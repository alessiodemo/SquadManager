import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Plus, RefreshCw, Radio, Edit2, Trash2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { getMatches, getMatchContext, upsertMatch, deleteMatch, updateScore, importCompetitionMatches } from '../api/matches'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'
import MatchVenueIcon from '../components/MatchVenueIcon'
import { getErrorMessage } from '../lib/errors'

function matchResult(m) {
  if (m.goals_for == null) return null
  if (m.goals_for > m.goals_against) return 'win'
  if (m.goals_for === m.goals_against) return 'draw'
  return 'loss'
}

const emptyForm = {
  opponent: '', date: '', is_home: true, venue: '',
  goals_for: '', goals_against: '', season_id: '',
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const { seasonId, selectedSeason } = useSeason()
  const { competitionCode, selectedTeam } = useTeam()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [liveId, setLiveId] = useState(null)
  const [liveScore, setLiveScore] = useState({ gf: '', ga: '' })
  const [context, setContext] = useState(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [contextMatch, setContextMatch] = useState(null)
  const [showContextModal, setShowContextModal] = useState(false)
  const [syncState, setSyncState] = useState({
    status: 'idle',
    imported: null,
    message: null,
    completedAt: null,
  })
  const load = useCallback(async (sid) => {
    if (!sid) {
      setMatches([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getMatches(sid)
      setMatches(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (seasonId) load(seasonId)
  }, [seasonId, load])

  // Real-time subscription
  useEffect(() => {
    if (!seasonId) return
    const channel = supabase
      .channel('matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load(seasonId))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [seasonId, load])

  function openNew() {
    setForm({ ...emptyForm, season_id: seasonId })
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(m) {
    setForm({
      opponent: m.opponent, date: m.date, is_home: m.is_home,
      venue: m.venue ?? '', goals_for: m.goals_for ?? '',
      goals_against: m.goals_against ?? '', season_id: m.season_id,
    })
    setEditingId(m.id)
    setShowModal(true)
  }

  async function handleSave() {
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      opponent: form.opponent,
      date: form.date,
      is_home: form.is_home,
      venue: form.venue || null,
      goals_for: form.goals_for !== '' ? Number(form.goals_for) : null,
      goals_against: form.goals_against !== '' ? Number(form.goals_against) : null,
      season_id: form.season_id,
    }
    try {
      await upsertMatch(payload)
      setShowModal(false)
      load(seasonId)
    } catch (e) {
      alert(getErrorMessage(e, 'Unable to save the match.'))
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this match?')) return
    await deleteMatch(id)
    load(seasonId)
  }

  async function handleLiveUpdate(id) {
    try {
      await updateScore(id, Number(liveScore.gf), Number(liveScore.ga))
      setLiveId(null)
      load(seasonId)
    } catch (e) {
      alert(getErrorMessage(e, 'Unable to update the score.'))
    }
  }

  async function handleContext(match) {
    setContextMatch(match)
    setShowContextModal(true)
    setContext(null)
    setContextLoading(true)

    try {
      const data = await getMatchContext(match.id)
      setContext(data)
    } catch (e) {
      alert(getErrorMessage(e, 'Unable to load the match context.'))
      setShowContextModal(false)
    } finally {
      setContextLoading(false)
    }
  }

  async function handleImport() {
    if (!selectedSeason || !selectedTeam || !competitionCode) {
      setSyncState((current) => ({
        ...current,
        status: 'error',
        message: 'Select a competition, season, and club before importing.',
      }))
      return
    }

    setSyncState({
      status: 'syncing',
      imported: null,
      message: 'Fetching the latest matches...',
      completedAt: null,
    })

    try {
      const result = await importCompetitionMatches({
        competitionCode,
        season: selectedSeason.start_year,
        teamExternalId: selectedTeam.id,
        seasonId,
      })

      await load(seasonId)
      setSyncState({
        status: 'success',
        imported: result.imported ?? 0,
        message: `Synchronization completed. ${result.imported ?? 0} matches imported or updated.`,
        completedAt: new Date(),
      })
    } catch (error) {
      setSyncState({
        status: 'error',
        imported: null,
        message: getErrorMessage(error, 'Unable to synchronize matches.'),
        completedAt: null,
      })
    }
  }

  const upcoming = matches.filter((m) => m.goals_for == null).sort((a, b) => new Date(a.date) - new Date(b.date))
  const played = matches.filter((m) => m.goals_for != null).sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Matches</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sofa-card border border-sofa-border text-sofa-muted">
              {matches.length} overall matches
            </span>
          </div>
          <p className="text-xs text-sofa-muted mt-0.5">
            {selectedTeam ? `${selectedTeam.name} · Calendar and results` : 'Select a team to visualize the calendar and results'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleImport}
            disabled={!seasonId || !selectedTeam || !competitionCode || syncState.status === 'syncing'}
            className="action-button"
          >
            <RefreshCw size={14} className={`text-sofa-muted ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncState.status === 'syncing' ? 'Synchronizing...' : selectedTeam ? `Synchronize ${selectedTeam.name}` : 'Synchronize'}</span>
          </button>
          
          <button
            onClick={openNew}
            disabled={!seasonId}
            className="primary-button shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Insert match manually</span>
          </button>
        </div>
      </div>

      {syncState.status !== 'idle' && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
          syncState.status === 'success'
            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
            : syncState.status === 'error'
              ? 'border-rose-500/25 bg-rose-500/10 text-rose-200'
              : 'border-sofa-blue/25 bg-sofa-blue/10 text-blue-100'
        }`}>
          {syncState.status === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : syncState.status === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          ) : (
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-sofa-blueLight" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{syncState.message}</p>
            {syncState.completedAt && (
              <p className="mt-1 text-xs opacity-70">
                Last updated {syncState.completedAt.toLocaleString('en-GB')}
              </p>
            )}
          </div>
          {syncState.status === 'error' && (
            <button type="button" onClick={handleImport} className="text-xs font-bold underline underline-offset-2">
              Try again
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-2 border-sofa-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-sofa-muted">Matches loading...</p>
        </div>
      ) : (
        <>
          {/* Upcoming Matches */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-sofa-muted flex items-center gap-2">
                  <Calendar size={14} className="text-sofa-blueLight" />
                  <span>Schedule ({upcoming.length})</span>
                </h3>
              </div>
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div
                    key={m.id}
                    className="glass-panel rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-150 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <MatchVenueIcon isHome={m.is_home} />
                      <div>
                        <p className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                          <span>{m.is_home ? (selectedTeam?.name || 'Home') : m.opponent}</span>
                          <span className="text-sofa-dim font-normal text-xs">vs</span>
                          <span>{m.is_home ? m.opponent : (selectedTeam?.name || 'Ospite')}</span>
                        </p>
                        <p className="text-xs text-sofa-muted mt-0.5">
                          {new Date(m.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {m.venue ? ` · 📍 ${m.venue}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {liveId === m.id ? (
                        <div className="flex items-center gap-1.5 bg-sofa-dark border border-sofa-border p-1 rounded-lg">
                          <input
                            type="number"
                            min="0"
                            value={liveScore.gf}
                            onChange={(e) => setLiveScore((s) => ({ ...s, gf: e.target.value }))}
                            placeholder="0"
                            className="w-10 bg-[#131f33] border border-sofa-border text-white text-center rounded px-1 py-1 text-xs font-bold font-mono focus:border-sofa-blue outline-none"
                          />
                          <span className="text-sofa-dim font-bold">–</span>
                          <input
                            type="number"
                            min="0"
                            value={liveScore.ga}
                            onChange={(e) => setLiveScore((s) => ({ ...s, ga: e.target.value }))}
                            placeholder="0"
                            className="w-10 bg-[#131f33] border border-sofa-border text-white text-center rounded px-1 py-1 text-xs font-bold font-mono focus:border-sofa-blue outline-none"
                          />
                          <button
                            onClick={() => handleLiveUpdate(m.id)}
                            className="bg-sofa-blue hover:bg-sofa-blueHover text-white text-xs font-bold px-2.5 py-1 rounded"
                          >
                            Salva
                          </button>
                          <button
                            onClick={() => setLiveId(null)}
                            className="text-sofa-muted hover:text-white text-xs px-1.5 py-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setLiveId(m.id); setLiveScore({ gf: '', ga: '' }) }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Radio size={12} className="animate-pulse" />
                          <span>Live</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEdit(m)}
                        title="Edit"
                        className="p-1.5 text-sofa-muted hover:text-white hover:bg-sofa-cardHover rounded-lg transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        title="Delete"
                        className="p-1.5 text-sofa-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Played Matches / Results */}
          {played.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-sofa-muted flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Results ({played.length})</span>
                </h3>
              </div>
              <div className="space-y-2">
                {played.map((m) => {
                  const r = matchResult(m)
                  return (
                    <div
                      key={m.id}
                      className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-150 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Badge label={r === 'win' ? 'V' : r === 'draw' ? 'P' : 'S'} variant={r} />
                        <div>
                          <div className="flex items-center gap-2">
                            <MatchVenueIcon isHome={m.is_home} />
                            <p className="font-bold text-white text-sm tracking-tight">
                              {m.opponent}
                            </p>
                          </div>
                          <p className="text-xs text-sofa-muted mt-0.5">
                            {new Date(m.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {m.venue ? ` · ${m.venue}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {/* Score Box */}
                        <div className="font-mono font-black text-sm sm:text-base px-3 py-1 bg-[#0b1320] border border-[#1e2f4a] text-white rounded-lg tabular-nums shadow-inner tracking-wider">
                          {m.goals_for} – {m.goals_against}
                        </div>

                        {/* Sofascore AI Context Button */}
                        <button
                          onClick={() => handleContext(m)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sofa-blueLight bg-sofa-blue/10 hover:bg-sofa-blue/20 border border-sofa-blue/30 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                        >
                          <Sparkles size={13} className="text-sofa-blueLight" />
                          <span>Analisi AI</span>
                        </button>

                        <button
                          onClick={() => openEdit(m)}
                          title="Edit"
                          className="p-1.5 text-sofa-muted hover:text-white hover:bg-sofa-cardHover rounded-lg transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          title="Delete"
                          className="p-1.5 text-sofa-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {upcoming.length === 0 && played.length === 0 && (
            <div className="text-center py-12 bg-sofa-card border border-sofa-border rounded-2xl p-8">
              <Calendar size={36} className="mx-auto text-sofa-muted opacity-40 mb-3" />
              <p className="text-sm font-semibold text-slate-300">Nessuna partita in questa stagione</p>
              <p className="text-xs text-sofa-muted mt-1">Usa il pulsante in alto a destra per sincronizzare o aggiungere gare</p>
            </div>
          )}
        </>
      )}

      {/* AI Match Context Modal */}
      {showContextModal && (
        <Modal
          title={`Sofascore AI analysis — vs ${contextMatch?.opponent || 'Match'}`}
          onClose={() => {
            setShowContextModal(false)
            setContext(null)
          }}
          maxWidth="max-w-2xl"
        >
          {contextLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-2 border-sofa-blue border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">Generazione analisi in corso...</p>
                <p className="text-xs text-sofa-muted mt-1">L'assistente AI sta elaborando statistiche ed eventi del match</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#0b1320] border border-sofa-border rounded-xl p-5 max-h-[60vh] overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {typeof context?.result === 'string'
                    ? context.result
                    : JSON.stringify(context?.result || context, null, 2)}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowContextModal(false)
                    setContext(null)
                  }}
                  className="px-5 py-2 bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Add / Edit Match Modal */}
      {showModal && (
        <Modal title={editingId ? 'Edit match' : 'New match'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-sofa-muted uppercase tracking-wider mb-1">Avversario</label>
              <input
                value={form.opponent}
                onChange={(e) => setForm((f) => ({ ...f, opponent: e.target.value }))}
                placeholder="es. Juventus, Inter, Milan..."
                className="w-full bg-[#0b1320] border border-sofa-border rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-sofa-muted uppercase tracking-wider mb-1">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-sofa-border rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sofa-muted uppercase tracking-wider mb-1">Stadium / Venue</label>
                <input
                  value={form.venue}
                  onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                  placeholder="es. San Siro..."
                  className="w-full bg-[#0b1320] border border-sofa-border rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0b1320] border border-sofa-border">
              <input
                id="home"
                type="checkbox"
                checked={form.is_home}
                onChange={(e) => setForm((f) => ({ ...f, is_home: e.target.checked }))}
                className="w-4 h-4 accent-sofa-blue rounded cursor-pointer"
              />
              <label htmlFor="home" className="text-xs font-semibold text-slate-200 cursor-pointer">
                Home match
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-sofa-muted uppercase tracking-wider mb-1">Gol fatti</label>
                <input
                  type="number"
                  min="0"
                  value={form.goals_for}
                  onChange={(e) => setForm((f) => ({ ...f, goals_for: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-[#0b1320] border border-sofa-border rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sofa-muted uppercase tracking-wider mb-1">Gol subiti</label>
                <input
                  type="number"
                  min="0"
                  value={form.goals_against}
                  onChange={(e) => setForm((f) => ({ ...f, goals_against: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-[#0b1320] border border-sofa-border rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue transition-colors font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-sofa-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-bold text-sofa-muted hover:text-white px-4 py-2 transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-sofa-blue hover:bg-sofa-blueHover text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-sofa-blue/25"
              >
                Save match
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
