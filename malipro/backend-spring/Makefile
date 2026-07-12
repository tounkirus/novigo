# NOVIGO — Backend Spring : raccourcis d'exploitation.
# Usage : make <cible>. (Windows : installer `make`, ou lancer les commandes directement.)

MVN ?= mvn
JAR := target/novigo-api.jar

.PHONY: help test coverage verify build run-demo run-dev infra-up infra-down docker-build clean

help:            ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

test:            ## Lance les tests (mode démo, zéro infra)
	$(MVN) -o clean test

coverage: test   ## Tests + rapport de couverture JaCoCo
	@echo "Rapport : target/site/jacoco/index.html"

verify:          ## Build complet + tests + couverture
	$(MVN) -o clean verify

build:           ## Package le jar exécutable (sans tests)
	$(MVN) -o clean package -DskipTests

run-demo: build  ## Démarre l'API en mode démo (H2, aucune infra)
	java -jar $(JAR) --spring.profiles.active=demo

run-dev: build   ## Démarre l'API en mode dev (Postgres/Redis/RabbitMQ requis)
	java -jar $(JAR) --spring.profiles.active=dev

infra-up:        ## Démarre l'infra locale (Postgres + Redis + RabbitMQ + MinIO)
	docker compose up -d db redis rabbitmq minio

infra-down:      ## Arrête et supprime l'infra locale
	docker compose down

docker-build:    ## Construit l'image Docker de l'API
	docker build -t novigo/backend-spring:local .

clean:           ## Nettoie les artefacts de build
	$(MVN) -o clean
