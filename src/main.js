import { Gorilla } from "./entities/Gorilla.js";
import { Human } from "./entities/Human.js";
import { StrongHuman } from "./entities/StrongHuman.js";
import { EliteHuman } from "./entities/EliteHuman.js";
import { canvasW, canvasH } from "./config/constants.js";



const graveSize = 0.25;
let gorilla;

let human;
let numberOfHumans = 100;
let humans = [];

window.setup = function () {
    createCanvas(canvasW, canvasH);

    gorilla = new Gorilla(width / 2, height / 2);
    human = new Human(width / 2 + 50, height / 2 + 50);
    createHumans();

}

window.draw = function () {
    background(220);
    gorilla.show();


    humans.forEach((human, index) => {
        applyDamageIfClose(human, gorilla);
        if (human.isAlive) {
            human.show();
            moveToObjective(human, gorilla);
        } else {
            drawGrave(human.position.x, human.position.y, "Juan", human.type, graveSize);
        }
    });

    //gorilla.position.set(mouseX, mouseY);

}

let randomPosition = function (x, y, minDist, maxDist) {

    let angle = random(TWO_PI);
    let distance = random(minDist, maxDist);
    let newX = x + cos(angle) * distance;
    let newY = y + sin(angle) * distance;

    return { x: newX, y: newY };

}

function createHumans() {
    for (let i = 0; i < 100; i++) {
        let r = random(1000); // escala para Elite

        const { x, y } = randomPosition(width / 2, height / 2, 50, height / 2);

        if (r < 1) {
            humans.push(new EliteHuman(x, y, true));
        } else if (r < random(40, 90)) {
            humans.push(new StrongHuman(x, y, true));
        } else {
            humans.push(new Human(x, y, true));
        }
    }

}

function moveToObjective(humano, gorilla) {
    // 1. Calcular el vector dirección (hacia dónde debe ir)
    let direccion = p5.Vector.sub(gorilla.position, humano.position);
    // 2. Comprobar si ya llegó (para evitar que "tiemble" al estar encima)
    if (direccion.mag() > 1) {
        direccion.normalize();
        direccion.mult(0.3 * humano.speed);
        humano.position.add(direccion);
    }
}

function applyDamageIfClose(human, gorilla) {
    const distance = p5.Vector.dist(human.position, gorilla.position);

    if (distance <= gorilla.killRange) {
        const damage = gorilla.force
        human.damage = Math.max(0, human.damage - damage);
        if (human.damage <= 0) {
            human.isAlive = false;
        }
    }
}

function drawGrave(x, y, name, type, size) {
    const s = Math.max(0.1, size); // evita tamaños negativos/cero

    push();
    translate(x, y);
    scale(s);

    // Sombra
    noStroke();
    fill(0, 0, 0, 90);
    ellipse(0, 8, 48, 12);

    // Piedra
    stroke(90);
    strokeWeight(2 / s); // para que el trazo no se vea enorme al escalar
    fill(170);
    rectMode(CENTER);

    // Cuerpo de la lápida
    rect(0, -25, 40, 55, 14);

    // Base de tierra
    noStroke();
    fill(40, 80, 45);
    rect(0, 5, 56, 12, 6);

    // Texto
    fill(70);
    textAlign(CENTER, CENTER);

    textSize(11);
    text("RIP", 0, -42);

    textSize(9);
    text(name || "Anon", 0, -28);

    // Tipo de humano
    textSize(8);
    //fill(typeColor(type));
    text(type ? type.toUpperCase() : "", 0, -14);

    pop();
}