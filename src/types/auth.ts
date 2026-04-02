// Request DTOs — khớp với BE
export interface LoginRequest {
    usernameOrEmail: string
    password: string
}
export interface RegisterRequest {
    email: string
    password: string
    username?: string
    fullName?: string
    confirmPassword?: string
}
// User info trả về từ BE (UserInfoDto)
export interface UserInfo {
    id: string
    username: string
    fullName: string
    email: string
    avatar: string | null
    isActive: boolean
    createdAt: string
    roles: string[]
}

// BE trả về AuthResponseDto: { accessToken, refreshToken, expiresAt, user }
export interface AuthApiData {
    access_token: string
    refresh_token: string
    expires_at: string
    user: UserInfo
}

// Shape của ApiResponse<T> từ BE
export interface ApiResponse<T> {
    statusCode: number
    error: unknown
    message: string
    data: T
}

// Để tương thích với code cũ dùng LoginResponse
export interface LoginResponse {
    token: string
    user: UserInfo
}

export interface AuthState {
    user: UserInfo | null
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null
}
