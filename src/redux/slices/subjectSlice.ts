import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { subjectService } from '../../api/services/subjectService'
import type { Subject, SubjectListResult, SubjectPayload, SubjectState } from '../../types/subject'

const initialState: SubjectState = {
    subjects: [],
    options: [],
    loading: false,
    optionsLoading: false,
    error: null,
    keyword: '',
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
}

export const fetchSubjects = createAsyncThunk<
    SubjectListResult,
    void,
    { state: { subject: SubjectState }; rejectValue: string }
>(
    'subject/fetchSubjects',
    async (_, thunkApi) => {
        const { keyword, page, pageSize } = thunkApi.getState().subject
        try {
            return await subjectService.getSubjects(keyword, page, pageSize)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tải danh sách môn học'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const fetchSubjectOptions = createAsyncThunk<
    Subject[],
    string | undefined,
    { state: { subject: SubjectState }; rejectValue: string }
>('subject/fetchSubjectOptions', async (keyword, thunkApi) => {
    const { pageSize } = thunkApi.getState().subject
    try {
        const { result } = await subjectService.getSubjects(keyword ?? '', 1, pageSize)
        return result
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải danh sách môn học để chọn'
        return thunkApi.rejectWithValue(message)
    }
})

export const createSubject = createAsyncThunk<Subject, SubjectPayload, { rejectValue: string }>(
    'subject/createSubject',
    async (payload, thunkApi) => {
        try {
            return await subjectService.createSubject(payload)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể tạo môn học'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const updateSubject = createAsyncThunk<
    Subject,
    { id: number; payload: SubjectPayload },
    { rejectValue: string }
>('subject/updateSubject', async ({ id, payload }, thunkApi) => {
    try {
        return await subjectService.updateSubject(id, payload)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể cập nhật môn học'
        return thunkApi.rejectWithValue(message)
    }
})

export const deleteSubject = createAsyncThunk<number, number, { rejectValue: string }>(
    'subject/deleteSubject',
    async (id, thunkApi) => {
        try {
            await subjectService.deleteSubject(id)
            return id
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể xóa môn học'
            return thunkApi.rejectWithValue(message)
        }
    },
)

export const toggleSubject = createAsyncThunk<
    { id: number; isActive: boolean },
    { id: number; isActive: boolean },
    { rejectValue: string }
>('subject/toggleSubject', async ({ id, isActive }, thunkApi) => {
    try {
        await subjectService.toggleSubject(id, isActive)
        return { id, isActive }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể thay đổi trạng thái môn học'
        return thunkApi.rejectWithValue(message)
    }
})

const subjectSlice = createSlice({
    name: 'subject',
    initialState,
    reducers: {
        setKeyword: (state, action: PayloadAction<string>) => {
            state.keyword = action.payload
            state.page = 1
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload
        },
        setOptions: (state, action: PayloadAction<Subject[]>) => {
            state.options = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSubjects.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchSubjects.fulfilled, (state, action) => {
                state.loading = false
                state.subjects = action.payload.result
                state.options = action.payload.result
                state.total = action.payload.meta.total
                state.totalPages = action.payload.meta.pages
                state.page = action.payload.meta.page
                state.pageSize = action.payload.meta.pageSize
            })
            .addCase(fetchSubjects.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Không thể tải danh sách môn học'
            })
            .addCase(fetchSubjectOptions.pending, (state) => {
                state.optionsLoading = true
            })
            .addCase(fetchSubjectOptions.fulfilled, (state, action) => {
                state.optionsLoading = false
                state.options = action.payload
            })
            .addCase(fetchSubjectOptions.rejected, (state, action) => {
                state.optionsLoading = false
                state.error = action.payload ?? 'Không thể tải danh sách môn học để chọn'
            })
            .addCase(createSubject.fulfilled, (state, action) => {
                state.subjects = [action.payload, ...state.subjects]
                state.options = [action.payload, ...state.options]
            })
            .addCase(updateSubject.fulfilled, (state, action) => {
                state.subjects = state.subjects.map((subject) =>
                    subject.id === action.payload.id ? action.payload : subject,
                )
                state.options = state.options.map((subject) =>
                    subject.id === action.payload.id ? action.payload : subject,
                )
            })
            .addCase(deleteSubject.fulfilled, (state, action) => {
                state.subjects = state.subjects.filter((subject) => subject.id !== action.payload)
                state.options = state.options.filter((subject) => subject.id !== action.payload)
            })
            .addCase(toggleSubject.fulfilled, (state, action) => {
                state.subjects = state.subjects.map((subject) =>
                    subject.id === action.payload.id
                        ? { ...subject, isActive: action.payload.isActive }
                        : subject,
                )
                state.options = state.options.map((subject) =>
                    subject.id === action.payload.id
                        ? { ...subject, isActive: action.payload.isActive }
                        : subject,
                )
            })
    },
})

export const { setKeyword, setPage, setOptions } = subjectSlice.actions
export default subjectSlice.reducer
