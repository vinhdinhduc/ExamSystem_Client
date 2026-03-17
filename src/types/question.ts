export interface QuestionOption {
    id: number
    content: string
    imageUrl?: string | null
    isCorrect?: boolean
    orderIndex?: number
}

export interface Question {
    id: string
    subjectId: number
    content: string
    imageUrl?: string | null
    explanation?: string | null
    questionType?: number
    difficultyLevel?: number
    tags?: string | string[] | null
    isActive?: boolean
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
