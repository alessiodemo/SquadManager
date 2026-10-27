import { useTeam } from '../context/teamContext'
import { Select } from './ui/select'

export default function TeamSelector() {
    const { teams, teamId, getSelectedTeam } = useTeam()

    return (
        <Select
            id="team-select"
            value={teamId ?? ''}
            onChange={(e) => getSelectedTeam(e.target.value || null)}
            aria-label="Select a club"
        >
            <option value="">Select a club</option>
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