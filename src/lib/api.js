import { ApiError } from './errors'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiFetch(path, options = {}) {
    let response
    try {
        response = await fetch(`${BASE}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        })
    } catch (error) {
        throw new ApiError('Unable to reach the server.', {
            code: 'NETWORK_ERROR',
            details: error,
        })
    }

    const contentType = response.headers.get('content-type') ?? ''
    const body = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text()

    if (!response.ok) {
        const message = typeof body === 'object' && body?.error
            ? body.error
            : typeof body === 'string' && body
                ? body
                : 'La richiesta non è andata a buon fine.'

        throw new ApiError(message, {
            status: response.status,
            code: typeof body === 'object' && body?.code ? body.code : 'HTTP_ERROR',
            details: body,
        })
    }

    return body
}
