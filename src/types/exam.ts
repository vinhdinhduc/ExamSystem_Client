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
export interface Answer {
    id: number
    content: string
    isCorrect: boolean
    orderIndex: number
    imageUrl?: string | null
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

// ── Draft types (from AI generation / file import) ──

export interface ExamOptionDraft {
    content: string
    isCorrect: boolean
    orderIndex: number
    imageUrl?: string | null
}

export interface ExamQuestionDraft {
    content: string
    explanation?: string | null
    questionType: number
    difficultyLevel: number
    score: number
    orderIndex: number
    options: ExamOptionDraft[]
}

export interface ExamDraft {
    title: string
    description?: string | null
    instructions?: string | null
    duration: number
    passScore: number
    maxAttempts: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    showResultAfter: boolean
    showCorrectAnswer: boolean
    status: number
    startDate?: string | null
    endDate?: string | null
    accessCode?: string | null
    questions: ExamQuestionDraft[]
}

export interface ExamAuthoringResult {
    examId?: string | null
    source: string
    totalQuestions: number
    draft: ExamDraft
}

// ── AI generation request ──

export interface GenerateExamWithGeminiRequest {
    subjectId: number
    createdByUserId: string
    title: string
    description?: string | null
    instructions?: string | null
    questionCount: number
    difficultyLevel: number
    duration: number
    passScore: number
    maxAttempts: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    showResultAfter: boolean
    showCorrectAnswer: boolean
    status: number
    startDate?: string | null
    endDate?: string | null
    accessCode?: string | null
    additionalPrompt?: string | null
    saveToDatabase?: boolean
}

// ── File import request (sent as FormData) ──

export interface ImportExamFromFileRequest {
    subjectId: number
    createdByUserId: string
    title: string
    description?: string | null
    instructions?: string | null
    duration: number
    passScore: number
    maxAttempts: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    showResultAfter: boolean
    showCorrectAnswer: boolean
    status: number
    startDate?: string | null
    endDate?: string | null
    accessCode?: string | null
    file: File
    saveToDatabase?: boolean
}

export interface SaveExamDraftRequest {
    subjectId: number
    createdByUserId: string
    source?: string
    draft: ExamDraft
}
