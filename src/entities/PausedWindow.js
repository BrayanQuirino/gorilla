

export class PausedWindow{
    constructor(width, height, mode, font,imageName, text){
        this.img = loadImage(`./utils/resources/images/${imageName}.png`); 
        this.isPaused = false;
        this.firstAnimationComplete = false;
        this.text = text
        this.textSize = 10;
        this.textColor = 255;
        this.font = font;
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
                  this.y = this.slideY
                  this.slideUpToDown();
                  break;
              case 'BOUNCE':
                  this.y = this.bounceY;
                  this.bounce();
                  break;
              case 'FILLUP':
                  
                  this.fillup();
                  break;
          }
      pop();
    }

    slideUpToDown(){

      if((this.isPaused && !this.firstAnimationComplete) || (this.isPaused && this.firstAnimationComplete)){
        rect(this.x,this.slideY,this.width,this.height);
        image(this.img,this.x,this.slideY,this.width,this.height);
        this.showText(this.slideY + this.height/2);
        if (this.slideY >= 0) {
          this.slideY = 0;
          this.firstAnimationComplete = true;
        }else{
          this.slideY += this.slideSpeed;
        }
      }
      
      if((!this.isPaused && this.firstAnimationComplete) || (!this.isPaused && !this.firstAnimationComplete)){
        if (this.slideY < -this.height) {
          this.slideY = -this.height;
          this.firstAnimationComplete = false;
        }else{
          rect(this.x,this.slideY,this.width,this.height);
          image(this.img,this.x,this.slideY,this.width,this.height);
          this.slideY -= this.slideSpeed;
        }
      }
      
    }

    bounce(){
      if((this.isPaused && !this.firstAnimationComplete) || (this.isPaused && this.firstAnimationComplete)){

        rect(this.x,this.bounceY,this.width,this.height);
        image(this.img,this.x,this.bounceY,this.width,this.height);
        this.showText(this.bounceY + this.height/2);

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
            this.firstAnimationComplete = true;
          }
        }
      }
      //Si se despauso y termino la animacion uno O si se esta en pausa pero no se termino la primer animacion
      if((!this.isPaused && this.firstAnimationComplete) || (!this.isPaused && !this.firstAnimationComplete)){
        if (this.bounceY <= -this.height) {
          this.bounceY = -this.height;
          this.firstAnimationComplete = false;
        }else{
          rect(this.x,this.bounceY,this.width,this.height);
          image(this.img,this.x,this.bounceY,this.width,this.height);
          this.bounceY -= this.slideSpeed;
        }
      }
    }

    fillup(){

      
      if((this.isPaused && !this.firstAnimationComplete) || (this.isPaused && this.firstAnimationComplete)){
        rect(this.x,this.y,this.width,this.height);
        tint(255,this.alpha*2);
        image(this.img,this.x,this.y,this.width,this.height);
        this.showText(this.height/2);
        if (this.alpha >= 180) {
          this.alpha = 180;
        }else{
          this.alpha += 3;
          this.color = color(`rgba(45, 107, 53, ${this.alpha/255})`);
        }
      }
      if((!this.isPaused && this.firstAnimationComplete) || (!this.isPaused && !this.firstAnimationComplete)){
        if (this.alpha <= 0) {
          this.alpha = 0;
        }else{
          this.alpha -= 3;
          rect(this.x,this.y,this.width,this.height);
          tint(255,this.alpha*2);
          image(this.img,this.x,this.y,this.width,this.height);
          this.color = color(`rgba(45, 107, 53, ${this.alpha/255})`);
        }
      }
    }

    showText(y){
      let pulse = sin(frameCount * 0.05);
      let size = this.textSize + pulse * (this.textSize * 0.08);
      push();
        textAlign(CENTER, CENTER);
        textFont(this.font);
        textSize(size);
        stroke(this.textColor);
        fill(this.textColor);
        text(this.text, this.width/2, y + this.height/4);
      pop();
    }
    
}