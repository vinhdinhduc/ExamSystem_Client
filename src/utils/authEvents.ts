export const AUTH_LOGOUT_EVENT = 'auth:logout'

export const triggerAutoLogout = () => {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
}
