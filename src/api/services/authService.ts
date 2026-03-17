import axiosClient from '../axiosClient'
import type { ApiResponse, AuthApiData, LoginRequest, RegisterRequest } from '../../types/auth'

export const authService = {
    login: async (payload: LoginRequest): Promise<AuthApiData> => {
        const response = await axiosClient.post<ApiResponse<AuthApiData>>('/auth/login', payload)
        return response.data.data
    },

    register: async (payload: RegisterRequest): Promise<{ email: string }> => {
        const response = await axiosClient.post<ApiResponse<{ email: string }>>('/auth/register', payload)
        return response.data.data
    },

    logout: async (): Promise<void> => {
        await axiosClient.post('/auth/logout')
    },

    refreshToken: async (): Promise<AuthApiData> => {
        const response = await axiosClient.post<ApiResponse<AuthApiData>>('/auth/refresh')
        return response.data.data
    },

    verifyEmail: async (token: string): Promise<void> => {
        await axiosClient.get(`/auth/verify-email?token=${token}`)
    },

    forgotPassword: async (email: string): Promise<void> => {
        await axiosClient.post('/auth/forgot-password', { email })
    },

    resetPassword: async (payload: {
        email: string
        otp: string
        newPassword: string
        confirmPassword: string
    }): Promise<void> => {
        await axiosClient.post('/auth/reset-password', payload)
    },
}