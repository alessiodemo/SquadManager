import { useEffect, useState } from 'react'
import { getSquadWithStats } from '../api/players'
import { upsertPlayer, deletePlayer } from '../api/players'
import { supabase } from '../lib/supabase'
import { getCurrentSeason } from '../api/seasons'
import SeasonSelector from '../components/SeasonSelector'
import Modal from '../components/Modal'

const ROLES = ['POR', 'DIF', 'CEN', 'ALA', 'ATT']

const emptyForm = {
  name: '', surname: '', role: 'CEN', nationality: '', birth_date: '',
}

const roleOrder = { POR: 0, DIF: 1, CEN: 2, ALA: 3, ATT: 4 }

export default function Squad() {
  const [players, setPlayers] = useState([])
  const [seasonId, setSeasonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('')

  async function load(sid) {
    if (!sid) return
    setLoading(true)
    try {
      const data = await getSquadWithStats(sid)
      setPlayers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCurrentSeason()
      .then((s) => setSeasonId(s.id))
      .catch((e) => { console.error(e); setLoading(false) })
  }, [])

  useEffect(() => {
    if (seasonId) load(seasonId)
  }, [seasonId])

  useEffect(() => {
    if (!seasonId) return
    const channel = supabase
      .channel('players-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => load(seasonId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, () => load(seasonId))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [seasonId])

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(p) {
    setForm({ name: p.name, surname: p.surname, role: p.role, nationality: p.nationality ?? '', birth_date: p.birth_date ?? '' })
    setEditingId(p.id)
    setShowModal(true)
  }

  async function handleSave() {
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name,
      surname: form.surname,
      role: form.role,
      nationality: form.nationality || null,
      birth_date: form.birth_date || null,
    }
    try {
      await upsertPlayer(payload)
      setShowModal(false)
      load(seasonId)
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo giocatore?')) return
    await deletePlayer(id)
    load(seasonId)
  }

  const filtered = players
    .filter((p) => {
      const q = filter.toLowerCase()
      return !q || `${p.name} ${p.surname}`.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q)
    })
    .sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) || a.surname.localeCompare(b.surname))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Rosa</h2>
        <div className="flex gap-3">
          <SeasonSelector value={seasonId} onChange={setSeasonId} />
          <button onClick={openNew} className="bg-green-700 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Aggiungi
          </button>
        </div>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Cerca giocatore o ruolo..."
        className="w-full max-w-xs bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
      />

      {loading ? (
        <p className="text-gray-400">Caricamento...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-800">
                <th className="pb-2 font-medium">Giocatore</th>
                <th className="pb-2 font-medium">Ruolo</th>
                <th className="pb-2 font-medium text-center">P</th>
                <th className="pb-2 font-medium text-center">Gol</th>
                <th className="pb-2 font-medium text-center">Assist</th>
                <th className="pb-2 font-medium text-center">GG</th>
                <th className="pb-2 font-medium text-center">GR</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((p) => {
                const stats = p.player_stats?.[0]
                return (
                  <tr key={p.id} className="hover:bg-gray-900/50">
                    <td className="py-2.5 font-medium text-white">{p.name} {p.surname}</td>
                    <td className="py-2.5">
                      <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded font-mono">{p.role}</span>
                    </td>
                    <td className="py-2.5 text-center text-gray-300">{stats?.appearances ?? 0}</td>
                    <td className="py-2.5 text-center text-gray-300">{stats?.goals ?? 0}</td>
                    <td className="py-2.5 text-center text-gray-300">{stats?.assists ?? 0}</td>
                    <td className="py-2.5 text-center text-yellow-400">{stats?.yellow_cards ?? 0}</td>
                    <td className="py-2.5 text-center text-red-400">{stats?.red_cards ?? 0}</td>
                    <td className="py-2.5 text-right space-x-2">
                      <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-white">✏️</button>
                      <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-400">🗑️</button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">Nessun giocatore trovato</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? 'Modifica giocatore' : 'Nuovo giocatore'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cognome</label>
                <input value={form.surname} onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ruolo</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nazionalità</label>
                <input value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Data di nascita</label>
              <input type="date" value={form.birth_date} onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
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
