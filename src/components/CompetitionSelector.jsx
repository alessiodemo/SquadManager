import { Select } from "flowbite-react"
import { useTeam } from "../context/teamContext"

export default function CompetitionSelector() {
    const { competitions, competitionCode, setCompetitionCode } = useTeam()

    return (
        <Select
            id="competition-select"
            value={competitionCode ?? ''}
            onChange={(e) => setCompetitionCode(e.target.value || null)}
            sizing="sm"
            color="gray"
            className="w-full border-gray-700 bg-gray-900 text-gray-100 focus:border-green-600 focus:ring-green-600"
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