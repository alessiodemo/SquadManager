import { useTeam } from "../context/teamContext"
import { Select } from "./ui/select"

export default function CompetitionSelector() {
    const { competitions, competitionCode, setCompetitionCode } = useTeam()

    return (
        <Select
            id="competition-select"
            value={competitionCode ?? ''}
            onChange={(e) => setCompetitionCode(e.target.value || null)}
            aria-label="Seleziona competizione"
        >
            <option value="">Seleziona una competizione</option>
            {
                competitions.map((c) => (
                    <option
                        key={c.id}
                        value={c.code}
                    >
                        {c.name}
                    </option>
                ))
            }
        </Select>
    )
}