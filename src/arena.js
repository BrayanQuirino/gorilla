import { alto, ancho } from './battle.js';

const colores = ['#91e8b1', '#b1de70', '#70bce5', '#e9c073', '#d995de',
  '#9c9bf2', '#5dcfbd', '#e39479', '#f5dfb0', '#b9c3d4'];

function circulo(ctx, x, y, radio, color) {
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function crear_terreno() {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  const luz = ctx.createRadialGradient(500, 315, 45, 500, 315, 570);
  luz.addColorStop(0, '#243a2c');
  luz.addColorStop(1, '#101c18');
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, ancho, alto);
  for (let i = 0; i < 1700; i += 1) {
    const x = (i * 71.913) % ancho;
    const y = (i * i * 2.311) % alto;
    circulo(ctx, x, y, i % 5 === 0 ? 2 : .8, i % 3 ? '#a7c98824' : '#10171166');
  }
  ctx.strokeStyle = '#b9d59819';
  ctx.lineWidth = 1;
  for (let x = 40; x < ancho; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, alto);
    ctx.stroke();
  }
  for (let y = 40; y < alto; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
    ctx.stroke();
  }
  return lienzo;
}

export function crear_dibujante(canvas) {
  const ctx = canvas.getContext('2d');
  const terreno = crear_terreno();
  return (batalla, escuadron) => {
    const { gorila, hombres } = batalla;
    ctx.drawImage(terreno, 0, 0);
    if (gorila.fase === 'aviso' || gorila.fase === 'embestida') {
      if (gorila.accion === 'embestida') {
        ctx.strokeStyle = '#ff936245';
        ctx.lineWidth = gorila.radio * 1.7;
        ctx.beginPath();
        ctx.moveTo(gorila.x, gorila.y);
        ctx.lineTo(gorila.destino.x, gorila.destino.y);
        ctx.stroke();
      }
      circulo(ctx, gorila.destino.x, gorila.destino.y,
        gorila.accion === 'rugido' ? 145 : gorila.radio + 28,
        gorila.accion === 'rugido' ? '#ecc77938' : '#ff875b46');
    }

    for (const hombre of hombres) {
      const { x, y, vida } = hombre;
      if (vida <= 0) {
        circulo(ctx, x, y, 3, '#78917c4d');
        continue;
      }
      if (escuadron && escuadron === hombre.escuadron) circulo(ctx, x, y, 8, '#ffffff70');
      circulo(ctx, x + 1, y + 3, 5, '#0d1615ae');
      circulo(ctx, x, y, 4.8, colores[hombre.escuadron - 1]);
      if (hombre.miedo > 12 + hombre.radar.valentia * .76) {
        circulo(ctx, x, y - 8, 2.6, '#ffba71');
      }
    }

    const { x, y, radio } = gorila;
    const pulso = gorila.fase === 'aviso' ? Math.sin(gorila.reloj * 18) * 2.5 : 0;
    circulo(ctx, x + 3, y + 8, radio * 1.12, '#090e0db3');
    circulo(ctx, x, y, radio + pulso, '#d28a57');
    circulo(ctx, x, y, radio * .86, '#43372f');
    ctx.fillStyle = '#ffd5a8';
    ctx.font = `bold ${Math.round(radio * .65)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('G', x, y);
  };
}
