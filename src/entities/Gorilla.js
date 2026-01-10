import { minGorillaSize, maxGorillaSize, 
    gorillaDamage, gorillaKillRange, 
    gorillaSpeed, maxGorillaForce, 
    minGorillaForce, pixelesSize } from "../config/constants.js";
import { randomNumber } from "../utils/randomFunctions.js";
//import * as randomFunctions from "../utils/randomFunctions"

export class Gorilla {
    constructor(x, y) {
        // This code runs once when an instance is created.
        this.x = x;
        this.y = y;
        this.size = randomNumber(minGorillaSize, maxGorillaSize) * pixelesSize;
        this.mainColor = 'black';
        this.force = randomNumber(minGorillaForce, maxGorillaForce);
        this.position = createVector(this.x, this.y);
        this.damage = this.force * gorillaDamage;
        this.killRange = this.size + gorillaKillRange;
    }

    show() {
        stroke(this.mainColor);
        fill(this.mainColor);
        circle(this.position.x, this.position.y, this.size)
    }

    applyDamageIfClose(human) {
        const distance = p5.Vector.dist(human.position, this.position);

        if (distance <= this.killRange) {
            const damage = this.force
            human.damage = Math.max(0, human.damage - damage);
            if (human.damage <= 0) {
                human.isAlive = false;
            }
        }
    }
}