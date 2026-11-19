function Section({ title, items, type = 'list' }) {
  if (!Array.isArray(items) || items.length === 0) return null

  return (
    <section>
      {title && <h3 className="font-bold text-white mb-2">{title}</h3>}
      {type === 'list' ? (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{typeof item === 'string' ? item : item?.label || item?.summary || JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-lg border border-sofa-border bg-sofa-bg/40 px-3 py-2">
              <p className="text-sm text-slate-300">{typeof item === 'string' ? item : item?.label || item?.summary || JSON.stringify(item)}</p>
              {item?.entity_type && (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-sofa-muted">{item.entity_type} · score {item.score?.toFixed?.(3) ?? 'N/A'}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function AIResult({ result, rag }) {
  if (!result) return null

  return (
    <div className="space-y-5">
      {result.summary && (
        <section>
          <h3 className="font-bold text-white mb-2">Summary</h3>
          <p className="text-sm leading-relaxed text-slate-300">{result.summary}</p>
        </section>
      )}

      <Section title="Verified facts" items={result.facts} />
      <Section title="Key factors" items={result.key_factors} />
      <Section title="Recommendations" items={result.recommendations} />
      <Section title="Missing data" items={result.missing_data} />
      <Section title="Sources" items={result.sources} type="cards" />

      {rag?.enabled && (
        <section>
          <h3 className="font-bold text-white mb-2">RAG documents</h3>
          {Array.isArray(rag.documents) && rag.documents.length > 0 ? (
            <Section title="" items={rag.documents} type="cards" />
          ) : (
            <p className="text-xs text-sofa-muted">No related documents found.</p>
          )}
        </section>
      )}
    </div>
  )
}
