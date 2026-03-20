import axiosClient from '../axiosClient'
import type {
    Exam,
    ExamAuthoringResult,
    ExamPayload,
    ExamQuestionCreatePayload,
    GenerateExamWithGeminiRequest,
    ImportExamFromFileRequest,
    StudentAssignedExam,
} from '../../types/exam'
import type { ApiResponse, PaginatedResult } from '../../types/api'

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

/** Unwrap both the ApiResponse wrapper AND the PaginatedResult wrapper */
const unwrapPaginatedData = <T>(payload: unknown): T[] => {
    // First unwrap the ApiResponse { data: ... } wrapper if present
    let inner = payload
    if (inner && typeof inner === 'object' && 'data' in (inner as Record<string, unknown>)) {
        inner = (inner as ApiResponse<unknown>).data
    }

    // If it's already an array, return it directly
    if (Array.isArray(inner)) {
        return inner as T[]
    }

    // Unwrap the PaginatedResult { meta: ..., result: [...] } wrapper
    if (inner && typeof inner === 'object' && 'result' in (inner as Record<string, unknown>)) {
        return (inner as PaginatedResult<T>).result
    }

    return []
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
        const response = await axiosClient.get('/exams')
        return unwrapPaginatedData<Exam>(response.data)
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
        for (const item of items) {
            await axiosClient.post(`/exams/${examId}/questions`, {
                questionId: item.questionId,
                orderIndex: item.orderIndex,
                score: item.score,
            })
        }
    },
    syncExamQuestions: async (examId: string, items: ExamQuestionCreatePayload[]): Promise<void> => {
        await axiosClient.put(`/exams/${examId}/questions/sync`, {
            items: items.map((item, index) => ({
                questionId: item.questionId,
                orderIndex: item.orderIndex ?? index + 1,
                score: item.score ?? 1,
            })),
        })
    },
    deleteExam: async (id: string): Promise<void> => {
        await axiosClient.delete(`/exams/${id}`)
    },
    publishExam: async (id: string, publishedByUserId: string): Promise<void> => {
        await axiosClient.post(`/exams/${id}/publish`, { publishedByUserId })
    },
    generateWithGemini: async (
        request: GenerateExamWithGeminiRequest,
    ): Promise<ExamAuthoringResult> => {
        const response = await axiosClient.post<ApiResponse<ExamAuthoringResult> | ExamAuthoringResult>(
            '/exam-authoring/generate',
            request, { timeout: 120000 }
        )
        return unwrapApiData(response.data)
    },
    importFromFile: async (
        request: ImportExamFromFileRequest,
    ): Promise<ExamAuthoringResult> => {
        const formData = new FormData()
        formData.append('file', request.file)
        formData.append('subjectId', String(request.subjectId))
        formData.append('createdByUserId', request.createdByUserId)
        formData.append('title', request.title)
        formData.append('description', request.description ?? '')
        formData.append('instructions', request.instructions ?? '')
        formData.append('duration', String(request.duration))
        formData.append('passScore', String(request.passScore))
        formData.append('maxAttempts', String(request.maxAttempts))
        formData.append('shuffleQuestions', String(request.shuffleQuestions))
        formData.append('shuffleAnswers', String(request.shuffleAnswers))
        formData.append('showResultAfter', String(request.showResultAfter))
        formData.append('showCorrectAnswer', String(request.showCorrectAnswer))
        formData.append('status', String(request.status))
        if (request.startDate) formData.append('startDate', request.startDate)
        if (request.endDate) formData.append('endDate', request.endDate)
        if (request.accessCode) formData.append('accessCode', request.accessCode)
        formData.append('saveToDatabase', String(request.saveToDatabase ?? true))

        const response = await axiosClient.post<ApiResponse<ExamAuthoringResult> | ExamAuthoringResult>(
            '/exam-authoring/import',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        )
        return unwrapApiData(response.data)
    },
    downloadImportTemplate: async (): Promise<{ blob: Blob; fileName: string }> => {
        const response = await axiosClient.get('/exam-authoring/import-template', {
            responseType: 'blob',
        })

        const disposition = response.headers['content-disposition'] as string | undefined
        const matchedFileName = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
        const decodedFileName = matchedFileName?.[1]
            ? decodeURIComponent(matchedFileName[1])
            : matchedFileName?.[2]

        return {
            blob: response.data as Blob,
            fileName: decodedFileName ?? 'exam-import-template.csv',
        }
    },
}
