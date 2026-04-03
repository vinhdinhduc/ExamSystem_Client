export interface SessionAnswerDraft {
    questionId: string
    answerIds: number[]
}

export interface ExamSessionQuestion {
    questionId: string
    orderIndex: number
    answerIds: number[]
}
export interface SaveProgressRequest {
    sessionId: string
    userId?: string
    questionId: string
    answerIds: number[]
    currentQuestionIndex: number
}

export interface SaveProgressResponse {
    sessionId: string
    currentQuestionIndex: number
    violationCount: number
    lastSavedAt: string
    status: number
    isAutoSubmitted: boolean
}

export interface ExamViolationRequest {
    sessionId: string
    userId?: string
    type: 'TAB_SWITCH' | 'COPY' | 'PASTE' | 'EXIT_FULLSCREEN' | 'DEVTOOLS'
    currentQuestionIndex: number
}

export interface ExamViolationResponse {
    sessionId: string
    violationCount: number
    isForceSubmitted: boolean
    status: number
    submittedAt?: string
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

/** Trạng thái 4 = tạm dừng sự cố chờ quản trị viên (PAUSED_SYSTEM + WAITING_ADMIN_APPROVAL). */
export const SESSION_STATUS_PAUSED_SYSTEM = 4

export type SystemInterruptionType =
    | 'NETWORK_LOSS'
    | 'PAGE_RELOAD'
    | 'HEARTBEAT_TIMEOUT'
    | 'CRASH_OR_UNKNOWN'

export interface SystemInterruptionRequest {
    sessionId: string
    userId?: string
    type: SystemInterruptionType
    currentQuestionIndex?: number
}

export interface SystemInterruptionResponse {
    sessionId: string
    status: number
    systemPauseReason?: string | null
    systemPausedAt?: string | null
}

export interface SessionRuntimeStatus {
    sessionId: string
    status: number
    systemPauseReason?: string | null
    systemPausedAt?: string | null
    expiresAt: string
    currentQuestionIndex: number
    violationCount: number
}

export interface PendingSystemPauseItem {
    sessionId: string
    examId: string
    examTitle: string
    userId: string
    studentFullName: string
    studentEmail?: string | null
    systemPauseReason?: string | null
    systemPausedAt?: string | null
    expiresAt: string
    currentQuestionIndex: number
    violationCount: number
}

export type AdminPauseDecision = 'RESUME' | 'SUBMIT' | 'DISQUALIFY'

export interface AdminResolvePauseRequest {
    decision: AdminPauseDecision
}

export interface AdminResolvePauseResult {
    sessionId: string
    status: number
    submittedAt?: string | null
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
