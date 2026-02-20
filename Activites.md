# gorilla

Listado de actividades y features programadas.
**Brandon B - Brayan Q**.

## TERMINADO:

1. Revisión jueves 15 de enero.
2. Banti organiza modulo de carpetas
3. Movimiento Craga Gorilla
4. Brayan agregar variable humanKillRange. Resolved
5. Error Human Elite dead Resolved.
6. Barra de vida Resolved
3. El gorrilla no sale de los bordes pero si la mitad **BRAYAN** <i>**DONE**</i></br>
7. Botón. de pausa - **BRAYAN** <i>**DONE**</i>  
7.1 Animacion despausa  **BRAYAN** **DONE**</br>7.2. Letras que palpiten para despausar ("Presiona P para continuar") **BRAYAN** <i>**DONE**</i></br>7.3. Despausa con clic en la imagen **BRAYAN** <i>**DONE**</i>
8. Activities.**txt** -> Activities.**md - BRAYAN** <i>**DONE**</i>

---

## PENDIENTE:

1. RESTRUCTURAR CREACION DE humanos - **BANTI**
2. IDENTIFICAR ACCIONES DE LOS humanos - **BANTI**
3. Tipo de movimiento humano NORMAL,  Variables brave, speed, agilidad, fatigue
4. Tipo de movimiento humano STRONG,  Variables brave, speed, agilidad, fatigue
5. Tipo de movimiento humano ELITE,  Variables brave, speed, agilidad, fatigue

---

## PROBLEMAS:


1. Los huamnos terminarán con una misma inclinación, es decir se unifican. Hay que darles más movimiento. No lineal. **BRAYAN** <i>**WORKING**</i></br>1.1 Los humanos se atoran en las lapidas
1.2 los humanos se suben en el gorilla.
2. Hay mas tipos de movimiento del Gorrilla

4. Los humanos se aplastan entre si. - **BRAYAN**
5. Revalorar fuerza del gorilla y humanos. 
6. Barra de vida en las cabeceras (¿como virus?) **BRAYAN**




---

## FISICAS DEL JUEGO:


1) Valentía

    Normales: 15–30 de 100 tienen valentía = 1, el resto 0.1–0.5

    Si < 0.2 → se raja.

    Fuertes: valentía mínima >= 0.2

    Elite: valentía > 0.5

2) Inteligencia + Agresividad

    Normales y Fuertes: probabilidad 1/100 de tener inteligencia = 1

    Si no: inteligencia 0.1–0.6

    agresividad 0.6–1

    Elite: inteligencia 0.5–0.8

    agresividad 0.1–0.6

3) Agilidad

    Normales y Fuertes: 30–50 de 100 tienen agilidad = 0.7, el resto 0.1–0.5

    Elite: agilidad = 1




## NOTAS:

---


El gorila no elige conscientemente. Ataca:

Al humano más cercano

O al que invade más su espacio

O al que se mueve o grita

No distingue fuerza, tamaño ni número.

Tipo de acciones

Empujones violentos

Golpes descendentes

Agarre y sacudida

Mordida solo si hay contacto cercano prolongado

Incluso en ataques documentados:

El gorila golpea

Genera espacio

Se retira inmediatamente

Cargas en diagonal de 3 - 8 metros. Extremos 10 - 12 metros. cambios bruscos de direccion al final.


| Acción del gorila                   | Descripción biomecánica       | Valor relativo de fuerza |
| ----------------------------------- | ----------------------------- | ------------------------ |
| Empujón con ambos brazos            | Uso de masa corporal completa | **10 – 15**              |
| Golpe descendente con brazo         | Movimiento tipo martillo      | **12 – 18**              |
| Golpe lateral (barrido)             | Rotación de torso + brazo     | **15 – 20**              |
| Agarre + sacudida                   | Fuerza de prensión + tracción | **18 – 25**              |
| Lanzamiento corto (empujar/arrojar) | Palanca + peso corporal       | **20 – 30**              |
| Mordida defensiva                   | Mandíbula + cuello            | **8 – 12**               |
| Golpe al suelo/pecho (intimidación) | No dirigido a dañar           | **5 – 8**                |
| Carga corporal (sin golpe directo)  | Inercia + masa                | **15 – 22**              |


Humano entrenado (boxeador): 2 – 3

Humano muy fuerte (levantador): 3 – 4








class Ball {
  constructor(pos, vel, radius, color) {
    this.pos = pos;
    this.vel = vel;
    this.radius = radius;
    this.color = color;
  }
  collide(other) {
    if (other == this) {
      return;
    }
    let relative = p5.Vector.sub(other.pos, this.pos);
    let dist = relative.mag() - (this.radius + other.radius);
    if (dist < 0) {
      let movement = relative.copy().setMag(abs(dist/2));
      this.pos.sub(movement);
      other.pos.add(movement);
      
      let thisToOtherNormal = relative.copy().normalize();
      let approachSpeed = this.vel.dot(thisToOtherNormal) + -other.vel.dot(thisToOtherNormal);
      let approachVector = thisToOtherNormal.copy().setMag(approachSpeed);
      this.vel.sub(approachVector);
      other.vel.add(approachVector);
    }
  }
  move() {
    this.vel.y += 0.1;
    this.pos.add(this.vel);
    if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
      this.vel.x = -this.vel.x;
    }
    if (this.pos.x > width-this.radius) {
      this.pos.x = width-this.radius;
      this.vel.x = -this.vel.x;
    }
    if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      this.vel.y = -this.vel.y;
    }
    if (this.pos.y > height-this.radius) {
      this.pos.y = height-this.radius;
      this.vel.y = -this.vel.y;
    }
  }
  render() {
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.radius*2);
  }
}

let balls = [];

function setup() {
  createCanvas(400, 400);
  for (i = 0; i < 5; i++) {
    balls.push(new Ball(
      createVector(random(width),random(height)),
      p5.Vector.random2D().mult(random(10)),
      30,
      color(random(255),random(255),random(255))
    ));
  }
}

function draw() {
  background(255);
  
  for(let i = 0; i < balls.length; i++) {
    for(let j = 0; j < i; j++) {
      balls[i].collide(balls[j]);
    }
  }
  
  for(let i = 0; i < balls.length; i++) {
    balls[i].move();
    balls[i].render();
  }
}