import { useEffect, useState } from 'react'
import { Trophy, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { getStandings, getMatches } from '../api/matches'
import { importStandings } from '../api/standings'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'
import Badge from '../components/Badge'

const FORM_COUNT = 5

function recentForm(matches) {
  return [...matches]
    .filter((m) => m.goals_for != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, FORM_COUNT)
    .map((m) => {
      if (m.goals_for > m.goals_against) return 'win'
      if (m.goals_for === m.goals_against) return 'draw'
      return 'loss'
    })
}

function getPositionIndicator(pos, total) {
  if (pos <= 4) return 'border-l-4 border-l-sofa-blue'
  if (pos === 5 || pos === 6) return 'border-l-4 border-l-amber-500'
  if (total > 6 && pos >= total - 2) return 'border-l-4 border-l-rose-500'
  return 'border-l-4 border-l-transparent'
}

export default function Standings() {
  const [rows, setRows] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [notification, setNotification] = useState(null)
  const { seasonId, selectedSeason } = useSeason()
  const { competitionCode, selectedTeam } = useTeam()

  async function load(sid) {
    if (!sid || !competitionCode) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [standings, matchData] = await Promise.all([
        getStandings(sid, competitionCode),
        getMatches(sid).catch(() => []),
      ])

      setMatches(matchData || [])
      setRows(
        (standings || [])
          .filter((row) => row.type === 'TOTAL')
          .sort((a, b) => a.position - b.position)
          .map((row) => ({
            position: row.position,
            name: row.team_name,
            played: Number(row.match_played || 0),
            won: Number(row.win || 0),
            drawn: Number(row.draw || 0),
            lost: Number(row.lose || 0),
            gf: Number(row.goal_scored || 0),
            ga: Number(row.goal_conceded || 0),
            points: Number(row.points || 0),
          }))
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleImportStandings() {
    if (!seasonId || !selectedSeason || !competitionCode || !selectedTeam || importing) {
      setNotification({
        type: 'error',
        message: 'Seleziona una lega, stagione e club per importare la classifica.',
      })
      return
    }
    setImporting(true)
    setNotification(null)

    try {
      const result = await importStandings({
        season: selectedSeason.start_year,
        seasonId,
        competitionCode,
      })

      await load(seasonId)
      setNotification({
        type: 'success',
        message: `Classifica aggiornata: ${result.imported ?? 0} squadre sincronizzate.`,
      })
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Errore durante l'importazione: ${error.message}`,
      })
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    if (seasonId && competitionCode) {
      load(seasonId)
    } else {
      setRows([])
      setLoading(false)
    }
  }, [seasonId, competitionCode])

  const ourForm = recentForm(matches)

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sofa-card border border-sofa-border p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Classifica</h2>
            <p className="text-xs text-sofa-muted font-medium mt-0.5">
              {competitionCode ? `${competitionCode} · ` : ''}{selectedSeason?.name ?? 'Stagione corrente'}
            </p>
          </div>
        </div>

        <button
          onClick={handleImportStandings}
          disabled={!seasonId || !selectedSeason || !competitionCode || !selectedTeam || importing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sofa-cardHover hover:bg-sofa-border border border-sofa-border hover:border-sofa-borderLight disabled:opacity-40 disabled:hover:bg-sofa-cardHover text-sofa-text text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm group self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sofa-blue ${importing ? 'animate-spin' : 'group-hover:rotate-45 transition-transform'}`} />
          <span>{importing ? 'Sincronizzazione...' : 'Sincronizza Classifica'}</span>
        </button>
      </div>

      {notification && (
        <div
          role="status"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-sofa-card border border-sofa-border rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-sofa-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-sofa-muted">Caricamento classifica in corso...</p>
        </div>
      ) : (
        <div className="bg-sofa-card border border-sofa-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sofa-bg/60 text-sofa-muted uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-sofa-border">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4 font-bold">Squadra</th>
                  <th className="py-3 px-2 text-center w-12" title="Partite Giocate">PG</th>
                  <th className="py-3 px-2 text-center w-10 text-emerald-400/80" title="Vittorie">V</th>
                  <th className="py-3 px-2 text-center w-10 text-amber-400/80" title="Pareggi">P</th>
                  <th className="py-3 px-2 text-center w-10 text-rose-400/80" title="Sconfitte">S</th>
                  <th className="py-3 px-2 text-center w-12 hidden md:table-cell" title="Gol Fatti">GF</th>
                  <th className="py-3 px-2 text-center w-12 hidden md:table-cell" title="Gol Subiti">GS</th>
                  <th className="py-3 px-2 text-center w-12" title="Differenza Reti">DR</th>
                  <th className="py-3 px-3 text-center w-14 font-black text-white" title="Punti">PT</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell w-36">Ultime 5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sofa-border/60 text-xs sm:text-sm">
                {rows.map((row, i) => {
                  const isSelected = selectedTeam && (
                    row.name.toLowerCase() === selectedTeam.name.toLowerCase() ||
                    row.name.toLowerCase().includes(selectedTeam.name.toLowerCase()) ||
                    selectedTeam.name.toLowerCase().includes(row.name.toLowerCase())
                  )
                  const zoneBorder = getPositionIndicator(i + 1, rows.length)
                  const goalDiff = row.gf - row.ga

                  return (
                    <tr
                      key={row.name}
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-sofa-blue/15 hover:bg-sofa-blue/20 font-semibold text-white'
                          : 'hover:bg-sofa-cardHover/70 text-sofa-text'
                      } ${zoneBorder}`}
                    >
                      {/* Position */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center font-mono font-bold text-xs ${isSelected ? 'text-sofa-blue text-sm' : 'text-sofa-muted'}`}>
                          {i + 1}
                        </span>
                      </td>

                      {/* Team Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isSelected
                              ? 'bg-sofa-blue text-white shadow-sm shadow-sofa-blue/40'
                              : 'bg-sofa-border text-sofa-muted group-hover:text-white'
                          }`}>
                            {row.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className={`truncate font-medium ${isSelected ? 'text-white font-bold' : 'text-gray-200'}`}>
                            {row.name}
                          </span>
                          {isSelected && (
                            <span className="hidden lg:inline-flex bg-sofa-blue/20 text-sofa-blue border border-sofa-blue/30 text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-sofa-muted">{row.played}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-emerald-400 font-semibold">{row.won}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-amber-400 font-semibold">{row.drawn}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-rose-400 font-semibold">{row.lost}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-sofa-muted hidden md:table-cell">{row.gf}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums text-sofa-muted hidden md:table-cell">{row.ga}</td>
                      <td className="py-3 px-2 text-center font-mono tabular-nums font-medium">
                        <span className={goalDiff > 0 ? 'text-emerald-400' : goalDiff < 0 ? 'text-rose-400' : 'text-sofa-muted'}>
                          {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block min-w-8 py-0.5 px-1.5 rounded font-mono font-black text-sm tabular-nums ${
                          isSelected ? 'bg-sofa-blue text-white shadow-sm' : 'bg-sofa-bg/80 text-white border border-sofa-border/60'
                        }`}>
                          {row.points}
                        </span>
                      </td>

                      {/* Recent Form */}
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        {
                          <div className="flex items-center justify-center gap-1">
                            {ourForm.length === 0 ? (
                              <span className="text-xs text-sofa-dim">—</span>
                            ) : (
                              ourForm.map((result, idx) => (
                                <Badge
                                  key={idx}
                                  variant={result}
                                  label={result === 'win' ? 'V' : result === 'draw' ? 'P' : 'S'}
                                />
                              ))
                            )}
                          </div>
                        }
                      </td>
                    </tr>
                  )
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan="11" className="py-12 text-center text-sofa-muted">
                      <p className="text-sm">Nessun dato di classifica disponibile per questa stagione.</p>
                      <p className="text-xs text-sofa-dim mt-1">Usa il pulsante "Sincronizza Classifica" in alto a destra.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Standings Legend */}
          {rows.length > 0 && (
            <div className="px-4 py-3 bg-sofa-bg/50 border-t border-sofa-border flex flex-wrap items-center gap-4 text-[11px] text-sofa-muted">
              <span className="font-bold uppercase tracking-wider text-sofa-dim">Legenda:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sofa-blue" />
                <span>Champions League (1-4)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Europa League (5-6)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Retrocessione</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
