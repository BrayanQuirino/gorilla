import { Gorilla } from "./entities/Gorilla.js";
import { canvasW, canvasH, gorrilaAceleration } from "./config/constants.js";
import { createHumans } from "./utils/createHumans.js";
import { PausedWindow } from "./entities/PausedWindow.js";


let gorilla;
let humans = [];
let isPaused = false;
let pausedWindow;

window.setup = function () {
    createCanvas(canvasW, canvasH);
    //pausedWindow = new PausedWindow(canvasW, canvasH, 'SLIDE');
    //pausedWindow = new PausedWindow(canvasW, canvasH, 'BOUNCE');
    pausedWindow = new PausedWindow(canvasW, canvasH, 'FILLUP');



    gorilla = new Gorilla(width / 2, height / 2, "DonkyKong");
    humans = createHumans();
}

window.draw = function () {
    background(220);
    gorilla.show();

    humans.forEach((human, index) => {
        if(!isPaused){
            gorilla.applyDamageIfClose(human);
            human.moveToObjective(gorilla);
        }
        human.show();
    });

    if(!isPaused){
        gorilla.charge();
        pausedWindow.restart();
    }else{

        pausedWindow.show();
        gorilla.isPaused = isPaused;
        gorilla.counterTimeIsPaused();
    }
    
    //gorilla.position.set(mouseX, mouseY);
}

window.keyPressed = function (){
  // Check if the 'p' key (case-insensitive) was pressed
  if (key === 'p' || key === 'P') {
    isPaused = !isPaused; // Toggle the pause state
  }
}