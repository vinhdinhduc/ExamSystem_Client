export interface SessionAnswerDraft {
    questionId: string
    answerIds: number[]
}

export interface ExamSessionState {
    sessionId: string | null
    answers: Record<string, number[]>
    currentQuestion: number
    remainingTime: number
    saving: boolean
    submitting: boolean
    error: string | null
}
