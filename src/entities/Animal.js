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

        //VARIABLES DE CARACTERISTICAS FISICAS

        //VARIABLES DE ATRIBUTOS

        //VARIABLES IDENTIFICADORAS
        this.name = name;

    }

    showLife() {

        let percentageLife = this.damage / this.maxDamageSupported;

        let r = lerp(255, 0, percentageLife); 
        let g = lerp(0, 255, percentageLife);
        
        
        fill(60, 60, 60, 150);
        rect(this.position.x - this.size/2, this.position.y + this.size*0.6, this.size, this.size*.3,4);
        
        fill(r, g, 0);

        let newLifeSize = this.size * percentageLife;
        let newPercentageLifeX = (this.position.x + (this.size/2)) - newLifeSize;

        rect(newPercentageLifeX, this.position.y + this.size*0.6, newLifeSize, this.size*0.3, 4);
    }

}

