import { Human } from "./Human.js";
import { randomNumber } from "../utils/randomFunctions.js";
import { pixelesSize, eliteHumanDamage, 
    eliteHumanSize, eliteHumanSpeed, 
    maxEliteHumanForce, minEliteHumanForce,
    eliteHumanKillRange } from "../config/constants.js";

export class EliteHuman extends Human {
    constructor(x, y, isAlive) {
        super(x, y,isAlive);
        this.size = eliteHumanSize * pixelesSize;
        this.speed = eliteHumanSpeed;
        this.force = randomNumber(minEliteHumanForce, maxEliteHumanForce);
        this.mainColor = 'blue';
        this.damage = eliteHumanDamage;
        this.type = "ELITE"
    }

    show() {
        if (this.isAlive) {
            stroke('black');
            fill(this.mainColor);
            circle(this.position.x, this.position.y, this.size);
        }
    }
}