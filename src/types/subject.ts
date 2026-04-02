import type { PaginatedResult } from './api'

export interface Subject {
    id: number
    code: string
    name: string
    description: string | null
    isActive: boolean
    questionCount?: number
    examCount?: number
    createdAt?: string
}

export type SubjectListResult = PaginatedResult<Subject>

export interface SubjectPayload {
    code: string
    name: string
    description: string
    isActive: boolean
}

export interface SubjectState {
    subjects: Subject[]
    options: Subject[]
    loading: boolean
    optionsLoading: boolean
    error: string | null
    keyword: string
    page: number
    pageSize: number
    total: number
    totalPages: number
}
