async function callLlm({ context, rag, role }) {
  if (!process.env.LLM_SERVICE_URL) {
    const error = new Error('LLM service is not configured')
    error.statusCode = 503
    throw error
  }

  const response = await fetch(`${process.env.LLM_SERVICE_URL}/api/service`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        task: 'transfer-advice',
      raw: {
        ...context,
        related_documents: rag.documents,
      },
      role,
    }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body?.detail || body?.error || `LLM service returned ${response.status}`
    const error = new Error(detail)
    error.statusCode = 502
    throw error
  }

  return body
}

export const transferAdvisor = {
  name: 'transfer-advisor',
  async run({ context, rag, role }) {
    return callLlm({ context, rag, role })
  },
}