# Makefile — React (web) + FastAPI (api)

COMPOSE        ?= docker compose
PROJECT_NAME   ?= maja-chat
COMPOSE_FILE   ?= docker-compose.yml

DC = $(COMPOSE) -p $(PROJECT_NAME) -f $(COMPOSE_FILE)

.PHONY: help
help: ## Zeigt diese Hilfe
	@echo "Usage: make <target>"
	@echo
	@awk 'BEGIN {FS = ":.*##"; printf "Targets:\n"} /^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# --- Build / Lifecycle -------------------------------------------------------

.PHONY: build
build: ## Images bauen
	$(DC) build

.PHONY: rebuild
rebuild: ## Images ohne Cache bauen
	$(DC) build --no-cache

.PHONY: up
up: ## Stack im Hintergrund starten
	$(DC) up -d

.PHONY: up-logs
up-logs: ## Stack starten und Logs folgen
	$(DC) up

.PHONY: down
down: ## Container & Network stoppen/entfernen (Volumes bleiben)
	$(DC) down

.PHONY: clean
clean: ## Alles stoppen & Volumes löschen
	$(DC) down -v

.PHONY: restart
restart: ## Neu starten
	$(DC) down
	$(DC) up -d

.PHONY: ps
ps: ## Status anzeigen
	$(DC) ps

# --- Logs --------------------------------------------------------------------

.PHONY: logs
logs: ## Alle Logs folgen
	$(DC) logs -f

.PHONY: logs-api
logs-api: ## API-Logs folgen
	$(DC) logs -f api

.PHONY: logs-web
logs-web: ## Web/Nginx-Logs folgen
	$(DC) logs -f web

# --- Shells ------------------------------------------------------------------

.PHONY: api-sh
api-sh: ## Shell in API-Container (sh)
	$(DC) exec -it api sh

.PHONY: web-sh
web-sh: ## Shell in Web-Container (sh)
	$(DC) exec -it web sh

# --- Smoke Tests -------------------------------------------------------------

.PHONY: curl-health
curl-health: ## Health via Nginx-Proxy testen (http://localhost/api/health)
	@curl -sS -i http://localhost/api/health || true

.PHONY: curl-health-direct
curl-health-direct: ## Health direkt gegen FastAPI (http://localhost:8000/health)
	@curl -sS -i http://localhost:8000/health || true