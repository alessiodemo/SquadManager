import { getMatchContext } from './matchContext.js'
import { getTransferContext } from './transferContext.js'
import { indexKnowledge, searchKnowledge } from './qdrant.js'
import { agents } from './agents/index.js'

async function indexAnalysis({ context, body }) {
  const contextText = JSON.stringify(context)

  await indexKnowledge({
    id: context.match.id,
    text: contextText,
    payload: {
      entity_type: 'match',
      entity_id: context.match.id,
      season_id: context.match.season_id,
      source: 'postgresql',
    },
  })

  if (typeof body?.result === 'string' && body.result.trim()) {
    await indexKnowledge({
      text: body.result,
      payload: {
        entity_type: 'match_analysis',
        entity_id: context.match.id,
        season_id: context.match.season_id,
        source: 'llm',
      },
    })
  }
}

function selectAgent(agentName) {
  if (!agents[agentName]) {
    const error = new Error(`Agent ${agentName} is not registered`)
    error.statusCode = 400
    throw error
  }

  return agents[agentName]
}

export async function runMatchAnalysis(
  matchId,
  { role, task = 'match-analysis' } = {},
) {
  const context = await getMatchContext(matchId)
  const contextText = JSON.stringify(context)
  let rag = { enabled: false, documents: [] }

  try {
    rag = await searchKnowledge({
      text: contextText,
      seasonId: context.match.season_id,
    })
  } catch (error) {
    console.error(`[orchestrator/match-analysis] RAG search failed: ${error.message}`)
  }

  const agent = selectAgent(task)
  const body = await agent.run({ context, rag, role })
  const result = {
    ...body,
    context: {
      matchId: context.match.id,
      result: context.result,
      eventsCount: context.events.length,
    },
    rag: {
      enabled: rag.enabled,
      documents: rag.documents,
    },
  }

  try {
    await indexAnalysis({ context, body })
  } catch (error) {
    console.error(`[orchestrator/match-analysis] RAG indexing failed: ${error.message}`)
    result.rag.indexed = false
  }

  return result
}

export async function runTransferAdvice(
  transferId,
  { role } = {},
) {
  const context = await getTransferContext(transferId)
  const contextText = JSON.stringify(context)

  let rag = {
    enabled: false,
    documents: [],
  }

  try {
    rag = await searchKnowledge({
      text: contextText,
      seasonId: context.transfer.season_id,
    })
  } catch (error) {
    console.error(`[orchestrator/transfer-advice] RAG search failed: ${error.message}`)
  }

  const agent = selectAgent('transfer-advice')

  const body = await agent.run({ context, rag, role })

  return {
    ...body,
    context: {
      transferId: context.transfer.id,
      seasonId: context.transfer.season_id,
    },
    rag: {
      enabled: rag.enabled,
      documents: rag.documents,
    },
  }
}