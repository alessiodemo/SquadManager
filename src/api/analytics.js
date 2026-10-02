export async function getAnalytics(seasonId) {
    const res = await fetch(`http://localhost:8080/api/analytics/seasons/${seasonId}/summary`, {
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (!res.ok) {
        throw new Error(await res.text())
    }

    return res.json()
}
