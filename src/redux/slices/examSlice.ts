import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { examService } from '../../api/services/examService'
import type { Exam, ExamState } from '../../types/exam'

const initialState: ExamState = {
    exams: [],
    examDetail: null,
    loading: false,
    error: null,
}

export const fetchExams = createAsyncThunk<Exam[], void, { rejectValue: string }>(
    'exam/fetchExams',
    async (_, thunkApi) => {
        try {
            return await examService.getExams()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to fetch exams'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const fetchExamById = createAsyncThunk<Exam, number, { rejectValue: string }>(
    'exam/fetchExamById',
    async (id, thunkApi) => {
        try {
            return await examService.getExamById(id)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to fetch exam details'
            return thunkApi.rejectWithValue(message)
        }
    },
)

const examSlice = createSlice({
    name: 'exam',
    initialState,
    reducers: {
        clearExamState: (state) => {
            state.examDetail = null
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchExams.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchExams.fulfilled, (state, action) => {
                state.loading = false
                state.exams = action.payload
            })
            .addCase(fetchExams.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Unable to fetch exams'
            })
            .addCase(fetchExamById.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchExamById.fulfilled, (state, action) => {
                state.loading = false
                state.examDetail = action.payload
            })
            .addCase(fetchExamById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Unable to fetch exam details'
            })
    },
})

export const { clearExamState } = examSlice.actions
export default examSlice.reducer
