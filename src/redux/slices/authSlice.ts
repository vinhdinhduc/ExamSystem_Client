import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authService } from '../../api/services/authService'
import type { AuthState, LoginRequest, LoginResponse, UserInfo } from '../../types/auth'
import { storage } from '../../utils/storage'

const initialState: AuthState = {
    user: storage.getUser() as UserInfo | null,
    token: storage.getToken(),
    isAuthenticated: Boolean(storage.getToken()),
    loading: false,
    error: null,
}

export const login = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: string }>(
    'auth/login',
    async (payload, thunkApi) => {
        try {
            return await authService.login(payload)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed'
            return thunkApi.rejectWithValue(message)
        }
    },
)

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.error = null
            storage.clearAuth()
        },
        setCredentials: (state, action: PayloadAction<{ user: UserInfo; token: string }>) => {
            state.user = action.payload.user
            state.token = action.payload.token
            state.isAuthenticated = true
            storage.setToken(action.payload.token)
            storage.setUser(action.payload.user)
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false
                state.user = action.payload.user
                state.token = action.payload.token
                state.isAuthenticated = true
                storage.setToken(action.payload.token)
                storage.setUser(action.payload.user)
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Login failed'
            })
    },
})

export const { logout, setCredentials } = authSlice.actions
export default authSlice.reducer
