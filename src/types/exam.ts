export interface Exam {
    id: number
    title: string
    description: string
    durationMinutes: number
    totalQuestions: number
}

export interface ExamState {
    exams: Exam[]
    examDetail: Exam | null
    loading: boolean
    error: string | null
}
