package com.futaneagro.config;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

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
