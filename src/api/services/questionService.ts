import axiosClient from '../axiosClient'
import type { Question } from '../../types/question'

export const questionService = {
    getQuestionsByExamId: async (examId: number): Promise<Question[]> => {
        const response = await axiosClient.get<Question[]>(`/api/questions/exam/${examId}`)
        return response.data
    },
}
