// Generic API response wrapper từ BE
export interface ApiResponse<T> {
    statusCode: number
    message: string
    error: unknown
    data: T
}

// Paginated result wrapper
export interface PaginatedResult<T> {
    meta: {
        page: number
        pageSize: number
        pages: number
        total: number
    }
    result: T[]
}

// Shape lỗi trả về từ BE (ApiResponse khi thất bại)
export interface ApiErrorResponse {
    statusCode?: number
    message?: string
    errors?: string[]
    error?: {
        code?: string
        reason?: string
        details?: Array<{ field: string; message: string }>
    }
}
