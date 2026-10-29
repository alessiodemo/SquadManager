import { useEffect, useState } from 'react'
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  Square,
} from 'lucide-react'
import { getSquadWithStats, importFootballDataSquad, upsertPlayer, deletePlayer } from '../api/players'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Badge from '../components/Badge'
import { useToast } from '../components/ToastProvider'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'
import { getErrorMessage } from '../lib/errors'

const ROLES = ['POR', 'DIF', 'CEN', 'ALA', 'ATT']
const ROLE_TABS = [
  { id: 'ALL', label: 'Tutti' },
  { id: 'POR', label: 'Portieri' },
  { id: 'DIF', label: 'Difensori' },
  { id: 'CEN', label: 'Centrocampisti' },
  { id: 'ALA', label: 'Esterni' },
  { id: 'ATT', label: 'Attaccanti' },
]

const emptyForm = {
  name: '',
  surname: '',
  role: 'CEN',
  nationality: '',
  birth_date: '',
}

const roleOrder = { POR: 0, DIF: 1, CEN: 2, ALA: 3, ATT: 4 }

export default function Squad() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState('ALL')
  const [importing, setImporting] = useState(false)
  const [deletePlayerId, setDeletePlayerId] = useState(null)
  const { showToast } = useToast()

  const { seasonId, selectedSeason } = useSeason()
  const { selectedTeam, competitionCode } = useTeam()

  async function load(sid) {
    if (!sid) {
      setPlayers([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getSquadWithStats(sid)
      setPlayers(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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
    setForm({
      name: p.name,
      surname: p.surname,
      role: p.role,
      nationality: p.nationality ?? '',
      birth_date: p.birth_date ?? '',
    })
    setEditingId(p.id)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.surname.trim()) {
      showToast('First name and surname are required.', { tone: 'error' })
      return
    }

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name.trim(),
      surname: form.surname.trim(),
      role: form.role,
      nationality: form.nationality ? form.nationality.trim() : null,
      birth_date: form.birth_date || null,
      seasonId,
    }
    try {
      await upsertPlayer(payload)
      setShowModal(false)
      await load(seasonId)
      showToast(editingId ? 'Player updated successfully.' : 'Player added to the squad.', { tone: 'success' })
    } catch (e) {
      showToast(getErrorMessage(e, 'Unable to save the player.'), { tone: 'error' })
    }
  }

  async function handleImportSquad() {
    if (!seasonId || !selectedSeason || !selectedTeam || importing) return
    setImporting(true)

    try {
      const result = await importFootballDataSquad(
        seasonId,
        selectedSeason.start_year,
        selectedTeam.id
      )
      await load(seasonId)
      showToast(
        `${result.team}: ${result.imported} players imported for season ${result.season}/${String(result.season + 1).slice(-2)}${result.skipped ? ` (${result.skipped} skipped)` : ''}.`,
        { tone: 'success' },
      )
    } catch (e) {
      showToast(getErrorMessage(e, 'Unable to import the squad.'), { tone: 'error' })
    } finally {
      setImporting(false)
    }
  }

  async function handleDelete(id) {
    setDeletePlayerId(id)
  }

  async function confirmDeletePlayer() {
    try {
      await deletePlayer(deletePlayerId, seasonId)
      await load(seasonId)
      showToast('Player removed from the squad.', { tone: 'success' })
    } catch (e) {
      showToast(getErrorMessage(e, 'Unable to delete the player.'), { tone: 'error' })
    } finally {
      setDeletePlayerId(null)
    }
  }

  // Filter players by role and search query
  const filtered = players
    .filter((p) => {
      if (selectedRole !== 'ALL' && p.role !== selectedRole) return false
      const q = search.toLowerCase().trim()
      if (!q) return true
      return (
        `${p.name} ${p.surname}`.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q) ||
        p.nationality?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9) || a.surname.localeCompare(b.surname))

  // Role counters
  const roleCounts = players.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sofa-blue/20 to-blue-700/20 border border-sofa-blue/30 flex items-center justify-center text-sofa-blue shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Rosa</h2>
              <span className="bg-sofa-bg border border-sofa-border text-sofa-blue text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                {players.length}
              </span>
            </div>
            <p className="text-xs text-sofa-muted font-medium mt-0.5">
              {selectedTeam?.name ? `${selectedTeam.name} · ` : ''}{selectedSeason?.name ?? 'Stagione corrente'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleImportSquad}
            disabled={!seasonId || !selectedTeam || importing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-sofa-cardHover hover:bg-sofa-border border border-sofa-border hover:border-sofa-borderLight disabled:opacity-40 text-sofa-text text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sofa-blue ${importing ? 'animate-spin' : ''}`} />
            <span>{importing ? 'Importazione...' : 'Importa Rosa'}</span>
          </button>

          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sofa-blue hover:bg-sofa-blueHover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sofa-blue/25 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuovo Giocatore</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {ROLE_TABS.map((tab) => {
            const count = tab.id === 'ALL' ? players.length : (roleCounts[tab.id] || 0)
            const isActive = selectedRole === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
                    : 'bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-sofa-muted hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-sofa-bg text-sofa-dim'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-sofa-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome o ruolo..."
            className="w-full bg-sofa-card border border-sofa-border focus:border-sofa-blue rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-sofa-dim focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Players Table */}
      {loading ? (
        <div className="bg-sofa-card border border-sofa-border rounded-2xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-sofa-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-sofa-muted">Caricamento rosa...</p>
        </div>
      ) : (
        <div className="data-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sofa-bg/60 text-sofa-muted uppercase text-[10px] sm:text-[11px] font-bold tracking-wider border-b border-sofa-border">
                  <th className="py-3 px-4 font-bold">Giocatore</th>
                  <th className="py-3 px-3 w-20">Ruolo</th>
                  <th className="py-3 px-3 text-center w-12 font-medium" title="Presenze">P</th>
                  <th className="py-3 px-3 text-center w-12 font-medium" title="Gol segnati">GOL</th>
                  <th className="py-3 px-3 text-center w-12 font-medium" title="Assist">ASS</th>
                  <th className="py-3 px-3 text-center w-12 font-medium text-amber-400/90" title="Cartellini Gialli">AMM</th>
                  <th className="py-3 px-3 text-center w-12 font-medium text-rose-400/90" title="Cartellini Rossi">ESP</th>
                  <th className="py-3 px-4 text-right w-24">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sofa-border/60 text-xs sm:text-sm">
                {filtered.map((p) => {
                  const stats = p.player_stats?.[0]
                  return (
                    <tr key={p.id} className="hover:bg-sofa-cardHover/70 transition-colors group">
                      {/* Player info with avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sofa-bg border border-sofa-border flex items-center justify-center font-bold text-xs text-white shrink-0 group-hover:border-sofa-blue/50 transition-colors">
                            {p.surname ? p.surname.substring(0, 2).toUpperCase() : p.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-sofa-blue transition-colors">
                              {p.name} {p.surname}
                            </p>
                            <p className="text-[11px] text-sofa-dim mt-0.5 flex items-center gap-2">
                              {p.nationality && <span>{p.nationality}</span>}
                              {p.birth_date && (
                                <span>
                                  {new Date().getFullYear() - new Date(p.birth_date).getFullYear()} anni
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3">
                        <Badge variant={p.role} label={p.role} />
                      </td>

                      {/* Stats */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold text-gray-300">
                        {stats?.appearances ?? 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-emerald-400">
                        {stats?.goals ?? 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold text-sky-400">
                        {stats?.assists ?? 0}
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-amber-400 font-semibold">
                        <span className="inline-flex items-center gap-1 justify-center">
                          <Square className="w-2.5 h-3 fill-amber-400 text-amber-400" />
                          {stats?.yellow_cards ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-rose-400 font-semibold">
                        <span className="inline-flex items-center gap-1 justify-center">
                          <Square className="w-2.5 h-3 fill-rose-500 text-rose-500" />
                          {stats?.red_cards ?? 0}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(p)}
                            title="Modifica"
                            className="p-1.5 rounded-lg bg-sofa-bg hover:bg-sofa-border border border-sofa-border text-sofa-muted hover:text-white transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Elimina"
                            className="p-1.5 rounded-lg bg-sofa-bg hover:bg-rose-500/20 border border-sofa-border hover:border-rose-500/40 text-sofa-muted hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-sofa-muted">
                      <Users className="w-8 h-8 text-sofa-dim mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Nessun giocatore trovato</p>
                      <p className="text-xs text-sofa-dim mt-1">Modifica i filtri o aggiungi nuovi elementi alla rosa.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Player Modal */}
      {showModal && (
        <Modal
          title={editingId ? 'Modifica Giocatore' : 'Nuovo Giocatore'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Nome
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="es. Nicolò"
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Cognome
                </label>
                <input
                  value={form.surname}
                  onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
                  placeholder="es. Barella"
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Ruolo
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Nazionalità
                </label>
                <input
                  value={form.nationality}
                  onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                  placeholder="es. Italia"
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                Data di Nascita
              </label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
                className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sofa-border/80">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-bold uppercase tracking-wider text-sofa-muted hover:text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-sofa-blue hover:bg-sofa-blueHover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sofa-blue/25 cursor-pointer"
              >
                {editingId ? 'Salva Modifiche' : 'Aggiungi Giocatore'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      <ConfirmDialog
        open={Boolean(deletePlayerId)}
        title="Remove player"
        message="Are you sure you want to remove this player from the squad?"
        confirmLabel="Remove"
        onCancel={() => setDeletePlayerId(null)}
        onConfirm={confirmDeletePlayer}
        destructive
      />
    </div>
  )
}
