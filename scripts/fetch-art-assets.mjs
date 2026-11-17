// Downloads only approved CC0 third-party 3D assets into the published build.
// Models are credited in the adjacent manifest and deliberately never replace
// the original game's audio, AI, combat or UI modules.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const assets=[
  {id:'big_tree',pack:'quaternius-texturedfantasynature',creator:'Quaternius',
   url:'https://raw.githubusercontent.com/Papyszoo/CC0-Public-Domain-Models/main/packs/quaternius-texturedfantasynature/models/big_tree/big_tree.glb',size:242936},
  {id:'tree',pack:'quaternius-texturedfantasynature',creator:'Quaternius',
   url:'https://raw.githubusercontent.com/Papyszoo/CC0-Public-Domain-Models/main/packs/quaternius-texturedfantasynature/models/tree/tree.glb',size:201796},
  {id:'rock_moss',pack:'polyhaven-nature-rocks',creator:'Poly Haven',
   url:'https://raw.githubusercontent.com/Papyszoo/CC0-Public-Domain-Models/main/packs/polyhaven-nature-rocks/models/rock_moss_set_01/rock_moss_set_01.glb',size:1934496}
];
const dest='public/models/selva';await mkdir(dest,{recursive:true});
for(const asset of assets){
 const output=join(dest,asset.id+'.glb');
 try{
  const existing=await readFile(output);
  if(existing.length===asset.size&&existing.toString('ascii',0,4)==='glTF'){
   console.log('Cached verified',asset.id);continue;
  }
 }catch{}
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);
 try{
  const r=await fetch(asset.url,{signal:abort.signal});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const b=Buffer.from(await r.arrayBuffer());
  if(b.length!==asset.size||b.toString('ascii',0,4)!=='glTF')
   throw new Error('Incorrect GLB size or magic: '+b.length);
  await writeFile(output,b);
  console.log('Downloaded verified CC0 model',asset.id,b.length);
 }finally{clearTimeout(timer);}
}
await writeFile(join(dest,'LICENSES.json'),JSON.stringify({
 license:'CC0-1.0',sources:assets,notes:'Source packs: Quaternius Texture Fantasy Nature; Poly Haven Rocks & Geology. Assets from public CC0 mirror Papyszoo/CC0-Public-Domain-Models.'
},null,2)+'\n');
