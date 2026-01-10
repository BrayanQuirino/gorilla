import { numberOfHumans } from "../config/constants.js";
import { EliteHuman } from "../entities/EliteHuman.js";
import { Human } from "../entities/Human.js";
import { StrongHuman } from "../entities/StrongHuman.js";
import { randomPosition } from "./randomFunctions.js";

export function createHumans() {
    let humans = [];
    for (let i = 0; i < numberOfHumans; i++) {
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
    return humans;
}