import { Select } from "flowbite-react"
import { useTeam } from "../context/teamContext"

export default function CompetitionSelector() {
    const { competitions, competitionCode, setCompetitionCode } = useTeam()

    return (
        <select
            id="competition-select"
            value={competitionCode ?? ''}
            onChange={(e) => setCompetitionCode(e.target.value || null)}
            className="w-full bg-[#0b1320] border border-[#1e2f4a] text-slate-100 text-xs rounded-lg px-3 py-2 focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue outline-none transition-colors cursor-pointer"
            aria-label="Seleziona competizione"
        >
            <option value="" className="bg-[#0b1320] text-slate-400">Seleziona una competizione</option>
            {
                competitions.map((c) => (
                    <option 
                        key={c.id}
                        value={c.code}
                        className="bg-[#0b1320] text-slate-100"
                    >
                        {c.name}
                    </option>
                ))
            }
        </select>
    )
}