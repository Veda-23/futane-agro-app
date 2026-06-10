# Stage 1: Build & Test
FROM maven:3.8-eclipse-temurin-8 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
# Run unit testing phase first to validate code correctness!
# Skipping test phase during Docker build as it requires a live database connection
# Package application
RUN mvn package -DskipTests -B

# Stage 2: Runtime Environment
FROM eclipse-temurin:8-jre-focal
WORKDIR /app
COPY --from=build /app/target/futane-agro-app-0.0.1-SNAPSHOT.jar app.jar
# Create upload directory in case it does not exist
RUN mkdir -p uploads
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
