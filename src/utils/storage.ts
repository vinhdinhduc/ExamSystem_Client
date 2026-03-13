const TOKEN_KEY = 'exam_token'
const USER_KEY = 'exam_user'

export const storage = {
    getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    removeToken: () => localStorage.removeItem(TOKEN_KEY),
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
        localStorage.removeItem(USER_KEY)
    },
}
