import { useTeam } from "../context/teamContext"
import { Select } from "./ui/select"

export default function CompetitionSelector() {
    const {
        competitions,
        competitionsLoading,
        competitionsError,
        competitionCode,
        setCompetitionCode,
    } = useTeam()

    return (
        <>
            <Select
                id="competition-select"
                value={competitionCode ?? ''}
                onChange={(e) => setCompetitionCode(e.target.value || null)}
                aria-label="Seleziona competizione"
                disabled={competitionsLoading || Boolean(competitionsError)}
            >
                <option value="">
                    {competitionsLoading ? 'Caricamento competizioni...' : 'Seleziona una competizione'}
                </option>
                {competitions.map((c) => (
                    <option key={c.id} value={c.code}>
                        {c.name}
                    </option>
                ))}
            </Select>
            {competitionsError && <p className="mt-1.5 text-[10px] font-medium text-rose-300">{competitionsError}</p>}
        </>
    )
}