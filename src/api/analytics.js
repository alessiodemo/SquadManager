import { apiFetchFrom } from '../lib/api'

const ANALYTICS_API_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8080'

export function getAnalytics(seasonId) {
    return apiFetchFrom(
        ANALYTICS_API_URL,
        `/api/analytics/seasons/${encodeURIComponent(seasonId)}/summary`,
    )
}
