import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authService } from '../../api/services/authService'
import type { AuthState, LoginRequest, RegisterRequest, UserInfo } from '../../types/auth'
import { storage } from '../../utils/storage'

const initialState: AuthState = {
    user: storage.getUser() as UserInfo | null,
    token: storage.getToken(),
    isAuthenticated: Boolean(storage.getToken()),
    loading: false,
    error: null,
}

// Thunk: Login
export const login = createAsyncThunk<
    { token: string; user: UserInfo },
    LoginRequest,
    { rejectValue: string }
>('auth/login', async (payload, thunkApi) => {
    try {
        const data = await authService.login(payload)
        return { token: data.access_token, user: data.user }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Đăng nhập thất bại'
        return thunkApi.rejectWithValue(message)
    }
})

// Thunk: Register — trả email để hiện thông báo xác thực
export const register = createAsyncThunk<
    { email: string },
    RegisterRequest,
    { rejectValue: string }
>('auth/register', async (payload, thunkApi) => {
    try {
        const data = await authService.register(payload)
        return { email: data.email }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Đăng ký thất bại'
        return thunkApi.rejectWithValue(message)
    }
})

// Thunk: Verify Email
export const verifyEmail = createAsyncThunk<void, string, { rejectValue: string }>(
    'auth/verifyEmail',
    async (token, thunkApi) => {
        try {
            await authService.verifyEmail(token)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Xác thực email thất bại'
            return thunkApi.rejectWithValue(message)
        }
    },
)

// Thunk: Forgot Password
export const forgotPassword = createAsyncThunk<void, string, { rejectValue: string }>(
    'auth/forgotPassword',
    async (email, thunkApi) => {
        try {
            await authService.forgotPassword(email)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gửi yêu cầu thất bại'
            return thunkApi.rejectWithValue(message)
        }
    },
)

// Thunk: Reset Password
export const resetPassword = createAsyncThunk<
    void,
    { email: string; otp: string; newPassword: string; confirmPassword: string },
    { rejectValue: string }
>('auth/resetPassword', async (payload, thunkApi) => {
    try {
        await authService.resetPassword(payload)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Đặt lại mật khẩu thất bại'
        return thunkApi.rejectWithValue(message)
    }
})

// Thunk: Logout
export const logoutAsync = createAsyncThunk<void, void, { rejectValue: string }>(
    'auth/logout',
    async (_, thunkApi) => {
        try {
            await authService.logout()
        } catch {
            // Dù BE lỗi vẫn clear local state
            return thunkApi.fulfillWithValue(undefined)
        }
    },
)

// Thunk: Refresh token (gọi khi access token sắp hết hạn)
export const refreshToken = createAsyncThunk<
    { token: string; user: UserInfo },
    void,
    { rejectValue: string }
>('auth/refreshToken', async (_, thunkApi) => {
    try {
        const data = await authService.refreshToken()
        return { token: data.access_token, user: data.user }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Phiên đăng nhập hết hạn'
        return thunkApi.rejectWithValue(message)
    }
})

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
        clearError: (state) => {
            state.error = null
        },
    },
    extraReducers: (builder) => {
        // Login
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
                state.error = action.payload ?? 'Đăng nhập thất bại'
            })

        // Register — chỉ gửi email xác thực, không login ngay
        builder
            .addCase(register.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Đăng ký thất bại'
            })

        // Logout
        builder
            .addCase(logoutAsync.fulfilled, (state) => {
                state.user = null
                state.token = null
                state.isAuthenticated = false
                state.error = null
                storage.clearAuth()
            })

        // Refresh token
        builder
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.token = action.payload.token
                state.user = action.payload.user
                state.isAuthenticated = true
                storage.setToken(action.payload.token)
                storage.setUser(action.payload.user)
            })
            .addCase(refreshToken.rejected, (state) => {
                state.user = null
                state.token = null
                state.isAuthenticated = false
                storage.clearAuth()
            })
    },
})

export const { logout, setCredentials, clearError } = authSlice.actions
export default authSlice.reducer
