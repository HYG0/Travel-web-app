build:
	docker build -t travel-web-app:v0.1 .
	
# run:
# 	docker run -p 8080:5000 -d --name app travel-web-app:latest

run-dev:
	docker run -p 8080:5000 \
		-v $(PWD)/app:/travel-app/app \
		-e FLASK_APP=app -e FLASK_DEBUG=1 -e FLASK_ENV=development -e SASS_WATCH=true \
		--name app-dev -d travel-web-app:v0.1

	sleep 2
	docker cp app-dev:/travel-app/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js ./app/static/js/
	docker logs -f app-dev

stop:
	docker stop app-dev || true

start:
	docker start app-dev

rm:
	docker rm app-dev || true

clean:
	docker volume prune -f