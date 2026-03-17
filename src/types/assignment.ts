export interface AssignmentTarget {
    id: string
    fullName: string
    email?: string | null
    avatar?: string | null
    groupCode?: string | null
    type: 'user' | 'group'
}

export interface AssignmentRequest {
    examId: string
    userIds: string[]
    groupIds: number[]
}

export interface AssignmentState {
    targets: AssignmentTarget[]
    assigning: boolean
    error: string | null
}
