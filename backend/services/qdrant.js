import { randomUUID } from 'node:crypto'

const qdrantUrl = (process.env.QDRANT_URL || 'http://localhost:6333').replace(/\/$/, '')
const collectionName = process.env.QDRANT_COLLECTION || 'squad_manager_knowledge'
const vectorSize = Number(process.env.QDRANT_VECTOR_SIZE || 1536)

function isConfigured() {
  return Boolean(process.env.QDRANT_URL || process.env.QDRANT_ENABLED === 'true')
}

async function request(path, options = {}) {
  const response = await fetch(`${qdrantUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body?.status?.error || body?.result?.status || 'request failed'
    throw new Error(`Qdrant returned ${response.status}: ${detail}`)
  }
  return body
}

async function ensureCollection() {
  try {
    await request(`/collections/${encodeURIComponent(collectionName)}`)
  } catch (error) {
    if (!error.message.includes('404')) throw error

    await request(`/collections/${encodeURIComponent(collectionName)}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      }),
    })
  }
}

async function createEmbedding(text) {
  if (!process.env.LLM_SERVICE_URL) {
    throw new Error('LLM service is required to create embeddings')
  }

  const response = await fetch(`${process.env.LLM_SERVICE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  const body = await response.json().catch(() => null)

  if (!response.ok || !Array.isArray(body?.embedding)) {
    throw new Error(body?.detail || body?.error || `Embedding service returned ${response.status}`)
  }

  if (body.embedding.length !== vectorSize) {
    throw new Error(`Embedding size ${body.embedding.length} does not match Qdrant size ${vectorSize}`)
  }

  return body.embedding
}

export async function searchKnowledge({ text, seasonId, limit = 5 }) {
  if (!isConfigured()) return { enabled: false, documents: [] }

  await ensureCollection()
  const vector = await createEmbedding(text)
  const filter = seasonId
    ? { must: [{ key: 'season_id', match: { value: seasonId } }] }
    : undefined

  const body = await request(
    `/collections/${encodeURIComponent(collectionName)}/points/search`,
    {
      method: 'POST',
      body: JSON.stringify({
        vector,
        limit,
        with_payload: true,
        ...(filter ? { filter } : {}),
      }),
    },
  )

  return {
    enabled: true,
    documents: (body?.result || []).map((item) => ({
      id: item.id,
      score: item.score,
      ...(item.payload || {}),
    })),
  }
}

export async function indexKnowledge({ id = randomUUID(), text, payload }) {
  if (!isConfigured()) return { enabled: false, indexed: false }

  await ensureCollection()
  const vector = await createEmbedding(text)
  await request(
    `/collections/${encodeURIComponent(collectionName)}/points?wait=true`,
    {
      method: 'PUT',
      body: JSON.stringify({
        points: [{ id, vector, payload: { ...payload, content: text } }],
      }),
    },
  )

  return { enabled: true, indexed: true, id }
}

export async function deleteKnowledge(id) {
  if (!isConfigured()) return { enabled: false, deleted: false }

  await ensureCollection()
  await request(
    `/collections/${encodeURIComponent(collectionName)}/points/delete?wait=true`,
    {
      method: 'POST',
      body: JSON.stringify({ points: [id] }),
    },
  )

  return { enabled: true, deleted: true, id }
}
