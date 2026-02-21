export class LiveBar {
    constructor(text, maxDamageSupported, x,y,width,height = 25){
        this.text = text
        this.textColor = 255;
        this.maxDamageSupported = maxDamageSupported;
        this.damage = 0;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y=y;
        this.position = createVector(this.x, this.y)
    }

    showLife() {

        let percentageLife = 1 - (this.damage / this.maxDamageSupported);

        let r = lerp(255, 0, percentageLife); 
        let g = lerp(0, 255, percentageLife);
        
        
        fill(100, 100, 100, 150);
        rect(this.position.x, this.position.y, this.width,this.height,4);
        
        fill(r, g, 0);

        let newLifeWidth = this.width * percentageLife;
        let newPercentageLifeX = (this.position.x + (this.width)) - newLifeWidth;

        rect(newPercentageLifeX, this.position.y, newLifeWidth, this.height,4);

        push();
            textAlign(CENTER, CENTER);
            //textFont(this.font);
            textSize(9);
            noStroke()
            fill(0);
            text(`${this.text}: ${this.maxDamageSupported- this.damage}`, this.position.x + this.width/2 ,this.position.y + this.height/2);
        pop();
    }
}