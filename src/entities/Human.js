import { graveSize, normalHumanDamage,
    normalHumanForce, normalHumanSize,
    normalHumanSpeed, pixelesSize, 
    normalHumanKillRange} from "../config/constants.js";
import { Animal } from "./Animal.js";

export class Human extends Animal{
    constructor(x, y, name) {
        // VARIABLES DE POSICION
        super(x,y,name);

        //VARIABLES DE ESTADO
       
        
        //VARIABLES DE CARACTERISTICAS FISICAS
        this.size = normalHumanSize * pixelesSize;
        this.force = normalHumanForce;
        this.speed = normalHumanSpeed;
        //this.aceleration = normalHumanAceleration.
        //this.angleOfVision?
        this.mainColor = 'pink';

        //VARIABLES DE ATRIBUTOS
        this.damage = normalHumanDamage;
        this.maxDamageSupported = this.damage;
        //this.killRange = 

        //VARIABLES IDENTIFICADORAS
        this.type = "NORMAL"        

    }

    show() {
        if (this.isAlive) {
            stroke('black');
            fill(this.mainColor);
            circle(this.position.x, this.position.y, this.size);
           
            this.showLife();
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
            }else{
                this.drawGrave();
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
        const s = Math.max(0.1, graveSize); // evita tamaños negativos/cero
        push();

            translate(this.position.x, this.position.y);
            scale(s);
            // Sombra
            noStroke();
            fill(0, 0, 0, 90);
            ellipse(0, 8, 48, 12);
            // Piedra
            stroke(90);
            strokeWeight(2 / s); // para que el trazo no se vea enorme al escalar
            fill(170);
            rectMode(CENTER);
            // Cuerpo de la lápida
            rect(0, -25, 40, 55, 14);
            // Base de tierra
            noStroke();
            fill(40, 80, 45);
            rect(0, 5, 56, 12, 6);
            // Texto
            fill(70);
            textAlign(CENTER, CENTER);
            textSize(11);
            text("RIP", 0, -42);
            textSize(9);
            text(this.name || "Anon", 0, -28);
            // Tipo de humano
            textSize(8);
            //fill(typeColor(type));
            text(this.type ? this.type.toUpperCase() : "", 0, -14);

        pop();
    }
}