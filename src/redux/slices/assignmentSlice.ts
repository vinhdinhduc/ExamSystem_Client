import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { assignmentService } from '../../api/services/assignmentService'
import type { AssignmentRequest, AssignmentState, AssignmentTarget } from '../../types/assignment'

const initialState: AssignmentState = {
    targets: [],
    assigning: false,
    error: null,
}

export const fetchAssignmentTargets = createAsyncThunk<
    AssignmentTarget[],
    string | undefined,
    { rejectValue: string }
>(
    'assignment/fetchTargets',
    async (keyword, thunkApi) => {
        try {
            return await assignmentService.getTargets(keyword ?? '')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to fetch targets'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const assignExam = createAsyncThunk<void, AssignmentRequest, { rejectValue: string }>(
    'assignment/assignExam',
    async (payload, thunkApi) => {
        try {
            await assignmentService.assignExam(payload)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to assign exam'
            return thunkApi.rejectWithValue(message)
        }
    },
)

const assignmentSlice = createSlice({
    name: 'assignment',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssignmentTargets.pending, (state) => {
                state.error = null
            })
            .addCase(fetchAssignmentTargets.fulfilled, (state, action) => {
                state.targets = action.payload
            })
            .addCase(fetchAssignmentTargets.rejected, (state, action) => {
                state.error = action.payload ?? 'Unable to fetch targets'
            })
            .addCase(assignExam.pending, (state) => {
                state.assigning = true
                state.error = null
            })
            .addCase(assignExam.fulfilled, (state) => {
                state.assigning = false
            })
            .addCase(assignExam.rejected, (state, action) => {
                state.assigning = false
                state.error = action.payload ?? 'Unable to assign exam'
            })
    },
})

export default assignmentSlice.reducer
