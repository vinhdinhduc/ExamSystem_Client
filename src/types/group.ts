export interface GroupMember {
    groupId: number
    userId: string
    fullName: string
    email: string
    joinedAt: string
}

export interface Group {
    id: number
    code: string
    name: string
    description: string | null
    createdByUserId: string
    createdAt: string
    members: GroupMember[]
}

export interface GroupPayload {
    createdByUserId: string
    code: string
    name: string
    description: string
}

export interface GroupState {
    groups: Group[]
    loading: boolean
    error: string | null
}
