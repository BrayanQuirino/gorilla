import { randomNumber } from "../utils/randomFunctions.js";
import { Human } from "./Human.js";

const strongHumanSize = 1.25;
const strongHumanSpeed = 1.8;
const strongHumanDamage = 1.5;
const minStrongHumanForce = 1.5;
const maxStrongHumanForce = 2;
const pixelesSize = 10;

export class StrongHuman extends Human {
    constructor(x, y, isAlive) {
        super(x, y, isAlive);
        this.size = strongHumanSize * pixelesSize;
        this.speed = strongHumanSpeed;
        this.force = randomNumber(minStrongHumanForce, maxStrongHumanForce);
        this.mainColor = 'purple';
        this.damage = strongHumanDamage;
        this.type = "FUERTE"
    }

    show() {
        if (this.isAlive) {
            stroke('black');
            fill(this.mainColor);
            circle(this.position.x, this.position.y, this.size);
        }
    }
}