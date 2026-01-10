import { minGorillaSize, maxGorillaSize, 
    gorillaDamage, gorillaKillRange, 
    gorillaSpeed, maxGorillaForce, 
    minGorillaForce, pixelesSize,
    gorrilaAceleration, angleOfVision } from "../config/constants.js";
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


        this.speed = gorillaSpeed;
        this.aceleration = gorrilaAceleration;
        this.angleOfVision =  angleOfVision;

        this.isCharging = true;
        this.isResting = false;
        this.startPosition = this.position.copy();
        this.maxDistanceToCharge = randomNumber(80,120);
        this.chargeDirection = p5.Vector.random2D().setMag(1);
        this.counterTime =  millis();
    }

    show() {
        stroke(this.mainColor);
        fill(this.mainColor);
        circle(this.position.x, this.position.y, this.size);
        line(this.position.x, this.position.y, this.position.x + this.chargeDirection.x * 30, this.position.y + this.chargeDirection.y * 30);
    }

    applyDamageIfClose(human) {
        if(this.isCharging){
            if(human.isAlive){
                let directionToHuman = p5.Vector.sub(human.position, this.position).normalize();
                let angle = degrees(this.chargeDirection.angleBetween(directionToHuman));
                angle = abs(angle);
                if (angle <= this.angleOfVision){
                    const chargeKillRage = this.size/2 +  human.size/2;
                    const distance = p5.Vector.dist(human.position, this.position);
                    if (distance <= chargeKillRage) {
                        const damage = this.force
                        human.damage = Math.max(0, human.damage - damage);
                        if (human.damage <= 0) {
                            human.isAlive = false;
                        }
                    }
                }  
            }
        }
    }

    charge(){

        if(this.isCharging){
            let elapsedTime =  millis() - this.counterTime;
            if(elapsedTime>=3000){
                this.isCharging = false;
                this.isResting =  true;
                this.counterTime = millis ();
            }else{
                this.position.add(this.chargeDirection);

                if (this.position.x < 0 || this.position.x > width) this.chargeDirection.x *= -1;
                if (this.position.y < 0 || this.position.y > height) this.chargeDirection.y *= -1;


                let distance = p5.Vector.dist(this.startPosition, this.position);

                if(distance >= this.maxDistanceToCharge/3*2){
                    //console.log("cambio erratico");
                    if (frameCount % 30 === 0) {
                        this.chargeDirection = p5.Vector.random2D();
                        this.chargeDirection.setMag(this.speed*this.aceleration);
                        //this.chargeDirection.setMag(0.5);
                    }
                }
                if (distance >= this.maxDistanceToCharge) {
                    //console.log("apagado", this.timeCharging);
                    this.isCharging = false;
                    this.isResting = true;
                    this.startPosition = this.position.copy();
                    this.chargeDirection = p5.Vector.random2D().setMag(1);
                    this.counterTime =  millis();
                }
            }
        }else if(this.isResting){
            let elapsedTime =  millis() - this.counterTime;
            if(elapsedTime>=2000){
                //console.log("encendido", elapsedTime);
                this.isCharging = true;
                this.isResting =  false;
                this.counterTime = millis ();
            }
        }

    }

}
