import axiosClient from '../axiosClient'
import type { ApiResponse } from '../../types/api'
import type { Question, QuestionCreatePayload } from '../../types/question'

interface QuestionCreateRequest {
    subjectId: number
    createdByUserId: string
    content: string
    imageUrl?: string | null
    questionType: number
    difficultyLevel: number
    tags?: string | null
    explanation?: string | null
    isActive?: boolean
    answers: Array<{
        content: string
        imageUrl?: string | null
        isCorrect: boolean
        orderIndex: number
    }>
}

const unwrapApiData = <T>(payload: ApiResponse<T> | T): T => {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        return (payload as ApiResponse<T>).data
    }

    return payload as T
}

export const questionService = {
    getQuestionsByExamId: async (examId: string): Promise<Question[]> => {
        const response = await axiosClient.get<ApiResponse<Question[]> | Question[]>(
            `/questions/exam/${examId}`,
        )
        return unwrapApiData(response.data)
    },
    getQuestionBank: async (subjectId?: number): Promise<Question[]> => {
        const response = await axiosClient.get<ApiResponse<Question[]> | Question[]>('/questions', {
            params: subjectId ? { subjectId } : undefined,
        })
        return unwrapApiData(response.data)
    },
    createQuestion: async (payload: QuestionCreatePayload): Promise<Question> => {
        const requestPayload: QuestionCreateRequest = {
            subjectId: payload.subjectId,
            createdByUserId: payload.createdByUserId,
            content: payload.content,
            imageUrl: payload.imageUrl ?? null,
            questionType: payload.questionType,
            difficultyLevel: payload.difficultyLevel,
            tags: payload.tags ?? null,
            explanation: payload.explanation ?? null,
            isActive: payload.isActive ?? true,
            answers: payload.options.map((option) => ({
                content: option.content,
                imageUrl: null,
                isCorrect: option.isCorrect,
                orderIndex: option.orderIndex,
            })),
        }

        const response = await axiosClient.post<ApiResponse<Question> | Question>(
            '/questions',
            requestPayload,
        )
        return unwrapApiData(response.data)
    },
    saveExamQuestions: async (
        examId: string,
        items: Array<{ questionId: string; orderIndex: number; score: number }>,
    ): Promise<void> => {
        await axiosClient.put(`/exams/${examId}/questions`, items)
    },
}
