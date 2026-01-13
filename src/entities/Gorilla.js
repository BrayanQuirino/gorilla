import { minGorillaSize, maxGorillaSize, 
    gorillaDamage, gorillaKillRange, 
    gorillaSpeed, maxGorillaForce, 
    minGorillaForce, pixelesSize,
    gorrilaAceleration, angleOfVision } from "../config/constants.js";
import { randomDecimalNumber, randomNumber } from "../utils/randomFunctions.js";
import { Animal } from "./Animal.js";
//import * as randomFunctions from "../utils/randomFunctions"

export class Gorilla extends Animal {
    constructor(x, y) {
        // VARIABLES DE POSICION
        super(x, y);
        this.chargeDirection = p5.Vector.random2D().setMag(1);


        //VARIABLES DE ESTADO
        this.isCharging = true;
        this.isResting = false;
        this.counterTime =  millis();

        //VARIABLES DE CARACTERISTICAS FISICAS

        this.size = randomNumber(minGorillaSize, maxGorillaSize) * pixelesSize;
        this.force = randomNumber(minGorillaForce, maxGorillaForce);
        this.speed = gorillaSpeed;
        this.aceleration = gorrilaAceleration;
        this.angleOfVision =  angleOfVision;
        this.mainColor = 'black';

        //VARIABLES DE ATRIBUTOS
        this.damage = this.force * gorillaDamage;
        this.maxDamageSupported = this.damage;
        this.killRange = this.size + gorillaKillRange;
        this.maxDistanceToCharge = randomNumber(80,120);

        //VARIABLES IDENTIFICADORAS
        //this.type = "NORMAL"
        this.name = 'DonkyKong'
    }

    show() {
        stroke(this.mainColor);
        fill(this.mainColor);
        circle(this.position.x, this.position.y, this.size);
        line(this.position.x, this.position.y, this.position.x + this.chargeDirection.x * 30, this.position.y + this.chargeDirection.y * 30);
    }


    applyDamageIfClose(human) {

        //SI EL GORILLA ESTÁ EN MODO CARGA
        if(this.isCharging){
            //SI EL HUMANO ESTÁ VIVO
            if(human.isAlive){
                /**
                 * Se calcula el vector de direccion del humano, si está en contra del gorilla lo atropella
                 * El gorilla tiene vision de 180 grados
                 * Los primeros 60 grados (30 izquierda, 30 derecha) Es un golpe total
                 * Los siguientes 60 grados (de 60 a 30 en izquierda y de 60 a 30 en derecha) es un golpe fuerte (La mitad de vida)
                 * Los ultimos 60 grados (de 90 a 60) Golpe menor, pero muy fuerte.
                 */
                let directionToHuman = p5.Vector.sub(human.position, this.position).normalize();
                let angle = degrees(this.chargeDirection.angleBetween(directionToHuman));
                angle = abs(angle);
                if (angle <= this.angleOfVision){

                    const chargeKillRange = this.size/2 +  human.size/2;
                    const distance = p5.Vector.dist(human.position, this.position);
                    let  damage = this.force

                    if(angle <= 30){
                        if (distance <= chargeKillRange) {

                            //Daño calculado con toda la fuerza del gorilla
                            human.damage = Math.max(0, human.damage - damage);
                            if (human.damage <= 0) {
                                human.isAlive = false;
                            }else{
                                human.isInmobilized = true;
                                human.speed = randomDecimalNumber(0.1, 0.3).toFixed(2); 
                                //human.position = p5.Vector.add(this.position,p5.Vector.fromAngle(random(TWO_PI)).mult(this.size*2));
                            }
                        }
                    }else if(angle >30 && angle <= 60){
                        if (distance <= chargeKillRange) {
                            /*
                            
                            Código con la mitad de fuerza del gorilla
                            damage /=2;
                            human.damage = Math.max(0, human.damage - damage);
                            
                            */

                            // No aguantan el vergazo. Por eso se quita la mitad de vida y se reduce la velocidad del humano 
                            // lo deja con su velocidad al (10-50%)
                           human.damage -= human.damage/2;
                           human.isInmobilized = true;
                           human.speed = randomDecimalNumber(0.1, 0.5).toFixed(2);
                           //human.position = p5.Vector.add(this.position,p5.Vector.fromAngle(random(TWO_PI)).mult(this.size*2));

                        }
                    }else if(angle >60){
                        if (distance <= chargeKillRange) {
                            /*
                            
                            Código con un tercio de fuerza del gorilla
                            damage /=3;
                            human.damage = Math.max(0, human.damage - damage); 
                            
                            */

                            // No aguantan el vergazo. Por eso se quita un tercio de vida y se reduce la velocidad del humano 
                            // lo deja con su velocidad al (20-100%)
                           human.damage -= human.damage/3;
                           human.isInmobilized = true;
                           human.speed = randomDecimalNumber(0.2, 1).toFixed(2);
                           //human.position = p5.Vector.add(this.position,p5.Vector.fromAngle(random(TWO_PI)).mult(this.size*1.5));
                           //console.log(angle, human.mainColor, human.damage, human.speed);
                        }
                    }

                    if (human.damage <= 0) human.isAlive = false;
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
