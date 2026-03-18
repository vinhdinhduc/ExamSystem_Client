import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { examSessionService } from '../../api/services/examSessionService'
import type { ExamSessionState, StartExamResponse, SubmitExamResult } from '../../types/examSession'
import type { RootState } from '../store'

const initialState: ExamSessionState = {
    sessionId: null,
    startedAt: null,
    expiresAt: null,
    attemptNumber: 0,
    questionOrder: [],
    questionAnswerOrder: {},
    answers: {},
    currentQuestion: 0,
    remainingTime: 0,
    saving: false,
    submitting: false,
    error: null,
}

export const startExamSession = createAsyncThunk<
    StartExamResponse,
    { examId: string; userId: string; accessCode?: string | null },
    { rejectValue: string }
>('examSession/start', async ({ examId, userId, accessCode }, thunkApi) => {
    try {
        return await examSessionService.startSession(examId, { userId, accessCode: accessCode ?? null })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể bắt đầu ca thi'
        return thunkApi.rejectWithValue(message)
    }
})

export const autosaveSession = createAsyncThunk<void, void, { state: RootState; rejectValue: string }>(
    'examSession/autosave',
    async (_, thunkApi) => {
        const state = thunkApi.getState().examSession
        const userId = thunkApi.getState().auth.user?.id
        if (!state.sessionId || !userId) {
            return
        }

        try {
            const requests = Object.entries(state.answers).map(([questionId, answerIds]) =>
                examSessionService.autosaveAnswer(state.sessionId!, {
                    userId,
                    questionId,
                    answerIds,
                }),
            )

            await Promise.all(requests)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tự động lưu câu trả lời'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const submitExamSession = createAsyncThunk<
    SubmitExamResult,
    string,
    { state: RootState; rejectValue: string }
>('examSession/submit', async (sessionId, thunkApi) => {
    const userId = thunkApi.getState().auth.user?.id
    if (!userId) {
        return thunkApi.rejectWithValue('Không xác định được thí sinh. Vui lòng đăng nhập lại.')
    }

    try {
        return await examSessionService.submitSession(sessionId, { userId })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể nộp ca thi'
        return thunkApi.rejectWithValue(message)
    }
})

const examSessionSlice = createSlice({
    name: 'examSession',
    initialState,
    reducers: {
        setRemainingTime: (state, action: PayloadAction<number>) => {
            state.remainingTime = action.payload
        },
        setCurrentQuestion: (state, action: PayloadAction<number>) => {
            state.currentQuestion = action.payload
        },
        setSessionAnswer: (
            state,
            action: PayloadAction<{ questionId: string; answerIds: number[] }>,
        ) => {
            state.answers[action.payload.questionId] = action.payload.answerIds
        },
        clearSessionState: (state) => {
            state.sessionId = null
            state.startedAt = null
            state.expiresAt = null
            state.attemptNumber = 0
            state.questionOrder = []
            state.questionAnswerOrder = {}
            state.answers = {}
            state.currentQuestion = 0
            state.remainingTime = 0
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(startExamSession.fulfilled, (state, action) => {
                state.sessionId = action.payload.sessionId
                state.startedAt = action.payload.startedAt
                state.expiresAt = action.payload.expiresAt
                state.attemptNumber = action.payload.attemptNumber
                state.questionOrder = action.payload.questions
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((item) => item.questionId)
                state.questionAnswerOrder = action.payload.questions.reduce<Record<string, number[]>>(
                    (acc, item) => {
                        acc[item.questionId] = item.answerIds
                        return acc
                    },
                    {},
                )
                const expiresAtTs = new Date(action.payload.expiresAt).getTime()
                const nowTs = Date.now()
                state.remainingTime = Math.max(0, Math.floor((expiresAtTs - nowTs) / 1000))
                state.currentQuestion = 0
            })
            .addCase(autosaveSession.pending, (state) => {
                state.saving = true
                state.error = null
            })
            .addCase(autosaveSession.fulfilled, (state) => {
                state.saving = false
            })
            .addCase(autosaveSession.rejected, (state, action) => {
                state.saving = false
                state.error = action.payload ?? 'Không thể tự động lưu câu trả lời'
            })
            .addCase(submitExamSession.pending, (state) => {
                state.submitting = true
                state.error = null
            })
            .addCase(submitExamSession.fulfilled, (state) => {
                state.submitting = false
            })
            .addCase(submitExamSession.rejected, (state, action) => {
                state.submitting = false
                state.error = action.payload ?? 'Không thể nộp ca thi'
            })
    },
})

export const { setRemainingTime, setCurrentQuestion, setSessionAnswer, clearSessionState } =
    examSessionSlice.actions
export default examSessionSlice.reducer
