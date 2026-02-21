import { Gorilla } from "./entities/Gorilla.js";
import { canvasW, canvasH, gorrilaAceleration } from "./config/constants.js";
import { createHumans } from "./utils/createHumans.js";
import { PausedWindow } from "./entities/PausedWindow.js";
import { LiveBar } from "./entities/liveBars.js";


let gorilla;
let pausedWindow;
let restartWindow;
let retroFont;
let liveBars = [];
let humansTeam;

window.preload = function (){
  retroFont = loadFont('utils/resources/fonts/PressStart2P-Regular.ttf');
  
}

window.setup = function () {
    createCanvas(canvasW, canvasH);

    /** MODO DE PAUSA 3 POSIBLES: DE ARRIBA ABAJO, REBOTE Y DESVANECIDO: SLIDE, BOUNCE, FILLUP */
    pausedWindow = new PausedWindow(canvasW, canvasH, 'BOUNCE', retroFont, "paused", "Presiona [P] para continuar");
    restartWindow = new PausedWindow(canvasW, canvasH, 'BOUNCE', retroFont, "restart", "Presiona [R] para iniciar");


    /**
     * SE CREA EL GORILLA Y HUMANOS
     */
    gorilla = new Gorilla(width / 2, height / 2, "DonkyKong");
    humansTeam = {...createHumans()};
    createLiveBars(4);
}

window.draw = function () {
    background(220);

    /**
     * MOSTRAR GORILLA Y HUMANOS
     */
    
    if(humansTeam.totalHumans == 0){
      restartWindow.isPaused = true;
    } 

    humansTeam.graves.forEach(grave => {
      grave.show();
    });

    humansTeam.humans.forEach((human, index) => {
        for(let i=0; i<humansTeam.humans.length;i++){
            if(human.isAlive){
                human.collide(humansTeam.humans[i]);
                human.collide(gorilla);
            }
        }
        if(!pausedWindow.isPaused){
          if(human.isAlive){
            gorilla.applyDamageIfClose(human);
            human.moveToObjective(gorilla);
            if(!human.isAlive){
              if(human.type == 'NORMAL'){
                humansTeam.normalHumans--;
                liveBars[1].damage ++;
              }
              if(human.type == 'STRONG'){
                humansTeam.strongHumans--;
                liveBars[2].damage ++;
              }
              if(human.type == 'ELITE'){
                humansTeam.eliteHumans--;
                liveBars[3].damage ++;
              }
              humansTeam.graves.push(human.grave);
              humansTeam.humans.splice(index,1);
              humansTeam.totalHumans --;
            }
          }
        }
        human.show();
    });

    gorilla.show();

    liveBars.forEach(bar => {
      bar.showLife();
    });

    /**
     * SI EL JUEGO SE PAUSA, PAUSAR CONTEOS Y MOVIMIENTOS
     */
    if(!pausedWindow.isPaused){
        gorilla.charge();
    }else{
        gorilla.isPaused = true;
        gorilla.counterTimeIsPaused();
    }

    /**
     * LA PAUSA SIEMPRE SE REVISA, QUEDA AFUERA PARA AYUDAR CON LA LOGICA DE ANIMACIÓN 
     */

    pausedWindow.show();
    restartWindow.show();
}

window.keyPressed = function (){
  if (key === 'p' || key === 'P') {
    pausedWindow.isPaused = !pausedWindow.isPaused; 
  }
  if (key === 'r' || key === 'R') {
    window.location.reload();
  }
}

window.mousePressed = function() {
  // Detectar si el clic está dentro del área de la imagen
  if (
    mouseX > pausedWindow.x &&
    mouseX < pausedWindow.x + pausedWindow.width &&
    mouseY > pausedWindow.y &&
    mouseY < pausedWindow.y + pausedWindow.height
  ) {
    pausedWindow.isPaused = !pausedWindow.isPaused; 
  }
}

function createLiveBars(numberOfBars){
    let barWidth = ((canvasW - 40)/numberOfBars) ;

    liveBars[0] = new LiveBar("Gorrilla damage", gorilla.maxDamageSupported, 10, 10, barWidth);
    liveBars[1] = new LiveBar("Normal Humans", humansTeam.normalHumans, 15 + barWidth, 10, barWidth);
    liveBars[2] = new LiveBar("Strong Humans", humansTeam.strongHumans, 20 + barWidth*2, 10, barWidth);
    liveBars[3] = new LiveBar("Elite Humans", humansTeam.eliteHumans, 25 + barWidth *3, 10, barWidth);
}