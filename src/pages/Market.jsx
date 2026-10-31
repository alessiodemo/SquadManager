import { useEffect, useState, useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Pencil,
  Trash2,
  Coins,
  Calendar,
  Search,
  Building2,
  UserPlus,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { getTransfers, upsertTransfer, deleteTransfer } from '../api/transfers'
import { getSquadWithStats } from '../api/players'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Badge from '../components/Badge'
import TeamLogo from '../components/TeamLogo'
import { useToast } from '../components/ToastProvider'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'
import { getErrorMessage } from '../lib/errors'

const emptyForm = {
  playerMode: 'existing', // 'existing' | 'new'
  player_id: '',
  new_name: '',
  new_surname: '',
  new_role: 'CEN',
  type: 'in', // 'in' = arrival, 'out' = departure
  transfer_date: '',
  fee: '',
  club: '',
  notes: '',
  add_to_squad: true,
}

const QUICK_NOTES = [
  'Permanent Transfer',
  'Loan with option to buy',
  'Loan with obligation to buy',
  'Dry loan',
  'Free agent',
  'Mutual termination',
]

function formatFee(fee) {
  if (fee === null || fee === undefined || fee === '') return 'Free / N/A'
  if (Number(fee) === 0) return 'Free'
  return `€ ${Number(fee).toLocaleString('en-US')}`
}

export default function Market() {
  const [transfers, setTransfers] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'in' | 'out'
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date-desc') // 'date-desc' | 'date-asc' | 'fee-desc'
  const [deleteTransferId, setDeleteTransferId] = useState(null)
  const { showToast } = useToast()

  const { seasonId, selectedSeason } = useSeason()
  const { selectedTeam, getTeamCrest } = useTeam()

  async function load(sid) {
    if (!sid) {
      setTransfers([])
      setPlayers([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [t, p] = await Promise.all([
        getTransfers(sid),
        getSquadWithStats(sid).catch(() => []),
      ])
      setTransfers(t || [])
      setPlayers(p || [])
    } catch (e) {
      console.error(e)
      showToast(getErrorMessage(e, 'Failed to load transfer market data.'), { tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(seasonId)
  }, [seasonId])

  function getDefaultDate() {
    if (selectedSeason?.start_year) {
      return `${selectedSeason.start_year}-07-01`
    }
    return new Date().toISOString().split('T')[0]
  }

  function openNew() {
    setForm({
      ...emptyForm,
      transfer_date: getDefaultDate(),
    })
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(t) {
    setForm({
      playerMode: t.player_id ? 'existing' : 'new',
      player_id: t.player_id ?? '',
      new_name: t.name || t.players?.name || '',
      new_surname: t.surname || t.players?.surname || '',
      new_role: t.role || t.players?.role || 'CEN',
      type: t.type || 'in',
      transfer_date: t.transfer_date ? t.transfer_date.split('T')[0] : '',
      fee: t.fee !== null && t.fee !== undefined ? t.fee : '',
      club: t.club ?? '',
      notes: t.notes ?? '',
      add_to_squad: false,
    })
    setEditingId(t.id)
    setShowModal(true)
  }

  async function handleSave() {
    if (!seasonId) {
      showToast('Please select a season first.', { tone: 'error' })
      return
    }
    if (!form.transfer_date) {
      showToast('Please select a transfer date.', { tone: 'error' })
      return
    }

    if (form.playerMode === 'existing' && !form.player_id && !editingId) {
      showToast('Please select a player from the squad or choose "New Player".', { tone: 'error' })
      return
    }

    if (form.playerMode === 'new' && !form.new_surname?.trim()) {
      showToast('Please enter at least the player last name.', { tone: 'error' })
      return
    }

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      season_id: seasonId,
      player_id: form.playerMode === 'existing' ? (form.player_id || null) : null,
      type: form.type,
      transfer_date: form.transfer_date,
      fee: form.fee !== '' && !isNaN(Number(form.fee)) ? Number(form.fee) : null,
      club: form.club?.trim() || null,
      notes: form.notes?.trim() || null,
      new_player_name: form.playerMode === 'new' ? form.new_name?.trim() : null,
      new_player_surname: form.playerMode === 'new' ? form.new_surname?.trim() : null,
      new_player_role: form.playerMode === 'new' ? form.new_role : null,
      add_to_squad: form.type === 'in' ? Boolean(form.add_to_squad) : false,
    }

    try {
      await upsertTransfer(payload)
      setShowModal(false)
      await load(seasonId)
      showToast(editingId ? 'Transfer updated successfully.' : 'Transfer recorded successfully.', { tone: 'success' })
    } catch (e) {
      showToast(getErrorMessage(e, 'Unable to save the transfer.'), { tone: 'error' })
    }
  }

  async function handleDelete(id) {
    setDeleteTransferId(id)
  }

  async function confirmDeleteTransfer() {
    try {
      await deleteTransfer(deleteTransferId)
      await load(seasonId)
      showToast('Transfer deleted successfully.', { tone: 'success' })
    } catch (e) {
      showToast(getErrorMessage(e, 'Unable to delete the transfer.'), { tone: 'error' })
    } finally {
      setDeleteTransferId(null)
    }
  }

  // Financial calculations
  const ins = transfers.filter((t) => t.type === 'in')
  const outs = transfers.filter((t) => t.type === 'out')
  const totalIn = ins.reduce((s, t) => s + (Number(t.fee) || 0), 0)
  const totalOut = outs.reduce((s, t) => s + (Number(t.fee) || 0), 0)
  const balance = totalOut - totalIn

  // Filter & Sorting
  const filteredTransfers = useMemo(() => {
    let list = transfers

    if (activeTab === 'in') {
      list = list.filter((t) => t.type === 'in')
    } else if (activeTab === 'out') {
      list = list.filter((t) => t.type === 'out')
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter((t) => {
        const pName = (t.players ? `${t.players.name} ${t.players.surname}` : `${t.name || ''} ${t.surname || ''}`).toLowerCase()
        const clubName = (t.club || '').toLowerCase()
        const notes = (t.notes || '').toLowerCase()
        return pName.includes(q) || clubName.includes(q) || notes.includes(q)
      })
    }

    const sorted = [...list]
    if (sortBy === 'date-desc') {
      sorted.sort((a, b) => new Date(b.transfer_date) - new Date(a.transfer_date))
    } else if (sortBy === 'date-asc') {
      sorted.sort((a, b) => new Date(a.transfer_date) - new Date(b.transfer_date))
    } else if (sortBy === 'fee-desc') {
      sorted.sort((a, b) => (Number(b.fee) || 0) - (Number(a.fee) || 0))
    }

    return sorted
  }, [transfers, activeTab, search, sortBy])

  const currentTeamName = selectedTeam?.name || selectedSeason?.team_name || 'Selected Team'
  const currentTeamCrest = selectedTeam?.crest || getTeamCrest(currentTeamName)

  return (
    <div className="space-y-6">
      {/* Header bar with Team & Season Context */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {currentTeamCrest ? (
            <div className="w-12 h-12 rounded-2xl bg-sofa-card border border-sofa-border p-2 flex items-center justify-center shadow-md shrink-0">
              <TeamLogo src={currentTeamCrest} name={currentTeamName} size="md" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-700/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
              <Coins className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Transfer Market
              </h2>
              {selectedTeam && (
                <span className="bg-sofa-blue/20 border border-sofa-blue/40 text-sofa-blueLight text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedTeam.name}
                </span>
              )}
              {selectedSeason?.name && (
                <span className="bg-sofa-bg border border-sofa-border text-emerald-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                  Season {selectedSeason.name}
                </span>
              )}
              <span className="bg-sofa-bg border border-sofa-border text-sofa-muted text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                {transfers.length} transfers
              </span>
            </div>
            <p className="text-xs text-sofa-muted font-medium mt-1">
              Signings, departures, and transfer balance for {currentTeamName}
            </p>
          </div>
        </div>

        <button
          onClick={openNew}
          disabled={!seasonId}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sofa-blue hover:bg-sofa-blueHover disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sofa-blue/25 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Warning when no season or team is selected */}
      {!seasonId && (
        <div className="bg-sofa-card border border-amber-500/30 rounded-2xl p-6 text-center text-sofa-muted">
          <HelpCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-base font-bold text-white mb-1">No team or season selected</h3>
          <p className="text-xs text-sofa-muted max-w-md mx-auto">
            Use the sidebar to choose a <strong>League</strong>, <strong>Season</strong>, and <strong>Club</strong> (clicking Apply if needed) to manage and review transfer operations.
          </p>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Expenditure (In) */}
        <div className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight transition-all rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-sky-400" />
              Expenditure (In)
            </span>
            <span className="text-xs font-mono font-semibold text-sofa-dim bg-sofa-bg px-2 py-0.5 rounded border border-sofa-border">
              {ins.length} {ins.length === 1 ? 'signing' : 'signings'}
            </span>
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2 font-mono tabular-nums">
            {formatFee(totalIn)}
          </p>
          <p className="text-[10px] text-sofa-dim mt-1">Total spent on incoming players</p>
        </div>

        {/* Income (Out) */}
        <div className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight transition-all rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              Income (Out)
            </span>
            <span className="text-xs font-mono font-semibold text-sofa-dim bg-sofa-bg px-2 py-0.5 rounded border border-sofa-border">
              {outs.length} {outs.length === 1 ? 'departure' : 'departures'}
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono tabular-nums">
            {formatFee(totalOut)}
          </p>
          <p className="text-[10px] text-sofa-dim mt-1">Revenue from player departures</p>
        </div>

        {/* Net Spend / Balance */}
        <div className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight transition-all rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-sofa-blue" />
              Net Balance
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                balance >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {balance >= 0 ? 'Surplus (+)' : 'Deficit (-)'}
            </span>
          </div>
          <p
            className={`text-2xl font-black mt-2 font-mono tabular-nums ${
              balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {balance >= 0 ? '+' : ''}
            {formatFee(balance)}
          </p>
          <p className="text-[10px] text-sofa-dim mt-1">Income minus expenditure</p>
        </div>
      </div>

      {/* Filter Tabs, Search & Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-sofa-card/50 border border-sofa-border/80 p-3 rounded-2xl">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
                : 'bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-sofa-muted hover:text-white'
            }`}
          >
            All ({transfers.length})
          </button>
          <button
            onClick={() => setActiveTab('in')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'in'
                ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
                : 'bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-sofa-muted hover:text-white'
            }`}
          >
            Signings ({ins.length})
          </button>
          <button
            onClick={() => setActiveTab('out')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'out'
                ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
                : 'bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-sofa-muted hover:text-white'
            }`}
          >
            Departures ({outs.length})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-sofa-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player or club..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue rounded-xl pl-8 pr-3 py-1.5 text-white text-xs placeholder-sofa-dim focus:outline-none transition-colors"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none transition-colors"
          >
            <option value="date-desc">Latest date</option>
            <option value="date-asc">Oldest date</option>
            <option value="fee-desc">Highest fee</option>
          </select>
        </div>
      </div>

      {/* Transfers List */}
      {loading ? (
        <div className="data-surface p-12 text-center">
          <div className="w-8 h-8 border-2 border-sofa-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-sofa-muted">Loading transfer market operations...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map((t) => {
            const isAcquisition = t.type === 'in'
            const playerName = t.players
              ? `${t.players.name} ${t.players.surname}`.trim()
              : t.surname || t.name
                ? `${t.name ?? ''} ${t.surname ?? ''}`.trim()
                : 'Unspecified Player'
            const playerRole = t.players?.role || t.role || null

            return (
              <div
                key={t.id}
                className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight rounded-2xl p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group"
              >
                {/* Left side: Badge & Player Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <Badge
                    label={isAcquisition ? 'SIGNING' : 'DEPARTURE'}
                    variant={isAcquisition ? 'in' : 'out'}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm sm:text-base group-hover:text-sofa-blue transition-colors truncate">
                        {playerName}
                      </p>
                      {playerRole && (
                        <Badge variant={playerRole} label={playerRole} />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sofa-muted mt-0.5">
                      {t.club && (
                        <span className="flex items-center gap-1.5 text-gray-300 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-sofa-dim shrink-0" />
                          <span>
                            {isAcquisition ? 'From:' : 'To:'}{' '}
                            <strong className="text-white font-semibold">{t.club}</strong>
                          </span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sofa-dim">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.transfer_date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {t.notes && (
                        <span className="text-sofa-dim italic bg-sofa-bg px-2 py-0.5 rounded border border-sofa-border/60">
                          "{t.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Fee & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-sofa-border/60">
                  <span
                    className={`border px-3 py-1 rounded-xl font-mono font-bold text-sm sm:text-base tabular-nums tracking-wide shadow-inner ${
                      isAcquisition
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {isAcquisition ? '-' : '+'}
                    {formatFee(t.fee)}
                  </span>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(t)}
                      title="Edit"
                      className="p-1.5 rounded-lg bg-sofa-bg hover:bg-sofa-border border border-sofa-border text-sofa-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-sofa-bg hover:bg-rose-500/20 border border-sofa-border hover:border-rose-500/40 text-sofa-muted hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {filteredTransfers.length === 0 && (
            <div className="bg-sofa-card border border-sofa-border rounded-2xl py-12 text-center text-sofa-muted">
              <Coins className="w-9 h-9 text-sofa-dim mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-white">No transfers recorded</p>
              <p className="text-xs text-sofa-dim mt-1 max-w-sm mx-auto">
                {search
                  ? 'No transfers match your search query.'
                  : `There are no transfer operations recorded for ${currentTeamName} in this season. Click "New Transfer" to add one.`}
              </p>
              {seasonId && !search && (
                <button
                  onClick={openNew}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sofa-blue/20 hover:bg-sofa-blue/30 border border-sofa-blue/40 text-sofa-blueLight text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Transfer</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editingId ? 'Edit Transfer' : 'New Transfer'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            {/* Player Mode: From Squad vs New Player */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-2">
                Player Source
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, playerMode: 'existing' }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    form.playerMode === 'existing'
                      ? 'bg-sofa-blue text-white border-sofa-blue shadow-md shadow-sofa-blue/25'
                      : 'bg-sofa-card border-sofa-border text-sofa-muted hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>From Squad ({players.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, playerMode: 'new', player_id: '' }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    form.playerMode === 'new'
                      ? 'bg-sofa-blue text-white border-sofa-blue shadow-md shadow-sofa-blue/25'
                      : 'bg-sofa-card border-sofa-border text-sofa-muted hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Player</span>
                </button>
              </div>

              {form.playerMode === 'existing' ? (
                <div>
                  <select
                    value={form.player_id}
                    onChange={(e) => setForm((f) => ({ ...f, player_id: e.target.value }))}
                    className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
                  >
                    <option value="">-- Select player from squad --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.surname} {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-sofa-bg/60 p-3 rounded-xl border border-sofa-border/60">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-sofa-muted mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Teun"
                      value={form.new_name}
                      onChange={(e) => setForm((f) => ({ ...f, new_name: e.target.value }))}
                      className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-sofa-muted mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Koopmeiners"
                      value={form.new_surname}
                      onChange={(e) => setForm((f) => ({ ...f, new_surname: e.target.value }))}
                      className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-sofa-muted mb-1">
                      Role
                    </label>
                    <select
                      value={form.new_role}
                      onChange={(e) => setForm((f) => ({ ...f, new_role: e.target.value }))}
                      className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none"
                    >
                      <option value="POR">Goalkeeper (POR)</option>
                      <option value="DIF">Defender (DIF)</option>
                      <option value="CEN">Midfielder (CEN)</option>
                      <option value="ATT">Forward (ATT)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Type & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Transfer Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: 'in' }))}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      form.type === 'in'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                        : 'bg-sofa-bg border-sofa-border text-sofa-muted hover:text-white'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Arrival (In)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: 'out' }))}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      form.type === 'out'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-sofa-bg border-sofa-border text-sofa-muted hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Departure (Out)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Transfer Date
                </label>
                <input
                  type="date"
                  value={form.transfer_date}
                  onChange={(e) => setForm((f) => ({ ...f, transfer_date: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Transfer Fee & Counterpart Club */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted">
                    Transfer Fee (€)
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, fee: '0' }))}
                    className="text-[10px] text-sofa-blueLight hover:underline font-semibold"
                  >
                    Free Transfer
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="e.g. 15000000 (0 for free)"
                  value={form.fee}
                  onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  {form.type === 'in' ? 'Selling Club (From)' : 'Buying Club (To)'}
                </label>
                <input
                  placeholder={form.type === 'in' ? 'e.g. Atalanta BC, Chelsea...' : 'e.g. PSG, Aston Villa...'}
                  value={form.club}
                  onChange={(e) => setForm((f) => ({ ...f, club: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Notes & Quick Suggestion Chips */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                Formula / Transfer Notes
              </label>
              <input
                placeholder="e.g. Permanent transfer, loan with option to buy for 20M..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, notes: note }))}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-sofa-bg border border-sofa-border text-sofa-muted hover:text-white hover:border-sofa-borderLight transition-colors"
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to squad checkbox for signings */}
            {form.type === 'in' && (
              <label className="flex items-center gap-2.5 pt-1 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.add_to_squad}
                  onChange={(e) => setForm((f) => ({ ...f, add_to_squad: e.target.checked }))}
                  className="rounded border-[#1e2f4a] bg-[#0b1320] text-sofa-blue focus:ring-0 w-4 h-4"
                />
                <span>Automatically add this player to the current season squad</span>
              </label>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sofa-border/80">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-bold uppercase tracking-wider text-sofa-muted hover:text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 bg-sofa-blue hover:bg-sofa-blueHover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sofa-blue/25 cursor-pointer"
              >
                {editingId ? 'Save Changes' : 'Record Transfer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTransferId)}
        title="Delete Transfer"
        message="Are you sure you want to delete this transfer? This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTransferId(null)}
        onConfirm={confirmDeleteTransfer}
        destructive
      />
    </div>
  )
}
