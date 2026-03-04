const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth * 0.3;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");
const road = new Road(canvas.width / 2, canvas.width * 0.90, 3);

const car = new Car(road, 1);
const sensor = new Sensor(car);

const minTrafficCount = 5;
const maxTrafficCount = 10;
const trafficRangeThreshold = 0.5; // 50% of screen height
const traffic = [];

function updateTraffic() {
    // Remove traffic that is out of screen range (+/- half screen)
    for (let i = traffic.length - 1; i >= 0; i--) {
        const dist = Math.abs(traffic[i].y - car.y);
        if (dist > canvas.height * (1 + trafficRangeThreshold)) {
            traffic.splice(i, 1);
        }
    }

    // Add new traffic if below threshold
    if (traffic.length < minTrafficCount + Math.random() * (maxTrafficCount - minTrafficCount)) {
        const lane = Math.floor(Math.random() * road.laneCount);
        // Traffic speed lower than car.maxSpeed, with some variation (1 to maxSpeed-1)
        const speedVariation = Math.random() * (car.maxSpeed - 2) + 1;

        // Spawn ahead of the car (randomly at the top of the road within view/buffer)
        // car.y is the vertical position. Lower y is "ahead".
        // Use a more dynamic range for spawning ahead
        const spawnY = car.y - canvas.height * (0.8 + Math.random());

        const newTrafficCar = new Car(road, lane, true, speedVariation);
        newTrafficCar.y = spawnY;
        traffic.push(newTrafficCar);
    }
}


animate();

function animate() {
    updateTraffic();
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update();
    }
    car.update(traffic);
    sensor.update(road.borders, traffic);
    canvas.height = window.innerHeight;

    ctx.save();
    ctx.translate(0, -car.y + canvas.height * 0.8);

    road.draw(ctx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(ctx, "red");
    }
    car.draw(ctx);
    sensor.draw(ctx);

    ctx.restore();
    requestAnimationFrame(animate);
}
