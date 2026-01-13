import { Gorilla } from "./entities/Gorilla.js";
import { canvasW, canvasH } from "./config/constants.js";
import { createHumans } from "./utils/createHumans.js";


let gorilla;
let humans = [];

window.setup = function () {
    createCanvas(canvasW, canvasH);
    gorilla = new Gorilla(width / 2, height / 2, "DonkyKong");
    humans = createHumans();
}

window.draw = function () {
    background(220);
    gorilla.show();
    gorilla.showLife();
    humans.forEach((human, index) => {
        gorilla.applyDamageIfClose(human);
        if (human.isAlive) {
            human.show();
            human.showLife();
            human.moveToObjective(gorilla);
        } else {
            human.drawGrave();
        }
    });

    gorilla.charge();
   
    //gorilla.position.set(mouseX, mouseY);

}