export interface GroupMember {
    id: string
    fullName: string
    email: string
    avatar: string | null
    joinedAt?: string
}

export interface Group {
    id: number
    groupCode: string
    groupName: string
    description: string | null
    members: GroupMember[]
    createdAt?: string
}

export interface GroupPayload {
    groupCode: string
    groupName: string
    description: string
}

export interface GroupState {
    groups: Group[]
    loading: boolean
    error: string | null
}
