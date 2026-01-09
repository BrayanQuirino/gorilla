const normalHumanSize = 1;
const normalHumanForce = 1;
const normalHumanSpeed = 1;
const normalHumanDamage = 1;
const pixelesSize = 10;

export class Human {
    constructor(x, y, isAlive) {
        // This code runs once when an instance is created.
        this.x = x;
        this.y = y;
        this.isAlive = isAlive;
        this.size = normalHumanSize * pixelesSize;
        this.mainColor = 'pink';
        this.force = normalHumanForce;
        this.position = createVector(this.x, this.y);
        this.speed = normalHumanSpeed;
        this.damage = normalHumanDamage;
        this.type = "NORMAL"
    }

    show() {
        if (this.isAlive) {
            stroke('black');
            fill(this.mainColor);
            circle(this.position.x, this.position.y, this.size);
        }
    }
}