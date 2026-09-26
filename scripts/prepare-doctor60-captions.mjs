import fs from 'node:fs/promises';
const root='public/assets/hsa-doctor60-v1';
const alignment=JSON.parse(await fs.readFile(root+'/alignment-source.json','utf8'));
const words=alignment.words.filter(w=>w.text.trim()).map(w=>({text:w.text,startMs:Math.round((w.start/.84+.4)*1000),endMs:Math.round((w.end/.84+.4)*1000),timestampMs:null,confidence:null}));
const groups=[];let current=[];
for(const word of words){current.push(word);if(current.length>=5 || /[.!?,]$/.test(word.text)){groups.push({text:current.map(w=>w.text).join(' ').replace('Virtue R F','VirtueRF').replace('A I','AI'),startMs:current[0].startMs,endMs:word.endMs,timestampMs:null,confidence:null});current=[];}}
if(current.length)groups.push({text:current.map(w=>w.text).join(' '),startMs:current[0].startMs,endMs:current.at(-1).endMs,timestampMs:null,confidence:null});
await fs.writeFile(root+'/captions.json',JSON.stringify(groups,null,2));
await fs.writeFile(root+'/words.json',JSON.stringify(words,null,2));
console.log('Caption groups: '+groups.length+'; speech ends '+words.at(-1).endMs+'ms');
