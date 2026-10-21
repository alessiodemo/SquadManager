import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSeason, getSeasons, normalizeSeason, normalizeSeasons } from "../api/seasons";

const SeasonContext = createContext();

export function useSeason() {
    return useContext(SeasonContext)
}

export const SeasonProvider = function ({ children }) {
    const [ seasonId, setSeasonId ] = useState(null);
    const [ seasons, setSeasons ] = useState([]);

    function activateSeason(season) {
        const normalizedSeason = normalizeSeason(season);
        setSeasons((current) => normalizeSeasons([
            normalizedSeason,
            ...current,
        ]))
        setSeasonId(normalizedSeason.id)
    }

    useEffect(() => {
        async function loadSeason() {
            try {
                const [ seasonList, currentSeason ] = await Promise.all([
                    getSeasons(),
                    getCurrentSeason(),
                ]);
                setSeasons(normalizeSeasons(seasonList));
                setSeasonId(currentSeason?.id ?? null);
            } catch (error) {
                console.error(error)
            }
        }
        loadSeason();
    }, [])

    const selectedSeason = seasons.find((season) => season.id === seasonId) ?? null;

    return (
        <SeasonContext.Provider value={{seasonId, setSeasonId, seasons, selectedSeason, activateSeason}}>
            {children}
        </SeasonContext.Provider>
    )
}