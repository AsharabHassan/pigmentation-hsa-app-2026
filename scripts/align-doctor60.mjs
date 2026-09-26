import fs from 'node:fs/promises';
const root='public/assets/hsa-doctor60-v1';
const text="Pigmentation deserves a plan. It starts with understanding what's visible, and choosing treatment carefully. At Harley Street Aesthetics, our approach brings together three treatment options, personalised to your skin. Virtue R F microneedling, carefully selected laser treatment, and mesotherapy. Your clinician decides which combination is appropriate. A course of sessions may be needed, and results vary. Start with our free A I pigmentation analysis. Upload a clear selfie to explore visible dark spots and uneven tone, with a personalised map and report. It's a cosmetic guide, not a diagnosis. Our clinical team reviews your report and confirms suitability at consultation. Take your first step. Try your free skin analysis with Harley Street Aesthetics.";
await fs.writeFile(root+'/script.txt',text+'\n');
const form=new FormData();form.append('text',text);form.append('file',new Blob([await fs.readFile(root+'/doctor-source.wav')],{type:'audio/wav'}),'doctor.wav');
const response=await fetch('https://api.elevenlabs.io/v1/forced-alignment',{method:'POST',headers:{'xi-api-key':process.env.ELEVENLABS_API_KEY},body:form});
if(!response.ok){const e=await response.json();console.log(JSON.stringify({status:response.status,detail:e.detail}));process.exit(1);}
const data=await response.json();await fs.writeFile(root+'/alignment-source.json',JSON.stringify(data,null,2));console.log(JSON.stringify({words:data.words?.length,first:data.words?.slice(0,5),last:data.words?.slice(-4)}));
