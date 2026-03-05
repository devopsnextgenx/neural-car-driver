
const networkCanvas = document.getElementById("network");

const networkCtx = networkCanvas.getContext("2d");

const carCanvas = document.getElementById("canvas");

const carCtx = carCanvas.getContext("2d");
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.90, 3);


const minTrafficCount = 3;
const maxTrafficCount = 7;
const trafficRangeThreshold = 0.5; // 50% of screen height
const traffic = [];

const mutationRateInput = document.getElementById("mutationRate");
if (localStorage.getItem("mutationRate")) {
    mutationRateInput.value = localStorage.getItem("mutationRate");
}

mutationRateInput.addEventListener("change", () => {
    localStorage.setItem("mutationRate", mutationRateInput.value);
});

function updateTraffic() {
    // Remove traffic that is out of screen range (+/- half screen)
    for (let i = traffic.length - 1; i >= 0; i--) {
        const dist = Math.abs(traffic[i].y - bestCar.y);
        if (dist > canvas.height * (1 + trafficRangeThreshold)) {
            traffic.splice(i, 1);
        }
    }

    // Add new traffic if below threshold
    if (traffic.length < minTrafficCount + Math.random() * (maxTrafficCount - minTrafficCount)) {
        const lane = Math.floor(Math.random() * road.laneCount);
        // Traffic speed lower than car.maxSpeed, with some variation (1 to maxSpeed-1)
        const speedVariation = Math.random() * (bestCar.maxSpeed - 2) + 1;

        // Spawn ahead of the car (randomly at the top of the road within view/buffer)
        // car.y is the vertical position. Lower y is "ahead".
        // Use a more dynamic range for spawning ahead
        const spawnY = bestCar.y - canvas.height * (0.8 + Math.random());

        const newTrafficCar = new Car(road, lane, -1, true, speedVariation);
        newTrafficCar.y = spawnY;
        traffic.push(newTrafficCar);
    }
}

const cars = [];
const N = 100;


function generateCars(N) {
    for (let i = 0; i < N; i++) {
        cars.push(new Car(road, 1, i));
    }
}


generateCars(N);

let bestCar = cars[0];

if (localStorage.getItem("bestCar")) {
    const mutationRate = parseFloat(mutationRateInput.value);
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(localStorage.getItem("bestCar"));
        if (i !== 0) {
            NeuralNetwork.mutate(cars[i].brain, mutationRate);
        }
    }
}
animate();

function saveBestCar() {
    localStorage.setItem("bestCar", JSON.stringify(bestCar.brain));
}

function discardBestCar() {
    localStorage.removeItem("bestCar");
}

// Ctrl+S shortcut to save best car
window.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        saveBestCar();
    }
});

function animate(time) {
    updateTraffic();
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update();
    }

    for (let i = 0; i < cars.length; i++) {
        cars[i].update(traffic);
    }
    // best car
    bestCar = cars.find(car => car.y === Math.min(...cars.map(car => car.y)));

    networkCanvas.height = window.innerHeight;
    carCanvas.height = window.innerHeight;
    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.8);

    road.draw(carCtx);
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, "red");
    }

    carCtx.globalAlpha = 0.2;
    for (let i = 0; i < cars.length; i++) {
        cars[i].draw(carCtx);
    }
    carCtx.globalAlpha = 1;

    bestCar.draw(carCtx, "blue", true);

    carCtx.restore();

    // Draw active car count
    carCtx.fillStyle = "black";
    carCtx.font = "bold 20px Arial";
    carCtx.textAlign = "right";
    const activeCount = cars.filter(c => !c.crashed).length;
    const startY = window.innerHeight / 2;
    const distance = Math.max(0, Math.floor(startY - bestCar.y));
    carCtx.fillText(`(${bestCar.index} [${distance}]) ${activeCount}/${cars.length}`, carCanvas.width - 20, 30);


    networkCtx.lineDashOffset = -time / 50;
    Visualizer.drawNetwork(networkCtx, bestCar.brain);
    requestAnimationFrame(animate);
}
