export interface ResultQuestionReview {
    questionId: string
    questionContent: string
    selectedOptionIds: number[]
    correctOptionIds: number[]
    isCorrect: boolean
    explanation?: string | null
}

export interface Result {
    id: string
    examId: string
    score: number
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
    examTitle?: string
    submittedAt?: string | null
    showCorrectAnswer?: boolean
    reviews: ResultQuestionReview[]
}

export interface ResultState {
    currentResult: Result | null
    score: number | null
    loading: boolean
    error: string | null
}

export interface SubmitExamRequest {
    examId: string
    answers: { questionId: string; selectedOptionIds: number[] }[]
}

export interface SubmitExamResponse {
    resultId: string
    score: number
}

export interface ResultSummaryView {
    sessionId: string
    score: number
    isPassed: boolean
    totalCorrect: number
    submittedAt: string
    status: number
    totalQuestions: number
    examTitle?: string
}
