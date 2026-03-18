import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { questionService } from '../../api/services/questionService'
import type { Question, QuestionCreatePayload, QuestionState } from '../../types/question'

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
        const message = error instanceof Error ? error.message : 'Không thể tải danh sách câu hỏi'
        return thunkApi.rejectWithValue(message)
    }
})

export const fetchQuestionBank = createAsyncThunk<Question[], number | undefined, { rejectValue: string }>(
    'question/fetchQuestionBank',
    async (subjectId, thunkApi) => {
        try {
            return await questionService.getQuestionBank(subjectId)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải ngân hàng câu hỏi'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const createQuestion = createAsyncThunk<
    Question,
    QuestionCreatePayload,
    { rejectValue: string }
>('question/createQuestion', async (payload, thunkApi) => {
    try {
        return await questionService.createQuestion(payload)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tạo câu hỏi'
        return thunkApi.rejectWithValue(message)
    }
})

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
                state.error = action.payload ?? 'Không thể tải danh sách câu hỏi'
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
                state.error = action.payload ?? 'Không thể tải ngân hàng câu hỏi'
            })
            .addCase(createQuestion.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(createQuestion.fulfilled, (state, action) => {
                state.loading = false
                state.bank = [action.payload, ...state.bank]
            })
            .addCase(createQuestion.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Không thể tạo câu hỏi'
            })
    },
})

export const { selectAnswer, resetAnswers } = questionSlice.actions
export const { setSelectedAnswers } = questionSlice.actions
export default questionSlice.reducer
