package com.example.Polling;

import org.springframework.web.bind.annotation.*;

/**
 * @author kushalsheth
 * @since 14/02/26
 */
@RestController
@RequestMapping("/polling")
public class Controller {
    private final PollingService pollingService;

    public Controller(PollingService pollingService) {
        this.pollingService = pollingService;
    }

    @PostMapping("/start/job")
    public String startJob() {
        return pollingService.startJob();
    }

    @GetMapping("/shortPoll/{jobId}")
    public String shortPoll(@PathVariable String jobId) {
        return pollingService.shortPoll(jobId);
    }

    @GetMapping("/longPoll/{jobId}")
    public String longPoll(@PathVariable String jobId) {
        return pollingService.longPoll(jobId);
    }


}
