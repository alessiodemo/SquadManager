import { createContext, useContext, useEffect, useState } from "react";
import { getFootballDataCompetitions, getFootballDataTeamsForCompetition } from "../api/footballData";
import { useSeason } from "./seasonContext";

const TeamContext = createContext();

export function useTeam() {
    return useContext(TeamContext)
}

export const TeamProvider = function({ children }) {
    const [ teamId, setTeamId ] = useState(null);
    const [ competitions, setCompetitions ] = useState([]);
    const [ competitionCode, setCompetitionCode ] = useState(null);
    const [ teams, setTeams ] = useState([]);
    const { selectedSeason } = useSeason();

    useEffect(() => {
        async function loadCompetitions() {
            try {
                const competitions = await getFootballDataCompetitions();
                setCompetitions(competitions)
            } catch (error) {
                console.error(error)
            }
        }
        loadCompetitions();
    }, [])

    useEffect(() => {
        setTeams([]);
        setTeamId(null);

        if (!competitionCode || !selectedSeason?.start_year) return;

        let cancelled = false;
        async function loadTeams() {
            try {
                const teamList = await getFootballDataTeamsForCompetition(
                    competitionCode,
                    selectedSeason.start_year,
                );
                if (!cancelled) setTeams(teamList);
            } catch (error) {
                if (!cancelled) console.error(error);
            }
        }

        loadTeams();
        return () => {
            cancelled = true;
        };
    }, [competitionCode, selectedSeason?.start_year]);

    return (
        <TeamContext.Provider
         value={{
            teamId,
            setTeamId,
            competitions,
            competitionCode,
            setCompetitionCode,
            teams,
         }}
        >
            {children}
        </TeamContext.Provider>
    )
}