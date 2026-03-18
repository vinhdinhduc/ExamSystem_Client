import axiosClient from '../axiosClient'
import type { StartExamResponse, SubmitExamResult } from '../../types/examSession'
import type { ApiResponse } from '../../types/api'

const unwrapApiData = <T>(payload: ApiResponse<T> | T): T => {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        return (payload as ApiResponse<T>).data
    }

    return payload as T
}

export const examSessionService = {
    startSession: async (
        examId: string,
        payload: { userId: string; accessCode?: string | null },
    ): Promise<StartExamResponse> => {
        try {
            const response = await axiosClient.post<ApiResponse<StartExamResponse> | StartExamResponse>(
                `/exam-sessions/${examId}/start`,
                payload,
            )
            return unwrapApiData(response.data)
        } catch {
            const fallbackResponse = await axiosClient.post<
                ApiResponse<StartExamResponse> | StartExamResponse
            >(`/exam-sessions/start`, {
                examId,
                ...payload,
            })
            return unwrapApiData(fallbackResponse.data)
        }
    },
    autosaveAnswer: async (
        sessionId: string,
        payload: { userId: string; questionId: string; answerIds: number[] },
    ): Promise<void> => {
        await axiosClient.post(`/exam-sessions/${sessionId}/autosave`, payload)
    },
    submitSession: async (sessionId: string, payload: { userId: string }): Promise<SubmitExamResult> => {
        const response = await axiosClient.post<ApiResponse<SubmitExamResult> | SubmitExamResult>(
            `/exam-sessions/${sessionId}/submit`,
            payload,
        )
        return unwrapApiData(response.data)
    },
}