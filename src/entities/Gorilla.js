import { minGorillaSize, maxGorillaSize, 
    gorillaDamage, gorillaKillRange, 
    gorillaSpeed, maxGorillaForce, 
    minGorillaForce, pixelesSize,
    gorrilaAceleration, angleOfVision, 
    minGorillaforceToLaunch,
    maxGorillaforceToLaunch} from "../config/constants.js";
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
        this.forceToLaunch = randomDecimalNumber(minGorillaforceToLaunch, maxGorillaforceToLaunch);
        this.speed = gorillaSpeed;
        this.aceleration = gorrilaAceleration;
        this.angleOfVision =  angleOfVision;
        this.mainColor = 'black';
        this.radius = this.size/2;

        //VARIABLES DE ATRIBUTOS
        this.damage = 0;
        this.maxDamageSupported = this.force * gorillaDamage;
        this.killRange = this.size + gorillaKillRange;
        this.maxDistanceToCharge = randomNumber(80,120);

        //VARIABLES IDENTIFICADORAS
        this.type = "GORILLA"
        this.name = 'DonkyKong'
        this.img = loadImage(`./utils/resources/images/gorilla.svg`); 

    }

    show() {
        fill(this.mainColor);
        stroke(this.mainColor);
        //circle(this.position.x, this.position.y, this.size);

        push();

            let xChargeDirection = this.chargeDirection.x;
            let yChargeDirection  = this.chargeDirection.y;
 
            let v1 = createVector(1, 0).setMag(this.radius*2);
            let v2 = createVector(xChargeDirection,yChargeDirection).setMag((this.radius*2));

            angleMode(DEGREES);
            let angle = round(v1.angleBetween(v2),2);
            translate(this.position.x, this.position.y)
            line(0,0, v2.x, v2.y);
            //line(0,0, v1.x, v1.y);

            
            rotate(angle-90)
            
            imageMode(CENTER);
            image(this.img, 0, 0, this.size*2, this.size*2)

        pop();

        this.collideWalls();
        this.showLife();
    }


    applyDamageIfClose(human) {

        const chargeKillRange = this.radius +  human.radius;
        const distance = p5.Vector.dist(human.position, this.position);

        //SI EL HUMANO ESTÁ PEGADO AL GORILLA
        if (distance <= chargeKillRange) {
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
                        
                        
                        let  damage = this.force
                        human.isLaunched = true;
                        human.isInmobilized = true;

                        human.positionLaunched = this.position.copy();
                        human.direction.mult(-1);
                        human.direction.normalize();
                        human.direction.mult(this.size)
                        
                        if(angle <= 30){
                            //Daño calculado con toda la fuerza del gorilla
                            human.damage = Math.max(0, human.damage + damage);
                            if (human.damage > human.maxDamageSupported) {
                                human.isAlive = false;
                            }else{
                                human.speed = randomDecimalNumber(0.1, 0.3); 
                            }
                        }else if(angle >30 && angle <= 60){
                            /*
                            
                            Código con la mitad de fuerza del gorilla
                            damage /=2;
                            human.damage = Math.max(0, human.damage - damage);
                            
                            */

                            // No aguantan el vergazo. Por eso se quita la mitad de vida y se reduce la velocidad del humano 
                            // lo deja con su velocidad al (10-50%)
                            human.damage += human.maxDamageSupported/2;
                            human.speed = randomDecimalNumber(0.1, 0.5);

                        }else if(angle >60){
                            /*
                            
                            Código con un tercio de fuerza del gorilla
                            damage /=3;
                            human.damage = Math.max(0, human.damage - damage); 
                            
                            */

                            // No aguantan el vergazo. Por eso se quita un tercio de vida y se reduce la velocidad del humano 
                            // lo deja con su velocidad al (20-100%)
                            human.damage += human.maxDamageSupported/3;
                            human.speed = randomDecimalNumber(0.2, 1);
                            //human.position = p5.Vector.add(this.position,p5.Vector.fromAngle(random(TWO_PI)).mult(this.size*1.5));
                            //console.log(angle, human.mainColor, human.damage, human.speed);
                        }
                        if (human.damage > human.maxDamageSupported) human.isAlive = false;
                    }  
                }
            }
        }
    }

    charge(){
        this.elapsedTime =  millis() - this.counterTime;
        if(this.isCharging){
            if(this.elapsedTime>=3000){
                this.isCharging = false;
                this.isResting =  true;
                this.counterTime = millis ();
            }else{
                this.position.add(this.chargeDirection);

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
            if(this.elapsedTime>=2000){
                //console.log("encendido", elapsedTime);
                this.isCharging = true;
                this.isResting =  false;
                this.counterTime = millis ();
            }
        }
    
    }
}
