package com.futaneagro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Asynchronous Task Execution & Thread Pool Configuration.
 * <p>
 * Configures the dedicated Spring {@link ThreadPoolTaskExecutor} used for asynchronous operations
 * (e.g., transactional email sending, SMS OTP dispatches, security audit logging):
 * <ul>
 *   <li><b>Core Pool Size:</b> 4 worker threads allocated for baseline concurrent workloads.</li>
 *   <li><b>Max Pool Size:</b> 16 worker threads allowing elastic bursts under peak invoice/audit loads.</li>
 *   <li><b>Queue Capacity:</b> 100 pending tasks buffered before rejection.</li>
 *   <li><b>RAM Ceiling Adherence:</b> Thread pool bounds respect the 8 GB host environment ceiling, preventing thread starvation.</li>
 * </ul>
 *
 * @author Futane Agro Core Architecture Team
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Primary task executor bean utilized by {@code @Async} annotated service methods.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("FutaneAsync-");
        executor.initialize();
        return executor;
    }
}
