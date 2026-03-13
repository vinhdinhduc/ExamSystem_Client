import axiosClient from '../axiosClient'
import type { Exam } from '../../types/exam'

export const examService = {
    getExams: async (): Promise<Exam[]> => {
        const response = await axiosClient.get<Exam[]>('/api/exams')
        return response.data
    },
    getExamById: async (id: number): Promise<Exam> => {
        const response = await axiosClient.get<Exam>(`/api/exams/${id}`)
        return response.data
    },
}
