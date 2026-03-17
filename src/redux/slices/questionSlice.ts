import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { questionService } from '../../api/services/questionService'
import type { Question, QuestionState } from '../../types/question'

const initialState: QuestionState = {
    bank: [],
    questions: [],
    selectedAnswers: {},
    loading: false,
    error: null,
}

export const fetchQuestionsByExamId = createAsyncThunk<
    Question[],
    string,
    { rejectValue: string }
>('question/fetchQuestionsByExamId', async (examId, thunkApi) => {
    try {
        return await questionService.getQuestionsByExamId(examId)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to fetch questions'
        return thunkApi.rejectWithValue(message)
    }
})

export const fetchQuestionBank = createAsyncThunk<Question[], number | undefined, { rejectValue: string }>(
    'question/fetchQuestionBank',
    async (subjectId, thunkApi) => {
        try {
            return await questionService.getQuestionBank(subjectId)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to fetch question bank'
            return thunkApi.rejectWithValue(message)
        }
    },
)

const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        selectAnswer: (
            state,
            action: PayloadAction<{ questionId: string; selectedOptionIds: number[] }>,
        ) => {
            state.selectedAnswers[action.payload.questionId] = action.payload.selectedOptionIds
        },
        setSelectedAnswers: (state, action: PayloadAction<Record<string, number[]>>) => {
            state.selectedAnswers = action.payload
        },
        resetAnswers: (state) => {
            state.selectedAnswers = {}
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchQuestionsByExamId.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchQuestionsByExamId.fulfilled, (state, action) => {
                state.loading = false
                state.questions = action.payload
            })
            .addCase(fetchQuestionsByExamId.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Unable to fetch questions'
            })
            .addCase(fetchQuestionBank.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchQuestionBank.fulfilled, (state, action) => {
                state.loading = false
                state.bank = action.payload
            })
            .addCase(fetchQuestionBank.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Unable to fetch question bank'
            })
    },
})

export const { selectAnswer, resetAnswers } = questionSlice.actions
export const { setSelectedAnswers } = questionSlice.actions
export default questionSlice.reducer
