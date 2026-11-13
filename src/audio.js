// Original procedural arcade soundtrack and effects; no external audio assets.
export function crear_audio_arcade() {
  let ctx=null, timer=null, beat=0;
  const AudioContextClass=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
  function iniciar() {
    if(!AudioContextClass)return null;
    if(!ctx)ctx=new AudioContextClass();
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return ctx;
  }
  function nota(freq,duracion=.12,tipo='square',vol=.035,demora=0) {
    if(!ctx||ctx.state!=='running')return;
    const t=ctx.currentTime+demora;
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=tipo;osc.frequency.setValueAtTime(Math.max(40,freq),t);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001,vol),t+.009);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duracion);
    osc.connect(gain).connect(ctx.destination);osc.start(t);osc.stop(t+duracion+.012);
  }
  const bajo=[110,110,146.83,110,98,98,130.81,164.81];
  const melodia=[220,0,261.63,293.66,220,0,196,164.81,220,0,329.63,293.66,261.63,0,196,0];
  function pulso() {
    const paso=beat++;
    nota(bajo[Math.floor(paso/2)%bajo.length],.19,'triangle',.040);
    if(paso%2===0)nota(65,.055,'sawtooth',.020);
    if(melodia[paso%melodia.length])nota(melodia[paso%melodia.length],.13,'square',.014);
  }
  return {
    activar(encendido) {
      if(!encendido){if(timer){clearInterval(timer);timer=null;}return;}
      if(!iniciar()||timer)return;
      pulso();timer=setInterval(pulso,245);
    },
    efecto(tipo) {
      if(!ctx||ctx.state!=='running')return;
      if(tipo==='disparo'){nota(140,.055,'sawtooth',.085);nota(72,.10,'triangle',.05);}
      else if(tipo==='ataque_gorila'){nota(79,.23,'sawtooth',.075);nota(58,.27,'triangle',.09);}
      else if(tipo==='baja'){nota(160,.16,'triangle',.045);nota(98,.18,'triangle',.04,.11);}
      else if(tipo==='segunda_vida'){[110,146.83,196,293.66].forEach((n,i)=>nota(n,.26,'sawtooth',.06,i*.14));}
      else if(tipo==='suministro_recogido'||tipo==='arma_encontrada'){nota(440,.08,'square',.035);nota(660,.12,'square',.03,.09);}
      else if(tipo==='objeto_soltado'){nota(260,.065,'triangle',.025);}
      else if(tipo==='objeto_lanzado'){nota(310,.15,'sawtooth',.025);}
      else if(tipo==='impacto_objeto'){nota(90,.17,'triangle',.065);}
    },
    cerrar(){if(timer)clearInterval(timer);timer=null;if(ctx)ctx.close().catch(()=>{});ctx=null;}
  };
}
