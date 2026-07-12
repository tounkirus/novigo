.PHONY: up down seed logs restart ps build

up:            ## Build + démarre toute la stack
	docker compose up --build -d
	@echo "Dashboard  http://localhost:3000  (login +22370000000 / admin123 apres 'make seed')"
	@echo "API        http://localhost:8080/api/v1"
	@echo "Prometheus http://localhost:9090"
	@echo "Grafana    http://localhost:3001  (admin / admin)"

seed:          ## Charge les donnees de demonstration
	docker compose exec api npm run seed

down:          ## Arrete la stack (conserve les volumes)
	docker compose down

clean:         ## Arrete et supprime les volumes (donnees effacees)
	docker compose down -v

logs:          ## Suit les logs
	docker compose logs -f

ps:            ## Etat des services
	docker compose ps
