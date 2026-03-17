import axiosClient from '../axiosClient'
import type { Subject, SubjectPayload } from '../../types/subject'

export const subjectService = {
    getSubjects: async (keyword = '', page = 1, pageSize = 10): Promise<Subject[]> => {
        const response = await axiosClient.get<Subject[]>('/subjects', {
            params: { keyword, page, pageSize },
        })
        return response.data
    },
    createSubject: async (payload: SubjectPayload): Promise<Subject> => {
        const response = await axiosClient.post<Subject>('/subjects', payload)
        return response.data
    },
    updateSubject: async (id: number, payload: SubjectPayload): Promise<Subject> => {
        const response = await axiosClient.put<Subject>(`/subjects/${id}`, payload)
        return response.data
    },
    deleteSubject: async (id: number): Promise<void> => {
        await axiosClient.delete(`/subjects/${id}`)
    },
    toggleSubject: async (id: number, isActive: boolean): Promise<void> => {
        await axiosClient.patch(`/subjects/${id}/active`, { isActive })
    },
}