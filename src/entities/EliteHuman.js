import { Human } from "./Human.js";
import { randomNumber } from "../utils/randomFunctions.js";
import { pixelesSize, eliteHumanDamage, 
    eliteHumanSize, eliteHumanSpeed, 
    maxEliteHumanForce, minEliteHumanForce,
    eliteHumanKillRange } from "../config/constants.js";

export class EliteHuman extends Human {
    constructor(x, y,name) {
        // VARIABLES DE POSICION
        super(x, y,name);

        //VARIABLES DE ESTADO

        //VARIABLES DE CARACTERISTICAS FISICAS
        this.size = eliteHumanSize * pixelesSize;
        this.force = randomNumber(minEliteHumanForce, maxEliteHumanForce);
        this.speed = eliteHumanSpeed;
        this.radius = this.size/2;

        //this.aceleration = normalHumanAceleration.
        //this.angleOfVision?
        this.mainColor = 'blue';

        //VARIABLES DE ATRIBUTOS
        this.damage = eliteHumanDamage;
        this.maxDamageSupported = this.damage;
        //this.killRange = 

        //VARIABLES IDENTIFICADORAS
        this.type = "ELITE"
    }

    show() {
        if (this.isAlive) {
            stroke('black');
            fill(this.mainColor);
            circle(this.position.x, this.position.y, this.size);

            this.showLife();
        }
    }
}