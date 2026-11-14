import { pool } from '../db.js'
import { deleteKnowledge, indexKnowledge } from './qdrant.js'

function playerName(transfer) {
  const name = [transfer.name, transfer.surname].filter(Boolean).join(' ').trim()
  return name || 'Unknown player'
}

function transferDocument(transfer) {
  const direction = transfer.type === 'in' ? 'arrived' : 'left'
  const fee = transfer.fee === null || transfer.fee === undefined
    ? 'unknown fee'
    : `${transfer.fee} EUR`

  return [
    `${playerName(transfer)} ${direction} the club on ${transfer.transfer_date}.`,
    `Role: ${transfer.role || 'unknown'}.`,
    `Related club: ${transfer.club || 'unknown'}.`,
    `Fee: ${fee}.`,
    transfer.notes ? `Notes: ${transfer.notes}.` : null,
  ].filter(Boolean).join(' ')
}

async function getTransfer(transferId) {
  const result = await pool.query(
    `SELECT mt.id, mt.season_id, mt.player_id, mt.type, mt.transfer_date,
            mt.fee, mt.club, mt.notes, p.name, p.surname, p.role
     FROM market_transfers mt
     LEFT JOIN players p ON p.id = mt.player_id
     WHERE mt.id = $1`,
    [transferId],
  )
  return result.rows[0]
}

export async function indexTransfer(transferId) {
  const transfer = await getTransfer(transferId)
  if (!transfer) return { indexed: false, reason: 'not_found' }

  return indexKnowledge({
    id: transfer.id,
    text: transferDocument(transfer),
    payload: {
      entity_type: 'transfer',
      entity_id: transfer.id,
      season_id: transfer.season_id,
      player_id: transfer.player_id,
      source: 'postgresql',
      source_table: 'market_transfers',
    },
  })
}

export async function indexTransfers(seasonId) {
  const result = await pool.query(
    `SELECT id
     FROM market_transfers
     WHERE ($1::uuid IS NULL OR season_id = $1)
     ORDER BY transfer_date, id`,
    [seasonId || null],
  )

  const indexed = []
  for (const transfer of result.rows) {
    indexed.push(await indexTransfer(transfer.id))
  }

  return {
    total: result.rows.length,
    indexed: indexed.filter((item) => item.indexed).length,
  }
}

export async function removeTransferFromKnowledge(transferId) {
  return deleteKnowledge(transferId)
}

export function reportKnowledgeSyncFailure(operation, error) {
  console.error(`[knowledge/${operation}] ${error.message}`)
}
