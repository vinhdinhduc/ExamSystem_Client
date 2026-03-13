export interface ResultQuestionReview {
    questionId: number
    questionContent: string
    selectedOptionId: number | null
    correctOptionId: number
    isCorrect: boolean
}

export interface Result {
    id: number
    examId: number
    score: number
    totalQuestions: number
    correctAnswers: number
    reviews: ResultQuestionReview[]
}

export interface ResultState {
    currentResult: Result | null
    score: number | null
    loading: boolean
    error: string | null
}

export interface SubmitExamRequest {
    examId: number
    answers: { questionId: number; selectedOptionId: number }[]
}

export interface SubmitExamResponse {
    resultId: number
    score: number
}
