# syntax=docker/dockerfile:1

# ==========================================
# Stage 1: Build
# ==========================================
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /app

# Copy Maven wrapper and project descriptor first.
# This allows Docker to cache dependency resolution.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -DskipTests

# Copy application source
COPY src ./src

# Build the Spring Boot executable JAR
RUN ./mvnw clean package -DskipTests


# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM eclipse-temurin:17-jre-jammy AS runtime

WORKDIR /app

# Create non-root application user
RUN groupadd --system --gid 1001 tripnest \
    && useradd --system --uid 1001 --gid 1001 tripnest

# Application upload directory
RUN mkdir -p /app/uploads \
    && chown -R tripnest:tripnest /app

# Copy only the built JAR from the builder stage
COPY --from=builder /app/target/*.jar /app/app.jar

# Run as non-root user
USER tripnest

EXPOSE 8080

# Container-aware JVM configuration
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]