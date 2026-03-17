import axiosClient from '../axiosClient'
import type { Group, GroupPayload } from '../../types/group'

export const groupService = {
    getGroups: async (): Promise<Group[]> => {
        const response = await axiosClient.get<Group[]>('/groups')
        return response.data
    },
    createGroup: async (payload: GroupPayload): Promise<Group> => {
        const response = await axiosClient.post<Group>('/groups', payload)
        return response.data
    },
    addMember: async (groupId: number, userId: string): Promise<void> => {
        await axiosClient.post(`/groups/${groupId}/members`, { userId })
    },
    removeMember: async (groupId: number, userId: string): Promise<void> => {
        await axiosClient.delete(`/groups/${groupId}/members/${userId}`)
    },
}