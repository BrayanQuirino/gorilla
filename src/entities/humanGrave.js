import { graveSize } from "../config/constants.js";

export class HumanGrave{
    constructor(position,name){
        this.position = position;
        this.name = name
    }

    show() {
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