import axiosClient from '../axiosClient'
import type { Exam, ExamPayload } from '../../types/exam'

export const examService = {
    getExams: async (): Promise<Exam[]> => {
        const response = await axiosClient.get<Exam[]>('/api/exams')
        return response.data
    },
    getAssignedExams: async (): Promise<Exam[]> => {
        const response = await axiosClient.get<Exam[]>('/api/exams/assigned')
        return response.data
    },
    getExamById: async (id: string): Promise<Exam> => {
        const response = await axiosClient.get<Exam>(`/api/exams/${id}`)
        return response.data
    },
    createExam: async (payload: ExamPayload): Promise<Exam> => {
        const response = await axiosClient.post<Exam>('/api/exams', payload)
        return response.data
    },
    updateExam: async (id: string, payload: ExamPayload): Promise<Exam> => {
        const response = await axiosClient.put<Exam>(`/api/exams/${id}`, payload)
        return response.data
    },
    deleteExam: async (id: string): Promise<void> => {
        await axiosClient.delete(`/api/exams/${id}`)
    },
    publishExam: async (id: string): Promise<void> => {
        await axiosClient.patch(`/api/exams/${id}/publish`)
    },
}
