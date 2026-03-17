import axiosClient from '../axiosClient'
import type { Subject, SubjectPayload } from '../../types/subject'

export const subjectService = {
    getSubjects: async (keyword = '', page = 1, pageSize = 10): Promise<Subject[]> => {
        const response = await axiosClient.get<Subject[]>('/api/subjects', {
            params: { keyword, page, pageSize },
        })
        return response.data
    },
    createSubject: async (payload: SubjectPayload): Promise<Subject> => {
        const response = await axiosClient.post<Subject>('/api/subjects', payload)
        return response.data
    },
    updateSubject: async (id: number, payload: SubjectPayload): Promise<Subject> => {
        const response = await axiosClient.put<Subject>(`/api/subjects/${id}`, payload)
        return response.data
    },
    deleteSubject: async (id: number): Promise<void> => {
        await axiosClient.delete(`/api/subjects/${id}`)
    },
    toggleSubject: async (id: number, isActive: boolean): Promise<void> => {
        await axiosClient.patch(`/api/subjects/${id}/active`, { isActive })
    },
}