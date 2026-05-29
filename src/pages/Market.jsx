import { useEffect, useState } from 'react'
import { getTransfers, upsertTransfer, deleteTransfer } from '../api/transfers'
import { getPlayers } from '../api/players'
import { getCurrentSeason } from '../api/seasons'
import SeasonSelector from '../components/SeasonSelector'
import Modal from '../components/Modal'
import Badge from '../components/Badge'

const emptyForm = {
  player_id: '', type: 'in', transfer_date: '', fee: '', club: '', notes: '', season_id: '',
}

function formatFee(fee) {
  if (!fee) return '—'
  return `€ ${Number(fee).toLocaleString('it-IT')}`
}

export default function Market() {
  const [transfers, setTransfers] = useState([])
  const [players, setPlayers] = useState([])
  const [seasonId, setSeasonId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  async function load(sid) {
    setLoading(true)
    try {
      const [t, p] = await Promise.all([getTransfers(sid), getPlayers()])
      setTransfers(t)
      setPlayers(p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCurrentSeason().then((s) => setSeasonId(s.id)).catch(console.error)
  }, [])

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
      player_id: t.player_id, type: t.type,
      transfer_date: t.transfer_date, fee: t.fee ?? '',
      club: t.club ?? '', notes: t.notes ?? '',
      season_id: t.season_id,
    })
    setEditingId(t.id)
    setShowModal(true)
  }

  async function handleSave() {
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      player_id: form.player_id || null,
      type: form.type,
      transfer_date: form.transfer_date,
      fee: form.fee !== '' ? Number(form.fee) : null,
      club: form.club || null,
      notes: form.notes || null,
      season_id: form.season_id,
    }
    try {
      await upsertTransfer(payload)
      setShowModal(false)
      load(seasonId)
    } catch (e) {
      alert(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo trasferimento?')) return
    await deleteTransfer(id)
    load(seasonId)
  }

  const ins = transfers.filter((t) => t.type === 'in')
  const outs = transfers.filter((t) => t.type === 'out')
  const totalIn = ins.reduce((s, t) => s + (t.fee ?? 0), 0)
  const totalOut = outs.reduce((s, t) => s + (t.fee ?? 0), 0)
  const balance = totalIn - totalOut

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Mercato</h2>
        <div className="flex gap-3">
          <SeasonSelector value={seasonId} onChange={setSeasonId} />
          <button onClick={openNew} className="bg-green-700 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Aggiungi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Acquisti</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{formatFee(totalIn)}</p>
          <p className="text-xs text-gray-500 mt-1">{ins.length} trasferimenti</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Cessioni</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{formatFee(totalOut)}</p>
          <p className="text-xs text-gray-500 mt-1">{outs.length} trasferimenti</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {balance >= 0 ? '+' : ''}{formatFee(Math.abs(balance))}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Caricamento...</p>
      ) : (
        <div className="space-y-6">
          {[{ label: 'Acquisti', items: ins, variant: 'in' }, { label: 'Cessioni', items: outs, variant: 'out' }].map(({ label, items, variant }) => (
            <section key={label}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{label}</h3>
              {items.length === 0 ? (
                <p className="text-gray-500 text-sm">Nessun trasferimento</p>
              ) : (
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge label={variant === 'in' ? 'ACQ' : 'CED'} variant={variant} />
                        <div>
                          <p className="font-medium text-white">
                            {t.players ? `${t.players.name} ${t.players.surname}` : 'N/D'}
                            {t.players?.role && <span className="ml-2 text-xs text-gray-500 font-mono">{t.players.role}</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t.club ? `${variant === 'in' ? 'da' : 'a'} ${t.club} · ` : ''}
                            {new Date(t.transfer_date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{formatFee(t.fee)}</span>
                        <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-white">✏️</button>
                        <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-400">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? 'Modifica trasferimento' : 'Nuovo trasferimento'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Giocatore</label>
              <select value={form.player_id} onChange={(e) => setForm((f) => ({ ...f, player_id: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                <option value="">Seleziona giocatore</option>
                {players.map((p) => <option key={p.id} value={p.id}>{p.surname} {p.name} ({p.role})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  <option value="in">Acquisto</option>
                  <option value="out">Cessione</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data</label>
                <input type="date" value={form.transfer_date} onChange={(e) => setForm((f) => ({ ...f, transfer_date: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cifra (€)</label>
                <input type="number" min="0" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Club provenienza/dest.</label>
                <input value={form.club} onChange={(e) => setForm((f) => ({ ...f, club: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Note</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
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
