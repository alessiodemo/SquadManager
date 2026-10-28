export class ApiError extends Error {
  constructor(message, { status = null, code = 'API_ERROR', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback

  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return 'You do not have permission to perform this operation.'
    }
    if (error.status === 404) {
      return 'The requested resource was not found.'
    }
    if (error.status === 429) {
      return 'Too many requests. Please wait a few seconds and try again.'
    }
    if (error.status >= 500) {
      return 'The server is currently unavailable. Please try again later.'
    }
    return error.message || fallback
  }

  if (error instanceof TypeError) {
    return 'Unable to reach the server. Check your connection.'
  }

  return error.message || fallback
}
