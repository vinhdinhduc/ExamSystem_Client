export interface Exam {
    id: string
    title: string
    description: string | null
    subjectId: number
    subjectName?: string
    subjectCode?: string
    instructions?: string | null
    duration: number
    passingScore: number
    maxAttempts?: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    showResultAfter?: boolean
    showCorrectAnswer?: boolean
    accessCode: string | null
    status: ExamStatus | number
    totalQuestions: number
    startDate?: string | null
    endDate?: string | null
    createdAt?: string
    updatedAt?: string
}

export type ExamStatus = 'Draft' | 'Published' | 'Archived'

export interface ExamPayload {
    title: string
    subjectId: number
    description: string
    instructions?: string
    duration: number
    passingScore: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    accessCode: string
    status: ExamStatus
    maxAttempts?: number
    showResultAfter?: boolean
    showCorrectAnswer?: boolean
    startDate?: string
    endDate?: string
    questionIds: string[]
}

export interface ExamState {
    exams: Exam[]
    assignedExams: Exam[]
    examDetail: Exam | null
    selectedQuestionIds: string[]
    loading: boolean
    error: string | null
}
