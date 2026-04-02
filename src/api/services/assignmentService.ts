import axiosClient from '../axiosClient'
import type { AssignmentRequest, AssignmentTarget } from '../../types/assignment'

export const assignmentService = {
    getTargets: async (keyword = ''): Promise<AssignmentTarget[]> => {
        const response = await axiosClient.get<AssignmentTarget[]>('/assignments/targets', {
            params: { keyword },
        })
        return response.data
    },
    assignExam: async (payload: AssignmentRequest): Promise<void> => {
        await axiosClient.post('/assignments', payload)
    },
}