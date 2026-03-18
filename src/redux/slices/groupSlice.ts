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
            const res = await groupService.getGroups('', 1, 100)
            return res.result
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải danh sách nhóm'
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
            const message = error instanceof Error ? error.message : 'Không thể tạo nhóm'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const addGroupMember = createAsyncThunk<
    Group[],
    { groupId: number; userId: string },
    { rejectValue: string }
>('group/addMember', async ({ groupId, userId }, thunkApi) => {
    try {
        await groupService.addMember(groupId, userId)
        const res = await groupService.getGroups('', 1, 100)
        return res.result
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể thêm thành viên'
        return thunkApi.rejectWithValue(message)
    }
})

export const removeGroupMember = createAsyncThunk<
    Group[],
    { groupId: number; userId: string },
    { rejectValue: string }
>('group/removeMember', async ({ groupId, userId }, thunkApi) => {
    try {
        await groupService.removeMember(groupId, userId)
        const res = await groupService.getGroups('', 1, 100)
        return res.result
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể xóa thành viên'
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
                state.error = action.payload ?? 'Không thể tải danh sách nhóm'
            })
            .addCase(createGroup.fulfilled, (state, action) => {
                state.groups = [action.payload, ...state.groups]
            })
            .addCase(addGroupMember.fulfilled, (state, action) => {
                state.groups = action.payload
            })
            .addCase(addGroupMember.rejected, (state, action) => {
                state.error = action.payload ?? 'Không thể thêm thành viên'
            })
            .addCase(removeGroupMember.fulfilled, (state, action) => {
                state.groups = action.payload
            })
            .addCase(removeGroupMember.rejected, (state, action) => {
                state.error = action.payload ?? 'Không thể xóa thành viên'
            })
    },
})

export default groupSlice.reducer
