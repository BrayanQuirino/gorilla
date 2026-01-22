export class PausedWindow{
    constructor(width, height, mode){
        this.img = loadImage('./utils/resources/paused.png'); 
        //this.img.resize(width,0);
        this.width = width;
        this.height =  height;
        this.mode = mode;
        this.maxAlpha = 255/2;
        this.color = color(`rgba(45, 107, 53, ${this.maxAlpha/255})`);

        this.x = 0;
        this. y = 0;

        //Fillup
        this.alpha = 0;

        //Slide up to down
        this.slideY = -height;
        this.slideSpeed = 25;

        //Bounce with gravity
        this.bounceY = -height;
        this.velocity = 0;
        this.gravity = 2.2;
        this.damping = 0.7;        // how much it bounces
        this.floorY = 0;
        
    }

    show(){
        push();
            noStroke();
            fill(this.color);

            switch(this.mode){
                case 'SLIDE':
                    rect(this.x,this.slideY,this.width,this.height);
                    image(this.img,this.x,this.slideY,this.width,this.height);
                    this.slideUpToDown();
                    break;
                case 'BOUNCE':
                    rect(this.x,this.bounceY,this.width,this.height);
                    image(this.img,this.x,this.bounceY,this.width,this.height);
                    this.bounce();
                    break;
                case 'FILLUP':
                    rect(this.x,this.y,this.width,this.height);
                    image(this.img,this.x,this.y,this.width,this.height);
                    this.fillup();
                    break;
            }

        pop();
    }

    fillup(){
      this.alpha += 3;
      if (this.alpha >= 180) {
        this.alpha = 180;
      }
      this.color = color(`rgba(45, 107, 53, ${this.alpha/255})`);
    }

    slideUpToDown(){
      this.slideY += this.slideSpeed;
      if (this.slideY >= 0) {
        this.slideY = 0;
      }
    }

    bounce(){
      this.velocity += this.gravity;
      this.bounceY += this.velocity;
      // Colisión con el "suelo"
      if (this.bounceY >= 0) {
        this.bounceY = 0;
        this.velocity *= -this.damping;

        // Detener cuando ya casi no se mueve
        if (abs(this.velocity) < 1) {
          this.velocity = 0;
          this.bounceY = 0;
        }
      }
    }

    restart(){

        this.color = color(`rgba(45, 107, 53, ${this.maxAlpha/255})`);

        this.x = 0;
        this. y = 0;

        //Fillup
        this.alpha = 0;

        //Slide up to down
        this.slideY = -height;
        this.slideSpeed = 25;

        //Bounce with gravity
        this.bounceY = -height;
        this.velocity = 0;      
    }
}