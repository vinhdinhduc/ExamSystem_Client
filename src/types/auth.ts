export interface LoginRequest {
    username: string
    password: string
}

export interface UserInfo {
    id: string
    username: string
    fullName: string
    email: string
    roles: string[]
}

export interface LoginResponse {
    token: string
    user: UserInfo
}

export interface AuthState {
    user: UserInfo | null
    token: string | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
}
