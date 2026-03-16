import axiosClient from '../axiosClient'
import type { Question } from '../../types/question'

export const questionService = {
    getQuestionsByExamId: async (examId: string): Promise<Question[]> => {
        const response = await axiosClient.get<Question[]>(`/api/questions/exam/${examId}`)
        return response.data
    },
    getQuestionBank: async (subjectId?: number): Promise<Question[]> => {
        const response = await axiosClient.get<Question[]>('/api/questions', {
            params: subjectId ? { subjectId } : undefined,
        })
        return response.data
    },
    saveExamQuestions: async (examId: string, questionIds: string[]): Promise<void> => {
        await axiosClient.put(`/api/exams/${examId}/questions`, { questionIds })
    },
}
