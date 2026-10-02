package com.squadManager.analytics;

import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SeasonSummaryService {

    private final SeasonSummaryRepository repo;

    public SeasonSummaryService(SeasonSummaryRepository repo) {
        this.repo = repo;
    }

    public SeasonSummary getSummaryForSeason(UUID seasonId) {
        return repo.findSummaryForSeason(seasonId);
    }
    
}
