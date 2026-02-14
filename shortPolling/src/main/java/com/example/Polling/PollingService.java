package com.example.Polling;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * @author kushalsheth
 * @since 14/02/26
 */
@Service
public class PollingService {
    private final Map<String, String> jobStatus = new HashMap<>();

    public String startJob() {
        String jobId = UUID.randomUUID().toString();
        jobStatus.put(jobId, "RUNNING");
        new Thread(() -> {
            try {
                Thread.sleep(20_000L);
                jobStatus.put(jobId, "STOPPED");
            } catch (Exception eX) {
                jobStatus.put(jobId, "FAILED");
                System.out.println("JobId: " + jobId + "Failed");
            }
        }).start();

        return jobId;
    }

    public String shortPoll(String jobId) {
        return jobStatus.get(jobId);
    }

    public String longPoll(String jobId) {
        final long timeoutMillis = 30_000L;
        final long pollIntervalMillis = 2_000L;

        while(System.currentTimeMillis() < (System.currentTimeMillis() + timeoutMillis)) {
            String currentStatus = jobStatus.get(jobId);
            LocalDateTime currentTime = LocalDateTime.now();
            DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
            if("RUNNING".equals(currentStatus)) {
                System.out.println("Status is still RUNNING, time: " + currentTime.format(dateTimeFormatter));
                try {
                    Thread.sleep(pollIntervalMillis);

                } catch (InterruptedException eX) {
                    System.out.println("Interrupted while waiting for job status");
                    return "INTERRUPTED";
                }
            } else {
                System.out.println("Status is STOPPED, time: " + currentTime.format(dateTimeFormatter));
                return currentStatus;
            }
        }

        return "TIMEOUT";
    }
}
