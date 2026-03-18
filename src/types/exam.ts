export interface Exam {
    id: string
    title: string
    description: string | null
    subjectId: number
    createdByUserId: string
    subjectName?: string
    subjectCode?: string
    instructions?: string | null
    duration: number
    passScore: number
    maxAttempts: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    showResultAfter: boolean
    showCorrectAnswer: boolean
    accessCode: string | null
    status: number
    totalQuestions: number
    startDate?: string | null
    endDate?: string | null
    createdAt: string
    updatedAt: string
    questions?: ExamQuestion[]
}

export type ExamStatus = 'Draft' | 'Published' | 'Archived'

export interface ExamQuestion {
    id: number
    examId: string
    questionId: string
    orderIndex: number
    score: number
}

export interface ExamQuestionCreatePayload {
    questionId: string
    orderIndex: number
    score: number
}

export interface ExamPayload {
    title: string
    subjectId: number
    createdByUserId: string
    description: string
    instructions?: string
    duration: number
    passScore: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    accessCode: string | null
    status: number
    maxAttempts?: number
    showResultAfter?: boolean
    showCorrectAnswer?: boolean
    startDate?: string
    endDate?: string
    totalQuestions: number
}

export interface StudentAssignedExam {
    examId: string
    title: string
    duration: number
    passScore: number
    startDate?: string | null
    endDate?: string | null
    status: number
    assignedAt: string
}

export interface ExamState {
    exams: Exam[]
    assignedExams: StudentAssignedExam[]
    examDetail: Exam | null
    selectedQuestionIds: string[]
    loading: boolean
    error: string | null
}
