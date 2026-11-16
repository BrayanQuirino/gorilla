import test from 'node:test';
import assert from 'node:assert/strict';
import {HABILIDADES_EVOLUCION,POR_ID,geometria_panal,geometria_panal_estado,habilidades_visibles,visible_habilidad,bananas_faltantes,distancia_hex,bonificacion_efectiva,comprar_habilidad,nivel_habilidad,costo_habilidad,disponible_habilidad,reembolso_habilidad,revertir_habilidad,bloqueos_reembolso} from './evolution.js';

const DIRECCIONES=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
test('unique skills and valid acyclic prerequisites',()=>{
 assert.equal(HABILIDADES_EVOLUCION.length,48);
 assert.equal(new Set(HABILIDADES_EVOLUCION.map(s=>s.id)).size,HABILIDADES_EVOLUCION.length);
 const visited=new Set(), visiting=new Set();
 const visit=(id)=>{if(visited.has(id))return;assert.ok(!visiting.has(id),'cycle '+id);visiting.add(id);for(const p of POR_ID[id].requisitos){assert.ok(POR_ID[p],'missing '+p);visit(p)}visiting.delete(id);visited.add(id)};
 HABILIDADES_EVOLUCION.forEach(h=>visit(h.id));
});
test('honeycomb is one continuous hexagonal structure with unique tiles',()=>{
 const grid=geometria_panal(),nodes=Object.entries(grid);
 assert.equal(nodes.length,HABILIDADES_EVOLUCION.length+1);
 assert.equal(new Set(nodes.map(([,p])=>p.q+','+p.r)).size,nodes.length);
 const seen=new Set(['BASE']);
 let progress=true;
 while(progress){progress=false;for(const [id,p] of nodes){if(seen.has(id))continue;
  if(nodes.some(([other,q])=>seen.has(other)&&DIRECCIONES.some(([x,y])=>p.q-q.q===x&&p.r-q.r===y))){seen.add(id);progress=true;}
 }}
 assert.equal(seen.size,nodes.length);
});
test('buying attribute skill raises all birth attributes without erasing differences',()=>{
 const b={bananas:1000,tiempo:300,resultado:'',evolucion:{E00:1},eventos:[],hombres:[{radar:{inteligencia:80,agilidad:40},valentia:55},{radar:{inteligencia:40,agilidad:30},valentia:45}]};
 assert.equal(comprar_habilidad(b,'E01'),true);
 assert.equal(b.hombres[0].radar.inteligencia,84);
 assert.equal(b.hombres[1].radar.inteligencia,42);
 assert.equal(nivel_habilidad(b,'E01'),1);
 assert.equal(comprar_habilidad(b,'E01'),true);
 assert.equal(b.hombres[0].radar.inteligencia,88);
 assert.equal(b.hombres[1].radar.inteligencia,44);
 assert.equal(b.hombres[0].radar_base.inteligencia,80);
 assert.equal(b.hombres[0].radar.agilidad,40);
});
test('prerequisites, affordability and cap are enforced',()=>{
 const b={bananas:35,tiempo:300,resultado:'',evolucion:{S00:1},eventos:[],hombres:[]};
 assert.equal(disponible_habilidad(b,'S04'),false);
 assert.equal(comprar_habilidad(b,'S04'),false);
 assert.equal(comprar_habilidad(b,'S01'),true);
 assert.equal(disponible_habilidad(b,'S04'),true);
 assert.equal(comprar_habilidad(b,'S04'),false);
 b.bananas=1000;assert.equal(comprar_habilidad(b,'S04'),true);
 assert.equal(comprar_habilidad(b,'S04'),false);
 assert.equal(bonificacion_efectiva(90,5),100);
});

test('refund returns 65% of actual purchase and restores original human values',()=>{
 const b={bananas:200,tiempo:300,resultado:'',evolucion:{E00:1},eventos:[],hombres:[{radar:{inteligencia:60},valentia:50}]};
 assert.equal(comprar_habilidad(b,'E01'),true);
 assert.equal(b.hombres[0].radar.inteligencia,63);
 const paid=200-b.bananas;
 assert.equal(reembolso_habilidad(b,'E01'),Math.floor(paid*.65));
 assert.equal(revertir_habilidad(b,'E01'),true);
 assert.equal(b.bananas,200-paid+Math.floor(paid*.65));
 assert.equal(b.hombres[0].radar.inteligencia,60);
 assert.equal(revertir_habilidad(b,'E01'),false);
});
test('cannot refund an evolution required by a purchased descendant',()=>{
 const b={bananas:200,tiempo:300,resultado:'',evolucion:{S00:1},eventos:[],hombres:[]};
 assert.equal(comprar_habilidad(b,'S01'),true);
 assert.equal(comprar_habilidad(b,'S04'),true);
 assert.deepEqual(bloqueos_reembolso(b,'S01'),['S04']);
 assert.equal(revertir_habilidad(b,'S01'),false);
 assert.equal(revertir_habilidad(b,'S04'),true);
 assert.equal(revertir_habilidad(b,'S01'),true);
});

test('progressive reveal ignores banana balance and requires every parent',()=>{
 const b={evolucion:{},bananas:0,resultado:''};
 const first=habilidades_visibles(b);
 assert.equal(first.length,3,'only Atacar, Supervivencia and Estrategia visible initially');
 assert.equal(visible_habilidad(b,'A10'),false);
 b.evolucion.A07=1;
 assert.equal(visible_habilidad(b,'A10'),true,'Cerco becomes visible when one parent has evolved');
 assert.equal(disponible_habilidad(b,'A10'),false,'Buying still requires both parents');
 b.evolucion.A08=1;
 assert.equal(visible_habilidad(b,'A10'),true,'Cerco remains revealed with both parents');
 assert.ok(habilidades_visibles(b).some(h=>h.id==='A10'));
 assert.equal(bananas_faltantes({...b,bananas:87},'A10'),3);
 assert.equal(bananas_faltantes({...b,bananas:0},'A10'),90);
});
test('dynamic honeycomb never overlaps cells as more skills become visible',()=>{
 for(const level of [0,1,2]){
  const bought=level===0?{}:level===1?{A01:1,A02:1,A03:1,S01:1,E01:1,E02:1,P01:1,P02:1}:
   Object.fromEntries(HABILIDADES_EVOLUCION.map(h=>[h.id,1]));
  const b={evolucion:bought,bananas:0};
  const positions=geometria_panal_estado(b);
  const ids=Object.keys(positions);
  assert.equal(ids.length,1+habilidades_visibles(b).length);
  assert.equal(new Set(Object.values(positions).map(p=>p.q+','+p.r)).size,ids.length,'all tiles unique');
 }
});
test('Cerco touches both Ataque grupal and Flanqueo on the hex map',()=>{
 const b={bananas:0,evolucion:Object.fromEntries(HABILIDADES_EVOLUCION.map(h=>[h.id,1]))};
 const map=geometria_panal_estado(b);
 assert.equal(distancia_hex(map.A10,map.A07),1,'Cerco beside Ataque grupal');
 assert.equal(distancia_hex(map.A10,map.A08),1,'Cerco beside Flanqueo');
});

test('the evolution starts with three top-level roots, then reveals descendants',()=>{
 const b={evolucion:{},bananas:0,resultado:''};
 assert.deepEqual(habilidades_visibles(b).map(h=>h.id),['A00','S00','E00']);
 assert.equal(visible_habilidad(b,'P01'),false,'Apoyo is not available until Intelligence');
 assert.equal(visible_habilidad(b,'S02'),false);
 b.evolucion.E00=1;
 assert.equal(visible_habilidad(b,'E01'),true);
 assert.equal(visible_habilidad(b,'E02'),true);
 b.evolucion.E01=1;
 assert.equal(visible_habilidad(b,'P01'),true);
 assert.equal(visible_habilidad(b,'P02'),true);
 b.evolucion.A00=1;
 assert.equal(visible_habilidad(b,'A01'),true);
 assert.equal(visible_habilidad(b,'A02'),true);
 assert.equal(visible_habilidad(b,'A03'),true);
});

test('only the purchased frontier is revealed; unrelated agility stays hidden',()=>{
 const b={bananas:999,evolucion:{A00:1,E00:1,E01:1,A01:1}};
 assert.equal(visible_habilidad(b,'S01'),false,'Agilidad remains hidden until buying Supervivencia');
 assert.equal(visible_habilidad(b,'S00'),true,'Supervivencia is a visible primary root');
 assert.equal(visible_habilidad(b,'A04'),true,'Golpe potente touches purchased Fuerza');
 assert.equal(visible_habilidad(b,'E04'),true,'Observación touches purchased Inteligencia');
 assert.equal(visible_habilidad(b,'S07'),false,'Reflejos stays hidden without any purchased parent');
 assert.equal(disponible_habilidad(b,'P08'),false,'Visible combined skills remain locked without all prerequisites');
 assert.equal(visible_habilidad(b,'P08'),true,'Combined skills are previewed from purchased Inteligencia');
});
