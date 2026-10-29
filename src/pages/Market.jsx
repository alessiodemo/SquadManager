import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Pencil,
  Trash2,
  Coins,
  Calendar,
} from 'lucide-react'
import { getTransfers, upsertTransfer, deleteTransfer } from '../api/transfers'
import { getSquadWithStats } from '../api/players'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Badge from '../components/Badge'
import { useToast } from '../components/ToastProvider'
import { useSeason } from '../context/seasonContext'
import { getErrorMessage } from '../lib/errors'

const emptyForm = {
  player_id: '',
  type: 'in',
  transfer_date: '',
  fee: '',
  club: '',
  notes: '',
  season_id: '',
}

function formatFee(fee) {
  if (fee === null || fee === undefined || fee === '') return 'Gratuito / N/D'
  if (Number(fee) === 0) return 'Gratuito'
  return `€ ${Number(fee).toLocaleString('it-IT')}`
}

export default function Market() {
  const [transfers, setTransfers] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'in' | 'out'
  const [deleteTransferId, setDeleteTransferId] = useState(null)
  const { showToast } = useToast()

  const { seasonId, selectedSeason } = useSeason()

  async function load(sid) {
    if (!sid) {
      setTransfers([])
      setPlayers([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [t, p] = await Promise.all([getTransfers(sid), getSquadWithStats(sid)])
      setTransfers(t || [])
      setPlayers(p || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(seasonId)
  }, [seasonId])

  function openNew() {
    setForm({ ...emptyForm, season_id: seasonId })
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(t) {
    setForm({
      player_id: t.player_id ?? '',
      type: t.type,
      transfer_date: t.transfer_date,
      fee: t.fee !== null && t.fee !== undefined ? t.fee : '',
      club: t.club ?? '',
      notes: t.notes ?? '',
      season_id: t.season_id,
    })
    setEditingId(t.id)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.transfer_date) {
      showToast('Select a transfer date.', { tone: 'error' })
      return
    }

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      player_id: form.player_id || null,
      type: form.type,
      transfer_date: form.transfer_date,
      fee: form.fee !== '' && !isNaN(Number(form.fee)) ? Number(form.fee) : null,
      club: form.club?.trim() || null,
      notes: form.notes?.trim() || null,
      season_id: form.season_id,
    }
    try {
      await upsertTransfer(payload)
      setShowModal(false)
      await load(seasonId)
      showToast(editingId ? 'Transfer updated successfully.' : 'Transfer saved successfully.', { tone: 'success' })
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

  const ins = transfers.filter((t) => t.type === 'in')
  const outs = transfers.filter((t) => t.type === 'out')
  const totalIn = ins.reduce((s, t) => s + (t.fee ?? 0), 0)
  const totalOut = outs.reduce((s, t) => s + (t.fee ?? 0), 0)
  // In football finances: income (outs) - expenses (ins)
  const balance = totalOut - totalIn

  const displayedTransfers =
    activeTab === 'in' ? ins : activeTab === 'out' ? outs : transfers

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-700/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Calciomercato</h2>
              <span className="bg-sofa-bg border border-sofa-border text-emerald-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                {transfers.length} op.
              </span>
            </div>
            <p className="text-xs text-sofa-muted font-medium mt-0.5">
              Gestione entrate, uscite e bilancio per {selectedSeason?.name ?? 'la stagione'}
            </p>
          </div>
        </div>

        <button
          onClick={openNew}
          disabled={!seasonId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sofa-blue hover:bg-sofa-blueHover disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sofa-blue/25 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Trasferimento</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Acquisti / Spesa */}
        <div className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight transition-all rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-sky-400" />
              Spesa Acquisti
            </span>
            <span className="text-xs font-mono font-semibold text-sofa-dim bg-sofa-bg px-2 py-0.5 rounded border border-sofa-border">
              {ins.length} entrati
            </span>
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2 font-mono tabular-nums">
            {formatFee(totalIn)}
          </p>
        </div>

        {/* Cessioni / Incassi */}
        <div className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight transition-all rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              Incassi Cessioni
            </span>
            <span className="text-xs font-mono font-semibold text-sofa-dim bg-sofa-bg px-2 py-0.5 rounded border border-sofa-border">
              {outs.length} usciti
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono tabular-nums">
            {formatFee(totalOut)}
          </p>
        </div>

        {/* Saldo / Bilancio */}
        <div className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight transition-all rounded-xl p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sofa-muted uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-sofa-blue" />
              Saldo Netto
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              balance >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              {balance >= 0 ? 'Attivo' : 'Passivo'}
            </span>
          </div>
          <p className={`text-2xl font-black mt-2 font-mono tabular-nums ${
            balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {balance >= 0 ? '+' : ''}{formatFee(balance)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
              : 'bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-sofa-muted hover:text-white'
          }`}
        >
          Tutti ({transfers.length})
        </button>
        <button
          onClick={() => setActiveTab('in')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'in'
              ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
              : 'bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-sofa-muted hover:text-white'
          }`}
        >
          Acquisti ({ins.length})
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'out'
              ? 'bg-sofa-blue text-white shadow-md shadow-sofa-blue/25'
              : 'bg-sofa-card hover:bg-sofa-cardHover border border-sofa-border text-sofa-muted hover:text-white'
          }`}
        >
          Cessioni ({outs.length})
        </button>
      </div>

      {/* Transfers List */}
      {loading ? (
        <div className="data-surface p-12 text-center">
          <div className="w-8 h-8 border-2 border-sofa-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-sofa-muted">Caricamento operazioni di mercato...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTransfers.map((t) => {
            const isAcquisition = t.type === 'in'
            return (
              <div
                key={t.id}
                className="bg-sofa-card border border-sofa-border hover:border-sofa-borderLight rounded-2xl p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors group"
              >
                {/* Left side: Badge & Player Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <Badge
                    label={isAcquisition ? 'ACQUISTO' : 'CESSIONE'}
                    variant={isAcquisition ? 'in' : 'out'}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm sm:text-base group-hover:text-sofa-blue transition-colors truncate">
                        {t.players ? `${t.players.name} ${t.players.surname}` : 'Giocatore non specificato'}
                      </p>
                      {t.players?.role && (
                        <Badge variant={t.players.role} label={t.players.role} />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sofa-muted mt-0.5">
                      {t.club && (
                        <span className="text-gray-300 font-medium">
                          {isAcquisition ? 'da' : 'a'}{' '}
                          <strong className="text-white">{t.club}</strong>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sofa-dim">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.transfer_date).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {t.notes && (
                        <span className="text-sofa-dim italic">"{t.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Fee & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-sofa-border/60">
                  <span className="bg-sofa-bg border border-sofa-border px-3 py-1 rounded-lg font-mono font-bold text-sm sm:text-base text-white tabular-nums tracking-wide shadow-inner">
                    {formatFee(t.fee)}
                  </span>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(t)}
                      title="Modifica"
                      className="p-1.5 rounded-lg bg-sofa-bg hover:bg-sofa-border border border-sofa-border text-sofa-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      title="Elimina"
                      className="p-1.5 rounded-lg bg-sofa-bg hover:bg-rose-500/20 border border-sofa-border hover:border-rose-500/40 text-sofa-muted hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {displayedTransfers.length === 0 && (
            <div className="bg-sofa-card border border-sofa-border rounded-2xl py-12 text-center text-sofa-muted">
              <Coins className="w-8 h-8 text-sofa-dim mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Nessuna operazione registrata</p>
              <p className="text-xs text-sofa-dim mt-1">
                Aggiungi nuovi acquisti o cessioni per monitorare il bilancio.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          title={editingId ? 'Modifica Trasferimento' : 'Nuovo Trasferimento'}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                Giocatore
              </label>
              <select
                value={form.player_id}
                onChange={(e) => setForm((f) => ({ ...f, player_id: e.target.value }))}
                className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
              >
                <option value="">Seleziona giocatore dalla rosa (opzionale)</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.surname} {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Tipo Operazione
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
                >
                  <option value="in">Acquisto (In arrivo)</option>
                  <option value="out">Cessione (In uscita)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Data Trasferimento
                </label>
                <input
                  type="date"
                  value={form.transfer_date}
                  onChange={(e) => setForm((f) => ({ ...f, transfer_date: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Cifra Cartellino (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="es. 15000000"
                  value={form.fee}
                  onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                  Club Controparte
                </label>
                <input
                  placeholder={form.type === 'in' ? 'Club di provenienza' : 'Club di destinazione'}
                  value={form.club}
                  onChange={(e) => setForm((f) => ({ ...f, club: e.target.value }))}
                  className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sofa-muted mb-1.5">
                Note / Dettagli Formula
              </label>
              <input
                placeholder="es. Prestito con diritto di riscatto, clausole, bonus..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#0b1320] border border-[#1e2f4a] focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue/30 rounded-xl px-3 py-2 text-white text-sm placeholder-sofa-dim focus:outline-none transition-colors"
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
                {editingId ? 'Salva Modifiche' : 'Registra Operazione'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      <ConfirmDialog
        open={Boolean(deleteTransferId)}
        title="Delete transfer"
        message="Are you sure you want to delete this transfer? This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTransferId(null)}
        onConfirm={confirmDeleteTransfer}
        destructive
      />
    </div>
  )
}
