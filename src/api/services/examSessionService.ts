import axiosClient from '../axiosClient'
import type { SessionAnswerDraft } from '../../types/examSession'
import type { Result } from '../../types/result'

export const examSessionService = {
    startSession: async (examId: string): Promise<{ sessionId: string; remainingTime: number }> => {
        const response = await axiosClient.post<{ sessionId: string; remainingTime: number }>(
            `/api/exam-sessions/start`,
            { examId },
        )
        return response.data
    },
    autosaveAnswers: async (
        sessionId: string,
        payload: { answers: SessionAnswerDraft[]; currentQuestion: number; remainingTime: number },
    ): Promise<void> => {
        await axiosClient.post(`/api/exam-sessions/${sessionId}/autosave`, payload)
    },
    submitSession: async (sessionId: string): Promise<Result> => {
        const response = await axiosClient.post<Result>(`/api/exam-sessions/${sessionId}/submit`)
        return response.data
    },
}