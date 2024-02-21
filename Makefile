start: 
	docker compose up -d

startall: 
	docker compose up --build -d

down:
	docker stop gold_front

reset: down
	docker rm gold_front

help:
	@echo ""
	@echo "~~ Gold Front Makefile ~~"
	@echo ""
	@echo "\033[33m make start\033[39m    : Démarre le projet"
	@echo "\033[33m make startall\033[39m : Build et démarre le projet"
	@echo "\033[33m make down\033[39m     : Stop le projet"
	@echo "\033[33m make reset\033[39m    : Reset les containers, les volumes, les networks et les données local"
	@echo ""