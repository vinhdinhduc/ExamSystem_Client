import axiosClient from '../axiosClient'
import type { Result, SubmitExamRequest, SubmitExamResponse } from '../../types/result'

export const resultService = {
    submitExamAttempt: async (payload: SubmitExamRequest): Promise<SubmitExamResponse> => {
        const response = await axiosClient.post<SubmitExamResponse>('/api/exam-attempts', payload)
        return response.data
    },
    getResultById: async (id: number): Promise<Result> => {
        const response = await axiosClient.get<Result>(`/api/results/${id}`)
        return response.data
    },
}
