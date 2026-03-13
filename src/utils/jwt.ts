interface JwtPayload {
    exp?: number
}

function decodeBase64Url(base64Url: string): string {
    const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return atob(padded)
}

export function isTokenExpired(token: string): boolean {
    try {
        const payloadPart = token.split('.')[1]
        if (!payloadPart) {
            return true
        }

        const payload = JSON.parse(decodeBase64Url(payloadPart)) as JwtPayload
        if (!payload.exp) {
            return true
        }

        return payload.exp * 1000 <= Date.now()
    } catch {
        return true
    }
}
