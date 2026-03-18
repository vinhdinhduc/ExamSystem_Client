import axiosClient from '../axiosClient'
import type { ApiResponse } from '../../types/api'
import type { Subject, SubjectListResult, SubjectPayload } from '../../types/subject'

export const subjectService = {
    getSubjects: async (keyword = '', page = 1, pageSize = 10): Promise<SubjectListResult> => {
        const response = await axiosClient.get<ApiResponse<SubjectListResult>>('/subjects', {
            params: { keyword, page, pageSize },
        })
        return response.data.data
    },
    createSubject: async (payload: SubjectPayload): Promise<Subject> => {
        const response = await axiosClient.post<ApiResponse<Subject>>('/subjects', payload)
        return response.data.data
    },
    updateSubject: async (id: number, payload: SubjectPayload): Promise<Subject> => {
        const response = await axiosClient.put<ApiResponse<Subject>>(`/subjects/${id}`, payload)
        return response.data.data
    },
    deleteSubject: async (id: number): Promise<void> => {
        await axiosClient.delete(`/subjects/${id}`)
    },
    toggleSubject: async (id: number, isActive: boolean): Promise<void> => {
        await axiosClient.patch(`/subjects/${id}/active`, { isActive })
    },
}