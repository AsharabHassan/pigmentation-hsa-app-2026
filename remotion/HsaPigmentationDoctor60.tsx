import {Audio,Video} from '@remotion/media';
import {AbsoluteFill,Img,Sequence,interpolate,staticFile,useCurrentFrame} from 'remotion';
import captions from '../public/assets/hsa-doctor60-v1/captions.json';

const ROOT='assets/hsa-doctor60-v1/';
const GOLD='#D4AF37', IVORY='#F8F2E5', INK='#10110F';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const f=(s:number)=>Math.round(s*30);
const source='assets/hsa-cinematic/source/';
export type HsaPigmentationDoctor60Props={musicVolume:number;captionsEnabled:boolean};

function Brand({dark=false}:{dark?:boolean}){
 return <div style={{position:'absolute',top:106,right:75,textAlign:'right',color:dark?INK:IVORY}}><div style={{fontFamily:'Playfair Display',fontSize:49,letterSpacing:10}}>HSA</div><div style={{fontSize:16,letterSpacing:3.5,marginTop:9}}>HARLEY STREET AESTHETICS</div></div>;
}
function Label({children}:{children:React.ReactNode}){return <div style={{fontSize:23,fontWeight:600,letterSpacing:4,color:GOLD,textTransform:'uppercase'}}>{children}</div>}
function Doctor({start=0,close=false}:{start?:number;close?:boolean}){
 const frame=useCurrentFrame();
 return <AbsoluteFill><Video src={staticFile(ROOT+'doctor-paced.mp4')} trimBefore={Math.max(0,f(start-.4))} muted style={{width:'100%',height:'100%',objectFit:'cover',scale:interpolate(frame,[0,300],[close?1.12:1,close?1.15:1.035],clamp),transformOrigin:'50% 48%'}}/><AbsoluteFill style={{background:'linear-gradient(180deg,rgba(12,13,11,.62),transparent 39%,transparent 58%,rgba(12,13,11,.9) 100%)'}}/></AbsoluteFill>;
}
function Treatment({file,trim,title,number,subtitle}:{file:string;trim:number;title:string;number:string;subtitle:string}){
 const frame=useCurrentFrame();
 return <AbsoluteFill><Video src={staticFile(source+file)} trimBefore={f(trim)} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/><AbsoluteFill style={{background:'linear-gradient(180deg,rgba(10,12,10,.4),transparent 38%,transparent 56%,rgba(10,12,10,.94))'}}/><div style={{position:'absolute',left:76,right:76,top:1220,opacity:interpolate(frame,[0,8],[0,1],clamp),translate:`0 ${interpolate(frame,[0,14],[24,0],clamp)}px`}}><Label>THE PERSONALISED APPROACH · {number}</Label><div style={{fontFamily:'Playfair Display',fontSize:88,lineHeight:1.07,marginTop:20}}>{title}</div><div style={{fontSize:27,color:IVORY,marginTop:20}}>{subtitle}</div></div><div style={{position:'absolute',bottom:190,left:76,fontSize:18,letterSpacing:1,color:'#ddd'}}>REAL CLINIC FOOTAGE · HARLEY STREET MEDICS</div></AbsoluteFill>;
}
function AppShot({kind,title,step}:{kind:'hero'|'upload'|'scan'|'map'|'booking';title:string;step:string}){
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:IVORY,color:INK}}><Brand dark/><div style={{position:'absolute',top:268,left:76,right:76}}><Label>{step}</Label><div style={{fontFamily:'Playfair Display',fontSize:78,lineHeight:1.06,marginTop:22}}>{title}</div></div>
  <div style={{position:'absolute',left:kind==='scan'?125:100,right:kind==='scan'?125:100,top:515,height:1020,borderRadius:28,overflow:'hidden',boxShadow:'0 32px 70px #33291230',border:'1px solid #b8a46f55',background:'#eee7d7',scale:interpolate(frame,[0,180],[.99,1.015],clamp)}}>
  {kind==='scan'?<Video src={staticFile('assets/hsa-cinematic/app-capture/hsa-real-scan-capture.mp4')} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<Img src={staticFile(ROOT+`app-${kind}.png`)} style={{width:'100%',height:'100%',objectFit:kind==='map'?'contain':'cover',objectPosition:kind==='map'?'50% 50%':'50% 0%'}}/>}
  </div><div style={{position:'absolute',top:1570,left:76,right:76,fontSize:23,textAlign:'center',color:'#665a43'}}>EXAMPLE ANALYSIS · LICENSED MODEL IMAGE</div>
  <div style={{position:'absolute',bottom:105,left:76,right:76,fontSize:24,textAlign:'center',color:'#665a43'}}>Cosmetic guidance. Suitability confirmed at consultation.</div>
 </AbsoluteFill>;
}
function EndCard(){
 const frame=useCurrentFrame();
 return <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 30%,#353323 0%,#11130f 60%)',alignItems:'center',textAlign:'center',padding:'250px 90px 0'}}>
  <div style={{fontFamily:'Playfair Display',fontSize:125,letterSpacing:25,color:GOLD}}>HSA</div><div style={{fontSize:23,letterSpacing:5,marginTop:18}}>HARLEY STREET AESTHETICS</div>
  <div style={{width:110,height:2,background:GOLD,marginTop:65}}/>
  <div style={{fontFamily:'Playfair Display',fontSize:100,lineHeight:1.08,marginTop:70,opacity:interpolate(frame,[0,12],[0,1],clamp)}}>Your skin.<br/>Your next step.</div>
  <div style={{fontSize:34,lineHeight:1.6,color:'#d9d1be',marginTop:48}}>A personalised map.<br/>A doctor-led conversation.</div>
  <div style={{marginTop:85,borderRadius:60,padding:'30px 48px',background:GOLD,color:INK,fontSize:34,fontWeight:700}}>Try your free skin analysis ↗</div>
  <div style={{marginTop:56,fontSize:27,letterSpacing:5}}>LONDON · GLASGOW</div>
  <div style={{position:'absolute',bottom:200,left:100,right:100,fontSize:24,lineHeight:1.6,color:'#c5bdab'}}>Cosmetic guide, not a diagnosis.<br/>Treatment suitability confirmed by your clinician.</div>
 </AbsoluteFill>;
}
export function HsaPigmentationDoctor60({musicVolume=.15,captionsEnabled=true}:HsaPigmentationDoctor60Props){
 const frame=useCurrentFrame();const ms=frame/30*1000;
 const caption=captions.find(c=>ms>=c.startMs && ms<c.endMs+100);
 const app=frame>=f(27) && frame<f(40);
 return <AbsoluteFill style={{background:INK,color:IVORY,fontFamily:'Montserrat',overflow:'hidden'}}>
  <style>{`@font-face{font-family:Montserrat;src:url('${staticFile(ROOT+'font-0.ttf')}');font-weight:400}@font-face{font-family:Montserrat;src:url('${staticFile(ROOT+'font-2.ttf')}');font-weight:600}@font-face{font-family:Montserrat;src:url('${staticFile(ROOT+'font-3.ttf')}');font-weight:700}@font-face{font-family:'Playfair Display';src:url('${staticFile(ROOT+'font-4.ttf')}');font-weight:400}`}</style>
  <Sequence durationInFrames={f(13.4)}><Doctor/><Brand/><div style={{position:'absolute',top:285,left:76,right:76}}><Label>DR AHMAD · A PERSONALISED APPROACH</Label><div style={{fontFamily:'Playfair Display',fontSize:92,lineHeight:1.02,marginTop:24}}>Pigmentation<br/>deserves a <span style={{color:GOLD}}>plan.</span></div></div><div style={{position:'absolute',top:1260,left:76,right:76}}>{frame>=f(7)&&<div style={{borderTop:'1px solid #d4af3766',paddingTop:26,fontSize:29,lineHeight:1.7}}>VirtueRF · Laser · Mesotherapy<br/><span style={{color:'#d9d1be',fontSize:26}}>Personalised to your skin</span></div>}</div><div style={{position:'absolute',bottom:192,left:76,fontSize:20,color:'#d1c9b6'}}>DR AHMAD · AUTHORISED AI AVATAR</div></Sequence>
  <Sequence from={f(13.4)} durationInFrames={f(2.3)}><Treatment file="hsa-reel-4-C4_G-EatMd-.mp4" trim={3} title="VirtueRF" number="01" subtitle="Radiofrequency microneedling"/></Sequence>
  <Sequence from={f(15.7)} durationInFrames={f(2.2)}><Treatment file="hsa-reel-1-DIolH88CMgE.mp4" trim={3} title="Selected laser" number="02" subtitle="Chosen for your skin by your clinician"/></Sequence>
  <Sequence from={f(17.9)} durationInFrames={f(4.5)}><Treatment file="hsa-reel-1-DIolH88CMgE.mp4" trim={15} title="Mesotherapy" number="03" subtitle="Part of your personalised treatment discussion"/></Sequence>
  <Sequence from={f(22.4)} durationInFrames={f(4.6)}><Doctor start={22.4} close/><Brand/><div style={{position:'absolute',top:310,left:76,right:76}}><Label>PLANNED AROUND YOUR SKIN</Label><div style={{fontFamily:'Playfair Display',fontSize:84,lineHeight:1.1,marginTop:24}}>A course of care.<br/>Results vary.</div></div></Sequence>
  <Sequence from={f(27)} durationInFrames={f(4.3)}><AppShot kind="hero" step="YOUR FIRST STEP" title="Free AI pigmentation analysis"/></Sequence>
  <Sequence from={f(31.3)} durationInFrames={f(2.2)}><AppShot kind="upload" step="01 · YOUR SELFIE" title="Start with a clear photo."/></Sequence>
  <Sequence from={f(33.5)} durationInFrames={f(3.5)}><AppShot kind="scan" step="02 · YOUR INSIGHT" title="Explore visible tone."/></Sequence>
  <Sequence from={f(37)} durationInFrames={f(3)}><AppShot kind="map" step="03 · YOUR PERSONAL MAP" title="See the areas to discuss."/></Sequence>
  <Sequence from={f(40)} durationInFrames={f(10)}><Doctor start={40} close/><Brand/><div style={{position:'absolute',top:285,left:76,right:76}}><Label>AI INSIGHT. HUMAN EXPERTISE.</Label><div style={{fontFamily:'Playfair Display',fontSize:86,lineHeight:1.07,marginTop:25}}>A cosmetic guide.<br/><span style={{color:GOLD}}>Doctor-led care.</span></div></div><div style={{position:'absolute',top:1300,left:76,right:76,fontSize:29,lineHeight:1.5}}>Your clinician confirms suitability<br/>at consultation.</div><div style={{position:'absolute',bottom:192,left:76,fontSize:20,color:'#d1c9b6'}}>DR AHMAD · AUTHORISED AI AVATAR</div></Sequence>
  <Sequence from={f(50)} durationInFrames={f(4)}><AppShot kind="booking" step="YOUR NEXT STEP" title="Talk it through with our team."/></Sequence>
  <Sequence from={f(54)} durationInFrames={f(6)}><EndCard/></Sequence>
  <Sequence from={12}><Audio src={staticFile(ROOT+'narration.wav')}/></Sequence>
  <Audio src={staticFile(ROOT+'score-mixed.wav')} volume={t=>musicVolume*interpolate(t,[0,25,1605,1690,1740,1800],[0,.68,.68,1,1,0],clamp)}/>
  {[13.4,27,40].map(t=><Sequence key={t} from={f(t)}><Audio src={staticFile(ROOT+'sweep.mp3')} volume={.18}/></Sequence>)}
  <Sequence from={f(37)}><Audio src={staticFile(ROOT+'reveal.mp3')} volume={.16}/></Sequence><Sequence from={f(54)}><Audio src={staticFile(ROOT+'resolve.mp3')} volume={.19}/></Sequence>
  {captionsEnabled&&caption&&<div style={{position:'absolute',bottom:app||frame>=f(50)&&frame<f(54)?190:290,left:68,right:68,display:'flex',justifyContent:'center'}}><div style={{fontSize:39,fontWeight:600,lineHeight:1.35,textAlign:'center',background:'rgba(9,12,10,.88)',border:'1px solid #b69a4b44',borderRadius:18,padding:'19px 28px',color:IVORY,boxShadow:'0 8px 30px #0003'}}>{caption.text}</div></div>}
 </AbsoluteFill>;
}
