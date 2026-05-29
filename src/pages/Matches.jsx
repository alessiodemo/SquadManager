import { useEffect, useState, useCallback } from 'react'
import { getMatches, upsertMatch, deleteMatch, updateScore } from '../api/matches'
import { getCurrentSeason } from '../api/seasons'
import { supabase } from '../lib/supabase'
import SeasonSelector from '../components/SeasonSelector'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

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
  const [seasonId, setSeasonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [liveId, setLiveId] = useState(null)
  const [liveScore, setLiveScore] = useState({ gf: '', ga: '' })

  const load = useCallback(async (sid) => {
    if (!sid) return
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
    getCurrentSeason()
      .then((s) => setSeasonId(s.id))
      .catch((e) => { console.error(e); setLoading(false) })
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
      alert(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questa partita?')) return
    await deleteMatch(id)
    load(seasonId)
  }

  async function handleLiveUpdate(id) {
    try {
      await updateScore(id, Number(liveScore.gf), Number(liveScore.ga))
      setLiveId(null)
      load(seasonId)
    } catch (e) {
      alert(e.message)
    }
  }

  const upcoming = matches.filter((m) => m.goals_for == null).sort((a, b) => new Date(a.date) - new Date(b.date))
  const played = matches.filter((m) => m.goals_for != null).sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Partite</h2>
        <div className="flex gap-3">
          <SeasonSelector value={seasonId} onChange={setSeasonId} />
          <button onClick={openNew} className="bg-green-700 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Aggiungi
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Caricamento...</p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Calendario</h3>
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{m.is_home ? 'vs' : '@'} {m.opponent}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(m.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}{m.venue ? ` · ${m.venue}` : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      {liveId === m.id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={liveScore.gf} onChange={(e) => setLiveScore((s) => ({ ...s, gf: e.target.value }))} placeholder="0" className="w-12 bg-gray-800 border border-gray-600 text-white text-center rounded px-1 py-0.5 text-sm" />
                          <span className="text-gray-400">–</span>
                          <input type="number" min="0" value={liveScore.ga} onChange={(e) => setLiveScore((s) => ({ ...s, ga: e.target.value }))} placeholder="0" className="w-12 bg-gray-800 border border-gray-600 text-white text-center rounded px-1 py-0.5 text-sm" />
                          <button onClick={() => handleLiveUpdate(m.id)} className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-lg">Salva</button>
                          <button onClick={() => setLiveId(null)} className="text-gray-500 hover:text-white text-xs px-2 py-1">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setLiveId(m.id); setLiveScore({ gf: '', ga: '' }) }} className="text-xs text-green-400 hover:text-green-300 border border-green-700 px-3 py-1 rounded-lg">Live</button>
                      )}
                      <button onClick={() => openEdit(m)} className="text-xs text-gray-400 hover:text-white">✏️</button>
                      <button onClick={() => handleDelete(m.id)} className="text-xs text-gray-400 hover:text-red-400">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {played.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Risultati</h3>
              <div className="space-y-2">
                {played.map((m) => {
                  const r = matchResult(m)
                  return (
                    <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge label={r === 'win' ? 'V' : r === 'draw' ? 'P' : 'S'} variant={r} />
                        <div>
                          <p className="font-medium text-white">{m.is_home ? 'vs' : '@'} {m.opponent}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(m.date).toLocaleDateString('it-IT')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">{m.goals_for}–{m.goals_against}</span>
                        <button onClick={() => openEdit(m)} className="text-xs text-gray-400 hover:text-white">✏️</button>
                        <button onClick={() => handleDelete(m.id)} className="text-xs text-gray-400 hover:text-red-400">🗑️</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {upcoming.length === 0 && played.length === 0 && (
            <p className="text-gray-500">Nessuna partita in questa stagione.</p>
          )}
        </>
      )}

      {showModal && (
        <Modal title={editingId ? 'Modifica partita' : 'Nuova partita'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Avversario</label>
              <input value={form.opponent} onChange={(e) => setForm((f) => ({ ...f, opponent: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Venue</label>
                <input value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="Stadio..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="home" type="checkbox" checked={form.is_home} onChange={(e) => setForm((f) => ({ ...f, is_home: e.target.checked }))} className="accent-green-600" />
              <label htmlFor="home" className="text-sm text-gray-300">Partita in casa</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Gol fatti</label>
                <input type="number" min="0" value={form.goals_for} onChange={(e) => setForm((f) => ({ ...f, goals_for: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Gol subiti</label>
                <input type="number" min="0" value={form.goals_against} onChange={(e) => setForm((f) => ({ ...f, goals_against: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-400 hover:text-white px-4 py-2">Annulla</button>
              <button onClick={handleSave} className="bg-green-700 hover:bg-green-600 text-white text-sm font-medium px-5 py-2 rounded-lg">Salva</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
