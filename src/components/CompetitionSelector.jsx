import { useTeam } from "../context/teamContext"
import { Select } from "./ui/select"
import { ErrorNotice } from "./ui/error-notice"

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
                aria-label="Select competition"
                disabled={competitionsLoading || Boolean(competitionsError)}
            >
                <option value="">
                    {competitionsLoading ? 'Loading competitions...' : 'Select a competition'}
                </option>
                {competitions.map((c) => (
                    <option key={c.id} value={c.code}>
                        {c.name}
                    </option>
                ))}
            </Select>
            <ErrorNotice message={competitionsError} />
        </>
    )
}