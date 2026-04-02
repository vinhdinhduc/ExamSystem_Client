import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
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

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth', 'examSession', 'subject'],
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
