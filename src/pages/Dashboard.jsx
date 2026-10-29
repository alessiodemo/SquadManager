import { useEffect, useState } from 'react'
import { Calendar, MapPin, Trophy, Shield, Activity, ChevronRight, TrendingUp, Target } from 'lucide-react'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'
import { getMatches, getStandings } from '../api/matches'
import { getAnalytics } from '../api/analytics'
import { getErrorMessage } from '../lib/errors'
import { ErrorNotice } from '../components/ui/error-notice'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import MatchVenueIcon from '../components/MatchVenueIcon'

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
  const { selectedTeam, competitionCode, dataRefreshKey } = useTeam()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [standings, setStandings] = useState([])
  const [dashboardError, setDashboardError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setDashboardError(null)
        if (!seasonId) {
          setMatches([])
          setLoading(false)
          return
        }
        setLoading(true)
        const m = await getMatches(seasonId)
        setMatches(m || [])
      } catch (e) {
        console.error(e)
        setDashboardError(getErrorMessage(e, 'Unable to load dashboard data.'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [seasonId, dataRefreshKey])

  useEffect(() => {
    async function loadStandings() {
      if (!seasonId || !competitionCode) {
        setStandings([])
        return
      }
      try {
        const rows = await getStandings(seasonId, competitionCode)
        setStandings((rows || []).filter((row) => row.type === 'TOTAL').sort((a, b) => a.position - b.position))
      } catch (error) {
        console.error(error)
        setStandings([])
      }
    }
    loadStandings()
  }, [seasonId, competitionCode, dataRefreshKey])

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
        console.error('Error Summary:', e)
      }
    }
    loadSummary()
  }, [seasonId, dataRefreshKey])

  const played = summary?.played ?? 0
  const wins = summary?.wins ?? 0
  const draws = summary?.draws ?? 0
  const losses = summary?.losses ?? 0
  const gf = summary?.goalsFor ?? 0
  const ga = summary?.goalsAgainst ?? 0
  const points = wins * 3 + draws
  const goalDiff = gf - ga

  const playedMatches = matches.filter((m) => m.goals_for !== null)
  const upcoming = matches
    .filter((m) => m.goals_for == null)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const nextMatch = upcoming[0] ?? null
  const recentMatches = [...playedMatches]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
  const recentForm = recentMatches.map(matchResult)
  const selectedStanding = standings.find((row) =>
    selectedTeam && (
      Number(row.team_external_id) === Number(selectedTeam.id) ||
      row.team_name?.toLowerCase() === selectedTeam.name?.toLowerCase()
    )
  )
  const pointsLastFive = recentForm.reduce((total, result) => total + (result === 'win' ? 3 : result === 'draw' ? 1 : 0), 0)

  if (loading) {
    return (
      <div className="bg-sofa-card border border-sofa-border rounded-2xl p-12 text-center">
        <div className="w-8 h-8 border-2 border-sofa-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-sofa-muted">Loading club statistics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {dashboardError && <ErrorNotice message={dashboardError} onDismiss={() => setDashboardError(null)} />}

      {/* Club Hero Banner */}
      <div className="page-header bg-gradient-to-r from-sofa-card via-sofa-card to-[#12223b]">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sofa-blue/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sofa-blue to-blue-700 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg shadow-sofa-blue/25 border border-white/10 shrink-0">
              {selectedTeam?.name ? selectedTeam.name.substring(0, 2).toUpperCase() : 'FC'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {selectedTeam?.name ?? 'Your team'}
                </h1>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-sofa-muted bg-sofa-bg/80 border border-sofa-border px-2.5 py-0.5 rounded-md">
                  {selectedSeason?.name ?? 'Current season'}
                </span>
                {competitionCode && (
                  <span className="text-xs font-semibold text-sofa-blue bg-sofa-blue/10 border border-sofa-blue/20 px-2.5 py-0.5 rounded-md">
                    {competitionCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto bg-sofa-bg/60 border border-sofa-border rounded-xl px-4 py-2.5">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-sofa-muted tracking-wider">Season record</p>
              <p className="text-sm font-black text-white font-mono">
                <span className="text-emerald-400">{wins}V</span> - <span className="text-amber-400">{draws}P</span> - <span className="text-rose-400">{losses}S</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Metric StatCards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard label="Total points" value={points} highlight={true} sub={`${wins * 3} from wins`} />
        <StatCard label="Wins" value={wins} sub={`${played ? Math.round((wins / played) * 100) : 0}% win rate`} />
        <StatCard label="Draws" value={draws} sub={`${played ? Math.round((draws / played) * 100) : 0}% of matches`} />
        <StatCard label="Losses" value={losses} sub={`${played ? Math.round((losses / played) * 100) : 0}% of matches`} />
        <StatCard label="Goals scored" value={gf} sub={`${played ? (gf / played).toFixed(2) : '0.00'} per match`} />
        <StatCard label="Goals conceded" value={ga} sub={`${played ? (ga / played).toFixed(2) : '0.00'} per match`} />
        <StatCard label="Goal difference" value={`${goalDiff >= 0 ? '+' : ''}${goalDiff}`} sub={`${gf} GF · ${ga} GA`} />
        <StatCard label="Matches played" value={played} sub={`${upcoming.length} remaining`} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sofa-blueLight" />
            <h2 className="text-xs font-black uppercase tracking-wider text-sofa-muted">Recent form</h2>
          </div>
          <div className="flex items-center gap-2">
            {recentForm.length ? recentForm.map((result, index) => (
              <Badge key={`${result}-${index}`} variant={result} label={matchResultLabel(result)} />
            )) : <span className="text-sm text-sofa-muted">No completed matches yet.</span>}
          </div>
          <p className="mt-4 text-xs text-sofa-dim">{pointsLastFive} points from the last {recentForm.length} matches</p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-sofa-muted">League position</h2>
          </div>
          <p className="text-3xl font-black text-white">{selectedStanding?.position ?? '—'}</p>
          <p className="mt-1 text-xs text-sofa-dim">
            {selectedStanding ? `${selectedStanding.points ?? 0} points · ${standings.length} teams` : 'Import standings to see your position.'}
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-sofa-muted">Performance</h2>
          </div>
          <p className="text-3xl font-black text-white">{played ? `${Math.round((points / (played * 3)) * 100)}%` : '—'}</p>
          <p className="mt-1 text-xs text-sofa-dim">Points efficiency this season</p>
        </div>
      </div>

      {/* Widgets Grid: Next Match & Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Next Match Widget */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sofa-border/80">
              <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sofa-blue" />
                Next match
              </span>
              {nextMatch && (
                <span className="text-[10px] font-semibold text-sofa-dim uppercase bg-sofa-bg px-2 py-0.5 rounded border border-sofa-border">
                  {nextMatch.competition ?? competitionCode ?? 'Competition'}
                </span>
              )}
            </div>

            {nextMatch ? (
              <div className="space-y-4">
                <div className="bg-sofa-bg/70 border border-sofa-border/70 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    {/* Home Team */}
                    <div className="flex-1 text-center sm:text-left">
                      <p className={`text-base font-bold truncate ${nextMatch.is_home ? 'text-white' : 'text-sofa-muted'}`}>
                        {nextMatch.is_home ? (selectedTeam?.name ?? 'Your team') : nextMatch.opponent}
                      </p>
                      <p className="text-[11px] text-sofa-dim mt-0.5">
                        {nextMatch.is_home ? 'Home' : 'Away'}
                      </p>
                    </div>

                    {/* Center VS pill */}
                    <div className="shrink-0 flex flex-col items-center">
                      <span className="w-9 h-9 rounded-full bg-sofa-card border border-sofa-border text-sofa-blue font-black text-xs flex items-center justify-center shadow-inner">
                        VS
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center sm:text-right">
                      <p className={`text-base font-bold truncate ${!nextMatch.is_home ? 'text-white' : 'text-sofa-muted'}`}>
                        {!nextMatch.is_home ? (selectedTeam?.name ?? 'Your team') : nextMatch.opponent}
                      </p>
                      <p className="text-[11px] text-sofa-dim mt-0.5">
                        {!nextMatch.is_home ? 'Home' : 'Away'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sofa-muted px-1">
                  <div className="flex items-center gap-2">
                    <MatchVenueIcon isHome={nextMatch.is_home} />
                    <span className="text-white font-medium capitalize">
                      {new Date(nextMatch.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  {nextMatch.venue && (
                    <div className="flex items-center gap-1.5 text-sofa-dim">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{nextMatch.venue}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sofa-muted">
                <Calendar className="w-8 h-8 text-sofa-dim mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No upcoming matches scheduled</p>
                <p className="text-xs text-sofa-dim mt-1">Add a match to your calendar to see it here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Results Widget */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sofa-border/80">
              <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Recent results
              </span>
              <div className="flex items-center gap-1">
                {recentMatches.map((m) => {
                  const r = matchResult(m)
                  return (
                    <Badge
                      key={m.id}
                      variant={r}
                      label={matchResultLabel(r)}
                      className="!w-5 !h-5 !text-[10px]"
                    />
                  )
                })}
              </div>
            </div>

            {recentMatches.length === 0 ? (
              <div className="py-8 text-center text-sofa-muted">
                <Shield className="w-8 h-8 text-sofa-dim mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No completed matches recorded</p>
                <p className="text-xs text-sofa-dim mt-1">Results will appear once scores are entered.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((m) => {
                  const r = matchResult(m)
                  return (
                    <div
                      key={m.id}
                      className="bg-sofa-bg/60 hover:bg-sofa-bg border border-sofa-border/70 hover:border-sofa-borderLight rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MatchVenueIcon isHome={m.is_home} />
                        <span className="font-semibold text-xs sm:text-sm text-gray-200 truncate">
                          {m.opponent}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs text-sofa-dim hidden sm:inline-block">
                          {new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <div className="bg-sofa-card border border-sofa-border rounded-md px-2.5 py-1 text-center font-mono font-black text-sm text-white tabular-nums tracking-wide">
                          {m.goals_for} – {m.goals_against}
                        </div>
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
    </div>
  )
}
