import { pixelesSize, strongHumanDamage, 
    maxStrongHumanForce, strongHumanSize, 
    strongHumanSpeed, minStrongHumanForce,
    strongHumanKillRange } from "../config/constants.js";
import { randomNumber } from "../utils/randomFunctions.js";
import { Human } from "./Human.js";


export class StrongHuman extends Human {
    constructor(x, y,name) {
        // VARIABLES DE POSICION
        super(x, y,name);

        //VARIABLES DE ESTADO

        //VARIABLES DE CARACTERISTICAS FISICAS
        this.size = strongHumanSize * pixelesSize;
        this.force = randomNumber(minStrongHumanForce, maxStrongHumanForce);
        this.speed = strongHumanSpeed;
        //this.aceleration = normalHumanAceleration.
        //this.angleOfVision?
        this.mainColor = 'purple';

        //VARIABLES DE ATRIBUTOS
        this.damage = strongHumanDamage;
        this.maxDamageSupported = this.damage;

        //this.killRange = 

        //VARIABLES IDENTIFICADORAS
        this.type = "FUERTE"
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