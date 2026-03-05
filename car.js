class Car {
    constructor(road, lane, index = -1, isTraffic = false, speed = 0, width = 45, height = 60) {
        this.road = road;
        this.lane = lane;
        this.index = index;
        this.isTraffic = isTraffic;
        this.x = this.road.getLaneCenter(this.lane) + 5;
        this.y = window.innerHeight / 2;
        if (isTraffic) {
            this.y = Math.random() * (window.innerHeight);
        }

        this.width = width;
        this.height = height;

        this.angle = 0;

        this.speed = speed;
        this.acceleration = 0.2;
        this.maxSpeed = 3;
        this.friction = 0.05;

        this.crashed = false;
        this.crashOnForward = false;
        this.crashOnBackward = false;

        this.steering = 0;

        this.useBrain = !isTraffic;

        if (this.useBrain) {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.sensor.rayCount, 5, 5, 4]);
        }

        this.controls = new Controls(isTraffic ? "DUMMY" : "AI");
    }

    get allowRecover() {
        return (this.crashOnForward && this.controls.backward)
            || (this.crashOnBackward && this.controls.forward)
            || this.controls.ctrl;
    }

    draw(ctx, color = "blue", drawSensor = false) {
        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);
        // make blue transparent
        ctx.fillStyle = this.crashed ? this.crashOnForward ? "rgba(255, 0, 0, 0.45)" : "rgba(0, 255, 0, 0.45)" : color;
        ctx.beginPath();
        ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fill();
        ctx.restore();
        // draw sensor after car
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }

    update(traffic = []) {
        this.polygon = this.#createPolygon();
        if (this.isTraffic) {
            this.#moveTraffic();
            return;
        }

        const wasCrashed = this.crashed;
        if (this.crashed) {
            this.speed = 0;
            return;
        }

        // this.polygon is already created above for all cars
        this.crashed = this.#collidesWithBorder();
        this.crashed = this.crashed || this.#collidesWithTraffic(traffic);
        if (this.crashed) {
            if (!wasCrashed) {
                this.crashOnForward = this.speed > 0;
                this.crashOnBackward = this.speed < 0;
            }
            this.speed = 0;
        } else {
            this.crashOnForward = false;
            this.crashOnBackward = false;
        }

        if (!this.crashed || this.allowRecover) {
            this.#move();
        }

        if (this.sensor) {
            this.sensor.update(this.road.borders, traffic);
            const offsets = this.sensor.readings.map(s => s.length == 0 ? 0 : 1 - s[0].offset);
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            if (this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1] ? 1 : 0;
                this.controls.right = outputs[2] ? 1 : 0;
                this.controls.backward = outputs[3];
            }
        }
    }

    #moveTraffic() {
        this.y -= this.speed;
    }

    #collidesWithBorder() {
        for (let i = 0; i < this.polygon.length; i++) {
            for (let j = 0; j < this.road.borders.length; j++) {
                if (getIntersection(
                    this.polygon[i],
                    this.polygon[(i + 1) % this.polygon.length],
                    this.road.borders[j][0],
                    this.road.borders[j][1]
                )) {
                    return true;
                }
            }
        }
        return false;
    }

    #collidesWithTraffic(traffic) {
        for (let i = 0; i < this.polygon.length; i++) {
            for (let j = 0; j < traffic.length; j++) {
                const trafficCar = traffic[j];
                const trafficPolygon = trafficCar.polygon;
                for (let k = 0; k < trafficPolygon.length; k++) {
                    if (getIntersection(
                        this.polygon[i],
                        this.polygon[(i + 1) % this.polygon.length],
                        trafficPolygon[k],
                        trafficPolygon[(k + 1) % trafficPolygon.length]
                    )) {
                        // trafficCar.speed = 0;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
        });
        return points;
    }

    #move() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.backward) {
            this.speed -= this.acceleration;
        }
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }


        if (this.speed != 0) {
            const flip = Math.sign(this.speed);
            this.speed -= flip * this.friction;
        }

        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }
        this.#turn();

        this.y -= Math.cos(this.angle) * this.speed;
    }

    #turn() {
        const targetSteering = (this.controls.left ? 1 : 0) - (this.controls.right ? 1 : 0);
        this.steering = lerp(this.steering, targetSteering, 0.1);

        this.angle += this.steering * 0.04;

        this.x -= Math.sin(this.angle) * this.speed;
    }
}