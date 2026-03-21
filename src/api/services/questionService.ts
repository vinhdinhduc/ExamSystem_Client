import axiosClient from '../axiosClient'
import type { ApiResponse } from '../../types/api'
import type { Question, QuestionCreatePayload } from '../../types/question'

interface ExamQuestionDetailResponse {
    examQuestionId: number
    examId: string
    questionId: string
    content: string
    imageUrl?: string | null
    questionType?: number
    difficultyLevel?: number
    tags?: string | null
    explanation?: string | null
    orderIndex: number
    score: number
    options?: Array<{
        id: number
        content: string
        imageUrl?: string | null
        isCorrect?: boolean
        orderIndex?: number
    }>
    answers?: Array<{
        id: number
        content: string
        imageUrl?: string | null
        isCorrect?: boolean
        orderIndex?: number
    }>
}

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
    options: Array<{
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

const normalizeDetailOptions = (
    optionsInput?: ExamQuestionDetailResponse['options'],
    answersInput?: ExamQuestionDetailResponse['answers'],
): NonNullable<Question['options']> => {
    const options = optionsInput ?? []
    const answers = answersInput ?? []

    if (answers.length === 0) return options
    if (options.length === 0) return answers

    const hasCorrectFlagInOptions = options.some((option) => option.isCorrect !== undefined)
    if (hasCorrectFlagInOptions) return options

    const answersById = new Map(answers.map((answer) => [answer.id, answer]))
    const answersByOrder = new Map(answers.map((answer) => [answer.orderIndex, answer]))

    return options.map((option, index) => {
        const byId = answersById.get(option.id)
        const byOrder = answersByOrder.get(option.orderIndex ?? index)
        const matched = byId ?? byOrder

        return {
            ...option,
            isCorrect: matched?.isCorrect,
        }
    })
}

export const questionService = {
    getQuestionsByExamId: async (examId: string): Promise<Question[]> => {
        const response = await axiosClient.get<
            ApiResponse<ExamQuestionDetailResponse[]> | ExamQuestionDetailResponse[]
        >(`/exams/${examId}/questions/details`)
        const details = unwrapApiData(response.data)

        return details.map((item) => {
            const mergedOptions = normalizeDetailOptions(item.options, item.answers)

            return {
                id: item.questionId,
                examQuestionId: item.examQuestionId,
                examId: item.examId,
                questionId: item.questionId,
                subjectId: 0,
                content: item.content,
                imageUrl: item.imageUrl ?? null,
                explanation: item.explanation ?? null,
                questionType: item.questionType,
                difficultyLevel: item.difficultyLevel,
                tags: item.tags ?? null,
                orderIndex: item.orderIndex,
                score: item.score,
                options: mergedOptions,
                answers: mergedOptions,
            }
        })
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
            options: payload.options.map((option) => ({
                content: option.content,
                imageUrl: option.imageUrl ?? null,
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
    updateQuestion: async (id: string, payload: QuestionCreatePayload): Promise<Question> => {
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
            options: payload.options.map((option) => ({
                content: option.content,
                imageUrl: option.imageUrl ?? null,
                isCorrect: option.isCorrect,
                orderIndex: option.orderIndex,
            })),
        }

        const response = await axiosClient.put<ApiResponse<Question> | Question>(
            `/questions/${id}`,
            requestPayload,
        )
        return unwrapApiData(response.data)
    },
    deleteQuestion: async (id: string): Promise<void> => {
        await axiosClient.delete(`/questions/${id}`)
    },
    saveExamQuestions: async (
        examId: string,
        items: Array<{ questionId: string; orderIndex: number; score: number }>,
    ): Promise<void> => {
        // Backend expects a single ExamQuestionCreateDto per request
        for (const item of items) {
            await axiosClient.post(`/exams/${examId}/questions`, {
                questionId: item.questionId,
                orderIndex: item.orderIndex,
                score: item.score,
            })
        }
    },
}
