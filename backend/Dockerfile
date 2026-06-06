FROM gradle:8.12-jdk17 AS builder
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN gradle build -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
RUN mkdir -p /data/uploads && chown -R appuser:appgroup /data
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
