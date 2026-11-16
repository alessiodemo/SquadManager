import { pool } from '../db.js'

export async function getTransferContext(transferId) {
  const result = await pool.query(
    `SELECT
       mt.*,
       p.name,
       p.surname,
       p.role
     FROM market_transfers mt
     LEFT JOIN players p ON p.id = mt.player_id
     WHERE mt.id = $1`,
    [transferId],
  )

  const transfer = result.rows[0]

  if (!transfer) {
    const error = new Error('Transfer not found')
    error.statusCode = 404
    throw error
  }

  return {
    transfer,
    player: {
      name: transfer.name,
      surname: transfer.surname,
      role: transfer.role,
    },
  }
}