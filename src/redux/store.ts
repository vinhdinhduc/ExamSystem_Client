import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from '@reduxjs/toolkit'
import { createMigrate, persistReducer, persistStore } from 'redux-persist'
import { storage } from '../utils/storage'
import authReducer from './slices/authSlice'
import examReducer from './slices/examSlice'
import questionReducer from './slices/questionSlice'
import resultReducer from './slices/resultSlice'
import subjectReducer from './slices/subjectSlice'
import groupReducer from './slices/groupSlice'
import assignmentReducer from './slices/assignmentSlice'
import examSessionReducer from './slices/examSessionSlice'

const rootReducer = combineReducers({
    auth: authReducer,
    exam: examReducer,
    question: questionReducer,
    result: resultReducer,
    subject: subjectReducer,
    group: groupReducer,
    assignment: assignmentReducer,
    examSession: examSessionReducer,
})

const migrations: Record<number, (state: unknown) => unknown> = {
    2: (state: unknown) => {
        if (!state || typeof state !== 'object') return state

        const next = { ...(state as Record<string, unknown>) }
        const auth = next.auth
        if (!auth || typeof auth !== 'object') return next

        const authState = { ...(auth as Record<string, unknown>) }
        const user = authState.user
        if (!user || typeof user !== 'object') {
            next.auth = authState
            return next
        }

        const userState = { ...(user as Record<string, unknown>) }
        const rawRoles = userState.roles
        const normalizedRoles = Array.isArray(rawRoles)
            ? rawRoles
                .map((role) => {
                    if (typeof role === 'string') return role
                    if (
                        role &&
                        typeof role === 'object' &&
                        'name' in role &&
                        typeof (role as { name?: unknown }).name === 'string'
                    ) {
                        return (role as { name: string }).name
                    }
                    return ''
                })
                .filter((role): role is string => Boolean(role))
            : []

        userState.roles = normalizedRoles
        authState.user = userState
        next.auth = authState

        return next
    },
    3: (state: unknown) => {
        if (!state || typeof state !== 'object') return state

        const next = { ...(state as Record<string, unknown>) }
        const subject = next.subject
        if (!subject || typeof subject !== 'object') return next

        const subjectState = { ...(subject as Record<string, unknown>) }
        // Ensure options is always an array
        if (!Array.isArray(subjectState.options)) {
            subjectState.options = []
        }
        next.subject = subjectState

        return next
    },
    4: (state: unknown) => {
        if (!state || typeof state !== 'object') return state

        const next = { ...(state as Record<string, unknown>) }

        // Fix exam.exams array
        const exam = next.exam
        if (exam && typeof exam === 'object') {
            const examState = { ...(exam as Record<string, unknown>) }
            if (!Array.isArray(examState.exams)) {
                examState.exams = []
            }
            if (!Array.isArray(examState.assignedExams)) {
                examState.assignedExams = []
            }
            next.exam = examState
        }

        // Fix group.groups array
        const group = next.group
        if (group && typeof group === 'object') {
            const groupState = { ...(group as Record<string, unknown>) }
            if (!Array.isArray(groupState.groups)) {
                groupState.groups = []
            }
            next.group = groupState
        }

        return next
    },
    5: (state: unknown) => {
        if (!state || typeof state !== 'object') return state

        const next = { ...(state as Record<string, unknown>) }

        const examSession = next.examSession
        if (examSession && typeof examSession === 'object') {
            const examSessionState = { ...(examSession as Record<string, unknown>) }
            if (!('startedAt' in examSessionState)) examSessionState.startedAt = null
            if (!('expiresAt' in examSessionState)) examSessionState.expiresAt = null
            if (!('attemptNumber' in examSessionState)) examSessionState.attemptNumber = 0
            if (!Array.isArray(examSessionState.questionOrder)) examSessionState.questionOrder = []
            if (
                !examSessionState.questionAnswerOrder ||
                typeof examSessionState.questionAnswerOrder !== 'object'
            ) {
                examSessionState.questionAnswerOrder = {}
            }
            next.examSession = examSessionState
        }

        const exam = next.exam
        if (exam && typeof exam === 'object') {
            const examState = { ...(exam as Record<string, unknown>) }
            if (Array.isArray(examState.exams)) {
                examState.exams = (examState.exams as Array<Record<string, unknown>>).map((item) => {
                    if ('passScore' in item || !('passingScore' in item)) {
                        return item
                    }

                    return {
                        ...item,
                        passScore: item.passingScore,
                    }
                })
            }
            next.exam = examState
        }

        return next
    },
}

const persistConfig = {
    key: 'root',
    version: 5,
    storage,
    whitelist: ['auth', 'examSession', 'subject', 'exam', 'group'],
    migrate: createMigrate(migrations as never, { debug: false }),
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
