// CC0 physically based stone surface for weathered cobbles.
// https://polyhaven.com/a/rock_surface (Amal Kumar / Poly Haven, CC0).
// Download by Poly Haven's authoritative files API, not guessed CDN URLs.
import {mkdir,writeFile} from 'node:fs/promises';
const manifest='https://api.polyhaven.com/files/rock_surface';
const target='public/textures/stone';
async function get(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(40000)});
 if(!response.ok)throw new Error('HTTP '+response.status+' '+url);
 return response;
}
try{
 const files=await (await get(manifest)).json();
 const maps=[
  ['Diffuse','rock_surface_diff_1k.jpg'],
  ['nor_gl','rock_surface_nor_gl_1k.jpg']
 ];
 await mkdir(target,{recursive:true});
 for(const [key,filename] of maps){
  const variants=files[key]||files[key.toLowerCase()];
  const url=variants?.['1k']?.jpg?.url;
  if(!url||!url.startsWith('https://dl.polyhaven.org/'))
   throw new Error('Missing verified 1k JPG '+key+' from Poly Haven API');
  const buffer=Buffer.from(await (await get(url)).arrayBuffer());
  if(buffer.length<5000||buffer[0]!==0xff||buffer[1]!==0xd8)
   throw new Error('Invalid JPEG: '+filename);
  await writeFile(target+'/'+filename,buffer);
  console.log('CC0 rock surface',filename,buffer.length,'bytes');
 }
 await writeFile(target+'/license.txt',
  'Rock Surface by Amal Kumar (Poly Haven) — CC0 1.0. https://polyhaven.com/a/rock_surface\n');
}catch(error){
 console.warn('PBR material unavailable; builtin weathered stone fallback remains:',error.message);
 // The game still renders with procedural material when the provider is offline.
}
