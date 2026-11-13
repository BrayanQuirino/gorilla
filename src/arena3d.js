// A fixed oblique camera projects the battle plane into the painted arenas.
// Painted silhouettes supply per-pixel occlusion for upright actor billboards.
import { ancho, alto, encuadre } from './terreno.js';
import { duracion_entrega, paracaidas_visible, radio_ataque, en_furia } from './battle.js';
import { limitar } from './rules.js';
import fotogramas from './art/sprites.json';

const archivos = import.meta.glob('./art/*.{webp,png}', {
  eager: true, query: '?url', import: 'default',
});
const imagenes = new Map();
const lados = [0, 1, 2, 0, 2, 3];
const poses = {
  paso: ['paso1', 'paso2', 'paso3', 'paso4'],
  embestida: ['carga1', 'carga2', 'carga3', 'carga4'],
  barrido: ['barrido1', 'barrido2', 'barrido3', 'barrido4'],
  golpe_area: ['golpe1', 'golpe2', 'golpe3'],
  rugido: ['rugido1', 'rugido2', 'rugido3'],
};
const retratos = {
  Entrenador: 'deportista', Campista: 'cazador', Estudiante: 'estudiante',
  Boxeador: 'boxeador', Científico: 'cientifico', Acróbata: 'artista',
  Oficinista: 'oficinista', Aficionado: 'conductor', Turista: 'ingeniero',
  Repartidor: 'guardia', Musculoso: 'tarzan', Adolescente: 'adolescente',
  Paramédico: 'paramedico', Velocista: 'deportista', Atleta: 'deportista',
  Beisbolista: 'estudiante', Malabarista: 'artista', Corredor: 'deportista',
  Anciano: 'anciano', Tarzán: 'tarzan',
};

function cargarImagen(nombre) {
  if (!imagenes.has(nombre)) {
    const imagen = new Image();
    const carga = new Promise((resolve, reject) => {
      imagen.onload = () => resolve(imagen);
      imagen.onerror = () => reject(new Error(`No se pudo cargar ${nombre}`));
      imagen.src = archivos[`./art/${nombre}`];
    }).catch(error => {
      imagenes.delete(nombre);
      throw error;
    });
    imagenes.set(nombre, carga);
  }
  return imagenes.get(nombre);
}

function programa(gl, vertice, fragmento) {
  const resultado = gl.createProgram();
  for (const [tipo, codigo] of [[gl.VERTEX_SHADER, vertice], [gl.FRAGMENT_SHADER, fragmento]]) {
    const shader = gl.createShader(tipo);
    gl.shaderSource(shader, codigo);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      gl.deleteProgram(resultado);
      throw new Error(error);
    }
    gl.attachShader(resultado, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(resultado);
  if (!gl.getProgramParameter(resultado, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(resultado);
    gl.deleteProgram(resultado);
    throw new Error(error);
  }
  return resultado;
}

function textura(gl, imagen) {
  const resultado = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, resultado);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagen);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return resultado;
}

const fondoVertice = `
  attribute vec2 posicion;
  varying vec2 pantalla;
  void main() {
    pantalla = vec2(posicion.x, -posicion.y) * .5 + .5;
    gl_Position = vec4(posicion, 0.0, 1.0);
  }`;
const fondoFragmento = `
  precision mediump float;
  uniform sampler2D arte;
  varying vec2 pantalla;
  void main() {
    vec3 color = texture2D(arte, pantalla).rgb;
    float borde = smoothstep(.25, .71, length((pantalla - .5) * vec2(.92, 1.0)));
    gl_FragColor = vec4(color * (1.0 - borde * .26), 1.0);
  }`;
const spriteVertice = `
  attribute vec3 posicion;
  attribute vec2 uv;
  attribute vec4 color;
  varying vec2 texel, pantalla;
  varying vec4 tono;
  varying float pie;
  void main() {
    pantalla = posicion.xy / vec2(${ancho}.0, ${alto}.0);
    texel = uv;
    tono = color;
    pie = posicion.z / ${alto}.0;
    gl_Position = vec4(pantalla.x * 2.0 - 1.0, 1.0 - pantalla.y * 2.0, 0.0, 1.0);
  }`;
const spriteFragmento = `
  precision mediump float;
  uniform sampler2D atlas, profundidad;
  varying vec2 texel, pantalla;
  varying vec4 tono;
  varying float pie;
  void main() {
    float frente = texture2D(profundidad, pantalla).r;
    float suelo = pie < 0.0 ? pantalla.y : pie;
    vec4 tinta = texture2D(atlas, texel);
    float valiente = step(1.5, abs(tono.a)) * (1.0 - step(2.5,abs(tono.a)));
    float opacidad = abs(tono.a) - valiente;
    if ((frente > suelo + .009 && abs(tono.a) < 2.5) || valiente > .0) {
      if (tono.a >= 0.0) discard;
      float pixel = 1.0 / 512.0;
      float interior = min(min(texture2D(atlas, texel + vec2(pixel, 0.0)).a,
        texture2D(atlas, texel - vec2(pixel, 0.0)).a),
        min(texture2D(atlas, texel + vec2(0.0, pixel)).a,
        texture2D(atlas, texel - vec2(0.0, pixel)).a));
      vec3 contraste = mix(vec3(.19, .17, .15), tinta.rgb * .78 + .035, interior);
      vec3 base = frente > suelo + .009 ? contraste : tinta.rgb * tono.rgb;
      gl_FragColor = vec4(mix(base, vec3(1.0, .85, .49), valiente * (1.0 - interior) * .44), tinta.a * opacidad);
      return;
    }
    gl_FragColor = tinta * vec4(tono.rgb, opacidad);
  }`;

function proyectar({ x, y }, vista) {
  return { x: vista.x + x * vista.ancho / ancho, y: vista.y + y * vista.alto / alto };
}

function lote() {
  const componentes = 9;
  let datos = new Float32Array(2048 * componentes);
  let indice = 0;
  function quad(x, y, anchoSprite, altoSprite, profundidad, region, color, giro = 0, espejo = false) {
    const [u, v, w, h] = region;
    const seno = Math.sin(giro);
    const coseno = Math.cos(giro);
    if (indice + 6 * componentes > datos.length) {
      const nuevo = new Float32Array(datos.length * 2);
      nuevo.set(datos);
      datos = nuevo;
    }
    for (const esquina of lados) {
      const derecha = esquina === 1 || esquina === 2;
      const abajo = esquina >= 2;
      const dx = anchoSprite * (derecha ? .5 : -.5);
      const dy = altoSprite * (abajo ? 0 : -1);
      datos[indice++] = x + dx * coseno - dy * seno;
      datos[indice++] = y + dx * seno + dy * coseno;
      datos[indice++] = profundidad;
      datos[indice++] = (u + (derecha !== espejo ? w - .12 : .12)) / 512;
      datos[indice++] = (v + (abajo ? h - .12 : .12)) / 512;
      for (const canal of color) datos[indice++] = canal;
    }
  }
  return {
    quad,
    vaciar() { indice = 0; },
    datos() { return datos.subarray(0, indice); },
    cantidad() { return indice / componentes; },
  };
}

const blanco = [1, 1, 1, 1];
const herido = [1, .66, .59, 1];
const oro = [1, .81, .41, .91];

function sprite(quads, nombre, x, y, escala, pie, tono = blanco, giro = 0, espejo = false) {
  const region = fotogramas[nombre];
  quads.quad(x, y, region[2] * escala, region[3] * escala, pie, region, tono, giro, espejo);
}

function rectangulo(quads, x, y, w, h, pie, color, giro = 0) {
  quads.quad(x, y + h / 2, w, h, pie, fotogramas.pixel, color, giro);
}

function aro(quads, x, y, rx, ry, pie, color, tiempo, pasos = 26) {
  for (let i = 0; i < pasos; i++) {
    const a = (i + .5) * Math.PI * 2 / pasos + tiempo;
    const largo = Math.hypot(Math.sin(a) * rx, Math.cos(a) * ry) * 3.9 / pasos;
    rectangulo(quads, x + Math.cos(a) * rx, y + Math.sin(a) * ry, largo, 2, pie, color,
      Math.atan2(Math.cos(a) * ry, -Math.sin(a) * rx));
  }
}

function poseGorila(g, tiempo) {
  if (g.descansando || g.vida <= 0) return 'descanso';
  if (g.fase === 'agarre') return g.reloj > .7 ? 'agarre' : 'alzar';
  if (g.accion === 'agarre' && g.fase === 'recuperacion' && g.reloj > .82) return 'soltar';
  if (g.fase === 'embestida') return poses.embestida[Math.floor(tiempo * 7) % 4];
  if (g.movimiento > 5) return poses.paso[Math.floor(tiempo * 5) % 4];
  if (g.fase === 'aviso' || g.fase === 'recuperacion') {
    const secuencia = poses[g.accion] ?? poses.barrido;
    if (g.fase === 'recuperacion') {
      const reposo = g.accion === 'golpe_area' ? .46 : en_furia(g) ? .65 : 1.15;
      if (g.reloj > reposo - .25 && g.reloj <= reposo) return secuencia.at(-1);
      return en_furia(g) ? 'furia' : 'reposo';
    }
    if (g.accion === 'golpe_area') return secuencia[g.reloj > .17 ? 0 : 1];
    return secuencia[Math.max(0, Math.min(secuencia.length - 2, Math.floor((1.3 - g.reloj) * 2)))];
  }
  if (en_furia(g)) return 'furia';
  if (g.vida < g.vida_maxima * .35) return 'herido';
  return 'reposo';
}

function dibujarHumano(quads, h, x, y, tiempo, g, mirando) {
  // Eliminated humans remain visible as fallen bodies.
  const caido = h.estado === 'incapacitado' || h.estado === 'eliminado' || h.vida <= 0;
  const moviendo = Math.abs(h.vx) + Math.abs(h.vy) > 10;
  if (Math.abs(h.vx) > 7) mirando.set(h.id, h.vx < 0);
  const paso = moviendo ? Math.sin(tiempo * 11 + h.id * .7) : 0;
  const golpe = Math.max(0, (h.atacando_hasta ?? 0) - tiempo);
  const tono = h.estado === 'herido' ? herido : blanco;
  const escala = h.edad >= 75 ? .92 : 1;
  sprite(quads, 'sombra', x, y + 4, caido ? .51 : .77, y);
  const retrato = retratos[h.arquetipo] ?? 'estudiante';
  const altura = h.altura || 0;
  const vuelo = h.vuelo ? (tiempo - h.vuelo.inicio) / h.vuelo.duracion : 0;
  const sujeto = g.fase === 'agarre' && g.sujeto === h;
  const izquierda = mirando.get(h.id) ?? g.x < h.x;
  const avance = golpe > 0 ? Math.sin(golpe / .38 * Math.PI) * (g.x < h.x ? -4 : 4) : 0;
  sprite(quads, caido && !h.vuelo ? 'caido' : retrato, x + avance, y - altura - Math.abs(paso) * 2,
    escala, y + altura * .35, [tono[0], tono[1], tono[2], -(tono[3] + Number(!caido && h.valentia > 70))],
    h.vuelo ? vuelo * Math.PI * 2 : sujeto ? 1.05 : h.defensa > 0 ? -.16 : paso * .085,
    izquierda);
  if (!h.objeto || caido) return;
  const objeto = h.objeto.tipo === 'fuego' ? 'arma_fuego' :
    h.objeto.peso_g > 1200 ? 'arma_larga' : 'objeto_mano';
  const [, , ancho_retrato, alto_retrato] = fotogramas[retrato];
  const mano = (izquierda ? -1 : 1) * ancho_retrato * .39 * escala;
  sprite(quads, objeto, x + avance + mano, y - altura - alto_retrato * .32 * escala - Math.abs(paso) * 2,
    escala, y + altura * .35, [1, 1, 1, -1], h.vuelo ? vuelo * Math.PI * 2 : 0, izquierda);
}

function dibujarGorila(quads, g, x, y, tiempo, espejo) {
  const escala = limitar(g.radio / 27, .92, 1.22) * .97;
  const pose = poseGorila(g, tiempo);
  sprite(quads, 'sombra', x, y + 15, escala * 2.75, y);
  const region = fotogramas[pose];
  const altura = g.altura || 0;
  if (en_furia(g)) {
    for (let i = 0; i < 11; i++) {
      const fase = (tiempo * (1.3 + i % 3 * .25) + i * .37) % 1;
      const dx = ((i * 23 % 41) - 20) * escala + Math.sin(fase * 5 + i) * 6;
      const py = y - altura - 9 - fase * 56 * escala;
      const fuego = [1, .25 + .55 * (1 - fase), .10, -(1 - fase) * .74];
      rectangulo(quads, x + dx, py, 3 + (1 - fase) * 4, 4 + (1 - fase) * 5, y, fuego, fase * .7);
    }
  }
  quads.quad(x, y - altura, region[2] * escala, region[3] * escala, y + altura * .35, region, [1, 1, 1, -3], 0, espejo);

}

function cuadro(quads, batalla, mirando) {
  const g = batalla.gorila;
  const tiempo = batalla.transcurrido;
  const vista = encuadre(batalla.arena);
  if ((g.fase === 'aviso' || g.fase === 'embestida') && g.destino) {
    const destino = proyectar(g.destino, vista);
    const rugido = g.accion === 'rugido';
    const radio = radio_ataque(g);
    aro(quads, destino.x, destino.y, radio * vista.ancho / ancho, radio * vista.alto / alto,
      -1, rugido ? oro : [1, .39, .21, .95], tiempo * 1.1);
  }
  const actores = [
    ...batalla.armas_suelo.filter(objeto => !objeto.recogido_por && (objeto.reserva ? objeto.descubierto : objeto.visible)),
    ...batalla.suministros,
    ...batalla.hombres,
    g,
  ].sort((a, b) => a.y - b.y);
  for (const actor of actores) {
    const { x, y } = proyectar(actor, vista);
    if (actor === g) {
      const avance = (g.destino?.x ?? ancho / 2) - g.x;
      if (Math.abs(avance) > 4) mirando.set(g, avance < 0);
      dibujarGorila(quads, g, x, y, tiempo, g.mira_izquierda ?? mirando.get(g) ?? true);
    } else if (actor.arquetipo) {
      dibujarHumano(quads, actor, x, y, tiempo, g, mirando);
    } else if (actor.tipo === 'barricada') {
      for (let i = -2; i <= 2; i++) sprite(quads, 'caja', x + i * 11, y, 1.2, y, [1, .81, .41, -.91]);
    } else {
      sprite(quads, 'caja', x, y, actor.tipo==='paquete' ? 1.45 : .82, y, actor.tipo ? [1, .81, .41, -.91] : [1, 1, 1, -1]);
    }
  }
  for(const p of batalla.proyectiles||[]) {
    const {x,y}=proyectar(p,vista);
    const tipo=p.objeto?.tipo==='fuego'?'arma_fuego':'objeto_mano';
    sprite(quads,'sombra',x,y+5,.55,y);
    sprite(quads,tipo,x,y-(p.altura||0),.95,y,[1,1,1,-3],p.transcurrido*8);
  }
  for (const entrega of batalla.entregas) {
    const { x, y } = proyectar(entrega, vista);
    const t = limitar((tiempo - entrega.inicio) / duracion_entrega, 0, 1);
    aro(quads, x, y, 22, 10, -1, oro, 0, 14);
    sprite(quads, 'sombra', x, y + 4, 1.35, y);
    sprite(quads, 'paracaidas', x + Math.sin(t * 8) * (1 - t) * 23,
      y * t - 15 * (1 - t), 1, y, [1, 1, 1, -1]);
  }
  for (const entrega of batalla.parpadeos) {
    if (!paracaidas_visible(tiempo, entrega.aterrizaje)) continue;
    const { x, y } = proyectar(entrega, vista);
    sprite(quads, 'tela_paracaidas', x, y - 12, 1, y, [1, 1, 1, -1]);
  }
}

export function crear_dibujante_3d(canvas, actualizar, fallo) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) throw new Error('WebGL no disponible');

  const fondo = programa(gl, fondoVertice, fondoFragmento);
  const actores = programa(gl, spriteVertice, spriteFragmento);
  const base = gl.createBuffer();
  const dinamico = gl.createBuffer();
  const quads = lote();
  const mirando = new Map();
  const escenas = new Map();
  let atlas;
  let destruido = false;
  let partida;
  const contextoPerdido = event => {
    event.preventDefault();
    fallo(new Error('Se perdió el contexto WebGL'));
  };
  canvas.addEventListener('webglcontextlost', contextoPerdido);
  gl.bindBuffer(gl.ARRAY_BUFFER, base);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.clearColor(.06, .08, .07, 1);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const fondoPos = gl.getAttribLocation(fondo, 'posicion');
  const atributos = [
    [gl.getAttribLocation(actores, 'posicion'), 3, 0],
    [gl.getAttribLocation(actores, 'uv'), 2, 12],
    [gl.getAttribLocation(actores, 'color'), 4, 20],
  ];
  gl.useProgram(actores);
  gl.uniform1i(gl.getUniformLocation(actores, 'atlas'), 0);
  gl.uniform1i(gl.getUniformLocation(actores, 'profundidad'), 1);

  cargarImagen('sprites.webp').then(imagen => {
    if (destruido) return;
    atlas = textura(gl, imagen);
    actualizar();
  }).catch(error => { if (!destruido) fallo(error); });

  function dibujar(batalla) {
    if (destruido || gl.isContextLost()) return false;
    const id = batalla.arena;
    if (partida !== batalla) {
      partida = batalla;
      mirando.clear();
    }
    if (!escenas.has(id)) {
      escenas.set(id, null);
      Promise.all([cargarImagen(`${id}.webp`), cargarImagen(`${id}-depth.png`)]).then(([arte, mapa]) => {
        if (destruido) return;
        escenas.set(id, { arte: textura(gl, arte), profundidad: textura(gl, mapa) });
        actualizar();
      }).catch(error => { if (!destruido) fallo(error); });
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const escena = escenas.get(id);
    if (!escena) return false;
    gl.disable(gl.BLEND);
    gl.useProgram(fondo);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, escena.arte);
    gl.bindBuffer(gl.ARRAY_BUFFER, base);
    gl.enableVertexAttribArray(fondoPos);
    gl.vertexAttribPointer(fondoPos, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(fondoPos);
    if (!atlas) return false;

    quads.vaciar();
    cuadro(quads, batalla, mirando);
    gl.enable(gl.BLEND);
    gl.useProgram(actores);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, escena.profundidad);
    gl.bindBuffer(gl.ARRAY_BUFFER, dinamico);
    gl.bufferData(gl.ARRAY_BUFFER, quads.datos(), gl.DYNAMIC_DRAW);
    for (const [ubicacion, cantidad, offset] of atributos) {
      gl.enableVertexAttribArray(ubicacion);
      gl.vertexAttribPointer(ubicacion, cantidad, gl.FLOAT, false, 36, offset);
    }
    gl.drawArrays(gl.TRIANGLES, 0, quads.cantidad());
    for (const [ubicacion] of atributos) gl.disableVertexAttribArray(ubicacion);
    gl.activeTexture(gl.TEXTURE0);
    return true;
  }

  dibujar.liberar = () => {
    destruido = true;
    canvas.removeEventListener('webglcontextlost', contextoPerdido);
    for (const escena of escenas.values()) {
      if (escena) {
        gl.deleteTexture(escena.arte);
        gl.deleteTexture(escena.profundidad);
      }
    }
    if (atlas) gl.deleteTexture(atlas);
    gl.deleteBuffer(base);
    gl.deleteBuffer(dinamico);
    gl.deleteProgram(fondo);
    gl.deleteProgram(actores);
  };
  return dibujar;
}
