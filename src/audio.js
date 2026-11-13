// Synthesized arcade combat audio: filtered noise, low-frequency impacts and roars.
// No external music, copyrighted recordings or network audio dependencies.
export function crear_audio_arcade(){
  let ctx=null,timer=null,beat=0,noiseBuffer=null;
  let ultimoGolpe=0,ultimoPaso=0;
  const AudioContextClass=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
  function iniciar(){
    if(!AudioContextClass)return null;
    if(!ctx){
      ctx=new AudioContextClass();
      noiseBuffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*2),ctx.sampleRate);
      const data=noiseBuffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return ctx;
  }
  function ruido(duracion=.15,vol=.11,corte=550,demora=0,pass='lowpass'){
    if(!ctx)return;
    const t=ctx.currentTime+demora;
    const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
    src.buffer=noiseBuffer;src.type='buffer';filter.type=pass;filter.frequency.setValueAtTime(corte,t);
    gain.gain.setValueAtTime(Math.max(.0001,vol),t);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duracion);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t,Math.random()*.7);src.stop(t+duracion+.02);
  }
  function tono(frecuencia,fin,duracion=.18,vol=.08,tipo='sawtooth',demora=0){
    if(!ctx)return;
    const t=ctx.currentTime+demora;
    const osc=ctx.createOscillator(),gain=ctx.createGain(),filtro=ctx.createBiquadFilter();
    osc.type=tipo;
    osc.frequency.setValueAtTime(Math.max(25,frecuencia),t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25,fin),t+duracion);
    filtro.type='lowpass';filtro.frequency.value=1100;
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.linearRampToValueAtTime(vol,t+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duracion);
    osc.connect(filtro).connect(gain).connect(ctx.destination);
    osc.start(t);osc.stop(t+duracion+.025);
  }
  function golpe(fuerza=1){
    // Heavy impact: bass thump, short transient and crunchy midrange.
    tono(110*fuerza,42,.18,.12,'sine');
    tono(150*fuerza,55,.09,.055,'triangle');
    ruido(.083,.105,1100,0,'bandpass');
    ruido(.16,.07,290,.016);
  }
  function pisada(){
    tono(64,37,.13,.072,'sine');
    ruido(.105,.075,175);
    ruido(.035,.028,700,.012);
  }
  function rugido(duracion=.8,intensidad=1){
    // Multiple slightly detuned low voices create a growling, animal-like roar.
    tono(125*intensidad,66,duracion,.085,'sawtooth');
    tono(94*intensidad,45,duracion*.92,.085,'triangle',.035);
    tono(208*intensidad,102,duracion*.74,.038,'sawtooth',.07);
    ruido(duracion*.88,.15,380,.025,'bandpass');
    ruido(duracion*.56,.075,1000,.14,'bandpass');
  }
  function estrujon(){
    ruido(.24,.11,360,0,'bandpass');
    ruido(.19,.085,165,.08);
    tono(210,63,.28,.062,'sawtooth');
  }
  function gritoBatalla(){
    // Several independent pitched shouts, rising into a unified charge.
    for(let i=0;i<7;i++){
      const delay=i*.052;
      tono(125+(i%4)*22,255+(i%3)*42,.44,.047,'sawtooth',delay);
      ruido(.30,.027,820+i*70,delay+.035,'bandpass');
    }
    tono(75,48,.52,.10,'triangle',.07);
    ruido(.7,.065,680,.08,'bandpass');
  }
  function ambiente(){
    if(!ctx)return;
    beat++;
    if(beat%2===0){tono(73,40,.18,.045,'triangle');ruido(.06,.018,210);}
    if(beat%4===2)ruido(.07,.022,420);
  }
  return {
    activar(encendido){
      if(!encendido){if(timer)clearInterval(timer);timer=null;return;}
      if(!iniciar()||timer)return;
      ambiente();timer=setInterval(ambiente,360);
    },
    efecto(tipo,datos={}){
      if(!iniciar())return;
      const ahora=ctx.currentTime;
      if(tipo==='inicio_batalla'){gritoBatalla();return;}
      if(tipo==='golpe_humano'||tipo==='golpe_gorila'||tipo==='impacto_objeto'){
        if(ahora-ultimoGolpe<.09)return;
        ultimoGolpe=ahora;golpe(tipo==='golpe_gorila'?1.25:1);return;
      }
      if(tipo==='pisada_gorila'){
        if(ahora-ultimoPaso<.24)return;
        ultimoPaso=ahora;pisada();return;
      }
      if(tipo==='ataque_gorila'){
        if(datos.accion==='rugido')rugido(.98,1.3);
        else if(datos.accion==='embestida')rugido(.40,.9);
        else golpe(.85);
        return;
      }
      if(tipo==='agarre'){estrujon();return;}
      if(tipo==='estrujon'){estrujon();return;}
      if(tipo==='lanzamiento'){ruido(.28,.08,970,0,'bandpass');golpe(.95);return;}
      if(tipo==='disparo'){ruido(.09,.13,1550,0,'highpass');tono(170,59,.14,.075,'triangle');return;}
      if(tipo==='baja'){tono(145,64,.22,.037,'sine');return;}
      if(tipo==='segunda_vida'){rugido(1.4,1.4);return;}
      if(tipo==='captura_rota'){ruido(.32,.11,1400,0,'highpass');return;}
      if(tipo==='captura_desplegada'){ruido(.27,.06,800,0,'bandpass');return;}
      if(tipo==='suministro_recogido'||tipo==='arma_encontrada'){
        tono(360,500,.1,.038,'triangle');tono(530,680,.14,.032,'triangle',.1);return;
      }
      if(tipo==='objeto_lanzado'||tipo==='objeto_soltado')ruido(.14,.035,920,0,'bandpass');
    },
    cerrar(){if(timer)clearInterval(timer);timer=null;if(ctx)ctx.close().catch(()=>{});ctx=null;}
  };
}
