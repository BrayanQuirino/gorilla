export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomPosition(x, y, minDist, maxDist) {

    let angle = random(TWO_PI);
    let distance = random(minDist, maxDist);
    let newX = x + cos(angle) * distance;
    let newY = y + sin(angle) * distance;

    return { x: newX, y: newY };
}