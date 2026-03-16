import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { subjectService } from '../../api/services/subjectService'
import type { Subject, SubjectPayload, SubjectState } from '../../types/subject'

const initialState: SubjectState = {
    subjects: [],
    options: [],
    loading: false,
    optionsLoading: false,
    error: null,
    keyword: '',
    page: 1,
    pageSize: 10,
}

export const fetchSubjects = createAsyncThunk<Subject[], void, { state: { subject: SubjectState }; rejectValue: string }>(
    'subject/fetchSubjects',
    async (_, thunkApi) => {
        const { keyword, page, pageSize } = thunkApi.getState().subject
        try {
            return await subjectService.getSubjects(keyword, page, pageSize)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to fetch subjects'
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
        return await subjectService.getSubjects(keyword ?? '', 1, pageSize)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to fetch subject options'
        return thunkApi.rejectWithValue(message)
    }
})

export const createSubject = createAsyncThunk<Subject, SubjectPayload, { rejectValue: string }>(
    'subject/createSubject',
    async (payload, thunkApi) => {
        try {
            return await subjectService.createSubject(payload)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to create subject'
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
        const message = error instanceof Error ? error.message : 'Unable to update subject'
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
            const message = error instanceof Error ? error.message : 'Unable to delete subject'
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
        const message = error instanceof Error ? error.message : 'Unable to toggle subject'
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
                state.subjects = action.payload
                state.options = action.payload
            })
            .addCase(fetchSubjects.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Unable to fetch subjects'
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
                state.error = action.payload ?? 'Unable to fetch subject options'
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
