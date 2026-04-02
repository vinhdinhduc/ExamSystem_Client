import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { resultService } from '../../api/services/resultService'
import type { Result, ResultState, SubmitExamRequest, SubmitExamResponse } from '../../types/result'

const initialState: ResultState = {
    currentResult: null,
    score: null,
    loading: false,
    error: null,
}

export const submitExam = createAsyncThunk<
    SubmitExamResponse,
    SubmitExamRequest,
    { rejectValue: string }
>('result/submitExam', async (payload, thunkApi) => {
    try {
        return await resultService.submitExamAttempt(payload)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể nộp bài thi'
        return thunkApi.rejectWithValue(message)
    }
})

export const fetchResultById = createAsyncThunk<Result, string, { rejectValue: string }>(
    'result/fetchResultById',
    async (id, thunkApi) => {
        try {
            return await resultService.getResultById(id)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải kết quả bài thi'
            return thunkApi.rejectWithValue(message)
        }
    },
)

const resultSlice = createSlice({
    name: 'result',
    initialState,
    reducers: {
        clearResultState: (state) => {
            state.currentResult = null
            state.score = null
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(submitExam.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(submitExam.fulfilled, (state, action) => {
                state.loading = false
                state.score = action.payload.score
            })
            .addCase(submitExam.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Không thể nộp bài thi'
            })
            .addCase(fetchResultById.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchResultById.fulfilled, (state, action) => {
                state.loading = false
                state.currentResult = action.payload
                state.score = action.payload.score
            })
            .addCase(fetchResultById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Không thể tải kết quả bài thi'
            })
    },
})

export const { clearResultState } = resultSlice.actions
export default resultSlice.reducer
