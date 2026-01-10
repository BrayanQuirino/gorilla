import { graveSize } from "../config/constants.js";

const normalHumanSize = 1;
const normalHumanForce = 1;
const normalHumanSpeed = 1;
const normalHumanDamage = 1;
const pixelesSize = 10;

export class Human {
    constructor(x, y, isAlive) {
        // This code runs once when an instance is created.
        this.x = x;
        this.y = y;
        this.isAlive = isAlive;
        this.size = normalHumanSize * pixelesSize;
        this.mainColor = 'pink';
        this.force = normalHumanForce;
        this.position = createVector(this.x, this.y);
        this.speed = normalHumanSpeed;
        this.damage = normalHumanDamage;
        this.type = "NORMAL"
        this.name = 'JUAN'
    }

    show() {
        if (this.isAlive) {
            stroke('black');
            fill(this.mainColor);
            circle(this.position.x, this.position.y, this.size);
        }
    }

    moveToObjective(gorillaPosition) {
        // 1. Calcular el vector dirección (hacia dónde debe ir)
        let direccion = p5.Vector.sub(gorillaPosition, this.position);
        // 2. Comprobar si ya llegó (para evitar que "tiemble" al estar encima)
        if (direccion.mag() > 1) {
            direccion.normalize();
            direccion.mult(0.3 * this.speed);
            this.position.add(direccion);
        }
    }

    drawGrave() {
        const s = Math.max(0.1, graveSize); // evita tamaños negativos/cero
        push();

            translate(this.position.x, this.position.y);
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
            text(this.name || "Anon", 0, -28);
            // Tipo de humano
            textSize(8);
            //fill(typeColor(type));
            text(this.type ? this.type.toUpperCase() : "", 0, -14);

        pop();
    }
}