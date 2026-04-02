export interface Subject {
    id: number
    subjectCode: string
    subjectName: string
    description: string | null
    isActive: boolean
    questionCount?: number
    examCount?: number
    createdAt?: string
}

export interface SubjectPayload {
    subjectCode: string
    subjectName: string
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
}
