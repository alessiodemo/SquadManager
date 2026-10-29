import { ApiError } from './errors'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(baseUrl, path, options = {}) {
    let response
    try {
        response = await fetch(`${baseUrl}${path}`, {
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
                : 'The request could not be completed.'

        throw new ApiError(message, {
            status: response.status,
            code: typeof body === 'object' && body?.code ? body.code : 'HTTP_ERROR',
            details: body,
        })
    }

    return body
}

export function apiFetch(path, options = {}) {
    return request(BASE, path, options)
}

export function apiFetchFrom(baseUrl, path, options = {}) {
    return request(baseUrl, path, options)
}
