import { Select } from 'flowbite-react'
import { useTeam } from '../context/teamContext'

export default function TeamSelector() {
    const { teams, teamId, getSelectedTeam } = useTeam()

    return (
        <select
            id="team-select"
            value={teamId ?? ''}
            onChange={(e) => getSelectedTeam(e.target.value || null)}
            className="w-full bg-[#0b1320] border border-[#1e2f4a] text-slate-100 text-xs rounded-lg px-3 py-2 focus:border-sofa-blue focus:ring-1 focus:ring-sofa-blue outline-none transition-colors cursor-pointer"
            aria-label="Seleziona club"
        >
            <option value="" className="bg-[#0b1320] text-slate-400">Seleziona un club</option>
            {
                teams.map((t) => (
                    <option
                        key={t.id}
                        value={t.id}
                        className="bg-[#0b1320] text-slate-100"
                    >
                        {t.name}
                    </option>
                ))
            }
        </select>
    )
}