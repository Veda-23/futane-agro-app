package com.futaneagro.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * AspectJ AOP Performance Profiler & Latency Sentinel.
 * <p>
 * Non-intrusively profiles execution duration across all {@code @RestController} endpoints:
 * <ul>
 *   <li><b>Pointcut Definition:</b> Intercepts all REST controller method executions.</li>
 *   <li><b>Slow Endpoint Detection:</b> Measures execution elapsed time using {@link System#currentTimeMillis()}.
 *       If an API call exceeds the 200ms threshold ({@link #SLOW_THRESHOLD_MS}), emits a warning log
 *       ({@code [SLOW API]}) to identify database query bottlenecks or serialization lag.</li>
 *   <li><b>Diagnostic Metrics:</b> In debug mode, logs detailed timing metrics for telemetry aggregation.</li>
 * </ul>
 *
 * @author Futane Agro Core Architecture Team
 */
@Aspect
@Component
public class PerformanceLoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(PerformanceLoggingAspect.class);
    private static final long SLOW_THRESHOLD_MS = 200;

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void restControllerMethods() {}

    @Around("restControllerMethods()")
    public Object profileControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        try {
            return joinPoint.proceed();
        } finally {
            long executionTime = System.currentTimeMillis() - start;
            if (executionTime > SLOW_THRESHOLD_MS) {
                log.warn("[SLOW API] {}.{} executed in {} ms (exceeds {}ms threshold)",
                        className, methodName, executionTime, SLOW_THRESHOLD_MS);
            } else if (log.isDebugEnabled()) {
                log.debug("[API METRIC] {}.{} executed in {} ms", className, methodName, executionTime);
            }
        }
    }
}
