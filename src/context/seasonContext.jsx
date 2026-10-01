import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentSeason } from "../api/seasons";

const SeasonContext = createContext();

export function useSeason() {
    return useContext(SeasonContext)
}

export const SeasonProvider = function ({ children }) {
    const [ seasonId, setSeasonId ] = useState(null);

    useEffect(() => {
        async function loadSeason() {
            try {
                const season = await getCurrentSeason();
                setSeasonId(season.id)
            } catch (error) {
                console.error(error)
            }
        }
        loadSeason();
    }, [])

    return (
        <SeasonContext.Provider value={{seasonId, setSeasonId}}>
            {children}
        </SeasonContext.Provider>
    )
}