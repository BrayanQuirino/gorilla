import React,{useMemo,useState} from 'react';
import {FAMILIAS,HABILIDADES_EVOLUCION,POR_ID,geometria_panal,nivel_habilidad,costo_habilidad,disponible_habilidad,reembolso_habilidad,bloqueos_reembolso} from './evolution.js';
import './evolution.css';
const ubicaciones=geometria_panal();
const RADIO=49;
const puntos=Array.from({length:6},(_,i)=>{const t=Math.PI/180*(60*i-30);return [RADIO*Math.cos(t),RADIO*Math.sin(t)].join(',')}).join(' ');
const cells=[{id:'BASE',nombre:'Humanos',raiz:'BASE',beneficio:'Estado inicial. Cada humano conserva su arquetipo y atributos de nacimiento.',requisitos:[]},...HABILIDADES_EVOLUCION].map(h=>{
 const {q,r}=ubicaciones[h.id];
 return {...h,x:Math.sqrt(3)*RADIO*(q+r/2),y:RADIO*1.5*r};
});
const bounds={
 minX:Math.min(...cells.map(c=>c.x))-RADIO-4,
 maxX:Math.max(...cells.map(c=>c.x))+RADIO+4,
 minY:Math.min(...cells.map(c=>c.y))-RADIO-4,
 maxY:Math.max(...cells.map(c=>c.y))+RADIO+4
};
function texto_hex(nombre){
 const words=nombre.split(' '),lines=[''];
 for(const word of words){
  let last=lines.length-1;
  if((lines[last]+' '+word).trim().length>12&&lines[last])lines.push(word);
  else lines[last]=(lines[last]+' '+word).trim();
 }
 return lines.slice(0,3);
}
export default function PanalEvolucion({batalla,comprar,revertir}){
 const [seleccion,setSeleccion]=useState('A01');
 const [filtrar,setFiltrar]=useState('TODAS');
 const seleccionado=POR_ID[seleccion];
 const nivel=seleccion==='BASE'?1:nivel_habilidad(batalla,seleccion);
 const requisitos=seleccionado?.requisitos||[];
 const descendientes=HABILIDADES_EVOLUCION.filter(h=>h.requisitos.includes(seleccion));
 const adquiridas=HABILIDADES_EVOLUCION.filter(h=>nivel_habilidad(batalla,h.id)).length;
 const view=`${bounds.minX} ${bounds.minY} ${bounds.maxX-bounds.minX} ${bounds.maxY-bounds.minY}`;
 return <div className="evo-ui" aria-label="Panal de evolución humana">
  <header className="evo-top"><div><h3>🍯 Evolución humana</h3><p>Los hexágonos comparten sus bordes. Selecciona una habilidad para consultar sus conexiones.</p></div>
   <div className="evo-balance">🍌 {Math.floor(batalla.bananas)} <small>{adquiridas} / {HABILIDADES_EVOLUCION.length} desbloqueadas</small></div>
  </header>
  <div className="evo-filtros"><button aria-pressed={filtrar==='TODAS'} onClick={()=>setFiltrar('TODAS')}>Todas</button>
   {Object.entries(FAMILIAS).map(([id,r])=><button key={id} aria-pressed={filtrar===id} style={{'--familia':r.color}} onClick={()=>setFiltrar(id)}>{r.icono} {r.nombre}</button>)}
  </div>
  <div className="evo-layout">
   <div className="evo-scroll" tabIndex={0} aria-label="Mapa hexagonal conectado, desplázate para explorar">
    <svg className="evo-svg" viewBox={view} role="group" aria-label="Panal continuo de habilidades">
      {cells.map(h=>{
       const lvl=h.id==='BASE'?1:nivel_habilidad(batalla,h.id);
       const unlocked=h.id==='BASE'||disponible_habilidad(batalla,h.id);
       const selected=seleccion===h.id;
       const related=seleccionado&&(requisitos.includes(h.id)||seleccionado.id===h.id||seleccionado.requisitos.includes(h.id)||descendientes.some(d=>d.id===h.id));
       const muted=filtrar!=='TODAS'&&h.raiz!==filtrar&&!related&&h.id!=='BASE';
       const base=h.id==='BASE';
       const color=base?'#e7b959':FAMILIAS[h.raiz].color;
       const words=texto_hex(h.nombre);
       return <g key={h.id} className={'evo-hex '+(selected?'is-selected ':'')+(lvl?'is-owned ':'')+(muted?'is-muted ':'')} onClick={()=>setSeleccion(h.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSeleccion(h.id);}}} role="button" tabIndex={0} aria-label={h.nombre+(lvl?', comprado nivel '+lvl:unlocked?', disponible':', bloqueado')} style={{'--hex-color':color}} transform={`translate(${h.x},${h.y})`}>
         <polygon points={puntos} fill={base?'#5b4617':lvl?'#253c37':'#162126'} stroke={color} strokeWidth={selected?4:2} />
         <text className="evo-hex-icon" y={words.length>2?-24:-21}>{base?'👥':lvl?'✦':unlocked?'◆':'🔒'}</text>
         {words.map((line,i)=><text className="evo-hex-title" key={i} y={-5+(i-(words.length-1)/2)*11}>{line}</text>)}
         <text className="evo-hex-cost" y="31">{base?'BASE':lvl?'Nv. '+lvl:unlocked?'🍌 '+costo_habilidad(batalla,h.id):'Bloq.'}</text>
       </g>;
      })}
    </svg>
   </div>
   <aside className="evo-detalle">
    <div className="evo-detalle-title" style={{borderColor:seleccionado?FAMILIAS[seleccionado.raiz].color:'#e7b959'}}>
     <span>{seleccionado?FAMILIAS[seleccionado.raiz].icono:'👥'}</span>
     <div><small>{seleccionado?FAMILIAS[seleccionado.raiz].nombre:'Origen evolutivo'}</small><h3>{seleccionado?.nombre||'Humanos (base)'}</h3></div>
    </div>
    <p>{seleccionado?.beneficio||'Todos comienzan con atacar y sus atributos determinados por arquetipo y edad.'}</p>
    {seleccionado&&<>
     <div className="evo-dato"><span>Estado</span><strong>{nivel===seleccionado.maxNivel?'DOMINADA':nivel?'Nivel '+nivel+'/'+seleccionado.maxNivel:disponible_habilidad(batalla,seleccion)?'DISPONIBLE':'BLOQUEADA'}</strong></div>
     {seleccionado.atributo&&<div className="evo-dato"><span>Mejora global actual</span><strong>+{5*nivel}%</strong></div>}
     <h4>Requiere</h4>
     <div className="evo-requisitos">{requisitos.length?requisitos.map(id=><button key={id} onClick={()=>setSeleccion(id)} className={nivel_habilidad(batalla,id)?'comprado':''}>{nivel_habilidad(batalla,id)?'✓':'🔒'} {POR_ID[id].nombre}</button>):<span>Sin requisitos</span>}</div>
     <h4>Desbloquea</h4>
     <div className="evo-requisitos">{descendientes.length?descendientes.map(h=><button key={h.id} onClick={()=>setSeleccion(h.id)}>{h.nombre}</button>):<span>Sin descendientes directos</span>}</div>
     <button className="evo-comprar" disabled={!disponible_habilidad(batalla,seleccion)||batalla.bananas<costo_habilidad(batalla,seleccion)} onClick={()=>comprar(seleccion)}>
      {nivel===seleccionado.maxNivel?'✓ Dominada':!disponible_habilidad(batalla,seleccion)?'🔒 Primero desbloquea requisitos':batalla.bananas<costo_habilidad(batalla,seleccion)?'🍌 Bananas insuficientes':'Comprar · 🍌 '+costo_habilidad(batalla,seleccion)}
     </button>
     {nivel>0&&<div className="evo-reembolso">
       <button className="evo-revertir" disabled={bloqueos_reembolso(batalla,seleccion).length>0||Boolean(batalla.resultado)} onClick={()=>revertir(seleccion)}>
         ↩ Revertir nivel · Recuperar 🍌 {reembolso_habilidad(batalla,seleccion)}
       </button>
       {bloqueos_reembolso(batalla,seleccion).length>0&&<small>Bloqueada: primero revierte {bloqueos_reembolso(batalla,seleccion).map(id=>POR_ID[id].nombre).join(', ')}.</small>}
       <small>Recuperas el 65% de lo pagado por el último nivel.</small>
     </div>}
    </>}
   </aside>
  </div>
  <p className="evo-leyenda">🟠 Atacar · 🟢 Supervivencia · 🔵 Estrategia · 🟣 Apoyo. Los contactos son proximidad evolutiva; los requisitos exactos aparecen en la ficha al seleccionar una habilidad.</p>
 </div>;
}
