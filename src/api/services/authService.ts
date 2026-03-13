import axiosClient from '../axiosClient'
import type { LoginRequest, LoginResponse } from '../../types/auth'

export const authService = {
    login: async (payload: LoginRequest): Promise<LoginResponse> => {
        const response = await axiosClient.post<LoginResponse>('/api/auth/login', payload)
        return response.data
    },
}
