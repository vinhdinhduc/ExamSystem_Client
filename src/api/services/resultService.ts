import axiosClient from '../axiosClient'
import type {
    Result,
    StudentExamResultItem,
    SubmitExamRequest,
    SubmitExamResponse,
    TeacherAssignedExamResultItem,
} from '../../types/result'
import type { ApiResponse } from '../../types/api'

const unwrapApiData = <T>(payload: ApiResponse<T> | T): T => {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        return (payload as ApiResponse<T>).data
    }

    return payload as T
}

export const resultService = {
    submitExamAttempt: async (payload: SubmitExamRequest): Promise<SubmitExamResponse> => {
        const response = await axiosClient.post<SubmitExamResponse>('/exam-attempts', payload)
        return response.data
    },
    getResultById: async (id: string): Promise<Result> => {
        const response = await axiosClient.get<Result>(`/results/${id}`)
        return response.data
    },
    getMyResults: async (): Promise<StudentExamResultItem[]> => {
        const response = await axiosClient.get<
            ApiResponse<StudentExamResultItem[]> | StudentExamResultItem[]
        >('/exam-sessions/my-results')
        return unwrapApiData(response.data)
    },
    getTeacherAssignedResults: async (
        examId?: string,
    ): Promise<TeacherAssignedExamResultItem[]> => {
        const response = await axiosClient.get<
            ApiResponse<TeacherAssignedExamResultItem[]> | TeacherAssignedExamResultItem[]
        >('/exam-sessions/teacher/assigned-results', {
            params: examId ? { examId } : undefined,
        })
        return unwrapApiData(response.data)
    },
}
