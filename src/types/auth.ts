// Request DTOs — khớp với BE
export interface LoginRequest {
    usernameOrEmail: string
    password: string
}

export interface RegisterRequest {
    email: string
    password: string
}

// User info trả về từ BE (UserDto)
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

// BE trả về bọc trong ApiResponse<{ access_token, expires_in, user }>
export interface AuthApiData {
    access_token: string
    expires_in: number
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
    isAuthenticated: boolean
    loading: boolean
    error: string | null
}
