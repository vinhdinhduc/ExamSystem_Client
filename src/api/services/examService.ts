import axiosClient from '../axiosClient'
import type {
    Exam,
    ExamPayload,
    ExamQuestionCreatePayload,
    StudentAssignedExam,
} from '../../types/exam'
import type { ApiResponse } from '../../types/api'

interface ExamCreateRequest {
    title: string
    subjectId: number
    createdByUserId: string
    description: string
    instructions?: string
    duration: number
    passScore: number
    totalQuestions: number
    maxAttempts: number
    shuffleQuestions: boolean
    shuffleAnswers: boolean
    showResultAfter: boolean
    showCorrectAnswer: boolean
    status: number
    startDate?: string | null
    endDate?: string | null
    accessCode?: string | null
}

type ExamUpdateRequest = Omit<ExamCreateRequest, 'subjectId' | 'createdByUserId'>

const unwrapApiData = <T>(payload: ApiResponse<T> | T): T => {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        return (payload as ApiResponse<T>).data
    }

    return payload as T
}

const toExamCreateRequest = (payload: ExamPayload): ExamCreateRequest => ({
    title: payload.title,
    subjectId: payload.subjectId,
    createdByUserId: payload.createdByUserId,
    description: payload.description,
    instructions: payload.instructions,
    duration: payload.duration,
    passScore: payload.passScore,
    totalQuestions: payload.totalQuestions,
    maxAttempts: payload.maxAttempts ?? 1,
    shuffleQuestions: payload.shuffleQuestions,
    shuffleAnswers: payload.shuffleAnswers,
    showResultAfter: payload.showResultAfter ?? true,
    showCorrectAnswer: payload.showCorrectAnswer ?? false,
    status: payload.status,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    accessCode: payload.accessCode || null,
})

const toExamUpdateRequest = (payload: ExamPayload): ExamUpdateRequest => ({
    title: payload.title,
    description: payload.description,
    instructions: payload.instructions,
    duration: payload.duration,
    totalQuestions: payload.totalQuestions,
    passScore: payload.passScore,
    maxAttempts: payload.maxAttempts ?? 1,
    shuffleQuestions: payload.shuffleQuestions,
    shuffleAnswers: payload.shuffleAnswers,
    showResultAfter: payload.showResultAfter ?? true,
    showCorrectAnswer: payload.showCorrectAnswer ?? false,
    status: payload.status,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    accessCode: payload.accessCode || null,
})

export const examService = {
    getExams: async (): Promise<Exam[]> => {
        const response = await axiosClient.get<ApiResponse<Exam[]> | Exam[]>('/exams')
        return unwrapApiData(response.data)
    },
    getAssignedExams: async (): Promise<StudentAssignedExam[]> => {
        const response = await axiosClient.get<
            ApiResponse<StudentAssignedExam[]> | StudentAssignedExam[]
        >('/exams/assigned')
        return unwrapApiData(response.data)
    },
    getExamById: async (id: string): Promise<Exam> => {
        const response = await axiosClient.get<ApiResponse<Exam> | Exam>(`/exams/${id}`)
        return unwrapApiData(response.data)
    },
    createExam: async (payload: ExamPayload): Promise<Exam> => {
        const response = await axiosClient.post<ApiResponse<Exam> | Exam>(
            '/exams',
            toExamCreateRequest(payload),
        )
        return unwrapApiData(response.data)
    },
    updateExam: async (id: string, payload: ExamPayload): Promise<Exam> => {
        const response = await axiosClient.put<ApiResponse<Exam> | Exam>(
            `/exams/${id}`,
            toExamUpdateRequest(payload),
        )
        return unwrapApiData(response.data)
    },
    saveExamQuestions: async (examId: string, items: ExamQuestionCreatePayload[]): Promise<void> => {
        try {
            await axiosClient.put(`/exams/${examId}/questions`, items)
        } catch {
            await axiosClient.put(`/exams/${examId}/questions`, { items })
        }
    },
    deleteExam: async (id: string): Promise<void> => {
        await axiosClient.delete(`/exams/${id}`)
    },
    publishExam: async (id: string, publishedByUserId: string): Promise<void> => {
        await axiosClient.patch(`/exams/${id}/publish`, { publishedByUserId })
    },
}
