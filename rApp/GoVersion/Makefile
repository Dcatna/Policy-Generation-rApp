NS ?= istio-nonrtric
APP ?= demo-rapp
IMG ?= go-rapp:dev

.PHONY: up down build deploy logs status

up: build deploy status

build:
	docker build -t $(IMG) .

deploy:
	kubectl get ns $(NS) >/dev/null 2>&1 || kubectl create ns $(NS)
	# imagePullPolicy IfNotPresent keeps your local image
	kubectl -n $(NS) set image deploy/$(APP) app=$(IMG) --record || \
	kubectl -n $(NS) apply -f k8s/$(APP).yaml
	kubectl -n $(NS) set env deploy/$(APP) \
		PMS_URL=http://policy-agent:8081 \
		SERVICE_ID=demo-rapp RIC_ID=ric2 POLICY_ID=demo-policy-3 \
		POLICY_TYPE_ID="" CALLBACK_URL=http://$(APP):8080/callback
	kubectl -n $(NS) rollout restart deploy/$(APP)
	kubectl -n $(NS) rollout status deploy/$(APP)

logs:
	kubectl -n $(NS) logs -f deploy/$(APP) -c app

status:
	kubectl -n $(NS) get pods -l app=$(APP) -o wide

down:
	kubectl -n $(NS) delete deploy/$(APP) svc/$(APP) --ignore-not-found
