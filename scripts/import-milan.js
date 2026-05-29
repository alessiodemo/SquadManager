import { createClient } from '@supabase/supabase-js'

// ── Configura queste variabili ──────────────────────────────
const APISPORTS_KEY  = 'b322b6319ebb785734ce936f4f709f02'
const SUPABASE_URL   = 'https://tmdzofqwogrhcggetrik.supabase.co'
const SUPABASE_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZHpvZnF3b2dyaGNnZ2V0cmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDc4NjAsImV4cCI6MjA5NTYyMzg2MH0.IOVSAtq5fMPGtHulvGFnV-LrqR1HkRbGlS3MoAS6gbA'
// ────────────────────────────────────────────────────────────

const MILAN_ID  = 489
const LEAGUE_ID = 135   // Serie A
const SEASON    = 2025  // stagione 2025/26 — cambia in 2024 per la stagione precedente

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const headers = {
  'x-apisports-key': APISPORTS_KEY,
}

async function apiFetch(path) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, { headers })
  const json = await res.json()
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(JSON.stringify(json.errors))
  }
  return json.response
}

function mapRole(position) {
  const map = { Goalkeeper: 'POR', Defender: 'DIF', Midfielder: 'CEN', Attacker: 'ATT' }
  return map[position] ?? 'CEN'
}

async function importSeason() {
  const seasonName = `${SEASON}/${String(SEASON + 1).slice(-2)}`
  console.log(`Importazione stagione ${seasonName}...`)

  // Rimuovi is_current dalle altre stagioni
  await supabase.from('seasons').update({ is_current: false }).neq('start_year', SEASON)

  // Cerca stagione esistente
  const { data: existing } = await supabase
    .from('seasons')
    .select('*')
    .eq('start_year', SEASON)
    .maybeSingle()

  if (existing) {
    await supabase.from('seasons').update({ is_current: true }).eq('id', existing.id)
    console.log('Stagione esistente impostata come corrente:', existing.id)
    return existing
  }

  const { data: season, error: sErr } = await supabase
    .from('seasons')
    .insert({ name: seasonName, start_year: SEASON, is_current: true })
    .select()
    .single()
  if (sErr) throw sErr
  console.log('Stagione creata:', season.id)
  return season
}

async function importPlayers(seasonId) {
  console.log('Scarico rosa Milan...')
  const data = await apiFetch(`/players/squads?team=${MILAN_ID}`)
  const players = data[0].players

  for (const p of players) {
    const nameParts = p.name.split(' ')
    const surname = nameParts.slice(-1)[0] || ''
    const name = nameParts.slice(0, -1).join(' ') || p.name

    // Controlla se esiste già
    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('name', name)
      .eq('surname', surname)
      .maybeSingle()

    let playerId = existing?.id

    if (!existing) {
      const { data: player, error } = await supabase
        .from('players')
        .insert({ name, surname, role: mapRole(p.position), nationality: p.nationality ?? null, birth_date: p.birth?.date ?? null })
        .select('id')
        .single()
      if (error) { console.warn(`Errore giocatore ${p.name}:`, error.message); continue }
      playerId = player.id
    }

    await supabase
      .from('player_stats')
      .upsert({ player_id: playerId, season_id: seasonId, appearances: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }, { onConflict: 'player_id,season_id' })

    console.log(`  ✓ ${p.name} (${mapRole(p.position)})`)
  }
}

async function importMatches(seasonId) {
  console.log('Scarico partite Serie A 2024/25...')
  const data = await apiFetch(`/fixtures?team=${MILAN_ID}&season=${SEASON}&league=${LEAGUE_ID}`)

  for (const f of data) {
    const isHome = f.teams.home.id === MILAN_ID
    const goalsFor     = f.goals[isHome ? 'home' : 'away']
    const goalsAgainst = f.goals[isHome ? 'away' : 'home']
    const opponent     = isHome ? f.teams.away.name : f.teams.home.name

    const matchData = {
      season_id:     seasonId,
      date:          f.fixture.date.split('T')[0],
      opponent,
      is_home:       isHome,
      venue:         f.fixture.venue?.name ?? null,
      goals_for:     goalsFor,
      goals_against: goalsAgainst,
    }

    const { data: existing } = await supabase.from('matches').select('id').eq('season_id', seasonId).eq('date', matchData.date).eq('opponent', opponent).maybeSingle()
    if (existing) { console.log(`  → già presente: vs ${opponent}`); continue }
    const { error } = await supabase.from('matches').insert(matchData)
    if (error) console.warn(`Errore partita vs ${opponent}:`, error.message)
    else console.log(`  ✓ vs ${opponent} (${matchData.date}) ${goalsFor ?? '?'}–${goalsAgainst ?? '?'}`)
  }
}

async function importStats(seasonId) {
  console.log('Scarico statistiche giocatori...')
  let page = 1
  let hasMore = true

  while (hasMore) {
    const data = await apiFetch(`/players?team=${MILAN_ID}&season=${SEASON}&league=${LEAGUE_ID}&page=${page}`)
    if (!data.length) break

    for (const entry of data) {
      const p = entry.player
      const stats = entry.statistics[0]

      // Trova il giocatore nel db per nome
      const nameParts = p.name.split(' ')
      const surname = nameParts.slice(-1)[0]
      const { data: dbPlayer } = await supabase
        .from('players')
        .select('id')
        .ilike('surname', surname)
        .maybeSingle()

      if (!dbPlayer) continue

      await supabase
        .from('player_stats')
        .upsert({
          player_id:    dbPlayer.id,
          season_id:    seasonId,
          appearances:  stats.games.appearences ?? 0,
          goals:        stats.goals.total ?? 0,
          assists:      stats.goals.assists ?? 0,
          yellow_cards: stats.cards.yellow ?? 0,
          red_cards:    stats.cards.red ?? 0,
        }, { onConflict: 'player_id,season_id' })

      console.log(`  ✓ stats ${p.name}: ${stats.goals.total ?? 0} gol, ${stats.goals.assists ?? 0} assist`)
    }

    // API-Football pagina le statistiche (20 per pagina)
    hasMore = data.length === 20
    page++
  }
}

async function main() {
  try {
    const season = await importSeason()
    await importPlayers(season.id)
    await importMatches(season.id)
    await importStats(season.id)
    console.log('\nImportazione completata!')
  } catch (e) {
    console.error('Errore:', e.message)
  }
}

main()
