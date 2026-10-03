import { useEffect, useState } from 'react'
import { getStandings } from '../api/matches'
import { importStandings } from '../api/standings'
import { useSeason } from '../context/seasonContext'
import { useTeam } from '../context/teamContext'

function computeStandings(matches) {
  const table = {}

  for (const m of matches) {
    if (m.goals_for == null) continue

    const us = 'La Nostra Squadra'
    const them = m.opponent

    if (!table[us]) table[us] = { name: us, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
    if (!table[them]) table[them] = { name: them, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }

    table[us].played++
    table[them].played++
    table[us].gf += m.goals_for
    table[us].ga += m.goals_against
    table[them].gf += m.goals_against
    table[them].ga += m.goals_for

    if (m.goals_for > m.goals_against) {
      table[us].won++; table[us].points += 3
      table[them].lost++
    } else if (m.goals_for === m.goals_against) {
      table[us].drawn++; table[us].points++
      table[them].drawn++; table[them].points++
    } else {
      table[them].won++; table[them].points += 3
      table[us].lost++
    }
  }

  return Object.values(table).sort(
    (a, b) =>
      b.points - a.points ||
      (b.gf - b.ga) - (a.gf - a.ga) ||
      b.gf - a.gf
  )
}

const FORM_COUNT = 5

function recentForm(matches, isUs) {
  return [...matches]
    .filter((m) => m.goals_for != null)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, FORM_COUNT)
    .map((m) => {
      const win = m.goals_for > m.goals_against
      const draw = m.goals_for === m.goals_against
      if (isUs) return win ? 'W' : draw ? 'D' : 'L'
      return win ? 'L' : draw ? 'D' : 'W'
    })
}

const formColor = { W: 'bg-green-600', D: 'bg-yellow-600', L: 'bg-red-600' }

export default function Standings() {
  const [rows, setRows] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [importMessage, setImportMessage] = useState('')
  const { seasonId, selectedSeason } = useSeason()
  const { competitionCode, selectedTeam } = useTeam()


  async function load(sid) {
    if (!sid || !competitionCode) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const standings = await getStandings(sid, competitionCode)
      //const data = await getMatches(sid)
      //setMatches(data)
      setRows(
        standings        
            .filter((row) => row.type === 'TOTAL')
            .sort((a, b) => a.position - b.position)
            .map((row) => ({
              name: row.team_name,
              played: Number(row.match_played),
              won: Number(row.win),
              drawn: Number(row.draw),
              lost: Number(row.lose),
              gf: Number(row.goal_scored),
              ga: Number(row.goal_conceded),
              points: Number(row.points),
            }))
        )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleImportStandings() {
    if (!seasonId || !selectedSeason || !competitionCode || !selectedTeam) {
      setImportMessage('Seleziona una lega, una stagione e un club prima di importare.')
      return
    }
    setImportMessage('Import...')

    try {
      const result = await importStandings({
        season: selectedSeason.start_year,
        seasonId,
        competitionCode,
      })

      await load(seasonId)

      setImportMessage(`Import completato: ${result.imported} righe per ${selectedTeam.name}, stagione ${selectedSeason.name}.`)
      console.log(result)
    } catch (error) {
      setImportMessage(`Errore durante l’import: ${error.message}`)
    }
  } 

  useEffect(() => {
    if (seasonId && competitionCode) {
      load(seasonId)
    } else {
      setRows([])
      setLoading(false)
    }
  }, [seasonId, competitionCode])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">Classifica</h2>
        <button onClick={handleImportStandings} disabled={!seasonId || !selectedSeason || !competitionCode || !selectedTeam}>
          Importa classifica
        </button>
      </div>
      {importMessage && (
        <p role="status" className="text-sm text-gray-300">
          {importMessage}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400">Caricamento...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left border-b border-gray-800">
                <th className="pb-2 w-8 font-medium">#</th>
                <th className="pb-2 font-medium">Squadra</th>
                <th className="pb-2 text-center font-medium">PG</th>
                <th className="pb-2 text-center font-medium">V</th>
                <th className="pb-2 text-center font-medium">P</th>
                <th className="pb-2 text-center font-medium">S</th>
                <th className="pb-2 text-center font-medium">GF</th>
                <th className="pb-2 text-center font-medium">GS</th>
                <th className="pb-2 text-center font-medium">DR</th>
                <th className="pb-2 text-center font-medium">Pt</th>
                <th className="pb-2 font-medium">Forma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((row, i) => {
                const isUs = row.name === 'La Nostra Squadra'
                const form = isUs ? recentForm(matches, true) : []
                return (
                  <tr key={row.name} className={`${isUs ? 'bg-green-900/20' : 'hover:bg-gray-900/50'}`}>
                    <td className="py-2.5 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 font-medium text-white">{row.name}</td>
                    <td className="py-2.5 text-center text-gray-300">{row.played}</td>
                    <td className="py-2.5 text-center text-gray-300">{row.won}</td>
                    <td className="py-2.5 text-center text-gray-300">{row.drawn}</td>
                    <td className="py-2.5 text-center text-gray-300">{row.lost}</td>
                    <td className="py-2.5 text-center text-gray-300">{row.gf}</td>
                    <td className="py-2.5 text-center text-gray-300">{row.ga}</td>
                    <td className="py-2.5 text-center text-gray-300">{row.gf - row.ga >= 0 ? '+' : ''}{row.gf - row.ga}</td>
                    <td className="py-2.5 text-center font-bold text-white">{row.points}</td>
                    <td className="py-2.5">
                      {isUs && (
                        <div className="flex gap-1">
                          {form.map((f, idx) => (
                            <span key={idx} className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold text-white ${formColor[f]}`}>{f}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td colSpan="11" className="py-8 text-center text-gray-500">Nessun dato disponibile</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
