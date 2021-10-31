const ROOT_BOUNDARIES = new Rectangle(LEVEL_SPACING_LEFT, 0, LEVEL_WIDTH-LEVEL_SPACING_LEFT, LEVEL_HEIGHT+1)

let boidEntities;
let debugTexts = [];

function setup() {
	let canvas = createCanvas(LEVEL_WIDTH, LEVEL_HEIGHT);
	canvas.position(0, 0);
	background(0);

	createCustomSlider("COHESION", 0, 1, COHESION_MULTIPLIER, 0.0005, (value) => COHESION_MULTIPLIER = value);
	createCustomSlider("SEPARATION", 0, 1, SEPARATION_MULTIPLIER, 0.001, (value) => SEPARATION_MULTIPLIER = value);
	createCustomSlider("ALIGNMENT", 0, 1, ALIGNMENT_MULTIPLIER, 0.001, (value) => ALIGNMENT_MULTIPLIER = value);
	createCustomCheckbox("SHOW FLOCK COLORS", SHOW_FLOCK_COLORS, (value) => SHOW_FLOCK_COLORS = value);
	createCustomCheckbox("BOUNCE AT EDGES", BOID_BOUNCE_AT_EDGES, (value) => BOID_BOUNCE_AT_EDGES = value);
	createCustomSlider("BOID AMOUNT", 100, 10000, BOID_AMOUNT, 100, (value) => { BOID_AMOUNT = value; adjustEntityAmountTo(value); });
	createCustomSlider("BOID MAX SPEED", 0, 10, BOID_MAX_SPEED, 0.1, (value) => BOID_MAX_SPEED = value);
	createCustomSlider("BOID PERSONAL SPACE", 0, 64, BOID_PERSONAL_SPACE, 1, (value) => BOID_PERSONAL_SPACE = value);
	createCustomSlider("BOID VISION", 8, 256, BOID_VISION, 2, (value) => BOID_VISION = value);
	createCustomCheckbox("USE QUADTREE", USE_QUADTREE, (value) => { USE_QUADTREE = value; totalQuadtrees = 0; });
	createCustomCheckbox("SHOW QUADTREE", SHOW_QUADTREE, (value) => SHOW_QUADTREE = value);
	createCustomSlider("MAX BOIDS PER QUADTREE", 2, 500, MAX_ENTITIES_PER_QUADTREE, 1, (value) => MAX_ENTITIES_PER_QUADTREE = value);
	createCustomSlider("MIN QUADTREE SIZE", 2, 500, MIN_QUADTREE_SIZE, 2, (value) => MIN_QUADTREE_SIZE = value);
	createCustomCheckbox("SHOW DEBUG", SHOW_DEBUG, (value) => SHOW_DEBUG = value);

	spawnBoids();
}

function draw() {
	background(0);


	// INIT QUADTREE

	let startTimeQuadtreeCreation = performance.now();

	let quadtree;
	if (USE_QUADTREE) {
		quadtree = new QuadTree(ROOT_BOUNDARIES, MAX_ENTITIES_PER_QUADTREE, true);
		for (let boidEntity of boidEntities) {
			quadtree.addEntity(boidEntity);
		}
	} else {
		quadtree = new NoQuadTree(boidEntities);
	}

	let endTimeQuadtreeCreation = performance.now();

	// DRAW BOIDS

	for (let boidEntity of boidEntities) {
		boidEntity.draw();
	}


	// DRAW DEBUG

	if (SHOW_QUADTREE) {
		quadtree.draw();
	}

	let res;
	if (SHOW_DEBUG) {
		// let boidPerception = new Rectangle(mouseX-64, mouseY-64, 128, 128);
		let boidPerception = boidEntities[0].getPerceptionRange();
		boidPerception.draw();
		res = quadtree.queryByRectangle(boidPerception);
		if (SHOW_QUADTREE) {
			for (let quadtree2 of res.quadtrees) {
				noFill();
				strokeWeight(1);
				stroke(255, 0, 0);
				rect(quadtree2.bounds.x, quadtree2.bounds.y, quadtree2.bounds.w, quadtree2.bounds.h);

				for (let entity of quadtree2.entities) {
					stroke(255, 0, 0);
					strokeWeight(BOID_SIZE);
					point(entity.position.x, entity.position.y);
				}
			}
		}
	}


	// SIMULATE

	let startTimeSimulation = performance.now();

	for (let boidEntity of boidEntities) {
		boidEntity.preSimulate();
	}
	for (let boidEntity of boidEntities) {
		boidEntity.simulate(quadtree, LEVEL_WIDTH, LEVEL_HEIGHT);
	}

	let endTimeSimulation = performance.now();

	// SHOW PERFORMANCE STATISTICS

	showPerformanceStatistics(startTimeQuadtreeCreation, endTimeQuadtreeCreation, startTimeSimulation, endTimeSimulation, res);
}

function mousePressed() {
	if (mouseX > LEVEL_WIDTH || mouseY > LEVEL_HEIGHT || mouseX < LEVEL_SPACING_LEFT || mouseY < 0) {
		return;
	}
    let vx = getRandomVelocity();
    let vy = getRandomVelocity();
	let boid = new Boid2D(getVector2D(mouseX, mouseY), getVector2D(vx, vy));
    boidEntities.push(boid);
}

function spawnBoids() {
	boidEntities = [];
	for (let i = 0; i < BOID_AMOUNT; i++) {
		boidEntities.push(getRandomBoid())
	}
}

function getRandomBoid() {
    let x = (Math.random() * (LEVEL_WIDTH-LEVEL_SPACING_LEFT-TURN_AROUND_AREA*2))+LEVEL_SPACING_LEFT+TURN_AROUND_AREA;
    let y = (Math.random() * (LEVEL_HEIGHT-TURN_AROUND_AREA*2))+TURN_AROUND_AREA;
    let vx = getRandomVelocity();
    let vy = getRandomVelocity();
	return new Boid2D(getVector2D(x, y), getVector2D(vx, vy));
}

function getVector2D(x, y) {
	return new Vector2D(x, y);
}

function getRandomVelocity() {
	return (Math.random() * 10) - 5;
}

function adjustEntityAmountTo(newAmount) {
	if (boidEntities.length > newAmount) {
		boidEntities.splice(newAmount-1, boidEntities.length-newAmount);
	} else if (boidEntities.length < newAmount) {
		for (let i = boidEntities.length; i < newAmount; i++) {
			boidEntities.push(getRandomBoid())
		}
	}
}


 // UI

let uiElementsAmount = 0;
let wasLastUIElementACheckbox = false;

function showPerformanceStatistics(startTimeQuadtreeCreation, endTimeQuadtreeCreation, startTimeSimulation, endTimeSimulation, res) {
	if (SHOW_DEBUG) {
		let simulationTime = endTimeSimulation-startTimeSimulation;
		let quadtreeCreationTime = USE_QUADTREE ? endTimeQuadtreeCreation-startTimeQuadtreeCreation : 0;
		let totalTime = simulationTime + quadtreeCreationTime;
		let fr = floor(frameRate());
		let texts = [
			"Simulation Time: " + simulationTime.toFixed(2) + "ms",
			"Quadtree Creation Time: " + quadtreeCreationTime.toFixed(2) + "ms",
			"Total Time: " + totalTime.toFixed(2) + "ms",
			"Framerate: " + fr,
			"Entities  (total/checked/found):",
			boidEntities.length + "/" + (res.entitiesChecked-1) + "/" + (res.entities.length-1), // itself excluded
			"Quadtrees (total/traversed/checked):",
			totalQuadtrees + "/" + res.quadtreesTraversed + "/" + res.quadtreesChecked
		]
		if (debugTexts.length === 0) {
			for (let i = 0; i < texts.length; i++) {
				createDebugText(10, uiElementsAmount*UI_SPACING+(i*20)+20, texts[i]);
			}
		} else {
			for (let i = 0; i < texts.length; i++) {
				debugTexts[i].html(texts[i]);
			}
		}
	} else {
		if (debugTexts.length > 0) {
			for (let i = 0; i < debugTexts.length; i++) {
				debugTexts[i].remove();
			}
			debugTexts = [];
		}
	}
}

function createCustomSlider(identifier, min, max, start, step, onChange) {
	let text = createP(identifier + ": " + start);
	text.position(22, uiElementsAmount*UI_SPACING);
	text.style('color', 'white')
	text.style('fontSize', '14px')
	text.style('fontFamily', 'Consolas, monospace')

	let slider = createSlider(min, max, start, step);
	slider.position(20, (uiElementsAmount*UI_SPACING) + 30);
	slider.style('width', SLIDER_WIDTH + 'px');
	slider.input(() => {
		let value = slider.value();
		text.html(identifier + ": " + value);
		onChange(value);
	});
	uiElementsAmount++;
	wasLastUIElementACheckbox = false;
}

function createCustomCheckbox(identifier, start, onChange) {
	if (!wasLastUIElementACheckbox) {
		uiElementsAmount += 0.25;
	}
	let text = createP(identifier);
	text.position(45, uiElementsAmount*UI_SPACING);
	text.style('color', 'white')
	text.style('fontSize', '14px')
	text.style('fontFamily', 'Consolas, monospace')

	let checkbox = createCheckbox('', start);
	checkbox.position(20, (uiElementsAmount*UI_SPACING)+13);
	checkbox.changed(() => {
		onChange(checkbox.checked());
	});
	uiElementsAmount += 0.5;
	wasLastUIElementACheckbox = true;
}


function createDebugText(x, y, identifier) {
	let text = createP(identifier);
	text.position(x, y);
	text.style('color', 'white')
	text.style('fontSize', '12px')
	text.style('fontFamily', 'Consolas, monospace')
	debugTexts.push(text);
}



// TODO statistics (new folder): gather stats by making the logic run with different settings, save average and median performance, plot graphs

// UI
// TODO reset button