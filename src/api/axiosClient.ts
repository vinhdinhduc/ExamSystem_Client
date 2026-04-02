import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { triggerAutoLogout } from '../utils/authEvents'
import { isTokenExpired, isTokenExpiringSoon } from '../utils/jwt'
import { storage } from '../utils/storage'
import type { ApiErrorResponse } from '../types/api'
import type { ApiResponse, AuthApiData } from '../types/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5082'

const axiosClient = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
    withCredentials: true, // Gửi cookie HttpOnly kèm theo mỗi request
})

// ---- Refresh token logic ----
let isRefreshing = false
let pendingQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
}> = []

function processPendingQueue(error: unknown, token: string | null) {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve(token!)
        }
    })
    pendingQueue = []
}

async function doRefresh(): Promise<string> {
    // Gọi thẳng axios để tránh circular qua interceptor
    const res = await axios.post<ApiResponse<AuthApiData>>(
        `${BASE_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true },
    )
    const newToken = res.data.data.access_token
    const user = res.data.data.user
    storage.setToken(newToken)
    storage.setUser(user)
    return newToken
}

// ---- Request interceptor ----
axiosClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = storage.getToken()

        if (!token) return config

        // Không can thiệp vào các auth endpoints (login, refresh, logout...)
        if (config.url?.includes('/auth/')) return config

        // Token đã hết hạn hoàn toàn
        if (isTokenExpired(token)) {
            if (isRefreshing) {
                // Chờ refresh đang chạy
                return new Promise<InternalAxiosRequestConfig>((resolve, reject) => {
                    pendingQueue.push({
                        resolve: (newToken) => {
                            config.headers.Authorization = `Bearer ${newToken}`
                            resolve(config)
                        },
                        reject,
                    })
                })
            }

            isRefreshing = true
            try {
                const newToken = await doRefresh()
                processPendingQueue(null, newToken)
                config.headers.Authorization = `Bearer ${newToken}`
                return config
            } catch (err) {
                processPendingQueue(err, null)
                storage.clearAuth()
                triggerAutoLogout()
                return Promise.reject(new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'))
            } finally {
                isRefreshing = false
            }
        }

        // Token sắp hết hạn (< 60s) — refresh proactively, không block request
        if (isTokenExpiringSoon(token)) {
            if (!isRefreshing) {
                isRefreshing = true
                doRefresh()
                    .then((newToken) => processPendingQueue(null, newToken))
                    .catch(() => {
                        // Không force logout ở đây — để response interceptor xử lý 401
                    })
                    .finally(() => {
                        isRefreshing = false
                    })
            }
        }

        config.headers.Authorization = `Bearer ${token}`
        return config
    },
    (error) => Promise.reject(error),
)

// ---- Response interceptor ----
axiosClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // 401 từ server — thử refresh một lần (trừ các auth endpoints)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/')
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true

            if (isRefreshing) {
                // Chờ refresh đang chạy rồi retry
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: (newToken) => {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`
                            resolve(axiosClient(originalRequest))
                        },
                        reject,
                    })
                })
            }

            isRefreshing = true
            try {
                const newToken = await doRefresh()
                processPendingQueue(null, newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return axiosClient(originalRequest)
            } catch {
                processPendingQueue(new Error('Phiên đăng nhập hết hạn'), null)
                storage.clearAuth()
                triggerAutoLogout()
                return Promise.reject(new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'))
            } finally {
                isRefreshing = false
            }
        }

        const data = error.response?.data
        const message =
            data?.error?.reason ||
            data?.error?.details?.[0]?.message ||
            data?.message ||
            data?.errors?.[0] ||
            error.message ||
            'Unexpected API error'

        return Promise.reject(new Error(message))
    },
)

export default axiosClient