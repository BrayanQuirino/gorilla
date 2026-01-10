import { pixelesSize, strongHumanDamage, 
    maxStrongHumanForce, strongHumanSize, 
    strongHumanSpeed, minStrongHumanForce } from "../config/constants.js";
import { randomNumber } from "../utils/randomFunctions.js";
import { Human } from "./Human.js";


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