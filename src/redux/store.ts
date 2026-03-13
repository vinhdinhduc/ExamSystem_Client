import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import examReducer from './slices/examSlice'
import questionReducer from './slices/questionSlice'
import resultReducer from './slices/resultSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        exam: examReducer,
        question: questionReducer,
        result: resultReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
