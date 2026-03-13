import axios, { AxiosError } from 'axios'
import { triggerAutoLogout } from '../utils/authEvents'
import { isTokenExpired } from '../utils/jwt'
import { storage } from '../utils/storage'
import type { ApiErrorResponse } from '../types/api'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:5001',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
})

axiosClient.interceptors.request.use(
    (config) => {
        const token = storage.getToken()
        if (token) {
            if (isTokenExpired(token)) {
                storage.clearAuth()
                triggerAutoLogout()
                return Promise.reject(new Error('Session expired. Please login again.'))
            }

            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error),
)

axiosClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
            storage.clearAuth()
            triggerAutoLogout()
        }

        const message =
            error.response?.data?.message ||
            error.response?.data?.errors?.[0] ||
            error.message ||
            'Unexpected API error'

        return Promise.reject(new Error(message))
    },
)

export default axiosClient
