export function getFootballAuth() {
    const token = process.env.FOOTBALL_DATA_TOKEN
    
    if (!token) {
        throw new Error('FOOTBALL_DATA_TOKEN is not configured')
    }
    return {'X-Auth-Token': token}
}