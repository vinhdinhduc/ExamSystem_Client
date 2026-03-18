export interface SessionAnswerDraft {
    questionId: string
    answerIds: number[]
}

export interface ExamSessionQuestion {
    questionId: string
    orderIndex: number
    answerIds: number[]
}

export interface StartExamResponse {
    sessionId: string
    startedAt: string
    expiresAt: string
    attemptNumber: number
    questions: ExamSessionQuestion[]
}

export interface SubmitExamResult {
    sessionId: string
    score: number
    isPassed: boolean
    totalCorrect: number
    submittedAt: string
    status: number
}

export interface ExamSessionState {
    sessionId: string | null
    startedAt: string | null
    expiresAt: string | null
    attemptNumber: number
    questionOrder: string[]
    questionAnswerOrder: Record<string, number[]>
    answers: Record<string, number[]>
    currentQuestion: number
    remainingTime: number
    saving: boolean
    submitting: boolean
    error: string | null
}
