import { limitar } from './rules.js';

export const ancho = 1000;
export const alto = 640;
const camara = { x: 75, y: 121, ancho: 850, alto: 460 };
const camaraClaro = { ...camara, x: 100, y: 86 };
export const encuadre = arena => arena === 'claro' ? camaraClaro : camara;

// Footprints follow the bases of the painted scenery, in canvas coordinates.
const bases = {
  claro: [[486, 296, 70, 22, 116], [766, 367, 88, 30, 88], [251, 403, 82, 28, 92], [125, 191, 49, 19, 78], [891, 192, 53, 29, 58], [531, 564, 81, 22, 70]],
  selva: [[517, 331, 74, 22, 74], [274, 408, 78, 22, 72], [714, 452, 74, 23, 78], [835, 280, 55, 19, 64], [105, 303, 81, 24, 58], [106, 527, 64, 25, 117], [451, 557, 87, 27, 74]],
  canon: [[471, 324, 112, 29, 72], [347, 311, 52, 20, 48], [455, 452, 69, 24, 49], [708, 427, 49, 22, 48], [567, 353, 45, 21, 42], [369, 558, 73, 20, 66], [60, 333, 75, 24, 57]],
  hangar: [[273, 299, 68, 23, 71], [539, 304, 61, 21, 60], [806, 332, 54, 22, 64], [379, 387, 67, 21, 63], [98, 389, 55, 22, 156], [523, 451, 52, 22, 59], [730, 478, 57, 23, 75]],
};
const obstaculos = Object.fromEntries(Object.entries(bases).map(([arena, lista]) => {
  const vista = encuadre(arena);
  return [arena, lista.map(([x, y, rx, ry, altura]) => ({
    altura,
    x: (x - vista.x) * ancho / vista.ancho,
    y: (y - vista.y) * alto / vista.alto,
    rx: rx * ancho / vista.ancho,
    ry: ry * alto / vista.alto,
  }))];
}));

// Human routes are constrained by ground-level cliffs and large rock masses.
// Rivers and bridges stay traversable. Gorilla height/climbing is unchanged.
// Painted west-side walkway, steps and riverbank on the wooded arenas.
// Bridge / stairs are walkable even when their supporting rocks overlap a
// broad mountain footprint. Coordinates are in the painted canvas space.
export function paso_construido(p, arena) {
  if(arena!=='claro'&&arena!=='selva')return false;
  const vista=encuadre(arena);
  const x=vista.x+p.x*vista.ancho/ancho,y=vista.y+p.y*vista.alto/alto;
  return arena==='claro'
    ? x>=108&&x<=280&&y>=401&&y<=542
    : x>=90&&x<=255&&y>=420&&y<=554;
}
export function obstaculo_humano(p, arena, margen=13) {
  if(paso_construido(p,arena))return false;
  return (obstaculos[arena]||[]).some(o =>
    ((p.x-o.x)/(o.rx+margen))**2+((p.y-o.y)/(o.ry+margen))**2 < 1);
}
export function ruta_humano(actor, destino, arena) {
  if(!destino)return destino;
  // New spawns and knockback positions may overlap a cliff's clearance margin.
  // Escape outward first instead of freezing against the collision boundary.
  for(const o of obstaculos[arena]||[]){
    const nx=(actor.x-o.x)/(o.rx+17),ny=(actor.y-o.y)/(o.ry+18);
    const d=Math.hypot(nx,ny);
    if(d<1 && !paso_construido(actor,arena)){
      const angle=d>0.001?Math.atan2(ny,nx):actor.id%2?0:Math.PI;
      return {x:limitar(o.x+Math.cos(angle)*(o.rx+29),14,ancho-14),
        y:limitar(o.y+Math.sin(angle)*(o.ry+32),22,alto-22)};
    }
  }
  const lista=(obstaculos[arena]||[]);
  // Check the entire segment: don't let actors go through rock in one frame.
  let bloque=null, tPrimero=2;
  for(const o of lista){
    const dx=destino.x-actor.x,dy=destino.y-actor.y;
    const rx=o.rx+17,ry=o.ry+18;
    const a=(dx/rx)**2+(dy/ry)**2;
    if(a<1e-8)continue;
    const ox=(actor.x-o.x)/rx,oy=(actor.y-o.y)/ry;
    const b=2*(ox*dx/rx+oy*dy/ry),c=ox*ox+oy*oy-1;
    const d=b*b-4*a*c;
    if(d<0)continue;
    const t=(-b-Math.sqrt(d))/(2*a);
    if(t>=0&&t<=1&&t<tPrimero){
      const interseccion={x:actor.x+dx*Math.min(1,t+.04),y:actor.y+dy*Math.min(1,t+.04)};
      if(paso_construido(interseccion,arena))continue;
      bloque=o;tPrimero=t;
    }
  }
  if(!bloque)return destino;
  // Go around the mountain on the shorter tangent side; stick to the same
  // side briefly to prevent oscillating between both flanks every frame.
  const o=bloque;
  const theta=Math.atan2((actor.y-o.y)/(o.ry+20),(actor.x-o.x)/(o.rx+20));
  const candidate=(side)=>{
    const angle=theta+side*.63;
    return {x:limitar(o.x+Math.cos(angle)*(o.rx+32),14,ancho-14),
      y:limitar(o.y+Math.sin(angle)*(o.ry+35),22,alto-22)};
  };
  let lado=actor.rodeo?.key===lista.indexOf(o)&&actor.rodeo?.restante>0
    ?actor.rodeo.lado
    :(Math.hypot(candidate(1).x-destino.x,candidate(1).y-destino.y)
      <Math.hypot(candidate(-1).x-destino.x,candidate(-1).y-destino.y)?1:-1);
  actor.rodeo={key:lista.indexOf(o),lado,restante:Math.max(0,(actor.rodeo?.restante||0)-.016)};
  return candidate(lado);
}
export function corregir_paso_humano(actor, antes, arena){
  if(paso_construido(actor,arena)||!obstaculo_humano(actor,arena,12))return;
  // Try sliding along the cliff rather than snapping through the mountain.
  const x={x:actor.x,y:antes.y},y={x:antes.x,y:actor.y};
  if(!obstaculo_humano(x,arena,12)){actor.y=antes.y;actor.vy=0;return;}
  if(!obstaculo_humano(y,arena,12)){actor.x=antes.x;actor.vx=0;return;}
  const enclosing=(obstaculos[arena]||[]).find(o=>
    ((antes.x-o.x)/(o.rx+12))**2+((antes.y-o.y)/(o.ry+12))**2<1);
  if(enclosing){
    const dist=p=>((p.x-enclosing.x)/(enclosing.rx+12))**2+
      ((p.y-enclosing.y)/(enclosing.ry+12))**2;
    if(dist(actor)>dist(antes))return;
  }
  actor.x=antes.x;actor.y=antes.y;actor.vx*=.3;actor.vy*=.3;
}
export function agua_humano(p,arena) {
  const vista=encuadre(arena);
  const x=vista.x+p.x*vista.ancho/ancho;
  const y=vista.y+p.y*vista.alto/alto;
  // Painted water at the left footbridge in the wooded scenes.
  if(arena==='claro'||arena==='selva')
    return x<215 && y>375 && y<560 && x < 208-(y-375)*.11;
  return false;
}
export function altura_humano(p,arena) {
  // Humans never climb the rock altitude map; water and riverbanks are level.
  return 0;
}

export function limitar_posicion(actor, arena, margen = 0) {
  for (const obstaculo of obstaculos[arena]) {
    const rx = obstaculo.rx + margen;
    const ry = obstaculo.ry + margen;
    const dx = (actor.x - obstaculo.x) / rx;
    const dy = (actor.y - obstaculo.y) / ry;
    const distancia = Math.hypot(dx, dy);
    if (distancia >= 1) continue;
    actor.x = obstaculo.x + (distancia ? dx / distancia * rx * 1.002 : 0);
    actor.y = obstaculo.y + (distancia ? dy / distancia * ry * 1.002 : ry * 1.002);
  }
  actor.x = limitar(actor.x, 10, ancho - 10);
  actor.y = limitar(actor.y, 10, alto - 10);
}

export function altura_terreno(actor, arena) {
  let altura = 0;
  for (const base of obstaculos[arena]) {
    const radio = Math.hypot((actor.x - base.x) / base.rx, (actor.y - base.y) / base.ry);
    altura = Math.max(altura, base.altura * limitar((1.08 - radio) / .80, 0, 1));
  }
  return altura;
}

export function actualizar_altura(actor, arena, dt) {
  const piso = altura_terreno(actor, arena);
  actor.altura ??= piso;
  actor.vz ??= 0;
  if (piso >= actor.altura) {
    actor.altura = piso;
    actor.vz = 0;
  } else {
    actor.vz -= 340 * dt;
    actor.altura = Math.max(piso, actor.altura + actor.vz * dt);
    if (actor.altura === piso) actor.vz = 0;
  }
}

export function zona_entrega(arena, azar) {
  // Open paths on each map, jittered so two deliveries need not share a tile.
  const zonas = {
    claro: [[370, 240], [552, 382], [667, 232], [418, 443]],
    selva: [[338, 238], [670, 241], [420, 430], [832, 375]],
    canon: [[353, 215], [580, 398], [730, 311], [254, 441]],
    hangar: [[382, 272], [662, 248], [572, 375], [637, 459]],
  };
  const [x, y] = zonas[arena][Math.min(3, Math.floor(azar() * 4))];
  const vista = encuadre(arena);
  const punto = { x: (x - vista.x) * ancho / vista.ancho + (azar() - .5) * 32,
    y: (y - vista.y) * alto / vista.alto + (azar() - .5) * 24 };
  limitar_posicion(punto, arena, 30);
  return punto;
}

export function tiene_cobertura(actor, observador, arena) {
  const dx = actor.x - observador.x;
  const dy = actor.y - observador.y;
  const desde = (observador.altura ?? altura_terreno(observador, arena)) + 26;
  const hasta = altura_terreno(actor, arena) + 13;
  return obstaculos[arena].some(base => {
    const vx = dx / base.rx;
    const vy = dy / base.ry;
    const largo = vx * vx + vy * vy;
    if (!largo) return false;
    const t = ((base.x - observador.x) / base.rx * vx + (base.y - observador.y) / base.ry * vy) / largo;
    if (t <= .03 || t >= .97) return false;
    const radio = Math.hypot((observador.x + dx * t - base.x) / base.rx,
      (observador.y + dy * t - base.y) / base.ry);
    const altura = base.altura * limitar((1.08 - radio) / .80, 0, 1);
    return altura > desde + (hasta - desde) * t;
  });
}

export function refugio(actor, observador, arena) {
  const opciones = obstaculos[arena].map(base => {
    const dx = (base.x - observador.x) / base.rx;
    const dy = (base.y - observador.y) / base.ry;
    const radio = Math.hypot(dx, dy) || 1;
    return {
      x: limitar(base.x + dx / radio * (base.rx + 30) + (actor.id % 5 - 2) * 10, 24, ancho - 24),
      y: limitar(base.y + dy / radio * (base.ry + 26) + (actor.id % 7 - 3) * 8, 26, alto - 26),
    };
  }).filter(punto => tiene_cobertura(punto, observador, arena));
  return opciones.sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) -
    Math.hypot(b.x - actor.x, b.y - actor.y))[0];
}

const separacion_x = 34;
const separacion_y = 39;
const direcciones = Array.from({ length: 16 }, (_, i) =>
  [Math.cos(i * Math.PI / 8), Math.sin(i * Math.PI / 8)]);

function superpuestos(a, b, margen = 1) {
  return Math.abs((a.altura ?? 0) - (b.altura ?? 0)) <= 22 &&
    ((a.x - b.x) / separacion_x) ** 2 + ((a.y - b.y) / separacion_y) ** 2 < margen ** 2;
}

export function separar_personajes(hombres, gorila, vueltas = 4) {
  const radio = gorila.radio + 8;
  for (let vuelta = 0; vuelta < vueltas; vuelta++) {
    let contactos = false;
    for (let i = 0; i < hombres.length; i++) {
      const a = hombres[i];
      const gx = a.x - gorila.x;
      const gy = a.y - gorila.y;
      const distancia_gorila = Math.hypot(gx, gy);
      if (distancia_gorila < radio && Math.abs((a.altura ?? 0) - (gorila.altura ?? 0)) < 22) {
        contactos = true;
        a.x = gorila.x + (distancia_gorila ? gx / distancia_gorila * radio : radio);
        a.y = gorila.y + (distancia_gorila ? gy / distancia_gorila * radio : 0);
      }
      for (let j = i + 1; j < hombres.length; j++) {
        const b = hombres[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (Math.abs(dx) >= separacion_x || Math.abs(dy) >= separacion_y || !superpuestos(a, b)) continue;
        contactos = true;
        const distancia = Math.hypot(dx / separacion_x, dy / separacion_y);
        const fuerza = distancia ? (1.01 - distancia) * .5 / distancia : 0;
        const x = distancia ? dx * fuerza : separacion_x / 2;
        const y = dy * fuerza;
        a.x -= x;
        a.y -= y;
        b.x += x;
        b.y += y;
      }
    }
    if (!contactos) break;
    for (const hombre of hombres) {
      hombre.x = limitar(hombre.x, 14, ancho - 14);
      hombre.y = limitar(hombre.y, 22, alto - 22);
    }
  }

  // A wall or a dense crowd can prevent pairwise pushes from clearing a body.
  // Try nearby slots when a character is still significantly inside another.
  const ubicados = [];
  for (const hombre of hombres) {
    if (ubicados.some(otro => superpuestos(hombre, otro, .88))) {
      reubicar(hombre, hombres, gorila, radio);
    }
    ubicados.push(hombre);
  }
}

function reubicar(hombre, hombres, gorila, radio) {
  const altura = hombre.altura;
  for (let anillo = 1; anillo <= 6; anillo++) {
    for (const [dx, dy] of direcciones) {
      const candidato = {
        x: hombre.x + dx * anillo * separacion_x * .42,
        y: hombre.y + dy * anillo * separacion_y * .42,
        altura,
      };
      if (candidato.x < 14 || candidato.x > ancho - 14 || candidato.y < 22 || candidato.y > alto - 22) continue;
      if (Math.abs((altura ?? 0) - (gorila.altura ?? 0)) < 22 &&
        Math.hypot(candidato.x - gorila.x, candidato.y - gorila.y) < radio) continue;
      if (hombres.some(otro => otro !== hombre && superpuestos(candidato, otro, .98))) continue;
      hombre.x = candidato.x;
      hombre.y = candidato.y;
      return;
    }
  }
}
