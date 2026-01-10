import { Gorilla } from "./entities/Gorilla.js";
import { canvasW, canvasH } from "./config/constants.js";
import { createHumans } from "./utils/createHumans.js";


let gorilla;
let humans = [];

window.setup = function () {
    createCanvas(canvasW, canvasH);
    gorilla = new Gorilla(width / 2, height / 2);
    humans = createHumans();

    console.log(gorilla.maxDist, gorilla.maxDist/3*2)

}

window.draw = function () {
    background(220);
    gorilla.show();
    humans.forEach((human, index) => {
        gorilla.applyDamageIfClose(human);
        if (human.isAlive) {
            human.show();
            human.moveToObjective(gorilla);
        } else {
            human.drawGrave();
        }
    });

    gorilla.charge();
   
    //gorilla.position.set(mouseX, mouseY);

}