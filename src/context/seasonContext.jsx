import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSeason, getSeasons } from "../api/seasons";

const SeasonContext = createContext();

export function useSeason() {
    return useContext(SeasonContext)
}

export const SeasonProvider = function ({ children }) {
    const [ seasonId, setSeasonId ] = useState(null);
    const [ seasons, setSeasons ] = useState([]);

    function activateSeason(season) {
        setSeasons((current) => [
            ...current.filter((item) => item.id !== season.id), season ,
        ])
        setSeasonId(season.id)
    }

    useEffect(() => {
        async function loadSeason() {
            try {
                const [ seasonList, currentSeason ] = await Promise.all([
                    getSeasons(),
                    getCurrentSeason(),
                ]);
                setSeasons(seasonList);
                setSeasonId(currentSeason?.id ?? null);
            } catch (error) {
                console.error(error)
            }
        }
        loadSeason();
    }, [])

    const selectedSeason = seasons.find((season) => season.id === seasonId) ?? null;

    return (
        <SeasonContext.Provider value={{seasonId, setSeasonId, selectedSeason, activateSeason}}>
            {children}
        </SeasonContext.Provider>
    )
}