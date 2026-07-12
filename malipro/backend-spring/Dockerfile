# --- Étape build : compile le jar exécutable avec Maven + JDK 21 ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

# --- Étape run : image légère JRE 21 ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S novigo && adduser -S novigo -G novigo
COPY --from=build /app/target/novigo-api.jar app.jar
USER novigo
EXPOSE 8081
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:8081/actuator/health | grep -q UP || exit 1
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
