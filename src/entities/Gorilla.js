import { randomNumber } from "../utils/random.js";


const minGorillaSize = 2.5;
const maxGorillaSize = 3;
const minGorillaForce = 6;
const maxGorillaForce = 10;
const pixelesSize = 10;
const gorillaSpeed = 1.5;
const gorillaDamage = 100;
const gorillaKillRange = 1.5;

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
}