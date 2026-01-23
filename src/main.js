import { Gorilla } from "./entities/Gorilla.js";
import { canvasW, canvasH, gorrilaAceleration } from "./config/constants.js";
import { createHumans } from "./utils/createHumans.js";
import { PausedWindow } from "./entities/PausedWindow.js";


let gorilla;
let humans = [];
let pausedWindow;
let retroFont;

window.preload = function (){
  retroFont = loadFont('utils/resources/fonts/PressStart2P-Regular.ttf');
}

window.setup = function () {
    createCanvas(canvasW, canvasH);

    /** MODO DE PAUSA 3 POSIBLES: DE ARRIBA ABAJO, REBOTE Y DESVANECIDO: SLIDE, BOUNCE, FILLUP */
    pausedWindow = new PausedWindow(canvasW, canvasH, 'BOUNCE', retroFont);

    /**
     * SE CREA EL GORILLA Y HUMANOS
     */
    gorilla = new Gorilla(width / 2, height / 2, "DonkyKong");
    humans = createHumans();
}

window.draw = function () {
    background(220);

    /**
     * MOSTRAR GORILLA Y HUMANOS
     */
    gorilla.show();
    humans.forEach((human, index) => {
        if(!pausedWindow.isPaused){
            gorilla.applyDamageIfClose(human);
            human.moveToObjective(gorilla);
        }
        human.show();
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
}

window.keyPressed = function (){
  if (key === 'p' || key === 'P') {
    pausedWindow.isPaused = !pausedWindow.isPaused; 
  }
}