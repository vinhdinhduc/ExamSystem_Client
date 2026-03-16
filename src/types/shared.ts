export interface SelectOption {
    value: string | number
    label: string
    meta?: string
}

export interface PaginationState {
    page: number
    pageSize: number
    total: number
}
