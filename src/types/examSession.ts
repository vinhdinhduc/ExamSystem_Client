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

export interface ExamSessionReviewOption {
    id: number
    content: string
    imageUrl?: string | null
    orderIndex: number
    isSelected: boolean
    isCorrect: boolean | null
}

export interface ExamSessionReviewQuestion {
    questionId: string
    content: string
    explanation?: string | null
    orderIndex: number
    score: number
    isCorrect: boolean
    selectedAnswerIds: number[]
    correctAnswerIds: number[]
    options: ExamSessionReviewOption[]
}

export interface ExamSessionReviewResult {
    sessionId: string
    examId: string
    userId: string
    examTitle: string
    score: number
    isPassed: boolean
    totalCorrect: number
    startedAt: string
    submittedAt: string
    questions: ExamSessionReviewQuestion[]
}

export interface ExamSessionState {
    starting: boolean
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
