import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve('public/assets/hsa-doctor60-v1');
await fs.mkdir(root, {recursive:true});
const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('ELEVENLABS_API_KEY is required');
const jobs = [
  {name:'score', endpoint:'music', body:{model_id:'music_v2', music_length_ms:60000, force_instrumental:true, sign_with_c2pa:true, prompt:'Original 60 second instrumental for a premium British doctor-led skin clinic film. Restrained felt piano, warm low strings, subtle electronic pulse at 92 BPM. Seconds 0-12 intimate curiosity with very soft piano, 12-28 gentle confident forward movement beneath a medical explanation, 28-44 clean delicate shimmering texture for a real skin analysis app, 44-54 warm human reassurance, 54-60 elegant resolved final chord with short clean decay. Spacious, sophisticated and calm. Leave the speech frequencies uncluttered. No vocals, no choir, no lyrics, no trailer drums, no aggressive drops.'}},
  {name:'sweep',endpoint:'sound-generation',body:{model_id:'eleven_text_to_sound_v2',duration_seconds:1.5,prompt_influence:0.3,text:'One restrained soft airy transition sweep, close and dry, delicate silk-like movement, immediate onset and short clean tail. No music, no speech, no alarm, no bass hit.'}},
  {name:'reveal',endpoint:'sound-generation',body:{model_id:'eleven_text_to_sound_v2',duration_seconds:2,prompt_influence:0.3,text:'One delicate glass confirmation tick opening into a subtle warm tonal bloom. Precise immediate attack, reassuring sophisticated report reveal, short clean tail. No melody, no speech, no alarm.'}},
  {name:'resolve',endpoint:'sound-generation',body:{model_id:'eleven_text_to_sound_v2',duration_seconds:2.5,prompt_influence:0.3,text:'One soft warm polished tonal accent for a premium clinic closing logo, rounded immediate attack, gentle elegant decay, subtle and unobtrusive. No speech, no musical sequence, no impact boom.'}},
];
for (const job of jobs) {
  const hash=crypto.createHash('sha256').update(JSON.stringify(job)).digest('hex');
  const metaPath=path.join(root,job.name+'.json');
  const dest=path.join(root,job.name+'.mp3');
  try {const old=JSON.parse(await fs.readFile(metaPath,'utf8')); if(old.hash===hash && (await fs.stat(dest)).size>1000){console.log(job.name+': cached');continue;}} catch {}
  const response=await fetch('https://api.elevenlabs.io/v1/'+job.endpoint,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify(job.body),signal:AbortSignal.timeout(240000)});
  if(!response.ok){const err=await response.json().catch(()=>({})); console.log(JSON.stringify({asset:job.name,status:response.status,detail:err.detail}));process.exitCode=1;break;}
  const bytes=Buffer.from(await response.arrayBuffer());
  await fs.writeFile(dest,bytes);
  await fs.writeFile(metaPath,JSON.stringify({hash,provider:'ElevenLabs',generated:new Date().toISOString(),request:job.body,bytes:bytes.length,requestId:response.headers.get('request-id')},null,2));
  console.log(job.name+': generated '+bytes.length+' bytes');
}
