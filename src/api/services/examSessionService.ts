import axiosClient from '../axiosClient'
import type {
    ExamSessionReviewResult,
    StartExamResponse,
    SubmitExamResult,
    SaveProgressRequest,
    SaveProgressResponse,
    ExamViolationRequest,
    ExamViolationResponse,
    SystemInterruptionRequest,
    SystemInterruptionResponse,
    SessionRuntimeStatus,
    PendingSystemPauseItem,
    AdminResolvePauseRequest,
    AdminResolvePauseResult,
} from '../../types/examSession'
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
        payload: { userId?: string; accessCode?: string | null },
    ): Promise<StartExamResponse> => {
        const response = await axiosClient.post<
            ApiResponse<StartExamResponse> | StartExamResponse
        >(`/exam-sessions/${examId}/start`, payload)

        return unwrapApiData(response.data)
    },
    saveProgress: async (payload: SaveProgressRequest): Promise<SaveProgressResponse> => {
        const response = await axiosClient.post<
            ApiResponse<SaveProgressResponse> | SaveProgressResponse
        >('/exam/save-progress', payload)
        return unwrapApiData(response.data)
    },
    reportViolation: async (payload: ExamViolationRequest): Promise<ExamViolationResponse> => {
        const response = await axiosClient.post<
            ApiResponse<ExamViolationResponse> | ExamViolationResponse
        >('/exam/violation', payload)
        return unwrapApiData(response.data)
    },
    submitExamV1: async (payload: { sessionId: string; userId?: string }): Promise<SubmitExamResult> => {
        const response = await axiosClient.post<ApiResponse<SubmitExamResult> | SubmitExamResult>(
            '/exam/submit',
            payload,
        )
        return unwrapApiData(response.data)
    },
    autosaveAnswer: async (
        sessionId: string,
        payload: { userId?: string; questionId: string; answerIds: number[] },
    ): Promise<void> => {
        await axiosClient.put(`/exam-sessions/${sessionId}/autosave`, payload)
    },
    submitSession: async (sessionId: string, payload: { userId?: string }): Promise<SubmitExamResult> => {
        const response = await axiosClient.post<ApiResponse<SubmitExamResult> | SubmitExamResult>(
            `/exam-sessions/${sessionId}/submit`,
            payload,
        )
        return unwrapApiData(response.data)
    },
    getSessionReview: async (sessionId: string): Promise<ExamSessionReviewResult> => {
        const response = await axiosClient.get<
            ApiResponse<ExamSessionReviewResult> | ExamSessionReviewResult
        >(`/exam-sessions/${sessionId}/review`)
        return unwrapApiData(response.data)
    },
    reportSystemInterruption: async (
        payload: SystemInterruptionRequest,
    ): Promise<SystemInterruptionResponse> => {
        const response = await axiosClient.post<
            ApiResponse<SystemInterruptionResponse> | SystemInterruptionResponse
        >('/exam/system-interruption', payload)
        return unwrapApiData(response.data)
    },
    sendHeartbeat: async (payload: { sessionId: string; userId?: string }): Promise<void> => {
        await axiosClient.post('/exam/heartbeat', payload)
    },
    getSessionRuntimeStatus: async (sessionId: string): Promise<SessionRuntimeStatus> => {
        const response = await axiosClient.get<
            ApiResponse<SessionRuntimeStatus> | SessionRuntimeStatus
        >(`/exam/session-runtime/${sessionId}`)
        return unwrapApiData(response.data)
    },
    getPendingSystemPauses: async (): Promise<PendingSystemPauseItem[]> => {
        const response = await axiosClient.get<
            ApiResponse<PendingSystemPauseItem[]> | PendingSystemPauseItem[]
        >('/exam-sessions/pending-system-pauses')
        return unwrapApiData(response.data)
    },
    resolveSystemPause: async (
        sessionId: string,
        payload: AdminResolvePauseRequest,
    ): Promise<AdminResolvePauseResult> => {
        const response = await axiosClient.post<
            ApiResponse<AdminResolvePauseResult> | AdminResolvePauseResult
        >(`/exam-sessions/${sessionId}/resolve-system-pause`, payload)
        return unwrapApiData(response.data)
    },
}
