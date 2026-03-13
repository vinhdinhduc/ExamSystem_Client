export interface QuestionOption {
    id: number
    text: string
}

export interface Question {
    id: number
    content: string
    options: QuestionOption[]
}

export interface QuestionState {
    questions: Question[]
    selectedAnswers: Record<number, number>
    loading: boolean
    error: string | null
}
