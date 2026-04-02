const TOKEN_KEY = 'exam_token'
const REFRESH_TOKEN_KEY = 'exam_refresh_token'
const USER_KEY = 'exam_user'

export const storage = {
    getItem: (key: string): Promise<string | null> => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string): Promise<string> => {
        localStorage.setItem(key, value)
        return Promise.resolve(value)
    },
    removeItem: (key: string): Promise<void> => {
        localStorage.removeItem(key)
        return Promise.resolve()
    },
    getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    removeToken: () => localStorage.removeItem(TOKEN_KEY),
    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
    setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
    removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
    getUser: () => {
        const raw = localStorage.getItem(USER_KEY)
        if (!raw) {
            return null
        }

        try {
            return JSON.parse(raw)
        } catch {
            localStorage.removeItem(USER_KEY)
            return null
        }
    },
    setUser: (user: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
    removeUser: () => localStorage.removeItem(USER_KEY),
    clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
    },
}
