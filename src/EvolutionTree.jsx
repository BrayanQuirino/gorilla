import React,{useEffect,useMemo,useState} from 'react';
import {
 FAMILIAS,HABILIDADES_EVOLUCION,POR_ID,geometria_panal_estado,
 nivel_habilidad,costo_habilidad,disponible_habilidad,
 reembolso_habilidad,bloqueos_reembolso,habilidades_visibles,bananas_faltantes
} from './evolution.js';
import './evolution.css';

const RADIO=49;
const puntos=Array.from({length:6},(_,i)=>{
 const a=(60*i-30)*Math.PI/180;
 return [RADIO*Math.cos(a),RADIO*Math.sin(a)].join(',');
}).join(' ');
const BASE={id:'BASE',nombre:'Humanos',raiz:'BASE',beneficio:'Los humanos nacen con sus atributos y arquetipos. Atacar es su comportamiento inicial.',requisitos:[]};
const TEXTO_LARGO=12;
function texto_hex(nombre){
 const words=nombre.split(' '),lines=[''];
 for(const word of words){
  const i=lines.length-1;
  if((lines[i]+' '+word).trim().length>TEXTO_LARGO && lines[i])lines.push(word);
  else lines[i]=(lines[i]+' '+word).trim();
 }
 return lines.slice(0,3);
}

export default function PanalEvolucion({batalla,comprar,revertir}){
 const [seleccion,setSeleccion]=useState('A01');
 const [filtrar,setFiltrar]=useState('TODAS');
 const [animacion,setAnimacion]=useState(null);
 const ultimaCompra=[...batalla.eventos].reverse().find(e=>e.tipo==='evolucion'||e.tipo==='evolucion_revertida');
 // Battle objects are deliberately mutable; the increasing event ID invalidates
 // both cached visibility and layout after purchases and refunds.
 const revision=batalla.evento_id||0;
 const visibles=useMemo(()=>habilidades_visibles(batalla),[batalla,revision]);
 const ubicaciones=useMemo(()=>geometria_panal_estado(batalla),[batalla,revision]);
 const visibleIds=useMemo(()=>new Set(visibles.map(h=>h.id)),[visibles]);
 const cells=useMemo(()=>visibles.map(h=>{
  const {q,r}=ubicaciones[h.id];
  return {...h,x:Math.sqrt(3)*RADIO*(q+r/2),y:RADIO*1.5*r};
 }),[visibles,ubicaciones]);
 const bounds=useMemo(()=>{
  const xs=cells.map(c=>c.x),ys=cells.map(c=>c.y);
  return {minX:Math.min(...xs)-RADIO-12,maxX:Math.max(...xs)+RADIO+12,
          minY:Math.min(...ys)-RADIO-12,maxY:Math.max(...ys)+RADIO+12};
 },[cells]);
 const view=`${bounds.minX} ${bounds.minY} ${bounds.maxX-bounds.minX} ${bounds.maxY-bounds.minY}`;
 const seleccionado=visibleIds.has(seleccion)?POR_ID[seleccion]:null;
 const nivel=seleccionado?nivel_habilidad(batalla,seleccion):0;
 const requisitos=seleccionado?.requisitos||[];
 const descendientes=seleccionado?HABILIDADES_EVOLUCION.filter(h=>h.requisitos.includes(seleccion)&&visibleIds.has(h.id)):[];
 const adquiridas=HABILIDADES_EVOLUCION.filter(h=>nivel_habilidad(batalla,h.id)>0).length;
 const nuevos=ultimaCompra?.tipo==='evolucion'
   ?new Set(HABILIDADES_EVOLUCION.filter(h=>h.requisitos.includes(ultimaCompra.habilidad)&&
     visibleIds.has(h.id)&&!nivel_habilidad(batalla,h.id)).map(h=>h.id))
   :new Set();

 useEffect(()=>{
  if(seleccion!=='BASE'&&!visibleIds.has(seleccion))setSeleccion(visibles[0]?.id||'BASE');
 },[seleccion,visibles,visibleIds]);

 useEffect(()=>{
  if(!ultimaCompra)return;
  setAnimacion({id:ultimaCompra.habilidad,evento:ultimaCompra.id});
  const timeout=setTimeout(()=>setAnimacion(null),1700);
  return ()=>clearTimeout(timeout);
 },[ultimaCompra?.id]);

 const costo=seleccionado?costo_habilidad(batalla,seleccion):0;
 const puede=seleccionado&&disponible_habilidad(batalla,seleccion);
 const faltantes=seleccionado?bananas_faltantes(batalla,seleccion):0;

 return <div className="evo-ui" aria-label="Panal de evolución humana">
  <header className="evo-top">
   <div><h3>🍯 Evolución humana</h3><p>El mapa se revela al adquirir habilidades. Las bananas determinan la compra, no la aparición.</p></div>
   <div className="evo-balance">🍌 {Math.floor(batalla.bananas)} <small>{adquiridas} / {HABILIDADES_EVOLUCION.length} descubiertas</small></div>
  </header>
  <div className="evo-filtros">
   <button aria-pressed={filtrar==='TODAS'} onClick={()=>setFiltrar('TODAS')}>Todas</button>
   {Object.entries(FAMILIAS).filter(([id])=>id!=='P'||visibles.some(h=>h.raiz==='P')).map(([id,r])=><button key={id} aria-pressed={filtrar===id}
    style={{'--familia':r.color}} onClick={()=>setFiltrar(id)}>{r.icono} {r.nombre}</button>)}
  </div>
  <div className="evo-layout">
   <div className="evo-scroll" tabIndex={0} aria-label="Mapa completo de habilidades visibles, ajustado al espacio disponible sin desplazamiento">
    <svg className="evo-svg" viewBox={view} preserveAspectRatio="xMidYMid meet" role="group" aria-label="Panal de habilidades conectadas">
     {cells.map(h=>{
      const base=h.id==='BASE';
      const lvl=base?1:nivel_habilidad(batalla,h.id);
      const selected=seleccion===h.id;
      const related=requisitos.includes(h.id)||descendientes.some(x=>x.id===h.id)||selected;
      const muted=filtrar!=='TODAS'&&h.raiz!==filtrar&&!related&&!base;
      const color=base?'#e7b959':FAMILIAS[h.raiz].color;
      const words=texto_hex(h.nombre);
      const glow=animacion?.id===h.id;
      const nuevo=nuevos.has(h.id)&&ultimaCompra?.id===animacion?.evento;
      return <g key={h.id}
       className={'evo-hex '+(selected?'is-selected ':'')+(lvl?'is-owned ':'')+(muted?'is-muted ':'')+
        (glow?'is-flash ':'')+(nuevo?'is-new ':'')+(!lvl?'is-available ':'')}
       role="button" tabIndex={0} aria-label={h.nombre+(lvl?', nivel '+lvl:', disponible para evolucionar')}
       style={{'--hex-color':color}} transform={`translate(${h.x},${h.y})`}
       onClick={()=>setSeleccion(h.id)}
       onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSeleccion(h.id);}}}>
       <polygon points={puntos} fill={base?'#5b4617':lvl?'#2e4c3d':'#152b2a'} stroke={color} strokeWidth={selected?4:2}/>
       <text className="evo-hex-icon" y={words.length>2?-24:-21}>{base?'👥':lvl?'✦':'◆'}</text>
       {words.map((line,i)=><text key={i} className="evo-hex-title" y={-5+(i-(words.length-1)/2)*11}>{line}</text>)}
       <text className="evo-hex-cost" y="31">{base?'BASE':lvl?'✓ Nv. '+lvl:'🍌 '+costo_habilidad(batalla,h.id)}</text>
      </g>;
     })}
    </svg>
   </div>
   <aside className="evo-detalle">
    <div className="evo-detalle-title" style={{borderColor:seleccionado?FAMILIAS[seleccionado.raiz].color:'#e7b959'}}>
     <span>{seleccionado?FAMILIAS[seleccionado.raiz].icono:'👥'}</span>
     <div><small>{seleccionado?FAMILIAS[seleccionado.raiz].nombre:'Origen evolutivo'}</small>
      <h3>{seleccionado?.nombre||'Humanos (base)'}</h3></div>
    </div>
    <p>{seleccionado?.beneficio||BASE.beneficio}</p>
    {seleccionado&&<>
     <div className="evo-dato"><span>Estado</span>
      <strong>{nivel===seleccionado.maxNivel?'DOMINADA':nivel?'Nivel '+nivel+'/'+seleccionado.maxNivel:'DISPONIBLE'}</strong></div>
     {seleccionado.atributo&&<div className="evo-dato"><span>Mejora global actual</span><strong>+{5*nivel}%</strong></div>}
     <h4>Requiere</h4>
     <div className="evo-requisitos">{requisitos.length?requisitos.map(id=><button key={id}
      onClick={()=>setSeleccion(id)} className={nivel_habilidad(batalla,id)?'comprado':''}>✓ {POR_ID[id].nombre}</button>)
      :<span>Sin requisitos</span>}</div>
     <h4>Próximas evoluciones</h4>
     <div className="evo-requisitos">{descendientes.length?descendientes.map(h=><button key={h.id}
      onClick={()=>setSeleccion(h.id)}>{h.nombre}</button>):<span>Los siguientes descubrimientos aparecerán al cumplir sus requisitos.</span>}</div>
     <button className="evo-comprar" disabled={!puede||faltantes>0} onClick={()=>comprar(seleccion)}>
      {nivel===seleccionado.maxNivel?'✓ Dominada':!puede?'🔒 No disponible':faltantes>0?'🍌 Te faltan '+faltantes+' bananas':'Comprar · 🍌 '+costo}
     </button>
     {nivel>0&&<div className="evo-reembolso">
       <button className="evo-revertir" disabled={bloqueos_reembolso(batalla,seleccion).length>0||Boolean(batalla.resultado)}
        onClick={()=>revertir(seleccion)}>↩ Revertir nivel · Recuperar 🍌 {reembolso_habilidad(batalla,seleccion)}</button>
       {bloqueos_reembolso(batalla,seleccion).length>0&&<small>Primero revierte: {bloqueos_reembolso(batalla,seleccion).map(id=>POR_ID[id].nombre).join(', ')}</small>}
       <small>Reembolso del 65% del precio pagado por el último nivel.</small>
     </div>}
    </>}
   </aside>
  </div>
  <p className="evo-leyenda">⚔️ Atacar · 🛡️ Supervivencia · 🧠 Estrategia · 🤝 Apoyo (se desbloquea después). Solo aparecen habilidades cuyos requisitos ya se han cumplido; cada color identifica su raíz.</p>
 </div>;
}
