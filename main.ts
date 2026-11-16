import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const W = 1024, H = 1024;
const pixels = Buffer.alloc(W * H * 4);
let seed = 0x4e6f7661;
function rand() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
function blend(x:number,y:number,r:number,g:number,b:number,a=1) {
  x|=0; y|=0; if(x<0||y<0||x>=W||y>=H||a<=0)return;
  const i=(y*W+x)*4, ia=1-a; pixels[i]=pixels[i]*ia+r*a; pixels[i+1]=pixels[i+1]*ia+g*a; pixels[i+2]=pixels[i+2]*ia+b*a; pixels[i+3]=255;
}
function disc(cx:number,cy:number,rad:number,color:[number,number,number],alpha=1) {
  const x0=Math.max(0,Math.floor(cx-rad)), x1=Math.min(W-1,Math.ceil(cx+rad)), y0=Math.max(0,Math.floor(cy-rad)), y1=Math.min(H-1,Math.ceil(cy+rad));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const d=Math.hypot(x-cx,y-cy); if(d<rad)blend(x,y,...color,alpha*Math.min(1,(rad-d)*1.8));}
}
function line(x0:number,y0:number,x1:number,y1:number,width:number,c:[number,number,number],a=1){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*1.25);for(let i=0;i<=n;i++){const t=i/n;disc(x0+(x1-x0)*t,y0+(y1-y0)*t,width/2,c,a);}}
function poly(points:[number,number][], c:[number,number,number], a=1){for(let i=1;i<points.length;i++)line(...points[i-1],...points[i],1.3,c,a);}
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
// Deep midnight field with a restrained radial nebula.
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=(x-512)/720,dy=(y-500)/720,d=Math.sqrt(dx*dx+dy*dy), glow=Math.max(0,1-d)*0.24;const band=Math.max(0,1-Math.abs((x+y*0.52-510)/330))*0.08;const i=(y*W+x)*4;pixels[i]=5+glow*29+band*23;pixels[i+1]=7+glow*9+band*3;pixels[i+2]=22+glow*39+band*35;pixels[i+3]=255;}
// Sweeping luminous diagonal ribbons, sampled as smooth cubic curves.
function ribbon(p:[number,number][], width:number, col:[number,number,number], alpha:number){for(let j=0;j<=240;j++){const t=j/240,u=1-t;const x=u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0];const y=u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1];const taper=Math.sin(Math.PI*t)**0.42;disc(x,y,width*taper,col,alpha);}}
ribbon([[64,925],[330,840],[280,470],[925,104] ],34,[255,36,171],.23);
ribbon([[20,760],[385,830],[520,370],[958,220]],22,[13,224,255],.22);
ribbon([[174,1010],[470,760],[410,430],[850,60]],16,[255,178,36],.25);
ribbon([[0,592],[380,700],[670,340],[1024,170]],7,[255,70,193],.45);
ribbon([[90,1000],[380,810],[590,460],[1000,280]],6,[50,236,255],.5);
// A starburst of tapered rays from the off-centre nova core.
const cx=518,cy=493;
// Broken elliptical arcs wrap the eruption and turn its outward force into a spiral.
for(const arc of [{start:-2.75,end:-.62,rx:186,ry:126,c:[255,207,105] as [number,number,number],w:3.5},{start:.28,end:2.52,rx:228,ry:164,c:[77,228,255] as [number,number,number],w:2.5}]){
  for(let j=0;j<=190;j++){const t=arc.start+(arc.end-arc.start)*j/190, x=cx+Math.cos(t)*arc.rx,y=cy+Math.sin(t)*arc.ry;disc(x,y,arc.w,arc.c,.68);}
}
for(let k=0;k<76;k++){const a=(Math.PI*2*k/76)+rand()*.045, len=180+rand()*410, start=24+rand()*30;const bend=(rand()-.5)*90;const col=k%3===0?[255,193,69] as [number,number,number]:k%3===1?[255,83,173] as [number,number,number]:[60,220,255] as [number,number,number];
 const x0=cx+Math.cos(a)*start,y0=cy+Math.sin(a)*start,x1=cx+Math.cos(a)*len+bend,y1=cy+Math.sin(a)*len-bend*.45;
 const n=36;for(let s=0;s<n;s++){const t=s/(n-1),q=t*t*(3-2*t);line(mix(x0,x1,t),mix(y0,y1,t),mix(x0,x1,(s+1)/(n-1)),mix(y0,y1,(s+1)/(n-1)),(1-q)*(2+rand()*4)+.35,col,.22+rand()*.48);}
}
// Faceted shards orbiting the core: short bright strokes create a crystalline eruption.
for(let i=0;i<112;i++){const a=rand()*Math.PI*2, d=95+rand()*300, x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d, l=12+rand()*68, tangent=a+(rand()-.5)*1.3;const c=i%3===0?[255,221,134] as [number,number,number]:i%3===1?[255,77,188] as [number,number,number]:[64,224,255] as [number,number,number];line(x,y,x+Math.cos(tangent)*l,y+Math.sin(tangent)*l,1+rand()*4,c,.45+rand()*.45);}
// Glowing core with layered amber corona, white-hot centre and crisp flare cross.
for(let r=164;r>2;r-=3){const t=1-r/164;disc(cx,cy,r,[mix(255,255,t),mix(91,247,t),mix(19,225,t)],.012+t*.022);}
disc(cx,cy,62,[255,175,52],.72);disc(cx,cy,38,[255,231,161],.92);disc(cx-5,cy-4,20,[255,255,240],1);disc(cx-7,cy-8,8,[255,255,255],1);
line(cx-110,cy,cx+112,cy,3,[255,244,200],.85);line(cx,cy-104,cx,cy+105,2,[255,237,181],.7);
// Sparse, sharp sparks and tiny lens glints.
for(let i=0;i<245;i++){const a=rand()*Math.PI*2,d=115+rand()*470,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,r=.8+rand()*2.5;const c=i%4===0?[255,218,142] as [number,number,number]:i%4===1?[93,231,255] as [number,number,number]:[255,102,190] as [number,number,number];disc(x,y,r,c,.55+rand()*.4);}
for(const [x,y] of [[220,286],[819,354],[742,771],[292,826],[900,629]]){disc(x,y,10,[255,213,122],.18);line(x-15,y,x+15,y,1,[255,245,218],.8);line(x,y-15,x,y+15,1,[255,245,218],.8);}
// PNG encoder: filter 0 rows, standard RGBA IHDR, compressed IDAT and CRC32.
const crcTable=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}
function crc(buf:Buffer){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type:string,data:Buffer){const t=Buffer.from(type), out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length,0);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([t,data])),8+data.length);return out;}
const raw=Buffer.alloc(H*(1+W*4));for(let y=0;y<H;y++)pixels.copy(raw,y*(1+W*4)+1,y*W*4,(y+1)*W*4);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const outDir=process.env.MAKEFUN_OUTPUT_DIR||'/output';mkdirSync(outDir,{recursive:true});writeFileSync(join(outDir,'entry.png'),png);
