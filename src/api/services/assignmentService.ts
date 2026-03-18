import axiosClient from '../axiosClient'
import type { AssignmentRequest, AssignmentTarget } from '../../types/assignment'
import { groupService } from './groupService'
import userService from './userService'

export const assignmentService = {
    getTargets: async (keyword = ''): Promise<AssignmentTarget[]> => {
        const [usersRes, groupsRes] = await Promise.all([
            userService.getUsers(1, 200),
            groupService.getGroups(keyword, 1, 200),
        ])

        const keywordLower = keyword.trim().toLowerCase()
        const userTargets: AssignmentTarget[] = usersRes.result
            .filter((user) => {
                if (!keywordLower) return true
                return (
                    user.fullName.toLowerCase().includes(keywordLower) ||
                    user.email.toLowerCase().includes(keywordLower) ||
                    user.username.toLowerCase().includes(keywordLower)
                )
            })
            .map((user) => ({
                id: user.id,
                fullName: user.fullName || user.username,
                email: user.email,
                avatar: user.avatar,
                type: 'user',
            }))

        const groupTargets: AssignmentTarget[] = groupsRes.result.map((group) => ({
            id: group.id,
            fullName: group.name,
            groupCode: group.code,
            type: 'group',
        }))

        return [...userTargets, ...groupTargets]
    },
    assignExam: async (payload: AssignmentRequest): Promise<void> => {
        await axiosClient.post(`/exams/${payload.examId}/assign`, {
            userId: payload.userId ?? null,
            groupId: payload.groupId ?? null,
        })
    },
}