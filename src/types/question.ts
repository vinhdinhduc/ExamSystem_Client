export interface QuestionOption {
    id: number
    content: string
    imageUrl?: string | null
    isCorrect?: boolean
    orderIndex?: number
}

export interface Question {
    id: string
    examQuestionId?: number
    examId?: string
    questionId?: string
    subjectId: number
    content: string
    imageUrl?: string | null
    explanation?: string | null
    questionType?: number
    difficultyLevel?: number
    tags?: string | string[] | null
    isActive?: boolean
    orderIndex?: number
    score?: number
    options?: QuestionOption[]
    answers?: QuestionOption[]
}

export interface QuestionState {
    bank: Question[]
    questions: Question[]
    selectedAnswers: Record<string, number[]>
    loading: boolean
    error: string | null
}

export interface QuestionCreateOptionPayload {
    content: string
    isCorrect: boolean
    orderIndex: number
    imageUrl?: string | null
}

export interface QuestionCreatePayload {
    subjectId: number
    createdByUserId: string
    content: string
    imageUrl?: string | null
    explanation?: string | null
    questionType: number
    difficultyLevel: number
    tags?: string | null
    isActive?: boolean
    options: QuestionCreateOptionPayload[]
}
