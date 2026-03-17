import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { groupService } from '../../api/services/groupService'
import type { Group, GroupPayload, GroupState } from '../../types/group'

const initialState: GroupState = {
    groups: [],
    loading: false,
    error: null,
}

export const fetchGroups = createAsyncThunk<Group[], void, { rejectValue: string }>(
    'group/fetchGroups',
    async (_, thunkApi) => {
        try {
            return await groupService.getGroups()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to fetch groups'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const createGroup = createAsyncThunk<Group, GroupPayload, { rejectValue: string }>(
    'group/createGroup',
    async (payload, thunkApi) => {
        try {
            return await groupService.createGroup(payload)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to create group'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const addGroupMember = createAsyncThunk<
    { groupId: number; userId: string },
    { groupId: number; userId: string },
    { rejectValue: string }
>('group/addMember', async ({ groupId, userId }, thunkApi) => {
    try {
        await groupService.addMember(groupId, userId)
        return { groupId, userId }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to add member'
        return thunkApi.rejectWithValue(message)
    }
})

export const removeGroupMember = createAsyncThunk<
    { groupId: number; userId: string },
    { groupId: number; userId: string },
    { rejectValue: string }
>('group/removeMember', async ({ groupId, userId }, thunkApi) => {
    try {
        await groupService.removeMember(groupId, userId)
        return { groupId, userId }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to remove member'
        return thunkApi.rejectWithValue(message)
    }
})

const groupSlice = createSlice({
    name: 'group',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGroups.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchGroups.fulfilled, (state, action) => {
                state.loading = false
                state.groups = action.payload
            })
            .addCase(fetchGroups.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Unable to fetch groups'
            })
            .addCase(createGroup.fulfilled, (state, action) => {
                state.groups = [action.payload, ...state.groups]
            })
            .addCase(addGroupMember.fulfilled, (state, action) => {
                state.groups = state.groups.map((group) =>
                    group.id === action.payload.groupId
                        ? {
                            ...group,
                            members: group.members.some((member) => member.id === action.payload.userId)
                                ? group.members
                                : [
                                    ...group.members,
                                    {
                                        id: action.payload.userId,
                                        fullName: 'New member',
                                        email: '',
                                        avatar: null,
                                    },
                                ],
                        }
                        : group,
                )
            })
            .addCase(removeGroupMember.fulfilled, (state, action) => {
                state.groups = state.groups.map((group) =>
                    group.id === action.payload.groupId
                        ? {
                            ...group,
                            members: group.members.filter(
                                (member) => member.id !== action.payload.userId,
                            ),
                        }
                        : group,
                )
            })
    },
})

export default groupSlice.reducer
