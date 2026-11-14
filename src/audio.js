// Gorilla audio: recorded CC0/CC-BY sounds and arena-specific licensed music.
// Every asset is prepared during the GitHub Pages build by scripts/fetch-audio.py.
// Missing recordings remain silent; never substitute oscillator imitations.
const BASE = import.meta.env.BASE_URL + 'audio/';
const TRACK_BY_ARENA = {claro:'music_a',selva:'music_b1',canon:'music_b2',hangar:'music_a'};
export function crear_audio_arcade(){
  let enabled=false, arena='claro', music=null, live=new Set(), last=new Map(), paused=false;
  let volumeMusic=.27, volumeEffects=.7, captureTimers=[];
  const effectTimers=new Map();
  const effectLimit=8;
  const urls = new Map();
  const url = name => {
    if(!urls.has(name)) urls.set(name, BASE + name + '.mp3');
    return urls.get(name);
  };
  const stopCapture = () => { for(const t of captureTimers) clearTimeout(t);captureTimers=[]; };
  function cleanEffect(a){
    if(!a||!live.has(a))return;
    live.delete(a);
    const timer=effectTimers.get(a);
    if(timer!==undefined)clearTimeout(timer);
    effectTimers.delete(a);
    a.pause();
    a.removeAttribute('src');
  }
  function stopEffects(){
    stopCapture();
    for(const a of [...live])cleanEffect(a);
    last.clear();
  }
  function sound(name,opts={}){
    if(!enabled||typeof Audio==='undefined')return;
    const now=performance.now();
    const gap=opts.minGap??110;
    if(now-(last.get(name)??-Infinity)<gap)return;
    last.set(name,now);
    // Keep simultaneous voices bounded even if impact events arrive in bursts.
    if(live.size>=effectLimit)cleanEffect(live.values().next().value);
    const a=new Audio(url(name));
    a.loop=false; // Effects are always one-shots; only arena music may loop.
    a.preload='auto';
    a.volume=Math.min(1,(opts.volume??1)*volumeEffects);
    a.playbackRate=opts.speed??1;
    live.add(a);
    a.addEventListener('ended',()=>cleanEffect(a),{once:true});
    a.addEventListener('error',()=>cleanEffect(a),{once:true});
    // Hard stop for missing/stuck media end events. No sound can run forever.
    const hardStop=Math.min(4800,Math.max(120,opts.maxMs??3200));
    effectTimers.set(a,setTimeout(()=>cleanEffect(a),hardStop));
    a.play().catch(()=>cleanEffect(a));
    return a;
  }

  function startMusic(){
    if(!enabled||!music||typeof Audio==='undefined')return;
    const track=TRACK_BY_ARENA[arena]||'music_a';
    if(music.dataset.track===track){
      music.volume=paused?Math.min(volumeMusic,.07):volumeMusic;
      if(music.paused)music.play().catch(()=>{});
      return;
    }
    music.pause();
    music.removeAttribute('src');
    music=new Audio(url(track));
    music.dataset.track=track;
    music.loop=true;
    music.volume=paused?Math.min(volumeMusic,.07):volumeMusic;
    music.play().catch(()=>{});
  }
  return {
    configurarArena(id){
      if(arena===id)return;
      arena=id;
      if(enabled&&music)startMusic();
    },
    volumenMusica(valor){volumeMusic=Math.max(0,Math.min(1,valor));if(music)music.volume=paused?Math.min(volumeMusic,.07):volumeMusic;},
    volumenEfectos(valor){volumeEffects=Math.max(0,Math.min(1,valor));},
    activar(active,segundaVida=false){
      enabled=Boolean(active);
      paused=Boolean(segundaVida);
      if(!enabled){
        stopEffects();
        if(music){music.pause();music.currentTime=0;music.removeAttribute('src');music=null;}
        return;
      }
      if(!music&&typeof Audio!=='undefined')music=new Audio();
      startMusic();
    },
    efecto(tipo,datos={}){
      if(!enabled)return;
      switch(tipo){
        case 'inicio_batalla': return sound('inicio_batalla',{volume:.85,maxMs:4000});
        case 'golpe_humano':
          if(!datos.disparo)sound('golpe_humano',{volume:.72,minGap:95});
          return;
        case 'golpe_gorila':return sound('golpe_humano',{speed:.8,volume:1,minGap:120});
        case 'pisada_gorila':return sound('pisada_gorila',{volume:.35,minGap:290,maxMs:380});
        case 'ataque_gorila':
          if(datos.accion==='rugido')sound('rugido',{volume:.9,minGap:1000});
          return;
        case 'agarre':
          // The progressive squeeze begins with the grab. Don't restart it on each squeeze tick.
          return sound('estrujon',{volume:.75,minGap:1000,maxMs:3000});
        case 'estrujon':return;
        case 'lanzamiento':return sound('lanzamiento',{volume:.75,minGap:180});
        case 'disparo':return sound('disparo',{volume:.7,minGap:120});
        case 'objeto_lanzado':return sound('objeto_lanzado',{volume:.5,minGap:100});
        case 'impacto_objeto':return sound('impacto_objeto',{volume:.65,minGap:90});
        case 'baja':return sound('baja',{volume:.65,minGap:120});
        case 'segunda_vida':return sound('segunda_vida',{volume:1,maxMs:3000});
        case 'captura_desplegada':
          stopCapture();
          sound('captura_desplegada',{volume:.55});
          // Synchronize multiple actual rope snaps to the existing restraint duration.
          // Rope = 4s, net = 8s. Last rupture coincides with breaking free.
          {const ms=datos.tipo==='cuerdas'?4000:8000;
           for(let i=1;i<=5;i++)
             captureTimers.push(setTimeout(()=>sound('captura_rota',{volume:.2+i*.13,minGap:90}),Math.round(ms*i/5)));
          }
          return;
        case 'captura_rota':
          stopCapture();
          return sound('captura_rota',{volume:1});
        case 'suministro_recogido':
        case 'arma_encontrada':return sound('suministro_recogido',{volume:.35,minGap:90});
        case 'objeto_soltado':return sound('objeto_soltado',{volume:.5,minGap:90,maxMs:1000});
        default:return;
      }
    },
    cerrar(){enabled=false;stopEffects();if(music){music.pause();music.removeAttribute('src');}music=null;}
  };
}
