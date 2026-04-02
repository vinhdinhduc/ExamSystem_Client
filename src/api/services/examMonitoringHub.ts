import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr'
import { storage } from '../../utils/storage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5082'
const HUB_URL = `${BASE_URL}/hubs/exam-monitoring`

export interface StudentProgressEvent {
    sessionId: string
    examId: string
    userId: string
    action: 'save_progress'
    currentQuestionIndex: number
    violationCount: number
    remainingSeconds: number
    progressPercent: number
    status: number
}

export interface StudentSubmitEvent {
    sessionId: string
    examId: string
    userId: string
    reason: 'submitted' | 'timed_out' | 'force_submitted'
    submittedAt: string
    score: number
    isPassed: boolean
    status: number
}

let connection: HubConnection | null = null

const createConnection = () =>
    new HubConnectionBuilder()
        .withUrl(HUB_URL, {
            accessTokenFactory: () => storage.getToken() ?? '',
            withCredentials: true,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(LogLevel.Warning)
        .build()

const ensureConnected = async () => {
    if (!connection) {
        connection = createConnection()
    }

    if (connection.state === HubConnectionState.Disconnected) {
        await connection.start()
    }

    return connection
}

export const examMonitoringHub = {
    connect: async () => {
        await ensureConnected()
    },
    disconnect: async () => {
        if (!connection) return
        if (connection.state !== HubConnectionState.Disconnected) {
            await connection.stop()
        }
    },
    joinExamRoom: async (examId: string) => {
        const hub = await ensureConnected()
        await hub.invoke('JoinExamRoom', examId)
    },
    joinMonitoringRoom: async () => {
        const hub = await ensureConnected()
        await hub.invoke('JoinMonitoringRoom')
    },
    onStudentProgress: (handler: (event: StudentProgressEvent) => void) => {
        if (!connection) {
            connection = createConnection()
        }
        connection.on('student_progress', handler)
        return () => {
            connection?.off('student_progress', handler)
        }
    },
    onStudentSubmit: (handler: (event: StudentSubmitEvent) => void) => {
        if (!connection) {
            connection = createConnection()
        }
        connection.on('student_submit', handler)
        return () => {
            connection?.off('student_submit', handler)
        }
    },
}
