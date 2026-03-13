import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { questionService } from '../../api/services/questionService'
import type { Question, QuestionState } from '../../types/question'

const initialState: QuestionState = {
    questions: [],
    selectedAnswers: {},
    loading: false,
    error: null,
}

export const fetchQuestionsByExamId = createAsyncThunk<
    Question[],
    number,
    { rejectValue: string }
>('question/fetchQuestionsByExamId', async (examId, thunkApi) => {
    try {
        return await questionService.getQuestionsByExamId(examId)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to fetch questions'
        return thunkApi.rejectWithValue(message)
    }
})

const questionSlice = createSlice({
    name: 'question',
    initialState,
    reducers: {
        selectAnswer: (
            state,
            action: PayloadAction<{ questionId: number; selectedOptionId: number }>,
        ) => {
            state.selectedAnswers[action.payload.questionId] = action.payload.selectedOptionId
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
    },
})

export const { selectAnswer, resetAnswers } = questionSlice.actions
export default questionSlice.reducer
