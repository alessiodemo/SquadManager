import { useEffect, useState } from 'react'
import { useSeason } from '../context/seasonContext'
import { getMatches } from '../api/matches'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import MatchVenueIcon from '../components/MatchVenueIcon'
import { getAnalytics } from '../api/analytics'

function matchResult(m) {
  if (m.goals_for == null) return null
  if (m.goals_for > m.goals_against) return 'win'
  if (m.goals_for === m.goals_against) return 'draw'
  return 'loss'
}

function matchResultLabel(r) {
  return r === 'win' ? 'V' : r === 'draw' ? 'P' : r === 'loss' ? 'S' : null
}

export default function Dashboard() {
  const { seasonId, selectedSeason } = useSeason()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [ summary, setSummary ] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        if (!seasonId) {
          setMatches([])
          setLoading(false)
          return
        }
        setLoading(true)
        const m = await getMatches(seasonId)
        setMatches(m)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [seasonId])

  useEffect(() => {
    async function loadSummary() {
      if (!seasonId) {
        setSummary(null)
        return
      }
      try {
        setSummary(null)
        const s = await getAnalytics(seasonId)
        setSummary(s)
      } catch (e) {
        console.error('Error Summary:',e)
      }
    }

      loadSummary()
    }, [seasonId])

  const played = summary?.played ?? 0
  const wins = summary?.wins ?? 0
  const draws = summary?.draws ?? 0
  const losses = summary?.losses ?? 0
  const gf = summary?.goalsFor ?? 0
  const ga = summary?.goalsAgainst ?? 0
  const points = wins * 3 + draws
  const playedMatches = matches.filter((m) =>m.goals_for !== null)

  const upcoming = matches.filter((m) => m.goals_for == null).sort((a, b) => new Date(a.date) - new Date(b.date))
  const nextMatch = upcoming[0] ?? null
  const recentMatches = [...playedMatches].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  const season = selectedSeason

  if (loading) return <p className="text-gray-400">Caricamento...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{season?.name ?? 'Stagione corrente'}</h2>
        <p className="text-gray-400 text-sm mt-0.5">Panoramica stagione</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Punti" value={points} />
        <StatCard label="Vittorie" value={wins} />
        <StatCard label="Pareggi" value={draws} />
        <StatCard label="Sconfitte" value={losses} />
        <StatCard label="Gol fatti" value={gf} />
        <StatCard label="Gol subiti" value={ga} />
        <StatCard label="Diff. reti" value={`${gf - ga >= 0 ? '+' : ''}${gf - ga}`} />
        <StatCard label="Partite" value={played} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nextMatch && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Prossima partita</p>
            <p className="flex items-center gap-2 font-semibold text-white text-lg">
              <MatchVenueIcon isHome={nextMatch.is_home} size={19} />
              {nextMatch.opponent}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {new Date(nextMatch.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {nextMatch.venue && <p className="text-gray-500 text-xs mt-1">{nextMatch.venue}</p>}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Ultimi risultati</p>
          {recentMatches.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun risultato</p>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => {
                const r = matchResult(m)
                return (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-300">
                      <MatchVenueIcon isHome={m.is_home} />
                      {m.opponent}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">{m.goals_for}–{m.goals_against}</span>
                      <Badge label={matchResultLabel(r)} variant={r} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
