import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { examSessionService } from '../../api/services/examSessionService'
import type { ExamSessionState, SessionAnswerDraft } from '../../types/examSession'
import type { Result } from '../../types/result'

const initialState: ExamSessionState = {
    sessionId: null,
    answers: {},
    currentQuestion: 0,
    remainingTime: 0,
    saving: false,
    submitting: false,
    error: null,
}

export const startExamSession = createAsyncThunk<
    { sessionId: string; remainingTime: number },
    string,
    { rejectValue: string }
>('examSession/start', async (examId, thunkApi) => {
    try {
        return await examSessionService.startSession(examId)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to start exam session'
        return thunkApi.rejectWithValue(message)
    }
})

export const autosaveSession = createAsyncThunk<void, void, { state: { examSession: ExamSessionState }; rejectValue: string }>(
    'examSession/autosave',
    async (_, thunkApi) => {
        const state = thunkApi.getState().examSession
        if (!state.sessionId) {
            return
        }

        const answers: SessionAnswerDraft[] = Object.entries(state.answers).map(([questionId, answerIds]) => ({
            questionId,
            answerIds,
        }))

        try {
            await examSessionService.autosaveAnswers(state.sessionId, {
                answers,
                currentQuestion: state.currentQuestion,
                remainingTime: state.remainingTime,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to autosave answers'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const submitExamSession = createAsyncThunk<Result, string, { rejectValue: string }>(
    'examSession/submit',
    async (sessionId, thunkApi) => {
        try {
            return await examSessionService.submitSession(sessionId)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to submit exam session'
            return thunkApi.rejectWithValue(message)
        }
    },
)

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
                state.remainingTime = action.payload.remainingTime
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
                state.error = action.payload ?? 'Unable to autosave answers'
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
                state.error = action.payload ?? 'Unable to submit exam session'
            })
    },
})

export const { setRemainingTime, setCurrentQuestion, setSessionAnswer, clearSessionState } =
    examSessionSlice.actions
export default examSessionSlice.reducer
