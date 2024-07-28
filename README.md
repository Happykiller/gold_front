# gold_front
Front for service Gold

## MEP

* Warning .env.local
* `docker build -t gold_front -f Dockerfile .`
* `docker save gold_front -o gold_front.tar`
* `docker stop gold_front`
* `docker rm gold_front`
* `docker image rm gold_front`
* `docker load -i gold_front.tar`
* `docker run -d --restart=always -p 8083:80 --name gold_front gold_front`