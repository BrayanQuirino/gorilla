import {
    normalHumanForce, normalHumanSize,
    normalHumanSpeed, pixelesSize, 
    normalHumanKillRange,
    normalHumanDamageSupport} from "../config/constants.js";
import { Animal } from "./Animal.js";
import { HumanGrave } from "./humanGrave.js";

export class Human extends Animal{
    constructor(x, y, name) {
        // VARIABLES DE POSICION
        super(x,y,name);

        //VARIABLES DE ESTADO
       
        
        //VARIABLES DE CARACTERISTICAS FISICAS
        this.size = normalHumanSize * pixelesSize;
        this.force = normalHumanForce;
        this.speed = normalHumanSpeed;
        this.radius = this.size/2;

        //this.aceleration = normalHumanAceleration.
        //this.angleOfVision?
        this.mainColor = 'pink';

        //VARIABLES DE ATRIBUTOS
        this.damage = 0;
        this.maxDamageSupported = normalHumanDamageSupport;
        //this.killRange = 

        //VARIABLES IDENTIFICADORAS
        this.type = "NORMAL"        


        //VARIABLES DE OBJETOS
        this.grave = new HumanGrave(this.position,this.name);

    }

    show() {
        if (this.isAlive) {
            stroke('black');
            fill(this.mainColor);
            circle(this.position.x, this.position.y, this.size);
           
            this.showLife();
        }else{
            this.drawGrave();
        }
    }

    moveToObjective(gorilla) {
        if(this.isLaunched == false){
            if(this.isAlive){
                this.direction = p5.Vector.sub(gorilla.position, this.position);
                const killRange = this.size/2 +  gorilla.size/2;
                const distance = p5.Vector.dist(gorilla.position, this.position);
                //line(this.position.x, this.position.y, this.position.x + this.direction.x -30, this.position.y + this.direction.y -30);
                if (distance >= killRange) {
                    this.direction.normalize();
                    this.direction.mult(0.3 * this.speed);
                    this.position.add(this.direction);
                }
            }
        }else{
            this.moveToLaunch(gorilla.size*gorilla.forceToLaunch);
        }
    }

    moveToLaunch(size) {
        if(this.isLaunched){
            const distance = p5.Vector.dist(this.positionLaunched, this.position);
            if (distance < size) {
                this.direction.normalize();
                this.direction.mult(3);
                this.position.add(this.direction);
            }else{
                this.isLaunched = false;
            }
        }
    }

    drawGrave() {
        this.grave.show();
    }
}