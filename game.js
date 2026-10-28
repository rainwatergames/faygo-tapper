/*! FAYGO TAPPER v0.1 ALPHA — © 2026 Rainwater Games (Jeff Rainwater). All rights reserved.
 * Private fan game. Not affiliated with, endorsed by, or sponsored by Faygo or Brooklyn Menace.
 * All code, art, music and sound are original and generated at runtime. */
(()=>{'use strict';
const VERSION='0.3';
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
const rnd=(a,b)=>a+Math.random()*(b-a),ri=n=>Math.floor(Math.random()*n),pick=a=>a[ri(a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const FONT='Lilita,"Trebuchet MS",sans-serif';
const FLAV=[{n:'Red Pop',c:'#ff2a3d',d:'#a3001a'},{n:'Orange',c:'#ff8a1c',d:'#b34d00'},{n:'Grape',c:'#9b4dff',d:'#5a1db3'},{n:'Moon Mist',c:'#27e07a',d:'#0f8a45'},{n:'Rock & Rye',c:'#d98a45',d:'#8a4b1a'},{n:'Black Cherry',c:'#d6246e',d:'#6d0f33'}];
const BULB=['#ff2a3d','#ffe14a','#27e07a','#3bb6ff','#ff3cac','#ff8a1c'];
const HOODS=['#222','#3b0764','#7f1d1d','#14532d','#1e3a8a','#111827','#4a044e','#7c2d12'];
const HAIRC=['#39ff6a','#a855f7','#ff3b3b','#3bb6ff','#151515','#ff8a1c','#ffe14a'];

// ---------- settings / storage ----------
const SET=Object.assign({mus:0.6,sfx:0.85,vib:true,calm:matchMedia('(prefers-reduced-motion: reduce)').matches},JSON.parse(localStorage.getItem('ft-set')||'{}'));
function saveSet(){localStorage.setItem('ft-set',JSON.stringify(SET));applyVol();}
function getHS(){try{return JSON.parse(localStorage.getItem('ft-hs')||'[]');}catch(e){return [];}}
function setHS(a){localStorage.setItem('ft-hs',JSON.stringify(a));}

// ================= AUDIO =================
const QS=new URLSearchParams(location.search);const TEST={wave:Math.max(1,Math.min(30,parseInt(QS.get('wave'))||1)),mode:(QS.get('test')||'').toLowerCase()};TEST.on=TEST.wave>1||!!TEST.mode;
function vib(p){try{if(SET.vib&&navigator.vibrate)navigator.vibrate(p);}catch(e){}}
const AU={ctx:null};
function audioInit(){
 if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 const c=new AC();AU.ctx=c;
 const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(c.destination);
 AU.mus=c.createGain();AU.sfx=c.createGain();AU.mus.connect(comp);AU.sfx.connect(comp);
 const len=c.sampleRate*2,nb=c.createBuffer(1,len,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.noise=nb;
 AU.lfo=c.createOscillator();AU.lfo.frequency.value=5.6;AU.lfoG=c.createGain();AU.lfoG.gain.value=14;AU.lfo.connect(AU.lfoG);AU.lfo.start();
 const cur=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cur[i]=Math.tanh(x*3);}AU.curve=cur;
 applyVol();
}
function applyVol(){if(!AU.ctx)return;AU.mus.gain.value=SET.mus*0.55;AU.sfx.gain.value=SET.sfx*0.9;}
const hz=m=>440*Math.pow(2,(m-69)/12);
function env(g,t,a,peak,dec,end){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec);}
function osc(type,f,t,dur,dest){const o=AU.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.connect(dest);o.start(t);o.stop(t+dur+0.05);return o;}
function gainN(dest,v){const g=AU.ctx.createGain();g.gain.value=v==null?1:v;g.connect(dest);return g;}
function noiseN(t,dur,dest){const s=AU.ctx.createBufferSource();s.buffer=AU.noise;s.connect(dest);s.start(t,Math.random()*1.5);s.stop(t+dur+0.05);return s;}
function filt(type,f,q,dest){const b=AU.ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q)b.Q.value=q;b.connect(dest);return b;}
// instruments (dest = music bus by default)
const I={
 kick(t,v=1,D=AU.mus){const g=gainN(D,0);env(g,t,0.004,v,0.42);const o=osc('sine',160,t,0.5,g);o.frequency.exponentialRampToValueAtTime(42,t+0.13);
  const cg=gainN(D,0);env(cg,t,0.001,v*0.5,0.025);osc('square',900,t,0.03,cg);},
 snare(t,v=1,D=AU.mus){const g=gainN(D,0);env(g,t,0.002,v*0.75,0.2);noiseN(t,0.25,filt('bandpass',1900,0.7,g));
  const g2=gainN(D,0);env(g2,t,0.002,v*0.5,0.09);const o=osc('triangle',220,t,0.12,g2);o.frequency.exponentialRampToValueAtTime(150,t+0.09);},
 clap(t,v=1,D=AU.mus){for(let i=0;i<3;i++){const g=gainN(D,0);env(g,t+i*0.011,0.001,v*0.5,0.06+(i==2?0.12:0));noiseN(t+i*0.011,0.2,filt('bandpass',1300,1.2,g));}},
 hat(t,v=1,open=false,D=AU.mus){const g=gainN(D,0);env(g,t,0.001,v*0.32,open?0.22:0.035);noiseN(t,0.3,filt('highpass',7500,0,g));},
 bass(t,m,dur,v=1,D=AU.mus){const ws=AU.ctx.createWaveShaper();ws.curve=AU.curve;const g=gainN(D,0);ws.connect(g);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*0.55,t+0.008);g.gain.setValueAtTime(v*0.5,t+Math.max(0.02,dur-0.06));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+0.12);
  const lp=filt('lowpass',420,1,ws);const o=osc('sine',hz(m)*1.9,t,dur+0.15,lp);o.frequency.exponentialRampToValueAtTime(hz(m),t+0.05);},
 pluck(t,m,v=1,D=AU.mus){const g=gainN(D,0);env(g,t,0.003,v*0.4,0.22);osc('triangle',hz(m),t,0.3,filt('lowpass',900,0,g));},
 organ(t,m,dur,v=1,D=AU.mus){const g=gainN(D,0);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*0.13,t+0.02);g.gain.setValueAtTime(v*0.11,t+Math.max(0.03,dur-0.03));g.gain.exponentialRampToValueAtTime(0.0001,t+dur+0.09);
  const lp=filt('lowpass',2600,0.8,g);
  [['square',1,0.5],['triangle',2,0.7],['sine',4,0.25]].forEach(([ty,mul,lv])=>{const gg=gainN(lp,lv);const o=osc(ty,hz(m)*mul,t,dur+0.12,gg);AU.lfoG.connect(o.detune);});},
 mbox(t,m,v=1,D=AU.mus){const g=gainN(D,0);env(g,t,0.002,v*0.22,1.1);osc('sine',hz(m),t,1.2,g);const g2=gainN(D,0);env(g2,t,0.001,v*0.07,0.25);osc('sine',hz(m)*3.02,t,0.3,g2);},
 pad(t,notes,dur,v=1,D=AU.mus){const g=gainN(D,0);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v*0.05,t+dur*0.35);g.gain.linearRampToValueAtTime(0.0001,t+dur);
  const lp=filt('lowpass',850,2,g);notes.forEach(m=>{[-9,9].forEach(dt=>{const o=osc('sawtooth',hz(m),t,dur+0.05,lp);o.detune.value=dt;});});},
 stab(t,m,v=1,D=AU.mus){const g=gainN(D,0);env(g,t,0.003,v*0.12,0.18);const lp=filt('lowpass',1800,6,g);lp.frequency.exponentialRampToValueAtTime(300,t+0.18);
  [0,0.07].forEach(dt=>{const o=osc('sawtooth',hz(m)*(1+dt*0.01),t,0.25,lp);o.frequency.exponentialRampToValueAtTime(hz(m)*0.94,t+0.2);});},
 block(t,v=1,D=AU.mus){const g=gainN(D,0);env(g,t,0.001,v*0.25,0.05);osc('sine',1250,t,0.08,filt('bandpass',1250,4,g));},
 hey(t,v=1,D=AU.mus){const g=gainN(D,0);env(g,t,0.01,v*0.28,0.18);const f1=filt('bandpass',700,5,g),f2=filt('bandpass',1300,6,g);
  [175,178,240].forEach(f=>{const o=osc('sawtooth',f,t,0.25,f1);o.connect(f2);o.frequency.linearRampToValueAtTime(f*1.12,t+0.08);});}
};
// --- note parsing & tracks (all original compositions, D minor "dark carnival") ---
const NB={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function nm(s){const m=/^([A-G])([#b]?)(-?\d)$/.exec(s);if(!m)return null;return NB[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)+12*(+m[3]+1);}
const seq=s=>s.trim().split(/\s+/).map(x=>x==='.'?null:x==='-'?'-':nm(x));
const bars=a=>a.map(seq);
const CH={Dm:{r:38,n:[62,65,69]},Bb:{r:34,n:[58,62,65]},Eb:{r:39,n:[58,63,67]},A:{r:33,n:[57,61,64]},C:{r:36,n:[55,60,64]},Gm:{r:43,n:[55,58,62]},F:{r:41,n:[57,60,65]}};
const TR={
 title:{bpm:()=>82,swing:0.06,ch:['Dm','Bb','Gm','A'],k:'x.........x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.x.',bass:'R - - - - - - . . . R - F - . .',
  lead:bars(['A4 - - . D5 - F5 - E5 - D5 - C#5 - D5 -','F5 - - . E5 - D5 - Bb4 - - - A4 - - .','G4 - Bb4 - D5 - G5 - F5 - E5 - D5 - Bb4 -','A4 - - - C#5 - E5 - G5 - - - F5 E5 C#5 .',
   'D5 . F5 . A5 - - . Bb5 - A5 - G5 - F5 -','E5 - D5 - Bb4 - D5 - F5 - - - . . . .','D5 - C5 - Bb4 - G4 - Bb4 - D5 - G5 - - .','E5 - - . C#5 - - . A4 - - - . . . .']),leadFrom:4,arp:true,padOn:true},
 gameA:{bpm:()=>94+Math.min(8,(G.level-1)*3),ch:['Dm','Bb','Eb','A'],k:'x.....x...x.....',s:'....x.......x...',h:'x.x.x.x.x.x.x.xx',bass:'R - - . . . R . . . R - . . O .',
  lead:bars(['D5 . F5 . A5 . F5 . G#5 . A5 . F5 . D5 .','Bb4 . D5 . F5 . D5 . E5 . F5 . D5 . Bb4 .','Eb5 . G5 . Bb5 . G5 . A5 . Bb5 . G5 . Eb5 .','C#5 . E5 . A5 . E5 . G5 - F5 - E5 - C#5 -']),leadFrom:0,arp:false,padOn:true,stab:false},
 gameB:{bpm:()=>104+Math.min(18,(G.level-3)*3),ch:['Dm','C','Bb','A'],k:'x..x..x...x..x..',s:'....x.......x..x',h:'xxxxxxxxxxxxxxxx',bass:'R - . R . . R - . R . . O - F -',
  lead:bars(['D5 D5 A5 . D5 D5 Bb5 . D5 D5 A5 . G5 . F5 .','C5 C5 G5 . C5 C5 A5 . C5 C5 G5 . F5 . E5 .','Bb4 Bb4 F5 . Bb4 Bb4 G5 . Bb4 Bb4 F5 . E5 . D5 .','A4 A4 E5 . A4 A4 F5 . C#5 . E5 . G5 . A5 .']),leadFrom:0,arp:true,padOn:true,stab:true,hey:true},
 bonus:{bpm:()=>116,swing:0.17,ch:['Dm','A','Bb','A'],k:'x.......x.......',s:'....x.......x...',h:'',block:true,bass:'R . . . F . . . R . . . F . O .',pizz:true,
  lead:bars(['D6 . E6 F6 . E6 D6 . C#6 . D6 . A5 . . .','E6 . F6 G6 . F6 E6 . D6 . C#6 . A5 . . .','F6 . G6 A6 . G6 F6 . E6 . D6 . Bb5 . . .','A5 . C#6 . E6 . G6 . F6 . E6 . D6 . . .']),leadFrom:0,box:true}
};
const MUS={name:null,step:0,next:0};
function setTrack(n){if(MUS.name===n)return;MUS.name=n;MUS.step=0;if(AU.ctx)MUS.next=AU.ctx.currentTime+0.08;}
function playStep(T,step,t,sd){
 const i=step%16,bar=Math.floor(step/16),nb=T.ch.length,cb=T.ch[bar%nb],c=CH[cb],big=bar%8;
 const fill=big===7&&i>=12;
 if(T.k[i]==='x')I.kick(t,0.95);
 if(T.s[i]==='x'){I.snare(t,0.8);if(MUS.name!=='title')I.clap(t,0.45);}
 if(fill&&i%1===0&&MUS.name!=='title'&&MUS.name!=='bonus')I.snare(t,0.35+0.1*(i-12));
 if(T.h&&T.h[i]==='x')I.hat(t,i%4===2?0.9:0.55,i===14&&MUS.name==='title');
 if(T.block&&i%2===0)I.block(t,i%4===0?1:0.6);
 // bass
 const bt=T.bass.split(' ');const tk=bt[i];
 if(tk==='R'||tk==='O'||tk==='F'){let n=i+1,len=1;while(n<16&&bt[n]==='-'){len++;n++;}
  const m=c.r+(tk==='O'?12:tk==='F'?7:0);if(T.pizz)I.pluck(t,m+12,1.2);else I.bass(t,m,len*sd,0.95);}
 // lead
 const lb=T.lead[bar%T.lead.length];const on=big>=T.leadFrom||T.leadFrom===0;
 if(on&&lb){const m=lb[i];if(typeof m==='number'){let n=i+1,len=1;while(n<16&&lb[n]==='-'){len++;n++;}
  if(T.box)I.mbox(t,m,1.1);else I.organ(t,m,len*sd*0.92,MUS.name==='gameB'?0.9:1);
  if(MUS.name==='gameB'&&big>=4)I.organ(t,m+12,len*sd*0.8,0.4);}}
 if(T.arp&&i%2===0){const k=[0,2,1,2,0,2,1,2][i/2];const m=c.n[k]+12+(i===8?12:0);I.mbox(t,m,MUS.name==='title'?0.8:0.45);}
 if(T.padOn&&i===0&&(MUS.name==='title'||big>=4))I.pad(t,c.n.map(x=>x-12),sd*16,1);
 if(T.stab&&(i===6||i===14))I.stab(t,c.n[0]-12,1);
 if(T.hey&&big===7&&(i===12||i===14))I.hey(t,1);
}
function musTick(){
 if(!AU.ctx||!MUS.name||AU.ctx.state!=='running')return;const T=TR[MUS.name];const c=AU.ctx;
 if(MUS.next<c.currentTime-0.25)MUS.next=c.currentTime+0.05;
 while(MUS.next<c.currentTime+0.16){const sd=60/T.bpm()/4;playStep(T,MUS.step,MUS.next,sd);
  MUS.next+=T.swing?sd*(MUS.step%2===0?1+T.swing:1-T.swing):sd;MUS.step++;}
}
setInterval(musTick,30);
// --- SFX ---
const S={
 ok(){return AU.ctx&&AU.ctx.state==='running';},
 pour(){if(!S.ok())return;const t=AU.ctx.currentTime,D=AU.sfx;const g=gainN(D,0);env(g,t,0.02,0.35,0.28);const bp=filt('bandpass',500,3,g);bp.frequency.exponentialRampToValueAtTime(2200,t+0.25);noiseN(t,0.32,bp);
  for(let i=0;i<5;i++){const tt=t+0.04+i*0.045;const gg=gainN(D,0);env(gg,tt,0.002,0.12,0.05);const o=osc('sine',rnd(600,1400),tt,0.07,gg);o.frequency.exponentialRampToValueAtTime(rnd(1500,2600),tt+0.05);}},
 slide(){if(!S.ok())return;const t=AU.ctx.currentTime;const g=gainN(AU.sfx,0);env(g,t,0.03,0.3,0.45);const lp=filt('bandpass',700,1.5,g);lp.frequency.exponentialRampToValueAtTime(2500,t+0.4);noiseN(t,0.5,lp);},
 catchD(){if(!S.ok())return;const t=AU.ctx.currentTime;const g=gainN(AU.sfx,0);env(g,t,0.002,0.4,0.12);const o=osc('sine',300,t,0.15,g);o.frequency.exponentialRampToValueAtTime(120,t+0.1);
  const g2=gainN(AU.sfx,0);env(g2,t,0.002,0.18,0.15);osc('triangle',hz(rnd(74,79)|0),t,0.2,g2);},
 clink(){if(!S.ok())return;const t=AU.ctx.currentTime;[2637,3951,5274].forEach((f,i)=>{const g=gainN(AU.sfx,0);env(g,t+i*0.012,0.001,0.22/(i+1),0.3);osc('sine',f,t+i*0.012,0.35,g);});},
 crash(){if(!S.ok())return;const t=AU.ctx.currentTime;const g=gainN(AU.sfx,0);env(g,t,0.002,0.8,0.35);noiseN(t,0.45,filt('highpass',1500,0,g));
  for(let i=0;i<9;i++){const tt=t+rnd(0,0.3);const gg=gainN(AU.sfx,0);env(gg,tt,0.001,0.15,rnd(0.05,0.18));osc('sine',rnd(2500,6500),tt,0.2,gg);}},
 coin(){if(!S.ok())return;const t=AU.ctx.currentTime;[988,1319,1976].forEach((f,i)=>{const g=gainN(AU.sfx,0);env(g,t+i*0.07,0.002,0.16,0.18);osc('square',f,t+i*0.07,0.2,filt('lowpass',4000,0,g));});},
 whoop(n=4,v=1){if(!S.ok())return;const t0=AU.ctx.currentTime;
  for(let w=0;w<2;w++)for(let k=0;k<n;k++){const t=t0+w*0.34+rnd(0,0.05);const g=gainN(AU.sfx,0);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.16*v,t+0.04);g.gain.exponentialRampToValueAtTime(0.0001,t+0.3);
   const f1=filt('bandpass',350,4,g),f2=filt('bandpass',900,5,g);f1.frequency.linearRampToValueAtTime(750,t+0.22);f2.frequency.linearRampToValueAtTime(1200,t+0.22);
   const b=rnd(150,260);const o=osc('sawtooth',b,t,0.32,f1);o.connect(f2);o.frequency.exponentialRampToValueAtTime(b*1.9,t+0.2);o.frequency.exponentialRampToValueAtTime(b*1.6,t+0.3);
   const ng=gainN(f1,0.08);noiseN(t,0.3,ng);}},
 lose(){if(!S.ok())return;const t=AU.ctx.currentTime;[62,61,60,55].forEach((m,i)=>I.organ(t+i*0.2,m,i==3?0.6:0.18,1.6,AU.sfx));},
 spray(dur=1.6){if(!S.ok())return;const t=AU.ctx.currentTime;const g=gainN(AU.sfx,0);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.45,t+0.06);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  const bp=filt('bandpass',3000,0.8,g);bp.frequency.exponentialRampToValueAtTime(900,t+dur);noiseN(t,dur+0.1,bp);
  for(let i=0;i<14;i++){const tt=t+rnd(0,dur*0.8);const gg=gainN(AU.sfx,0);env(gg,tt,0.001,0.06,0.03);osc('sine',rnd(2000,5000),tt,0.05,gg);}},
 jingle(){if(!S.ok())return;const t=AU.ctx.currentTime;[62,65,69,74,77,81].forEach((m,i)=>I.organ(t+i*0.09,m,0.16,1.4,AU.sfx));},
 swish(){if(!S.ok())return;const t=AU.ctx.currentTime;const g=gainN(AU.sfx,0);env(g,t,0.02,0.18,0.15);const bp=filt('bandpass',1200,2,g);bp.frequency.exponentialRampToValueAtTime(400,t+0.15);noiseN(t,0.2,bp);},
 rattle(){if(!S.ok())return;const t=AU.ctx.currentTime;for(let i=0;i<10;i++){const tt=t+i*0.07;const g=gainN(AU.sfx,0);env(g,tt,0.001,0.12,0.04);noiseN(tt,0.06,filt('bandpass',rnd(2500,4500),3,g));}},
 tick(){if(!S.ok())return;I.block(AU.ctx.currentTime,0.8,AU.sfx);},
 over(){if(!S.ok())return;const t=AU.ctx.currentTime;[69,68,67,66,62].forEach((m,i)=>I.organ(t+i*0.28,m,i===4?1.2:0.25,1.6,AU.sfx));I.kick(t+1.4,1,AU.sfx);}
};

// ================= LAYOUT =================
let W=0,H=0,DPR=1;const L={};
function resize(){
 DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';
 const land=W>H*1.1;L.land=land;
 L.hudH=land?40:62;
 if(!land){L.ctrlH=clamp(H*0.16,110,170);L.ctrlW=0;L.playTop=L.hudH+8;L.playBot=H-L.ctrlH;}
 else{L.ctrlH=0;L.ctrlW=clamp(W*0.15,110,170);L.playTop=L.hudH+4;L.playBot=H-4;}
 L.laneH=(L.playBot-L.playTop)/4;const lh=L.laneH;
 L.right=W-L.ctrlW;L.fountW=Math.min(lh*0.5,W*0.13);L.doorW=Math.min(lh*0.42,W*0.1);
 L.x0=L.fountW+lh*0.42;L.x1=L.right-L.doorW-lh*0.12;
 L.unit=Math.min(lh,(L.x1-L.x0)*0.42);
 if(!land){const cy=H-L.ctrlH/2;const r=Math.min(L.ctrlH*0.36,W*0.15);const rs=Math.min(r*0.62,W*0.075);L.btnPour={x:W*0.84,y:cy,r:Math.min(r*1.05,W*0.14)};L.btnUp={x:W*0.1,y:cy,r:rs};L.btnDn={x:W*0.27,y:cy,r:rs};L.btnL={x:W*0.45,y:cy,r:rs};L.btnR={x:W*0.62,y:cy,r:rs};}
 else{const cx=W-L.ctrlW/2;const r=Math.min(L.ctrlW*0.36,H*0.16);L.btnPour={x:cx,y:H*0.8,r:r*1.1};L.btnUp={x:cx-r*0.8,y:H*0.3,r:r*0.6};L.btnDn={x:cx+r*0.8,y:H*0.3,r:r*0.6};L.btnL={x:cx-r*0.8,y:H*0.53,r:r*0.6};L.btnR={x:cx+r*0.8,y:H*0.53,r:r*0.6};}
 L.gear={x:W-24,y:L.hudH/2,r:17};
 STARS.length=0;for(let i=0;i<70;i++)STARS.push([Math.random()*W,Math.random()*H,Math.random()*1.6+0.3,Math.random()*6]);
}
const STARS=[];
const laneTop=i=>L.playTop+i*L.laneH;
const barY=i=>laneTop(i)+L.laneH*0.66;
const ux=u=>L.x0+u*(L.x1-L.x0);

// ================= GAME STATE =================
const G={state:'boot',score:0,hi:0,level:1,lives:3,lane:0,cust:[],drinks:[],empties:[],tips:[],parts:[],floats:[],toSpawn:0,spawnT:0,
 pend:null,pourT:0,pourCD:0,dash:null,show:0,banner:null,oops:null,t:0,bonus:null,nextLife:10000,flash:0,shakeT:0,hold:false,holdT:0,press:null,bot:false,botCD:0,
 laneAnim:0,bu:0,walk:0,flav:0,combo:0,tut:null,conf:0,stats:{served:0,empties:0,tips:0,perfect:0},ft:[],dts:[],botPickWrong:false};
G.hi=(getHS()[0]||{s:0}).s;
window.__FT=G;

function newCust(lane,u){return {lane,u:u==null?1.06:u,st:'walk',t:0,ph:Math.random()*3,hair:ri(6),paint:ri(6),acc:ri(3),hc:pick(HAIRC),hood:pick(HOODS),flav:lane,spd:custSpd(),dk:0,got:0,rowdy:G.state==='play'&&G.level>=5&&Math.random()<Math.min(0.25,0.06+0.03*(G.level-5)),want:G.state==='play'&&G.level>=4&&Math.random()<Math.min(0.3,0.1+0.04*(G.level-4))?ri(4):-1,from:0,to:0,mood:0,id:Math.random()};}
function custSpd(){return Math.min(0.11,0.04+0.006*(G.level-1))*rnd(0.92,1.08);}
function waveSize(){return 4+2*G.level;}
function spawnGap(){return Math.max(0.9,3.0-0.2*(G.level-1))*rnd(0.8,1.2);}

function startGame(){audioInit();G.score=0;G.level=TEST.wave;G.lives=3;G.nextLife=10000;G.combo=0;G.stats={served:0,empties:0,tips:0,perfect:0};showOv(null);startLevel();S.whoop(5);
 G.tut=(G.level===1&&(TEST.mode==='tutorial'||(!localStorage.getItem('ft-tut')&&!G.bot&&!TEST.on)))?{step:0,t:0}:null;tutShow();}
const TUT=['👆 Tap a bar to move Brooklyn there','🍾 Tap your bar again (or POUR) to slide a Faygo','🥤 Catch the empties they slide back! Hold ◀ ▶ or drag Brooklyn to run along the bar','💬 Some Juggalos want a flavor. Tap the fountain to switch flavors for a PERFECT POUR bonus'];
function tutShow(){const el=$('tut');if(!el)return;if(!G.tut){el.classList.add('hide');return;}el.classList.remove('hide');$('tutTxt').textContent=TUT[G.tut.step];$('tutN').textContent=(G.tut.step+1)+'/'+TUT.length;}
function tutNext(from){if(!G.tut||G.tut.step!==from)return;G.tut.step++;G.tut.t=0;if(G.tut.step>=TUT.length)tutEnd();else tutShow();}
function tutEnd(){G.tut=null;localStorage.setItem('ft-tut','1');tutShow();}
function startLevel(){
 G.cust=[];G.drinks=[];G.empties=[];G.tips=[];G.parts=[];G.pend=null;G.dash=null;G.show=0;G.lane=clamp(G.lane,0,3);
 G.bu=0;G.walk=0;G.flav=G.lane;G.toSpawn=waveSize();G.spawnT=1.4;G.state='play';G.banner={txt:'WAVE '+G.level,sub:G.level===1?'Keep the Faygo flowin\'!':'Faster & thirstier!',t:2.2};
 setTrack(G.level<=2?'gameA':'gameB');
}
function mult(){return 1+Math.min(4,Math.floor(G.combo/5));}
function addScore(n,x,y,col){G.score+=n;if(x!=null)G.floats.push({x,y,txt:'+'+n,t:1,col:col||'#ffe14a'});
 if(G.score>=G.nextLife){G.nextLife+=20000;if(G.lives<5){G.lives++;G.floats.push({x:W/2,y:H*0.4,txt:'EXTRA LIFE!',t:1.6,col:'#27e07a',big:1});S.jingle();}}
 if(G.score>G.hi)G.hi=G.score;}
function moveLane(l){if(G.dash||l===G.lane||l<0||l>3)return;G.lane=l;G.flav=l;G.bu=0;G.laneAnim=0.12;S.swish();tutNext(0);}
function cycleFlav(){G.flav=(G.flav+1)%4;S.clink();G.floats.push({x:L.fountW+L.laneH*0.3,y:barY(G.lane)-L.laneH*0.5,txt:FLAV[G.flav].n,t:0.9,col:FLAV[G.flav].c});}
function pour(){if(G.state!=='play'||G.dash||G.pourCD>0)return;G.pourCD=0.38;G.pourT=0.28;G.bu=0;G.pend={lane:G.lane,t:0.22,flav:G.flav};S.pour();tutNext(1);}
function grabTip(tp){if(G.dash||G.state!=='play')return;G.lane=tp.lane;G.bu=0;G.dash={lane:tp.lane,u:tp.u,t:0,dur:0.55,tip:tp,got:false};S.swish();}
function loseLife(why,lane,u){
 if(G.state!=='play')return;G.lives--;G.combo=0;vib([90,50,140]);G.state='oops';G.oops={t:2.0,why,lane,u};S.crash();setTimeout(S.lose,180);
 if(!SET.calm)G.flash=0.5;G.shakeT=0.35;
 const x=ux(clamp(u,0,1.05)),y=barY(lane);burst(x,y-10,FLAV[lane].c,20,1);
}
function afterOops(){
 const back=G.cust.filter(c=>c.st!=='exit').length;G.toSpawn+=back;G.cust=[];G.drinks=[];G.empties=[];G.tips=[];G.pend=null;G.dash=null;G.show=0;
 if(G.lives<=0){gameOver();return;}G.state='play';G.spawnT=1.6;G.banner={txt:'GET READY',sub:G.lives+(G.lives===1?' life':' lives')+' left',t:1.5};
}
function gameOver(){G.state='over';setTrack(null);S.over();G.overT=1.4;}
function collectTip(tp){G.tips=G.tips.filter(x=>x!==tp);addScore(1000,ux(tp.u),barY(tp.lane)-30,'#27e07a');G.stats.tips++;S.coin();vib(40);
 G.show=3.4;G.banner={txt:'FAYGO SPRAY SHOW!',sub:'The crowd goes wild!',t:2.2};S.spray(2.4);setTimeout(()=>S.whoop(6),250);}
function burst(x,y,col,n,sp){if(SET.calm)n=Math.ceil(n*0.6);for(let i=0;i<n;i++){const a=rnd(0,Math.PI*2),v=rnd(60,260)*(sp||1);G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-120,life:rnd(0.5,1.1),max:1,col,sz:rnd(2,5)});}}

function update(dt){
 G.t+=dt;
 for(const p of G.parts){p.life-=dt;p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}G.parts=G.parts.filter(p=>p.life>0);if(G.parts.length>500)G.parts.splice(0,G.parts.length-500);
 for(const f of G.floats){f.t-=dt;f.y-=40*dt;}G.floats=G.floats.filter(f=>f.t>0);
 if(G.flash>0)G.flash-=dt;if(G.shakeT>0)G.shakeT-=dt;if(G.laneAnim>0)G.laneAnim-=dt;
 if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null;}
 if(G.state==='title'){attract(dt);return;}
 if(G.state==='oops'){G.oops.t-=dt;if(G.oops.t<=0)afterOops();return;}
 if(G.state==='clear'){if(G.conf>0){G.conf-=dt;const n=SET.calm?1:4;for(let k=0;k<n;k++)G.parts.push({x:rnd(0,W-L.ctrlW),y:L.playTop-10,vx:rnd(-60,60),vy:rnd(-80,40),life:1.8,max:1.8,col:pick(BULB),sz:rnd(4,8)});}G.clearT-=dt;if(G.clearT<=0)startBonus();return;}
 if(G.state==='bonus'){updBonus(dt);return;}
 if(G.state==='over'){if(G.overT>0){G.overT-=dt;if(G.overT<=0)showOver();}return;}
 if(G.state!=='play')return;
 if(G.bot)botStep(dt);
 if(G.walk&&!G.dash){G.bu=clamp(G.bu+G.walk*0.85*dt,0,0.9);if(G.bu>0.05)tutNext(2);}
 if(G.tut){G.tut.t+=dt;if(G.tut.step>=2&&G.tut.t>7)tutNext(G.tut.step);}
 for(const tp of G.tips)if(tp.lane===G.lane&&!G.dash&&G.bu>0.02&&Math.abs(tp.u-G.bu)<0.05){collectTip(tp);break;}
 if(TEST.mode==='tips'&&G.show<=0&&!G.tips.length&&Math.random()<dt*0.5){const l=ri(4);G.tips.push({lane:l,u:rnd(0.25,0.8),t:0});}
 G.pourCD-=dt;if(G.pourT>0)G.pourT-=dt;
 if(G.hold){G.holdT-=dt;if(G.holdT<=0){pour();G.holdT=0.42;}}
 if(G.pend){G.pend.t-=dt;if(G.pend.t<=0){G.drinks.push({lane:G.pend.lane,u:0.0,spd:Math.min(0.95,0.62+0.03*(G.level-1)),flav:G.pend.flav});G.pend=null;S.slide();}}
 if(G.show>0){G.show-=dt;if(!SET.calm||Math.random()<0.5)for(let k=0;k<2;k++){const x=rnd(L.x0,L.x1),f=pick(FLAV);G.parts.push({x,y:L.playBot,vx:rnd(-40,40),vy:rnd(-700,-420),life:1.2,max:1.2,col:f.c,sz:rnd(3,6)});}}
 // dash for tip
 if(G.dash){const d=G.dash;d.t+=dt;if(!d.got&&d.t>=d.dur*0.5){d.got=true;collectTip(d.tip);}
  if(d.t>=d.dur)G.dash=null;}
 // spawn
 if(G.toSpawn>0){G.spawnT-=dt;if(G.spawnT<=0&&G.show<=0&&!(G.tut&&G.tut.step<1&&G.cust.length)){
   const cand=[0,1,2,3].filter(l=>!G.cust.some(c=>c.lane===l&&c.u>0.86));
   if(cand.length){cand.sort((a,b)=>G.cust.filter(c=>c.lane===a).length-G.cust.filter(c=>c.lane===b).length+rnd(-1.2,1.2));G.cust.push(newCust(cand[0]));G.toSpawn--;}
   G.spawnT=spawnGap();}}
 // customers
 for(const c of G.cust){c.t+=dt;
  if(c.st==='walk'){if(G.show>0){c.mood=1;continue;}c.mood=0;
   const ahead=G.cust.some(o=>o!==c&&o.lane===c.lane&&o.u<c.u&&c.u-o.u<0.11&&o.st!=='exit');
   const moving=((c.t+c.ph)%1.2)<0.55;
   if(!ahead&&c.u>0.95)c.u-=c.spd*4*dt;else if(moving&&!ahead)c.u-=c.spd*2.2*dt;
   if(c.u<=0){loseLife('reach',c.lane,Math.max(0,c.u));return;}}
  else if(c.st==='pushed'){const p=Math.min(1,c.t/0.38);c.u=c.from+(c.to-c.from)*(1-Math.pow(1-p,3));
   if(p>=1){if(c.to>=0.97){c.st='exit';c.t=0;addScore(50);G.stats.served++;if(Math.random()<0.35)S.whoop(2,0.7);}else{c.st='drink';c.t=0;c.dk=(rnd(1.2,1.8)-Math.min(0.5,G.level*0.04))*(c.rowdy?0.45:1);}}}
  else if(c.st==='drink'){if(c.t>=c.dk){c.st='walk';c.t=0;G.stats.served++;
    G.empties.push({lane:c.lane,u:c.u-0.035,spd:(0.26+0.018*G.level)*(c.rowdy?1.8:1),flav:c.flav,rowdy:c.rowdy});if(c.rowdy){S.swish();G.floats.push({x:ux(c.u),y:barY(c.lane)-L.unit*0.9,txt:'TOSS!',t:0.8,col:'#ff2a3d'});}
    if(Math.random()<(TEST.mode==='tips'?0.6:0.14)&&!G.tips.some(x=>x.lane===c.lane)&&G.show<=0)G.tips.push({lane:c.lane,u:clamp(c.u-0.06,0.12,0.92),t:0});}}
  else if(c.st==='exit'){c.u+=0.55*dt;}
 }
 G.cust=G.cust.filter(c=>c.u<1.25);
 // drinks
 for(const d of G.drinks){d.u+=d.spd*dt;
  let best=null;for(const c of G.cust)if(c.lane===d.lane&&c.st==='walk'&&c.u-d.u<=0.035&&c.u>d.u-0.08&&(!best||c.u<best.u))best=c;
  if(best){d.dead=true;best.st='pushed';best.t=0;best.from=best.u;best.got=(best.got||0)+1;best.to=best.u+rnd(0.24,0.32);best.flav=d.flav;G.combo++;const m=mult();
   if(best.want>=0&&best.want===d.flav){best.want=-1;G.stats.perfect++;addScore(250*m,ux(best.u),barY(d.lane)-L.unit*0.85,'#ff3cac');G.floats.push({x:ux(best.u),y:barY(d.lane)-L.unit*1.15,txt:'PERFECT POUR!',t:1.1,col:'#ff3cac'});S.coin();}
   else{best.want=-1;addScore(50*m,ux(best.u),barY(d.lane)-L.unit*0.6);}
   if(G.combo%5===0&&G.combo<=20){G.floats.push({x:(W-L.ctrlW)/2,y:L.playTop+30,txt:'COMBO x'+mult()+'!',t:1.2,col:'#ffe14a',big:1});S.jingle();}
   S.catchD();vib(15);
   if(best.to>=0.99)best.to=1.0;continue;}
  if(d.u>=1.0){d.dead=true;loseLife('slide',d.lane,1.0);return;}}
 G.drinks=G.drinks.filter(d=>!d.dead);
 // empties
 for(const e of G.empties){e.u-=e.spd*dt;
  if(e.u<=G.bu+0.03&&e.u>G.bu-0.08&&G.lane===e.lane&&!G.dash){e.dead=true;addScore(100*mult(),ux(Math.max(0.03,e.u)),barY(e.lane)-L.unit*0.4,'#3bb6ff');G.stats.empties++;S.clink();vib(20);tutNext(2);continue;}
  if(e.u<=-0.06){e.dead=true;loseLife('empty',e.lane,-0.06);return;}}
 G.empties=G.empties.filter(e=>!e.dead);
 for(const tp of G.tips){tp.t+=dt;}G.tips=G.tips.filter(tp=>tp.t<7);
 // wave clear
 if(G.toSpawn<=0&&!G.cust.length&&!G.drinks.length&&!G.empties.length&&!G.pend){G.state='clear';G.clearT=2.4;G.conf=2.2;G.walk=0;G.bu=0;if(G.tut)tutEnd();vib([30,40,30,40,60]);G.floats.push({x:(W-L.ctrlW)/2,y:L.playTop+(L.playBot-L.playTop)*0.62,txt:'+'+(G.stats.served)+' served · combo x'+mult(),t:2,col:'#27e07a'});G.banner={txt:'WAVE '+G.level+' CLEAR!',sub:'Bonus round next...',t:1.8};S.jingle();S.whoop(6);}
}
// ---- auto-play bot (testing) ----
function botStep(dt){
 if(G.dash)return;G.botCD-=dt;if(G.botCD>0)return;G.botCD=0.09;
 let urg=null,ut=99;for(const e of G.empties){const t=e.u/e.spd;if(t<ut){ut=t;urg=e;}}
 if(urg&&ut<0.85){moveLane(urg.lane);return;}
 if(G.tips.length&&ut>1.5&&!G.cust.some(c=>c.st==='walk'&&c.u<0.3)){grabTip(G.tips[0]);return;}
 let best=-1,bu=99;
 for(let l=0;l<4;l++){const w=G.cust.filter(c=>c.lane===l&&c.st==='walk'&&c.u<1.03);const dr=G.drinks.filter(d=>d.lane===l).length+(G.pend&&G.pend.lane===l?1:0);
  if(w.length>dr){const mu=Math.min(...w.map(c=>c.u));if(mu<bu){bu=mu;best=l;}}}
 if(best>=0){if(G.lane!==best)moveLane(best);else{const w=G.cust.filter(c=>c.lane===best&&c.st==='walk').sort((a,b)=>a.u-b.u)[0];if(w&&w.want>=0)G.flav=w.want;pour();}}
}
// ---- title attract ----
function attract(dt){
 if(G.cust.length<5&&Math.random()<dt*0.8){const c=newCust(ri(4));c.spd=0.06;G.cust.push(c);}
 for(const c of G.cust){c.t+=dt;if(c.st==='walk'){if(((c.t+c.ph)%1.15)<0.72)c.u-=c.spd*1.6*dt;if(c.u<0.35+0.1*c.lane%2){c.st='exit';}}else c.u+=0.4*dt;}
 G.cust=G.cust.filter(c=>c.u<1.25);G.lane=Math.floor(G.t/2.5)%4;G.pourT=(G.t%2.5)<0.2?0.1:0;
}

// ================= BONUS ROUND =================
function startBonus(){
 G.state='bonus';setTrack('bonus');const ids=[0,1,2,3,4,5];
 G.bonus={ph:'show',t:0,slot:ids.slice(),safe:ri(6),swaps:Math.min(16,5+2*G.level),sd:Math.max(0.2,0.52-0.04*G.level),cur:null,pick:-1,win:false};
 G.banner={txt:'BONUS: SHAKE-UP!',sub:'Watch the safe Faygo...',t:2.0};
}
function bSlotX(s){const sp=Math.min((W-L.ctrlW)*0.15,110);return (W-L.ctrlW)/2+(s-2.5)*sp;}
function bGeom(){const sp=Math.min((W-L.ctrlW)*0.15,110);const h=Math.min(sp*2.1,H*0.24);return {sp,h,y:L.land?H*0.72:H*0.6};}
function updBonus(dt){
 const B=G.bonus;B.t+=dt;
 if(B.ph==='show'&&B.t>2.2){B.ph='shake';B.t=0;S.rattle();}
 else if(B.ph==='shake'&&B.t>1.0){B.ph='shuffle';B.t=0;}
 else if(B.ph==='shuffle'){
  if(!B.cur){if(B.swaps<=0){B.ph='pick';B.t=0;G.banner={txt:'PICK ONE!',sub:'Which Faygo is safe?',t:99};return;}
   const a=ri(6);let b=ri(5);if(b>=a)b++;B.cur={a,b,t:0};B.swaps--;S.swish();}
  else{B.cur.t+=dt;if(B.cur.t>=B.sd){const ia=B.slot.indexOf(B.cur.a),ib=B.slot.indexOf(B.cur.b);B.slot[ia]=B.cur.b;B.slot[ib]=B.cur.a;B.cur=null;}}}
 else if(B.ph==='pick'){if(G.bot&&B.t>0.6){const want=G.botPickWrong?(B.safe+1)%6:B.safe;bonusPick(B.slot.indexOf(want));}}
 else if(B.ph==='reveal'){
  if(!B.win&&B.t<1.6){const g=bGeom();for(let k=0;k<(SET.calm?2:5);k++)G.parts.push({x:bSlotX(B.pick),y:g.y-g.h,vx:rnd(-220,220),vy:rnd(-650,-250),life:1.3,max:1.3,col:FLAV[B.slot[B.pick]].c,sz:rnd(3,7)});}
  if(B.t>3.0){G.banner=null;G.level++;startLevel();}}
}
function bonusPick(s){const B=G.bonus;if(!B||B.ph!=='pick'||s<0||s>5)return;B.pick=s;B.ph='reveal';B.t=0;B.win=B.slot[s]===B.safe;
 if(B.win){const pts=2000+500*G.level;addScore(pts,bSlotX(s),bGeom().y-bGeom().h-20,'#27e07a');G.banner={txt:'SAFE! +'+pts,sub:'Fresh, un-shaken Faygo!',t:3};burst(bSlotX(s),bGeom().y-bGeom().h,'#ffe14a',40,1.4);S.jingle();S.whoop(6);}
 else{G.banner={txt:'SPRAYED!',sub:'That one was shook up!',t:3};S.spray(1.8);setTimeout(()=>S.whoop(3,0.6),400);}
}

// ================= DRAWING =================
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);}
function txt(s,x,y,px,col,al,stroke){ctx.font=px+'px '+FONT;ctx.textAlign=al||'center';ctx.textBaseline='middle';if(stroke){ctx.lineWidth=Math.max(3,px*0.16);ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(s,x,y);}ctx.fillStyle=col;ctx.fillText(s,x,y);}
function drawBottle(x,y,h,fl,fill,ang,glow){
 const F=FLAV[fl%FLAV.length];ctx.save();ctx.translate(x,y);if(ang)ctx.rotate(ang);
 const w=h*0.36,nw=h*0.15;
 if(glow){ctx.shadowColor=glow;ctx.shadowBlur=h*0.4;}
 ctx.beginPath();ctx.moveTo(-w/2,-h*0.05);ctx.quadraticCurveTo(-w/2,0,-w/2+h*0.05,0);ctx.lineTo(w/2-h*0.05,0);ctx.quadraticCurveTo(w/2,0,w/2,-h*0.05);
 ctx.lineTo(w/2,-h*0.58);ctx.quadraticCurveTo(w/2,-h*0.7,nw/2,-h*0.78);ctx.lineTo(nw/2,-h*0.93);ctx.lineTo(-nw/2,-h*0.93);ctx.lineTo(-nw/2,-h*0.78);ctx.quadraticCurveTo(-w/2,-h*0.7,-w/2,-h*0.58);ctx.closePath();
 if(fill>0){ctx.fillStyle=F.c;ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=Math.max(1,h*0.035);ctx.strokeStyle=F.d;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-w*0.34,-h*0.62,w*0.14,h*0.55);
  ctx.fillStyle='#fff';ctx.fillRect(-w/2,-h*0.42,w,h*0.18);if(h>26){ctx.save();ctx.translate(0,-h*0.33);ctx.rotate(-0.12);txt('Faygo',0,0,h*0.13,F.d);ctx.restore();}}
 else{ctx.fillStyle='rgba(220,240,255,.28)';ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=Math.max(1,h*0.04);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.stroke();ctx.fillStyle=F.c;ctx.globalAlpha=0.6;ctx.fillRect(-w/2+2,-h*0.08,w-4,h*0.06);ctx.globalAlpha=1;}
 ctx.fillStyle=fill>0?'#e5e7eb':'#9ca3af';ctx.fillRect(-nw*0.62,-h,nw*1.24,h*0.09);
 ctx.restore();
}
function starP(cx,cy,r1,r2,n,rot){ctx.beginPath();for(let i=0;i<n*2;i++){const r=i%2?r2:r1,a=(rot||-Math.PI/2)+i*Math.PI/n;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}ctx.closePath();}
function hatchGuy(x,y,h,col){ // ORIGINAL running cleaver-guy silhouette (not any real logo)
 ctx.save();ctx.fillStyle=col;ctx.strokeStyle=col;ctx.lineCap='round';ctx.lineWidth=Math.max(1,h*0.12);
 ctx.beginPath();ctx.arc(x+h*0.05,y-h*0.42,h*0.12,0,7);ctx.fill();
 ctx.beginPath();ctx.moveTo(x,y-h*0.28);ctx.lineTo(x-h*0.05,y+h*0.08);ctx.lineTo(x-h*0.28,y+h*0.45);ctx.moveTo(x-h*0.05,y+h*0.08);ctx.lineTo(x+h*0.2,y+h*0.25);ctx.lineTo(x+h*0.2,y+h*0.48);
 ctx.moveTo(x,y-h*0.2);ctx.lineTo(x+h*0.22,y-h*0.42);ctx.moveTo(x,y-h*0.18);ctx.lineTo(x-h*0.25,y-h*0.02);ctx.stroke();
 ctx.fillRect(x+h*0.16,y-h*0.66,h*0.24,h*0.16);ctx.restore();}
function drawJuggalo(c,x,yb,s){
 const bob=Math.sin((c.t+c.ph)*9)*s*0.012*(c.st==='walk'&&G.show<=0?1:0.3);
 const hr=s*0.2,hy=yb-s*0.56+bob,bw=s*0.54,P=c.paint||0,acc=c.acc||0;
 ctx.save();
 // hoodie / tee body
 ctx.fillStyle=c.hood;rr(x-bw/2,yb-s*0.32+bob,bw,s*0.4,s*0.13);ctx.fill();
 hatchGuy(x+s*0.02,yb-s*0.13+bob,s*0.2,c.hc==='#151515'?'#f8f8f2':c.hc);
 // hood behind head
 if(acc===2){ctx.fillStyle=c.hood;ctx.beginPath();ctx.arc(x,hy+hr*0.1,hr*1.32,0,Math.PI*2);ctx.fill();}
 // hair (behind/around)
 ctx.fillStyle=c.hc;ctx.strokeStyle=c.hc;const H=c.hair%6;
 if(acc!==2){
  if(H===0){for(let i=-4;i<=4;i++){const a=-Math.PI/2+i*0.3;ctx.beginPath();ctx.moveTo(x+Math.cos(a-0.16)*hr*0.85,hy+Math.sin(a-0.16)*hr*0.85);ctx.lineTo(x+Math.cos(a)*hr*1.8,hy+Math.sin(a)*hr*1.8);ctx.lineTo(x+Math.cos(a+0.16)*hr*0.85,hy+Math.sin(a+0.16)*hr*0.85);ctx.fill();}}
  else if(H===1){ctx.lineWidth=hr*0.26;ctx.lineCap='round';for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(x+i*hr*0.22,hy-hr*0.8);ctx.quadraticCurveTo(x+i*hr*0.4,hy,x+i*hr*0.36+Math.sin(G.t*3+i)*hr*0.08,hy+hr*1.25);ctx.stroke();}}
  else if(H===2){ctx.beginPath();ctx.arc(x,hy-hr*0.4,hr*0.95,Math.PI,0);ctx.fill();[-1,1].forEach(sd=>{ctx.beginPath();ctx.ellipse(x+sd*hr*1.25,hy-hr*0.1,hr*0.3,hr*0.65,sd*0.5,0,7);ctx.fill();});ctx.fillStyle='#ff3cac';[-1,1].forEach(sd=>{ctx.beginPath();ctx.arc(x+sd*hr*0.98,hy-hr*0.55,hr*0.13,0,7);ctx.fill();});}
  else if(H===3){ctx.beginPath();ctx.moveTo(x-hr*0.25,hy-hr*0.7);for(let i=0;i<5;i++){ctx.lineTo(x-hr*0.22+i*hr*0.11,hy-hr*(1.85-Math.abs(i-2)*0.12));ctx.lineTo(x-hr*0.16+i*hr*0.11,hy-hr*0.85);}ctx.lineTo(x+hr*0.35,hy-hr*0.7);ctx.fill();}
  else if(H===4){[[-0.8,-0.7],[0.8,-0.7],[0,-1.05],[-0.45,-1.0],[0.45,-1.0],[-1.05,-0.2],[1.05,-0.2]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(x+a*hr,hy+b*hr,hr*0.45,0,7);ctx.fill();});}
  else {ctx.fillStyle=c.hood==='#111827'?'#dc2626':'#111';ctx.beginPath();ctx.arc(x,hy-hr*0.25,hr*1.0,Math.PI*1.02,Math.PI*1.98);ctx.fill();ctx.fillRect(x-hr*1.0,hy-hr*0.4,hr*2.0,hr*0.22);ctx.beginPath();ctx.moveTo(x+hr*0.85,hy-hr*0.35);ctx.lineTo(x+hr*1.45,hy-hr*0.05);ctx.lineTo(x+hr*1.25,hy+hr*0.2);ctx.fill();
   ctx.fillStyle='#fff';for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(x-hr*0.6+k*hr*0.4,hy-hr*0.7,hr*0.06,0,7);ctx.fill();}}}
 // white face base
 ctx.save();ctx.beginPath();ctx.ellipse(x,hy,hr*0.9,hr*1.02,0,0,Math.PI*2);
 if(P===5){const g=ctx.createLinearGradient(0,hy-hr,0,hy+hr);g.addColorStop(0,'#f8f8f2');g.addColorStop(0.45,'#f8f8f2');g.addColorStop(1,'#111');ctx.fillStyle=g;}else ctx.fillStyle='#f8f8f2';
 ctx.fill();ctx.clip();ctx.fillStyle='#111';
 if(P===3){ctx.fillRect(x-hr,hy-hr*1.1,hr,hr*2.2);}
 if(P===0){[-1,1].forEach(sd=>{const ex=x+sd*hr*0.4;ctx.beginPath();ctx.moveTo(ex,hy-hr*0.85);ctx.lineTo(ex+hr*0.2,hy-hr*0.1);ctx.lineTo(ex,hy+hr*0.45);ctx.lineTo(ex-hr*0.2,hy-hr*0.1);ctx.closePath();ctx.fill();});}
 if(P===1){[-1,1].forEach(sd=>{starP(x+sd*hr*0.4,hy-hr*0.12,hr*0.42,hr*0.17,5);ctx.fill();});}
 if(P===2){[-1,1].forEach(sd=>{ctx.beginPath();ctx.ellipse(x+sd*hr*0.38,hy-hr*0.12,hr*0.3,hr*0.33,0,0,7);ctx.fill();});ctx.beginPath();ctx.moveTo(x,hy+hr*0.12);ctx.lineTo(x-hr*0.13,hy+hr*0.36);ctx.lineTo(x+hr*0.13,hy+hr*0.36);ctx.fill();ctx.fillRect(x-hr*0.9,hy+hr*0.1,hr*0.25,hr*0.06);ctx.fillRect(x+hr*0.65,hy+hr*0.1,hr*0.25,hr*0.06);}
 if(P===4){ctx.lineWidth=hr*0.08;ctx.strokeStyle='#111';[-1,1].forEach(sd=>{const ex=x+sd*hr*0.4;ctx.beginPath();ctx.arc(ex,hy-hr*0.1,hr*0.26,Math.PI*1.1,Math.PI*1.9);ctx.stroke();ctx.beginPath();ctx.moveTo(ex,hy+hr*0.15);ctx.quadraticCurveTo(ex+hr*0.1,hy+hr*0.38,ex,hy+hr*0.45);ctx.quadraticCurveTo(ex-hr*0.1,hy+hr*0.38,ex,hy+hr*0.15);ctx.fill();});}
 if(P===5){ctx.fillStyle='#9b4dff';[-1,1].forEach(sd=>{ctx.fillRect(x+sd*hr*0.4-hr*0.05,hy-hr*0.75,hr*0.1,hr*0.4);});ctx.fillStyle='#111';[-1,1].forEach(sd=>{ctx.beginPath();ctx.ellipse(x+sd*hr*0.4,hy-hr*0.1,hr*0.24,hr*0.2,0,0,7);ctx.fill();});}
 ctx.restore();
 // eyes
 const look=c.mood?-hr*0.1:0,lx=c.st==='walk'?-hr*0.06:0;
 [-1,1].forEach(sd=>{const ex=x+sd*hr*0.4;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(ex,hy-hr*0.1,hr*0.14,hr*0.17,0,0,7);ctx.fill();ctx.fillStyle=P===3&&sd<0?'#ff2a3d':'#111';ctx.beginPath();ctx.arc(ex+lx,hy-hr*0.08+look,hr*0.075,0,7);ctx.fill();});
 // mouth
 const ink=(P===5)?'#f8f8f2':'#111';ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineCap='round';const happy=c.st!=='walk'||c.mood;
 if(P===2){ctx.fillStyle='#111';rr(x-hr*0.42,hy+hr*0.45,hr*0.84,hr*0.3,hr*0.08);ctx.fill();ctx.fillStyle='#f8f8f2';for(let k=0;k<5;k++)ctx.fillRect(x-hr*0.36+k*hr*0.15,hy+hr*0.49,hr*0.1,hr*0.22);}
 else{ctx.lineWidth=Math.max(1.4,hr*0.13);ctx.beginPath();if(happy)ctx.arc(x,hy+hr*0.35,hr*0.38,0.15,Math.PI-0.15);else{ctx.moveTo(x-hr*0.36,hy+hr*0.52);ctx.quadraticCurveTo(x,hy+hr*0.42,x+hr*0.36,hy+hr*0.52);}ctx.stroke();
  if(happy){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,hy+hr*0.42,hr*0.24,0.2,Math.PI-0.2);ctx.fill();}
  ctx.lineWidth=Math.max(1,hr*0.07);
  if(P===0||P===3)[-0.25,0,0.25].forEach(o=>{ctx.beginPath();ctx.moveTo(x+o*hr,hy+hr*0.7);ctx.lineTo(x+o*hr*1.25,hy+hr*0.98);ctx.stroke();});
  if(P===1||P===4){ctx.beginPath();ctx.moveTo(x-hr*0.38,hy+hr*0.5);for(let k=1;k<=4;k++)ctx.lineTo(x-hr*0.38-k*hr*0.1,hy+hr*(0.5+(k%2?-0.1:0.1)));ctx.moveTo(x+hr*0.38,hy+hr*0.5);for(let k=1;k<=4;k++)ctx.lineTo(x+hr*0.38+k*hr*0.1,hy+hr*(0.5+(k%2?-0.1:0.1)));ctx.stroke();
   for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(x+k*hr*0.15,hy+hr*0.62);ctx.lineTo(x+k*hr*0.15,hy+hr*0.8);ctx.stroke();}}}
 ctx.fillStyle=P===3?'#f8f8f2':'#111';ctx.beginPath();ctx.arc(x+(P===3?0:0),hy+hr*0.22,hr*0.09,0,7);ctx.fill();
 // bandana around neck
 if(acc===1){ctx.fillStyle=c.hc==='#151515'?'#dc2626':'#1e3a8a';ctx.beginPath();ctx.moveTo(x-hr*0.8,hy+hr*0.95);ctx.lineTo(x+hr*0.8,hy+hr*0.95);ctx.lineTo(x,hy+hr*1.6);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-hr*0.2,hy+hr*1.15,hr*0.05,0,7);ctx.arc(x+hr*0.25,hy+hr*1.1,hr*0.05,0,7);ctx.fill();}
 // chain + hatchet pendant
 ctx.strokeStyle='#e5e7eb';ctx.lineWidth=Math.max(1.2,s*0.016);ctx.setLineDash([s*0.02,s*0.012]);ctx.beginPath();ctx.arc(x,yb-s*0.33+bob,bw*0.34,0.3,Math.PI-0.3);ctx.stroke();ctx.setLineDash([]);
 const px=x-bw*0.12,py=yb-s*0.33+bob+bw*0.33;ctx.fillStyle='#e5e7eb';ctx.fillRect(px-s*0.007,py-s*0.005,s*0.014,s*0.07);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+s*0.05,py-s*0.006);ctx.quadraticCurveTo(px+s*0.06,py+s*0.03,px+s*0.04,py+s*0.04);ctx.lineTo(px,py+s*0.03);ctx.fill();
 // arms / drink (Faygo in hand)
 if(c.st==='pushed'||c.st==='drink'){
  const drinking=c.st==='drink';const hx=x-bw*0.45,hyy=drinking?hy+hr*0.45:yb-s*0.34;
  ctx.strokeStyle=c.hood;ctx.lineWidth=s*0.09;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-bw*0.36,yb-s*0.18+bob);ctx.lineTo(hx,hyy);ctx.stroke();
  drawBottle(hx,hyy+s*0.06,s*0.24,c.flav,1,drinking?-2.2+Math.sin(c.t*5)*0.15:-0.2);
  ctx.fillStyle='#f8f8f2';ctx.beginPath();ctx.arc(hx,hyy,s*0.04,0,7);ctx.fill();}
 if(c.mood&&G.show>0&&Math.sin(G.t*6+c.ph*3)>0.6)txt('WHOOP!',x,hy-hr*2.0,s*0.11,'#ffe14a',null,'#000');
 if(c.st==='exit'&&c.t<0.8)txt('WHOOP!',x,hy-hr*2.0,s*0.11,'#27e07a',null,'#000');
 ctx.restore();
}
function devilPatch(x,y,r){ // original little devil-face patch
 ctx.fillStyle='#dc2626';[-1,1].forEach(sd=>{ctx.beginPath();ctx.moveTo(x+sd*r*0.45,y-r*0.7);ctx.lineTo(x+sd*r*0.95,y-r*1.35);ctx.lineTo(x+sd*r*0.85,y-r*0.45);ctx.fill();});
 ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.fillStyle='#111';
 [-1,1].forEach(sd=>{ctx.beginPath();ctx.moveTo(x+sd*r*0.15,y-r*0.2);ctx.lineTo(x+sd*r*0.7,y-r*0.42);ctx.lineTo(x+sd*r*0.55,y+r*0.02);ctx.fill();});
 ctx.beginPath();ctx.arc(x,y+r*0.2,r*0.5,0.2,Math.PI-0.2);ctx.fill();}
function drawBrooklyn(x,yb,s,pouring,mini){
 // caricature: grey ribbed beanie w/ red devil patch, fair skin, blue eyes, strong dark brows, short brown beard, dark tee + apron
 const bob=Math.sin(G.t*4)*s*0.008,hy=yb-s*0.55+bob,hr=s*0.19,bw=s*0.52,SK='#f2c6a0',BR='#6b4428';
 ctx.save();
 ctx.fillStyle='#1f2937';rr(x-bw/2,yb-s*0.32+bob,bw,s*0.38,s*0.13);ctx.fill();
 ctx.strokeStyle='#22c55e';ctx.lineWidth=Math.max(1,s*0.014);ctx.beginPath();ctx.moveTo(x-bw*0.22,yb-s*0.31+bob);ctx.lineTo(x-bw*0.05,yb-s*0.12+bob);ctx.moveTo(x+bw*0.22,yb-s*0.31+bob);ctx.lineTo(x+bw*0.05,yb-s*0.12+bob);ctx.stroke();
 ctx.fillStyle='#f3f4f6';rr(x-bw*0.3,yb-s*0.2+bob,bw*0.6,s*0.28,s*0.04);ctx.fill();
 ctx.fillStyle='#ffe14a';rr(x-bw*0.24,yb-s*0.17+bob,bw*0.48,s*0.07,s*0.02);ctx.fill();
 if(s>70)txt('BROOKLYN',x,yb-s*0.135+bob,s*0.045,'#1a0629');
 ctx.strokeStyle='#1f2937';ctx.lineWidth=s*0.09;ctx.lineCap='round';
 const ax=pouring?x-bw*0.75:x+bw*0.52,ay=pouring?yb-s*0.28:yb-s*0.12;
 ctx.beginPath();ctx.moveTo(pouring?x-bw*0.35:x+bw*0.35,yb-s*0.22+bob);ctx.lineTo(ax,ay);ctx.stroke();ctx.fillStyle=SK;ctx.beginPath();ctx.arc(ax,ay,s*0.045,0,7);ctx.fill();
 // neck + head (slightly long jaw)
 ctx.fillStyle=SK;ctx.fillRect(x-hr*0.35,hy+hr*0.6,hr*0.7,hr*0.6);
 ctx.beginPath();ctx.ellipse(x,hy,hr*0.9,hr*1.05,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(x-hr*0.85,hy+hr*0.05,hr*0.2,0,7);ctx.fill();
 // short beard + moustache
 ctx.fillStyle=BR;ctx.beginPath();ctx.moveTo(x-hr*0.88,hy+hr*0.05);ctx.quadraticCurveTo(x-hr*0.75,hy+hr*1.0,x+hr*0.05,hy+hr*1.15);ctx.quadraticCurveTo(x+hr*0.85,hy+hr*0.95,x+hr*0.9,hy+hr*0.1);ctx.lineTo(x+hr*0.78,hy+hr*0.15);ctx.quadraticCurveTo(x+hr*0.55,hy+hr*0.5,x+hr*0.12,hy+hr*0.45);ctx.quadraticCurveTo(x-hr*0.3,hy+hr*0.45,x-hr*0.72,hy+hr*0.1);ctx.closePath();ctx.fill();
 ctx.beginPath();ctx.ellipse(x+hr*0.18,hy+hr*0.42,hr*0.38,hr*0.1,0,0,7);ctx.fill();
 // smirk
 ctx.strokeStyle='#5a1e1e';ctx.lineWidth=Math.max(1.2,hr*0.09);ctx.beginPath();ctx.moveTo(x-hr*0.05,hy+hr*0.62);ctx.quadraticCurveTo(x+hr*0.25,hy+hr*0.72,x+hr*0.5,hy+hr*0.55);ctx.stroke();
 // nose
 ctx.fillStyle='#e0a982';ctx.beginPath();ctx.ellipse(x+hr*0.3,hy+hr*0.15,hr*0.13,hr*0.17,0.3,0,7);ctx.fill();
 // blue eyes, facing right
 [0,0.55].forEach(o=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x+hr*(o-0.05),hy-hr*0.12,hr*0.17,hr*0.15,0,0,7);ctx.fill();ctx.fillStyle='#2f7fe0';ctx.beginPath();ctx.arc(x+hr*(o+0.02),hy-hr*0.11,hr*0.1,0,7);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+hr*(o+0.03),hy-hr*0.11,hr*0.045,0,7);ctx.fill();});
 // strong angled brows
 ctx.strokeStyle='#3b2416';ctx.lineWidth=hr*0.13;ctx.lineCap='round';[0,0.55].forEach(o=>{ctx.beginPath();ctx.moveTo(x+hr*(o-0.25),hy-hr*0.42);ctx.lineTo(x+hr*(o+0.15),hy-hr*0.32);ctx.stroke();});
 // grey ribbed beanie
 ctx.fillStyle='#4b4f57';ctx.beginPath();ctx.moveTo(x-hr*1.0,hy-hr*0.35);ctx.quadraticCurveTo(x-hr*1.05,hy-hr*1.75,x,hy-hr*1.75);ctx.quadraticCurveTo(x+hr*1.05,hy-hr*1.75,x+hr*1.0,hy-hr*0.35);ctx.closePath();ctx.fill();
 ctx.fillStyle='#3a3d44';rr(x-hr*1.05,hy-hr*0.62,hr*2.1,hr*0.34,hr*0.1);ctx.fill();
 ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=Math.max(1,hr*0.05);for(let k=-4;k<=4;k++){ctx.beginPath();ctx.moveTo(x+k*hr*0.22,hy-hr*0.32);ctx.lineTo(x+k*hr*0.2,hy-hr*(k*k>9?1.2:1.6));ctx.stroke();}
 devilPatch(x+hr*0.35,hy-hr*1.0,hr*0.26);
 ctx.restore();
}
function drawFountain(i){
 const top=laneTop(i),lh=L.laneH,fw=L.fountW,F=FLAV[i],by=barY(i);
 ctx.fillStyle='#3a1d0e';rr(4,top+lh*0.18,fw-8,by-top-lh*0.14,6);ctx.fill();
 ctx.fillStyle=F.c;rr(8,top+lh*0.22,fw-16,lh*0.3,fw*0.18);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(12,top+lh*0.25,fw*0.12,lh*0.24);
 ctx.save();ctx.translate(fw/2,top+lh*0.37);ctx.rotate(-0.15);txt('Faygo',0,0,Math.min(fw*0.3,lh*0.12),'#fff',null,F.d);ctx.restore();
 ctx.fillStyle='#d1d5db';ctx.fillRect(fw-10,top+lh*0.5,lh*0.16,lh*0.05);ctx.fillRect(fw-10+lh*0.12,top+lh*0.5,lh*0.04,lh*0.09);
 if(G.lane===i&&G.pourT>0){ctx.fillStyle=F.c;ctx.fillRect(fw-10+lh*0.125,top+lh*0.59,lh*0.03,by-top-lh*0.59);}
}
function drawLights(y,x0,x1,sag,ph){
 ctx.strokeStyle='#1a1a1a';ctx.lineWidth=1.5;ctx.beginPath();const n=Math.max(4,Math.floor((x1-x0)/30));
 for(let k=0;k<=n;k++){const p=k/n,x=x0+(x1-x0)*p,yy=y+Math.sin(p*Math.PI)*sag;k?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.stroke();
 for(let k=0;k<=n;k++){const p=k/n,x=x0+(x1-x0)*p,yy=y+Math.sin(p*Math.PI)*sag+4;const col=BULB[(k+ph)%BULB.length];
  let on=1;if(!SET.calm){on=((k+Math.floor(G.t*4))%3===0)?0.35:1;if(G.show>0)on=Math.random()<0.5?0.3:1;}
  ctx.globalAlpha=0.22*on;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,yy,8,0,7);ctx.fill();ctx.globalAlpha=0.5+0.5*on;ctx.beginPath();ctx.arc(x,yy,3.2,0,7);ctx.fill();ctx.globalAlpha=1;}
}
function drawBG(){
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#14062a');g.addColorStop(0.55,'#3a0d4f');g.addColorStop(1,'#1b0826');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(const s of STARS){ctx.globalAlpha=SET.calm?0.6:0.4+0.4*Math.sin(G.t*1.5+s[3]);ctx.fillStyle='#fff';ctx.fillRect(s[0],s[1],s[2],s[2]);}ctx.globalAlpha=1;
 // ferris wheel + tent silhouettes
 const R=Math.min(W,H)*0.33,cx=(W-L.ctrlW)*0.72,cy=H*0.42;ctx.save();ctx.globalAlpha=0.18;ctx.strokeStyle='#ff3cac';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();
 const rot=SET.calm?0:G.t*0.1;for(let k=0;k<12;k++){const a=rot+k*Math.PI/6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.stroke();ctx.fillStyle=BULB[k%6];ctx.beginPath();ctx.arc(cx+Math.cos(a)*R,cy+Math.sin(a)*R,6,0,7);ctx.fill();}
 ctx.restore();
}
function drawLane(i){
 const top=laneTop(i),lh=L.laneH,by=barY(i),s=L.unit;
 // backdrop fence
 ctx.fillStyle=i%2?'rgba(60,20,70,.55)':'rgba(45,15,60,.55)';ctx.fillRect(0,top,L.right,lh);
 drawLights(top+lh*0.08,L.fountW,L.x1+L.doorW*0.3,lh*0.08,i);
 // door: striped tent flap
 const dx=L.x1+lh*0.06,dw=L.right-dx;ctx.save();ctx.beginPath();ctx.rect(dx,top+lh*0.12,dw,by-top-lh*0.12+lh*0.26);ctx.clip();
 for(let k=0;k<8;k++){ctx.fillStyle=k%2?'#f5f5f5':'#e11d48';ctx.fillRect(dx+k*dw/6,top,dw/6,lh);}
 ctx.fillStyle='#0b0410';ctx.beginPath();ctx.moveTo(dx+dw*0.12,by+lh*0.26);ctx.quadraticCurveTo(dx+dw*0.5,top+lh*0.05,dx+dw*0.95,by+lh*0.26);ctx.fill();ctx.restore();
 drawFountain(i);
 // customers (far first)
 const cs=G.cust.filter(c=>c.lane===i).sort((a,b)=>b.u-a.u);for(const c of cs){drawJuggalo(c,ux(c.u)+s*0.12,by,s*0.95);const cx=ux(c.u)+s*0.12;
  if(c.rowdy&&c.st!=='exit')txt('!!',cx+s*0.2,by-s*0.95,s*0.16,'#ff2a3d',null,'#000');
  if(c.want>=0&&c.st==='walk'){const bx=cx-s*0.05,byy=by-s*1.0,F=FLAV[c.want];ctx.fillStyle='#fff';rr(bx-s*0.2,byy-s*0.13,s*0.4,s*0.24,s*0.08);ctx.fill();ctx.beginPath();ctx.moveTo(bx,byy+s*0.11);ctx.lineTo(bx+s*0.06,byy+s*0.2);ctx.lineTo(bx+s*0.1,byy+s*0.1);ctx.fill();
   drawBottle(bx-s*0.11,byy+s*0.08,s*0.18,c.want,1,0);txt(F.n.split(' ')[0],bx+s*0.06,byy-s*0.01,Math.max(9,s*0.07),F.d);}}
 // Brooklyn
 if(G.lane===i){let bx=L.fountW+lh*0.22+G.bu*(L.x1-L.x0);if(G.dash&&G.dash.lane===i){const p=G.dash.t/G.dash.dur;bx=bx+(ux(G.dash.u)-bx)*Math.sin(Math.PI*Math.min(1,p));}
  drawBrooklyn(bx,by,s,G.pourT>0);if(G.state==='play'&&G.bu===0&&G.flav!==i){ctx.fillStyle=FLAV[G.flav].c;ctx.beginPath();ctx.arc(L.fountW*0.5,top+lh*0.12,7,0,7);ctx.fill();}}
 // counter
 const cx0=L.fountW-4,cw=L.x1-cx0+lh*0.08;
 ctx.fillStyle='#5b2c0f';ctx.fillRect(cx0,by+lh*0.06,cw,lh*0.24);
 ctx.fillStyle='rgba(0,0,0,.25)';for(let k=1;k<8;k++)ctx.fillRect(cx0+cw*k/8,by+lh*0.06,2,lh*0.24);
 ctx.fillStyle=G.lane===i&&G.state==='play'?'#e8a054':'#c47a3a';ctx.fillRect(cx0,by,cw,lh*0.07);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(cx0,by,cw,2);
 ctx.fillStyle=FLAV[i].c;ctx.globalAlpha=0.8;ctx.fillRect(cx0,by+lh*0.27,cw,3);ctx.globalAlpha=1;
 // tips
 for(const tp of G.tips)if(tp.lane===i){const x=ux(tp.u),pul=SET.calm?1:1+0.12*Math.sin(G.t*10);ctx.save();ctx.translate(x,by-s*0.04);ctx.scale(pul,pul);ctx.shadowColor='#ffe14a';ctx.shadowBlur=14;ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.ellipse(0,0,s*0.075,s*0.05,0,0,7);ctx.fill();ctx.shadowBlur=0;txt('$',0,0,s*0.075,'#7a4a00');ctx.restore();
  if(tp.t<2.5)txt('TIP! tap it',x,by-s*0.18,Math.max(11,s*0.075),'#ffe14a',null,'#000');}
 // drinks & empties
 for(const d of G.drinks)if(d.lane===i)drawBottle(ux(d.u),by+2,s*0.24,d.flav,1,0);
 for(const e of G.empties)if(e.lane===i)drawBottle(ux(Math.max(e.u,-0.05)),by+2,s*0.22,e.flav,0,0.25*Math.sin(G.t*14));
}
function drawBtn(b,label,col,pressed,icon){
 ctx.save();ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.arc(b.x,b.y+5,b.r,0,7);ctx.fill();
 const g=ctx.createRadialGradient(b.x-b.r*0.3,b.y-b.r*0.4,b.r*0.1,b.x,b.y,b.r);g.addColorStop(0,'#fff');g.addColorStop(0.25,col);g.addColorStop(1,'#1a0629');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y+(pressed?4:0),b.r,0,7);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.stroke();
 if(icon)drawBottle(b.x-b.r*0.42,b.y+b.r*0.35+(pressed?4:0),b.r*0.7,G.flav,1,-0.35);
 txt(label,b.x+(icon?b.r*0.16:0),b.y+(pressed?4:0),b.r*(icon?0.36:0.6),'#fff',null,'#1a0629');ctx.restore();
}
function drawHUD(){
 ctx.fillStyle='rgba(10,3,20,.85)';ctx.fillRect(0,0,W,L.hudH);ctx.fillStyle='#ff3cac';ctx.fillRect(0,L.hudH-2,W,2);
 const px=L.land?17:18,y1=L.land?L.hudH/2:L.hudH*0.32,y2=L.land?L.hudH/2:L.hudH*0.72;
 txt('SCORE '+G.score,10,y1,px,'#ffe14a','left');
 txt('HI '+G.hi,L.land?W*0.3:10,y2,L.land?px:13,'#c4b5fd','left');
 txt('WAVE '+G.level,L.land?W*0.5:W*0.56,y1,px,'#fff');
 if(G.state==='play'||G.state==='oops')txt('Left: '+(G.toSpawn+G.cust.filter(c=>c.st!=='exit').length),L.land?W*0.62:W*0.56,y2,L.land?13:12,'#c4b5fd',L.land?'left':'center');
 if(G.combo>=5&&(G.state==='play'))txt('COMBO x'+mult(),L.land?W*0.72:W*0.56,L.land?L.hudH/2:L.hudH*0.98+8,L.land?13:12,'#ff3cac',L.land?'right':'center','#000');
 for(let k=0;k<G.lives;k++)drawBottle((L.land?W*0.78:W*0.74)+k*14,L.land?L.hudH*0.85:L.hudH*0.62,L.land?26:30,k,1,0);
 // gear
 const g=L.gear;ctx.fillStyle='#3b0764';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(g.x-6,g.y-7,4,14);ctx.fillRect(g.x+2,g.y-7,4,14);
 txt('v'+VERSION+' ALPHA',W-48,L.land?L.hudH/2:L.hudH*0.72,9,'#ff3cac','right');
}
function drawControls(){
 if(!L.land){ctx.fillStyle='rgba(10,3,20,.88)';ctx.fillRect(0,L.playBot,W,H-L.playBot);ctx.fillStyle='#ff3cac';ctx.fillRect(0,L.playBot,W,2);}
 else{ctx.fillStyle='rgba(10,3,20,.88)';ctx.fillRect(L.right,L.hudH,W-L.right,H);ctx.fillStyle='#ff3cac';ctx.fillRect(L.right,L.hudH,2,H);}
 const p=G.press;drawBtn(L.btnUp,'▲','#9b4dff',p==='up');drawBtn(L.btnDn,'▼','#9b4dff',p==='dn');drawBtn(L.btnPour,'POUR',FLAV[G.flav].c,p==='pour'||G.hold,true);drawBtn(L.btnL,'◀','#3bb6ff',G.walk<0);drawBtn(L.btnR,'▶','#3bb6ff',G.walk>0);
}
function drawBanner(){
 const b=G.banner;if(!b)return;const a=Math.min(1,b.t*3);ctx.save();ctx.globalAlpha=a;const y=G.state==='bonus'?L.hudH+Math.min(H*0.13,110):L.playTop+(L.playBot-L.playTop)*0.42,cx=(W-L.ctrlW)/2;
 const sc=SET.calm?1:1+0.04*Math.sin(G.t*8);ctx.translate(cx,y);ctx.scale(sc,sc);
 const px=Math.min(W*0.1,48);ctx.fillStyle='rgba(10,3,20,.7)';rr(-Math.min(W*0.46,260),-px*0.95,Math.min(W*0.92,520),px*2.1,18);ctx.fill();
 txt(b.txt,0,-px*0.2,px,'#ffe14a',null,'#000');if(b.sub)txt(b.sub,0,px*0.65,px*0.42,'#fff',null,'#000');ctx.restore();
}
function drawBonus(){
 const B=G.bonus,g=bGeom();
 ctx.fillStyle='rgba(10,3,20,.35)';ctx.fillRect(0,L.hudH,W,H);
 drawLights(L.hudH+16,0,W,22,0);
 // table
 const tx=bSlotX(0)-g.sp*0.7,tw=g.sp*6.4;ctx.fillStyle='#5b2c0f';ctx.fillRect(tx,g.y,tw,g.h*0.45);ctx.fillStyle='#c47a3a';ctx.fillRect(tx,g.y-4,tw,10);
 // Brooklyn watching
 drawBrooklyn(L.land?W*0.08:W*0.15,L.land?H*0.97:g.y+g.h*1.1,L.land?H*0.32:Math.min(W*0.32,160),false);
 // crowd silhouettes
 for(let k=0;k<5;k++){const c={t:G.t,ph:k*1.3,st:'walk',mood:1,hair:k%5,hc:HAIRC[k],hood:HOODS[k],lane:0,flav:k};drawJuggalo(c,(W-L.ctrlW)*(L.land?0.45+k*0.11:0.18+k*0.16),L.land?H*0.5:g.y-g.h*1.3,L.land?H*0.28:Math.min(W*0.22,130));}
 for(let s=0;s<6;s++){const id=B.slot[s];let x=bSlotX(s),y=g.y,ang=0;
  if(B.cur&&(id===B.cur.a||id===B.cur.b)){const other=id===B.cur.a?B.cur.b:B.cur.a,ts=B.slot.indexOf(other),p=Math.min(1,B.cur.t/B.sd),e=p*p*(3-2*p);x=bSlotX(s)+(bSlotX(ts)-bSlotX(s))*e;y=g.y-Math.sin(Math.PI*e)*g.h*0.45*(id===B.cur.a?1:-0.35);}
  if(B.ph==='shake')ang=Math.sin(G.t*40+s)*0.18,x+=Math.sin(G.t*50+s*2)*3;
  const glow=(B.ph==='show'&&id===B.safe)?'#ffe14a':(B.ph==='reveal'&&id===B.safe)?'#27e07a':null;
  const fl=[0,1,2,3,4,5][id];
  if(B.ph==='reveal'&&s===B.pick&&!B.win)ang=0.4*Math.sin(G.t*30);
  drawBottle(x,y,g.h,fl,1,ang,glow);
  if(B.ph==='show'&&id===B.safe){txt('SAFE',x,y-g.h*1.15,g.sp*0.26,'#ffe14a',null,'#000');if(!SET.calm||true)txt('▼',x,y-g.h*1.02+Math.sin(G.t*8)*4,g.sp*0.2,'#ffe14a',null,'#000');}
  if(B.ph==='pick')txt(String(s+1),x,y+g.h*0.25,g.sp*0.25,'#fff',null,'#000');
  if(B.ph==='reveal'&&s===B.pick)txt(B.win?'✓':'✗',x,y-g.h*1.15,g.sp*0.45,B.win?'#27e07a':'#ff2a3d',null,'#000');}
}
function drawParts(){for(const p of G.parts){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.col;ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);}ctx.globalAlpha=1;
 for(const f of G.floats){ctx.globalAlpha=clamp(f.t,0,1);txt(f.txt,f.x,f.y,f.big?30:17,f.col,null,'#000');}ctx.globalAlpha=1;}
function drawLineup(){ // ?test=lineup : meet-the-crowd art check
 const w=W,h=H;ctx.fillStyle='rgba(10,2,20,.92)';ctx.fillRect(0,0,w,h);
 txt('MEET THE CROWD',w/2,h*0.06,Math.min(w,h)*0.06,'#ffe14a',null,'#000');
 const port=h>w,cols=port?2:4,rows=port?4:2,cw=w/cols,chh=(h*0.88)/rows,s=Math.min(cw*0.85,chh*0.95);
 const names=['DIAMOND','STAR EYES','SKULL','HALF-FACE','TEARDROPS','GRADIENT','',''];
 for(let k=0;k<cols*rows;k++){const cx=cw*(k%cols+0.5),cy=h*0.1+chh*(Math.floor(k/cols)+0.72);
  if(k===6){drawBrooklyn(cx,cy,s*0.95,false);}
  else if(k===7){const c={t:G.t,ph:1,st:'drink',paint:1,hair:4,acc:0,hc:'#39ff6a',hood:'#4a044e',flav:2,mood:0};drawJuggalo(c,cx,cy,s);}
  else{const c={t:G.t,ph:k,st:'walk',paint:k,hair:k,acc:[0,1,0,2,1,0][k],hc:HAIRC[k%HAIRC.length],hood:HOODS[(k+1)%HOODS.length],flav:k%6,mood:0};drawJuggalo(c,cx,cy,s);}
  ctx.fillStyle='#2a0f3a';ctx.fillRect(cx-cw*0.45,cy,cw*0.9,s*0.12);
  txt(k===6?'BROOKLYN':k===7?'DRINKING':names[k],cx,cy+s*0.2,s*0.09,'#fff',null,'#000');}}
function render(){
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.save();
 if(G.shakeT>0&&!SET.calm)ctx.translate(rnd(-5,5),rnd(-5,5));
 drawBG();
 if(G.state==='lineup'){drawLineup();ctx.restore();return;}
 if(G.state==='bonus')drawBonus();
 else{for(let i=0;i<4;i++)drawLane(i);
  if(G.state==='oops'){const o=G.oops;txt(o.why==='reach'?'A Juggalo reached Brooklyn!':o.why==='slide'?'Faygo slid off the bar!':'Dropped an empty!',(W-L.ctrlW)/2,L.playTop+L.laneH*(o.lane+0.35),Math.min(W*0.06,30),'#ff2a3d',null,'#000');}}
 drawParts();
 if(G.state!=='title'&&G.state!=='boot'){drawHUD();if(G.state!=='bonus')drawControls();drawBanner();}
 ctx.restore();
 if(G.flash>0){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='rgba(255,40,60,'+(G.flash*0.5)+')';ctx.fillRect(0,0,W,H);}
}

// ================= INPUT =================
const hit=(b,x,y,pad)=>Math.hypot(x-b.x,y-b.y)<=b.r+(pad||8);
cv.addEventListener('pointerdown',e=>{
 audioInit();const x=e.clientX,y=e.clientY;
 if(G.state==='bonus'){const B=G.bonus;if(B.ph==='pick'){const g=bGeom();for(let s=0;s<6;s++)if(Math.abs(x-bSlotX(s))<g.sp*0.5&&y>g.y-g.h*1.2&&y<g.y+g.h*0.4){bonusPick(s);break;}}return;}
 if(hit(L.gear,x,y,10)&&(G.state==='play'||G.state==='oops'||G.state==='clear')){pauseGame();return;}
 if(G.state!=='play')return;
 if(hit(L.btnPour,x,y)){G.press='pour';G.hold=true;G.holdT=0.42;pour();cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);return;}
 if(hit(L.btnUp,x,y)){G.press='up';moveLane(G.lane-1);return;}
 if(hit(L.btnL,x,y)){G.walk=-1;return;}if(hit(L.btnR,x,y)){G.walk=1;return;}
 if(hit(L.btnDn,x,y)){G.press='dn';moveLane(G.lane+1);return;}
 if(y>=L.playTop&&y<L.playBot&&x<L.right){const l=clamp(Math.floor((y-L.playTop)/L.laneH),0,3);
  const tp=G.tips.find(t=>t.lane===l&&Math.abs(ux(t.u)-x)<L.unit*0.22);if(tp){grabTip(tp);return;}
  if(l===G.lane&&x<L.fountW+4){cycleFlav();return;}
  if(l===G.lane){G.drag={x0:x,id:e.pointerId,moved:false};cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);}else moveLane(l);}
});
cv.addEventListener('pointermove',e=>{const d=G.drag;if(!d||d.id!==e.pointerId||G.state!=='play'||G.dash)return;if(!d.moved&&Math.abs(e.clientX-d.x0)>16)d.moved=true;
 if(d.moved){G.bu=clamp((e.clientX-L.x0)/(L.x1-L.x0)-0.04,0,0.9);if(G.bu>0.05)tutNext(2);}});
const up=e=>{G.hold=false;G.press=null;G.walk=0;const d=G.drag;G.drag=null;if(d&&!d.moved&&G.state==='play'&&(!e||d.id===e.pointerId))pour();};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',()=>{G.hold=false;G.press=null;G.walk=0;G.drag=null;});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')G.walk=0;});
addEventListener('keydown',e=>{if(G.state!=='play')return;if(e.key==='ArrowUp')moveLane(G.lane-1);else if(e.key==='ArrowDown')moveLane(G.lane+1);else if(e.key===' '){pour();e.preventDefault();}else if(e.key==='ArrowLeft')G.walk=-1;else if(e.key==='ArrowRight')G.walk=1;else if(e.key==='f')cycleFlav();
 else if(e.key==='t'&&G.tips[0])grabTip(G.tips[0]);});

// ================= DOM SCREENS =================
const OVS=['title','settings','scores','pause','over'];let setBack='title';
function showOv(id){OVS.forEach(o=>$(o).classList.toggle('hide',o!==id));}
function toTitle(){G.tut=null;tutShow();G.state='title';G.cust=[];G.drinks=[];G.empties=[];G.tips=[];G.banner=null;showOv('title');if(AU.ctx)setTrack('title');}
function pauseGame(){if(G.state==='paused')return;G.prev=G.state;G.state='paused';showOv('pause');if(AU.ctx)AU.ctx.suspend();}
function resume(){showOv(null);G.state=G.prev||'play';audioInit();}
function listHTML(a,me){if(!a.length)return '<li><span>No scores yet. Be the first!</span></li>';return a.map((h,i)=>`<li class="${i===me?'me':''}"><span>${i+1}. ${h.n}</span><span>${h.s} <small style="color:#c4b5fd">W${h.l}</small></span></li>`).join('');}
function showOver(){const hs=getHS();const q=G.score>0&&(hs.length<10||G.score>hs[hs.length-1].s);
 $('ovS').textContent='Score '+G.score+' · Wave '+G.level+' · Served '+G.stats.served;$('ovList').innerHTML=listHTML(hs,-1);
 const box=$('iniBox');box.style.display=q?'flex':'none';$('ini').value=localStorage.getItem('ft-ini')||'';showOv('over');if(q)setTimeout(()=>{try{$('ini').focus();}catch(e){}},100);G.pendingHS=q;}
function saveIni(){if(!G.pendingHS)return;const n=(($('ini').value||'AAA').toUpperCase().replace(/[^A-Z0-9]/g,'')+'___').slice(0,3);localStorage.setItem('ft-ini',n);
 const hs=getHS();const e={n,s:G.score,l:G.level};hs.push(e);hs.sort((a,b)=>b.s-a.s);hs.length=Math.min(10,hs.length);setHS(hs);G.pendingHS=false;$('iniBox').style.display='none';$('ovList').innerHTML=listHTML(hs,hs.indexOf(e));G.hi=hs[0].s;}
$('bPlay').onclick=()=>startGame();
$('bScores').onclick=()=>{$('hsList').innerHTML=listHTML(getHS(),-1);showOv('scores');};
$('bScBack').onclick=()=>showOv('title');
const syncSet=()=>{$('sMus').value=SET.mus;$('sSfx').value=SET.sfx;$('sCalm').checked=SET.calm;$('sVib').checked=SET.vib;};
$('sVib').onchange=e=>{SET.vib=e.target.checked;saveSet();vib(30);};
$('tutSkip').onclick=e=>{e.stopPropagation();tutEnd();};
$('sTut').onclick=()=>{localStorage.removeItem('ft-tut');$('sTut').textContent='Tutorial will show next game ✓';};
$('bSet').onclick=()=>{setBack='title';syncSet();showOv('settings');};
$('bPSet').onclick=()=>{setBack='pause';syncSet();showOv('settings');};
$('bSetBack').onclick=()=>showOv(setBack);
$('sMus').oninput=e=>{SET.mus=+e.target.value;saveSet();};
$('sSfx').oninput=e=>{SET.sfx=+e.target.value;saveSet();};
$('sSfx').onchange=()=>{audioInit();S.clink();};
$('sCalm').onchange=e=>{SET.calm=e.target.checked;saveSet();};
$('bResume').onclick=resume;
$('bQuit').onclick=()=>{audioInit();toTitle();};
$('bAgain').onclick=()=>{saveIni();startGame();};
$('bMenu').onclick=()=>{saveIni();toTitle();};
$('bIni').onclick=saveIni;$('ini').addEventListener('keydown',e=>{if(e.key==='Enter')saveIni();});
$('title').addEventListener('pointerdown',()=>{audioInit();if(G.state==='title')setTrack('title');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(G.state==='play'||G.state==='oops'||G.state==='clear')pauseGame();else if(AU.ctx)AU.ctx.suspend();}else{checkVer();if(G.state!=='paused'&&AU.ctx)AU.ctx.resume();}});

// ================= ALWAYS-NEWEST =================
function checkVer(){fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(j=>{const v=String(j.v||'');if(v&&v!==VERSION){const k='ft-rl-'+v;
 if(!sessionStorage.getItem(k)&&!['play','bonus','oops','clear','paused'].includes(G.state)){sessionStorage.setItem(k,'1');location.reload();}}}).catch(()=>{});}
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
checkVer();setInterval(checkVer,5*60*1000);

// ================= LOOP =================
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));resize();
let last=performance.now();
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;const t0=performance.now();
 if(G.state!=='paused')update(dt);render();
 const ft=performance.now()-t0;G.ft.push(ft);G.dts.push(dt*1000);if(G.ft.length>240){G.ft.shift();G.dts.shift();}
 requestAnimationFrame(frame);}
G.perf=()=>{const a=G.ft.slice().sort((x,y)=>x-y),d=G.dts.slice().sort((x,y)=>x-y);return {avgWork:+(a.reduce((s,x)=>s+x,0)/a.length).toFixed(2),p95Work:+a[Math.floor(a.length*0.95)].toFixed(2),avgDt:+(d.reduce((s,x)=>s+x,0)/d.length).toFixed(2)};};
G.startGame=startGame;G.TEST=TEST;G.cycleFlav=cycleFlav;G.startBonus=startBonus;G.bonusPick=bonusPick;G.grabTip=grabTip;G.pour=pour;G.moveLane=moveLane;G.toTitle=toTitle;
Object.defineProperty(G,'stateName',{get(){return G.state;}});
requestAnimationFrame(frame);
setTimeout(()=>{$('splash').classList.add('gone');toTitle();setTimeout(()=>$('splash').remove(),600);
 if(TEST.on){const tb=$('testTag');tb.textContent='TEST: '+[TEST.wave>1?'wave '+TEST.wave:'',TEST.mode].filter(Boolean).join(' + ')+' · tap anywhere for sound';tb.classList.remove('hide');setTimeout(()=>tb.classList.add('hide'),6000);
  startGame();
  if(TEST.mode==='bonus'){G.banner=null;startBonus();}
  else if(TEST.mode==='lineup'){G.banner=null;G.state='lineup';}
  else if(TEST.mode==='gameover'){G.score=12345;G.stats.served=42;G.lives=0;G.banner=null;gameOver();G.overT=0.05;}}
},1100);
})();
