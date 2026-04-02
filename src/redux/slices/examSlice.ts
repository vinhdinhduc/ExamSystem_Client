import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { examService } from '../../api/services/examService'
import type { Exam, ExamPayload, ExamState } from '../../types/exam'

const initialState: ExamState = {
    exams: [],
    assignedExams: [],
    examDetail: null,
    selectedQuestionIds: [],
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

export const fetchAssignedExams = createAsyncThunk<Exam[], void, { rejectValue: string }>(
    'exam/fetchAssignedExams',
    async (_, thunkApi) => {
        try {
            return await examService.getAssignedExams()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to fetch assigned exams'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const fetchExamById = createAsyncThunk<Exam, string, { rejectValue: string }>(
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

export const createExam = createAsyncThunk<Exam, ExamPayload, { rejectValue: string }>(
    'exam/createExam',
    async (payload, thunkApi) => {
        try {
            return await examService.createExam(payload)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to create exam'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const updateExam = createAsyncThunk<
    Exam,
    { id: string; payload: ExamPayload },
    { rejectValue: string }
>('exam/updateExam', async ({ id, payload }, thunkApi) => {
    try {
        return await examService.updateExam(id, payload)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update exam'
        return thunkApi.rejectWithValue(message)
    }
})

export const publishExam = createAsyncThunk<string, string, { rejectValue: string }>(
    'exam/publishExam',
    async (id, thunkApi) => {
        try {
            await examService.publishExam(id)
            return id
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to publish exam'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const deleteExam = createAsyncThunk<string, string, { rejectValue: string }>(
    'exam/deleteExam',
    async (id, thunkApi) => {
        try {
            await examService.deleteExam(id)
            return id
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to delete exam'
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
        setSelectedQuestionIds: (state, action: PayloadAction<string[]>) => {
            state.selectedQuestionIds = action.payload
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
            .addCase(fetchAssignedExams.fulfilled, (state, action) => {
                state.assignedExams = action.payload
            })
            .addCase(fetchAssignedExams.rejected, (state) => {
                state.assignedExams = []
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
            .addCase(createExam.fulfilled, (state, action) => {
                state.exams = [action.payload, ...state.exams]
                state.examDetail = action.payload
            })
            .addCase(updateExam.fulfilled, (state, action) => {
                state.exams = state.exams.map((exam) =>
                    exam.id === action.payload.id ? action.payload : exam,
                )
                if (state.examDetail?.id === action.payload.id) {
                    state.examDetail = action.payload
                }
            })
            .addCase(deleteExam.fulfilled, (state, action) => {
                state.exams = state.exams.filter((exam) => exam.id !== action.payload)
            })
            .addCase(publishExam.fulfilled, (state, action) => {
                state.exams = state.exams.map((exam) =>
                    exam.id === action.payload ? { ...exam, status: 'Published' } : exam,
                )
                if (state.examDetail?.id === action.payload) {
                    state.examDetail = { ...state.examDetail, status: 'Published' }
                }
            })
    },
})

export const { clearExamState, setSelectedQuestionIds } = examSlice.actions
export default examSlice.reducer
