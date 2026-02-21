export class Animal {

    constructor (x, y, name){

        // VARIABLES DE POSICION
        this.x = x;
        this.y = y;
        this.position = createVector(this.x, this.y);
        this.startPosition = this.position.copy();
        this.direction = createVector(1,1);
        this.positionLaunched = createVector(1,1);

        //VARIABLES DE ESTADO
        this.isAlive = true;
        this.isInmobilized = false;
        this.isLaunched = false;
        this.isPaused = false;
        this.elapsedTime = 0;

        //VARIABLES DE CARACTERISTICAS FISICAS

        //VARIABLES DE ATRIBUTOS

        //VARIABLES IDENTIFICADORAS
        this.name = name;

    }

    showLife() {

        let percentageLife = 1 - (this.damage / this.maxDamageSupported);

        let r = lerp(255, 0, percentageLife); 
        let g = lerp(0, 255, percentageLife);
        
        
        fill(100, 100, 100, 150);
        rect(this.position.x - this.size/2, this.position.y + this.size*0.6, this.size, this.size*.3,4);
        
        fill(r, g, 0);

        let newLifeSize = this.size * percentageLife;
        let newPercentageLifeX = (this.position.x + (this.size/2)) - newLifeSize;

        rect(newPercentageLifeX, this.position.y + this.size*0.6, newLifeSize, this.size*0.3, 4);
    }

    counterTimeIsPaused(){
        if(this.isPaused){
            this.counterTime = millis() - this.elapsedTime;
            this.elapsedTime = millis() - this.counterTime;
        }
    }


    collide(other) {
        if (other == this || !other.isAlive) {
            return;
        }
        let relative = p5.Vector.sub(other.position, this.position);
        let dist = relative.mag() - (this.radius + other.radius);
        if (dist < 0) {
            let movement = relative.copy().setMag(abs(dist/2));
            this.position.sub(movement);
            if(other.type != 'GORILLA'){
                other.position.add(movement);
            }else{
                let percentageForce = this.force/other.force
                other.position.add(relative.copy().setMag(abs(dist*percentageForce)));
            }

  
            /*let thisToOtherNormal = relative.copy().normalize();
            let approachSpeed = this.vel.dot(thisToOtherNormal) + -other.vel.dot(thisToOtherNormal);
            let approachVector = thisToOtherNormal.copy().setMag(approachSpeed);
            this.vel.sub(approachVector);
            other.vel.add(approachVector);*/
        }
   }

   collideWalls() {
        if (this.position.x - this.radius <= 0){
            this.chargeDirection.x = abs(this.chargeDirection.x); 
            this.position.x = this.radius;
        }
        if (this.position.x + this.radius >= width){
            this.chargeDirection.x = abs(this.chargeDirection.x) * -1;
            this.position.x = width - this.radius;
        }
        if (this.position.y - this.radius <= 0){
            this.chargeDirection.y = abs(this.chargeDirection.y);
            this.position.y = this.radius;
        }
        if(this.position.y + this.radius >= height){
            this.chargeDirection.y = abs(this.chargeDirection.y) * -1;
            this.position.y = height - this.radius;
        }
   }

}

