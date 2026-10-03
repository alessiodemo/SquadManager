import { Select } from 'flowbite-react'
import { useTeam } from '../context/teamContext'

export default function TeamSelector() {
    const { teams, teamId, getSelectedTeam } = useTeam()

    return (
        <Select
            id="team-select"
            value={teamId ?? ''}
            onChange={(e) => getSelectedTeam(e.target.value || null)}
            sizing="sm"
            color="gray"
            className="w-full border-gray-700 bg-gray-900 text-gray-100 focus:border-green-600 focus:ring-green-600"
            aria-label="Seleziona club"
        >
            <option value="">Seleziona un club</option>
            {
                teams.map((t) => (
                    <option
                        key={t.id}
                        value={t.id}
                    >
                        {t.name}
                    </option>
                ))
            }
        </Select>
    )
}