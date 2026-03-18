export interface AssignmentTarget {
    id: string | number
    fullName: string
    email?: string | null
    avatar?: string | null
    groupCode?: string | null
    type: 'user' | 'group'
}

export interface AssignmentRequest {
    examId: string
    userId?: string | null
    groupId?: number | null
}

export interface AssignmentState {
    targets: AssignmentTarget[]
    assigning: boolean
    error: string | null
}
