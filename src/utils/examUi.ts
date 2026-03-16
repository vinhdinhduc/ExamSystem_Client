import type { Exam, ExamStatus } from '../types/exam'
import type { Question, QuestionOption } from '../types/question'

const EXAM_STATUS_MAP: Record<number, ExamStatus> = {
    0: 'Draft',
    1: 'Published',
    2: 'Archived',
}

export const normalizeExamStatus = (status: Exam['status']): ExamStatus => {
    if (typeof status === 'number') {
        return EXAM_STATUS_MAP[status] ?? 'Draft'
    }

    return status
}

export const getExamStatusVariant = (status: Exam['status']) => {
    switch (normalizeExamStatus(status)) {
        case 'Published':
            return 'success'
        case 'Archived':
            return 'warning'
        default:
            return 'default'
    }
}

export const formatDateTime = (value?: string | null) => {
    if (!value) {
        return 'Chưa thiết lập'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

export const formatDuration = (duration: number) => `${duration} phút`

export const getQuestionOptions = (question: Question): QuestionOption[] =>
    question.options ?? question.answers ?? []

export const getQuestionTypeLabel = (questionType?: number) => {
    switch (questionType) {
        case 1:
            return 'Nhiều đáp án'
        case 2:
            return 'Đúng / Sai'
        default:
            return 'Một đáp án'
    }
}

export const getDifficultyLabel = (difficultyLevel?: number) => {
    switch (difficultyLevel) {
        case 3:
            return 'Khó'
        case 2:
            return 'Trung bình'
        default:
            return 'Dễ'
    }
}

export const getAssignmentBucket = (exam: Exam) => {
    const status = normalizeExamStatus(exam.status)
    const now = Date.now()
    const start = exam.startDate ? new Date(exam.startDate).getTime() : null
    const end = exam.endDate ? new Date(exam.endDate).getTime() : null

    if (status === 'Archived' || (end !== null && end < now)) {
        return 'completed'
    }

    if (start !== null && start > now) {
        return 'upcoming'
    }

    return 'doing'
}