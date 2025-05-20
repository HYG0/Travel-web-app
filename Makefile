build:
	docker build -t travel-web-app:v0.1 .


run-dev:
	docker run -p 8080:5000 \
		-v $(PWD):/travel-app \
		-e FLASK_APP=run.py \
		-e FLASK_ENV=development \
		-e FLASK_DEBUG=1 \
		--name app-dev -d travel-web-app:v0.1

	sleep 2
	docker logs -f app-dev


stop:
	docker stop app-dev || true

start:
	docker start app-dev

rm:
	docker rm app-dev || true

clean:
	docker volume prune -f
