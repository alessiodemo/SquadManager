package com.squadManager.analytics;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SeasonSummaryController {

    private final SeasonSummaryService seasonSummaryService;

    public SeasonSummaryController(SeasonSummaryService seasonSummaryService) {
        this.seasonSummaryService = seasonSummaryService;
    }

    @GetMapping("/api/analytics/seasons/{seasonId}/summary")
    public SeasonSummary getSummary(@PathVariable UUID seasonId) {
        return seasonSummaryService.getSummaryForSeason(seasonId);
    }
}
