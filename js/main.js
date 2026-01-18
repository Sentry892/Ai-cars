// ===== CANVAS SETUP =====
// Canvases for drawing the car simulation and neural network visualization
const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

// 2D drawing contexts for both canvases
const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

// UI elements for displaying alive car count and input
const aliveCountEl = document.getElementById("aliveCount");
const carCountInput = document.getElementById("carCountInput");

// ===== SIMULATION SETUP =====
// Create the road with center at canvas middle and width of 90% of canvas width
const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

// Initialize variables for the neural network car simulation
let cars = []; 
let bestCar = null; // Tracks the car that has traveled the farthest

// ===== TRAFFIC SETUP =====
// Create dummy cars (not controlled by AI) that serve as traffic obstacles, TODO add a possibility to controll how many cars there are
// Also don't put speed over 5 since the ai-cars can't handle that speed
const traffic = [
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 1, getRandomColor()), 
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -500, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2, getRandomColor()), 
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 1, getRandomColor()),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 1, getRandomColor()),
    new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -500, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2, getRandomColor()), 
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 1, getRandomColor()),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -500, 30, 50, "DUMMY", 3, getRandomColor()),
    new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2, getRandomColor()), 
    new Car(road.getLaneCenter(0), -300, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -300, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(0), -500, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(1), -500, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(1), -700, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -700, 30, 50, "DUMMY", 2, getRandomColor()),
    new Car(road.getLaneCenter(2), -500, 30, 50, "DUMMY", 3, getRandomColor()),

];

// ===== INITIALIZATION =====
// Initialize the simulation and start the animation loop
restartSimulation(); 
animate();

// ===== FUNCTIONS =====

// Warning to all only js devs: A int is a number and I write docs reffering to number as int 

/**
 * Restarts the simulation with a fresh set of AI cars.
 * Loads the best brain from previous session if available.
 * Mutates the brain slightly for other cars to create variation.
 */
function restartSimulation() {
    numberOfCars = Number(carCountInput.value);
    cars = generateCars(numberOfCars);
    bestCar = cars[0];

    if (localStorage.getItem("bestBrain")) {
        for (let i = 0; i < cars.length; i++) {
            cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
            if (i !== 0) {
                NeuralNetwork.mutate(cars[i].brain, 0.1);
            }
        }
    }
}

// Saves the best car's neural network brain to browser localStorage
function save() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

// Discards the saved brain from localStorage, resetting training progress.

function discard() {
    localStorage.removeItem("bestBrain");
}

/**
 * Generates an array of AI-controlled cars, all starting at the same position.
 * @param {int} numberOfCars - The number of cars to generate @returns {arr} Array of Car objects with AI control
 */
function generateCars(numberOfCars) {
    const cars = [];
    for (let i = 0; i < numberOfCars; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
    }
    return cars;
}

/**
 * Main animation loop - runs every frame to update and render the simulation.
 * Updates all cars and traffic, determines the best performing car.
 * @param {int} time - Timestamp of the frame
 */
function animate(time) {
    // Update all traffic cars (they move at constant speed)
    for (let t of traffic) {
        t.update(road.borders, []);
    }

    // Update all AI cars - they use their neural network to decide controls, they are no limits on how many they can do at one time btw
    for (let c of cars) {
        c.update(road.borders, traffic);
    }

    // Filter out cars that have collided and are no longer in the simulation
    const aliveCars = cars.filter(c => !c.damaged);
    aliveCountEl.textContent = aliveCars.length;

    // Find the best car (the one that has traveled the farthest - lowest y value)
    bestCar = aliveCars.length > 0
        ? aliveCars.reduce((a, b) => a.y < b.y ? a : b)
        : cars[0];

    // Set canvas heights to match window height
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;

    // ===== RENDERING CAR CANVAS =====
    // Save canvas state for transformation
    carCtx.save();
    
    // Translate view to follow the best car, keeping it centered 70% down the canvas
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

    // Draw the road
    road.draw(carCtx);

    // Draw all traffic cars
    for (let t of traffic) t.draw(carCtx);

    // Draw all other AI cars with reduced opacity to focus on best car
    carCtx.globalAlpha = 0.2;
    for (let c of cars) c.draw(carCtx);
    carCtx.globalAlpha = 1;

    // Draw the best car with full opacity and highlighting
    bestCar.draw(carCtx, true);
    carCtx.restore();

    // ===== RENDERING NETWORK CANVAS =====
    // Create animated dashed lines effect using line dash offset
    networkCtx.lineDashOffset = -time / 50;
    
    // Draw the neural network of the best car
    Visualizer.drawNetwork(networkCtx, bestCar.brain);

    // Request next animation frame to continue the loop
    requestAnimationFrame(animate);
}
