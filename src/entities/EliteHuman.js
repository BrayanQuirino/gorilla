import { Human } from "./Human.js";
import { randomNumber } from "../utils/randomFunctions.js";

const eliteHumanDamage = 2.5;
const eliteHumanSize = 1.5;
const eliteHumanSpeed = 3;
const minEliteHumanForce = 2.5;
const maxEliteHumanForce = 3.5;
const pixelesSize = 10;

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