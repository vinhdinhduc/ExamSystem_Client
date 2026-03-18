import axiosClient from '../axiosClient'
import type { ApiResponse, PaginatedResult } from '../../types/api'
import type { Group, GroupPayload } from '../../types/group'

export const groupService = {
    getGroups: async (keyword = '', page = 1, pageSize = 100): Promise<PaginatedResult<Group>> => {
        const response = await axiosClient.get<ApiResponse<PaginatedResult<Group>>>('/groups', {
            params: { keyword, page, pageSize },
        })
        return response.data.data
    },
    createGroup: async (payload: GroupPayload): Promise<Group> => {
        const response = await axiosClient.post<ApiResponse<Group>>('/groups', payload)
        return response.data.data
    },
    addMember: async (groupId: number, userId: string): Promise<void> => {
        await axiosClient.post(`/groups/${groupId}/members`, { userId })
    },
    removeMember: async (groupId: number, userId: string): Promise<void> => {
        await axiosClient.delete(`/groups/${groupId}/members/${userId}`)
    },
}