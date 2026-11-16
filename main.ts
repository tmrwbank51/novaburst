import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// NOVABURST — a small deterministic analytic ray tracer, drawn entirely from geometry.
const OUT_W=1024, OUT_H=1024, W=384, H=384;
type V=[number,number,number]; type C=[number,number,number];
const v=(x:number,y:number,z:number):V=>[x,y,z], add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul=(a:V,s:number):V=>[a[0]*s,a[1]*s,a[2]*s], dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], norm=(a:V):V=>{const l=Math.hypot(...a)||1;return mul(a,1/l)};
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x)), mix=(a:number,b:number,t:number)=>a+(b-a)*t;
interface Obj {kind:'e'|'b'; c:V; ax:V[]; r:V; col:C; mat:'skin'|'shell'|'wing'|'city'|'cloud'|'rock'; id:number; glow?:number}
const objs:Obj[]=[]; let seed=0x51a7c0de; function rnd(){seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}
function ell(c:V,r:V,col:C,mat:Obj['mat'], ax?:V[], glow=0){objs.push({kind:'e',c,ax:ax||[v(1,0,0),v(0,1,0),v(0,0,1)],r,col,mat,id:objs.length,glow});}
function box(c:V,r:V,col:C,glow=0){objs.push({kind:'b',c,ax:[v(1,0,0),v(0,1,0),v(0,0,1)],r,col,mat:'city',id:objs.length,glow});}
// Far cloud banks create layered scale and a warm horizon.
for(let i=0;i<20;i++){const x=-8+rnd()*16,z=-3-rnd()*7,y=-1.9+rnd()*.55,s=.6+rnd()*1.5;ell(v(x,y,z),v(s,.18+rnd()*.22,s*.62),[.55,.66,.78],'cloud');}
// Broad translucent-looking flight membranes; flattened ellipsoids with luminous edges and ribbing in shader.
ell(v(-.78,1.10,.75),v(2.55,.075,.72),[.10,.49,.59],'wing',[norm(v(.83,.55,-.18)),norm(v(-.55,.82,.18)),norm(v(.12,-.05,1))]);
ell(v(-1.30,.83,-.62),v(2.25,.055,.58),[.08,.37,.51],'wing',[norm(v(-.91,-.23,.18)),norm(v(.22,.97,.10)),norm(v(.20,-.05,1))]);
// Torso, carapace and sleek neck/head, all continuous sculptural forms.
ell(v(-.20,.05,0),v(1.58,.57,.93),[.50,.29,.16],'skin');
ell(v(-.28,.39,0),v(1.50,.48,.99),[.11,.24,.29],'shell');
ell(v(.93,.36,.02),v(.88,.28,.30),[.20,.39,.43],'skin',[norm(v(.94,.20,0)),norm(v(-.20,.98,0)),v(0,0,1)]);
ell(v(1.53,.57,.025),v(.58,.39,.36),[.43,.65,.60],'skin',[norm(v(.96,.18,0)),norm(v(-.18,.98,0)),v(0,0,1)]);
// Four swept-back flippers with tapered silhouettes and subtle golden highlights.
ell(v(-.85,-.10,1.0),v(1.18,.16,.31),[.47,.29,.15],'skin',[norm(v(-.83,-.20,.52)),norm(v(.30,.95,-.08)),norm(v(-.48,.23,-.84))]);
ell(v(-.92,-.13,-.91),v(1.15,.14,.28),[.39,.25,.14],'skin',[norm(v(-.85,-.12,-.50)),norm(v(.18,.98,.08)),norm(v(.48,-.18,-.86))]);
ell(v(-1.12,-.39,.48),v(.80,.13,.25),[.40,.24,.13],'skin',[norm(v(-.86,-.39,.31)),norm(v(.39,.91,0)),norm(v(-.28,.12,-.95))]);
ell(v(-1.17,-.41,-.45),v(.78,.12,.23),[.40,.24,.13],'skin',[norm(v(-.89,-.34,-.29)),norm(v(.35,.94,0)),norm(v(.28,-.11,-.95))]);
// Turtle eye and nostril are refined, high-contrast focal accents.
ell(v(1.77,.72,.332),v(.115,.105,.042),[.025,.038,.054],'skin'); ell(v(1.792,.75,.370),v(.032,.034,.014),[1,.79,.39],'skin',undefined,.18); ell(v(1.803,.759,.382),v(.014,.016,.008),[.012,.022,.035],'skin'); ell(v(2.02,.56,.31),v(.035,.025,.018),[.055,.13,.14],'skin');
// City towers rise from the shell in a compact, readable skyline.
const towers:[number,number,number,number][]=[[-.90,.60,.24,.58],[-.61,.64,.27,.92],[-.29,.61,.25,.70],[.02,.64,.29,1.25],[.36,.62,.25,.92],[.66,.57,.23,.68],[.94,.52,.21,.48],[-.02,.66,.19,1.48]];
for(let i=0;i<towers.length;i++){const [x,z,w,h]=towers[i];box(v(x,.82+h/2,z),v(w/2,h/2,.18),i%3===0?[.12,.22,.28]:[.08,.17,.23],i===7?.42:.08); if(i===1||i===7){ell(v(x,.82+h+.065,z),v(.035,.035,.035),[1,.20,.065],'city',undefined,1.8);}}
// Lower blocks and a glowing aerial transit loop tie the skyline to the shell.
for(let i=0;i<11;i++){const x=-1.15+i*.22,z=(i%2?-.40:.38);box(v(x,.79+.17+(i%3)*.045,z),v(.095,.17+(i%3)*.045,.12),[.10,.24,.28],.035);}
// Distant birds and aircraft, tiny silhouette scale cues.
function bird(x:number,y:number,z:number,s:number){ell(v(x,y,z),v(s,.018,.012),[.025,.035,.065],'rock');ell(v(x-s*.62,y+s*.10,z),v(s*.65,.012,.012),[.025,.035,.065],'rock',[norm(v(-.8,.45,0)),norm(v(.45,.9,0)),v(0,0,1)]);ell(v(x+s*.62,y+s*.10,z),v(s*.65,.012,.012),[.025,.035,.065],'rock',[norm(v(.8,.45,0)),norm(v(-.45,.9,0)),v(0,0,1)]);}
bird(-3.4,1.9,-2,.12);bird(3.1,1.35,-2.5,.09);bird(-2.8,-.5,-1.3,.075);
ell(v(3.7,2.05,-3.2),v(.24,.025,.045),[.035,.055,.08],'rock',[norm(v(1,.05,0)),norm(v(0,1,0)),v(0,0,1)]);
const cam=v(4.3,3.25,9.6), target=v(0,.12,0), forward=norm(sub(target,cam)), right=norm(v(forward[2],0,-forward[0])), up=norm(v(forward[1]*right[2]-forward[2]*right[1],forward[2]*right[0]-forward[0]*right[2],forward[0]*right[1]-forward[1]*right[0]));
function intersect(o:Obj,ro:V,rd:V):[number,V,V]|null {let q=sub(ro,o.c), t:number, n:V;
 if(o.kind==='e'){let p0=dot(q,o.ax[0])/o.r[0],p1=dot(q,o.ax[1])/o.r[1],p2=dot(q,o.ax[2])/o.r[2],d0=dot(rd,o.ax[0])/o.r[0],d1=dot(rd,o.ax[1])/o.r[1],d2=dot(rd,o.ax[2])/o.r[2];const A=d0*d0+d1*d1+d2*d2,B=2*(p0*d0+p1*d1+p2*d2),D=B*B-4*A*(p0*p0+p1*p1+p2*p2-1);if(D<0)return null;const s=Math.sqrt(D);t=(-B-s)/(2*A);if(t<.001)t=(-B+s)/(2*A);if(t<.001)return null;const lx=p0+t*d0,ly=p1+t*d1,lz=p2+t*d2;n=norm(add(add(mul(o.ax[0],lx/o.r[0]),mul(o.ax[1],ly/o.r[1])),mul(o.ax[2],lz/o.r[2])));return [t,add(ro,mul(rd,t)),n];}
 let lo=-1e9,hi=1e9,axis=0,sgn=1;const qq=[q[0],q[1],q[2]],dd=[rd[0],rd[1],rd[2]],rr=[o.r[0],o.r[1],o.r[2]];for(let i=0;i<3;i++){if(Math.abs(dd[i])<1e-7){if(Math.abs(qq[i])>rr[i])return null;continue;}let a=(-rr[i]-qq[i])/dd[i],b=(rr[i]-qq[i])/dd[i],ss=-1;if(a>b){const z=a;a=b;b=z;ss=1;}if(a>lo){lo=a;axis=i;sgn=ss;}hi=Math.min(hi,b);if(lo>hi)return null;}t=lo>.001?lo:hi;if(t<.001)return null;n=v(0,0,0);if(axis===0)n=v(sgn,0,0);if(axis===1)n=v(0,sgn,0);if(axis===2)n=v(0,0,sgn);return [t,add(ro,mul(rd,t)),n];}
const sunPos=norm(add(forward,add(mul(up,.34),mul(right,-.30))));
const sky=(d:V):C=>{const h=clamp(d[1]*.5+.5);const horizon=[.74,.40,.29],zenith=[.035,.052,.17];let c:[number,number,number]=[mix(horizon[0],zenith[0],h),mix(horizon[1],zenith[1],h),mix(horizon[2],zenith[2],h)];const a=Math.acos(clamp(dot(d,sunPos)))*1,disk=Math.exp(-a*a*1800),halo=Math.exp(-a*a*22);return [c[0]+.95*disk+.20*halo,c[1]+.68*disk+.12*halo,c[2]+.32*disk+.05*halo];};
function trace(ro:V,rd:V):C {let best=1e9,hit:Obj|null=null,p=v(0,0,0),n=v(0,1,0);for(const o of objs){const h=intersect(o,ro,rd);if(h&&h[0]<best){best=h[0];p=h[1];n=h[2];hit=o;}}if(!hit){let c=sky(rd);const haze=Math.exp(-Math.pow((rd[1]+.10)*4,2));c=[mix(c[0],.91,haze*.23),mix(c[1],.61,haze*.20),mix(c[2],.44,haze*.17)];return c;}
 const o=hit;let base=o.col.slice() as C;let transparency=0;
 if(o.mat==='shell'){const q=sub(p,o.c),u=Math.atan2(dot(q,o.ax[2])/o.r[2],dot(q,o.ax[0])/o.r[0]),vv=Math.asin(clamp(dot(q,o.ax[1])/o.r[1],-1,1));const fu=Math.abs((u/ (Math.PI/3))-Math.round(u/(Math.PI/3))),fv=Math.abs(vv/(Math.PI/5)-Math.round(vv/(Math.PI/5)));if(fu<.026||fv<.025)base=[.055,.105,.14];else {const plate=.90+.12*Math.sin(u*3+vv*7);base=[base[0]*plate,base[1]*plate,base[2]*plate];}}
 if(o.mat==='wing'){const q=sub(p,o.c),u=dot(q,o.ax[0])/o.r[0],z=dot(q,o.ax[2])/o.r[2];const edge=clamp((1-Math.max(Math.abs(u),Math.abs(z)))*8);const rib=Math.exp(-Math.pow((z*6-Math.round(z*6))/.09,2));base=[base[0]*(.80+.22*rib)+edge*.12,base[1]*(.83+.20*rib)+edge*.17,base[2]*(.86+.18*rib)+edge*.18];transparency=.20;}
 if(o.mat==='city'){const q=sub(p,o.c),face=Math.max(Math.abs(n[0]),Math.abs(n[2]));if(face>.8){const wx=Math.floor((q[0]+1)*21),wy=Math.floor((q[1]+1)*20),on=(wx%4===1||wx%4===2)&&(wy%5===1||wy%5===2);if(on){const hue=(wx+wy)%5;base=hue===0?[.95,.52,.18]:[.24,.80,.91];base=[base[0]*.82,base[1]*.82,base[2]*.82];}}}
 const nd=Math.max(0,dot(n,sunPos)),view=Math.max(0,dot(n,mul(rd,-1))),fres=Math.pow(1-view,3);let shadow=1;const sr=add(p,mul(n,.012));let checks=0;for(const ob of objs){if(ob===o||ob.mat==='cloud'||ob.mat==='wing'&&o.mat==='wing')continue;if(++checks>18)break;const h=intersect(ob,sr,sunPos);if(h&&h[0]<5){shadow=.48;break;}}
 let diff=.24+nd*.98*shadow, rim=Math.pow(Math.max(0,1-dot(n,mul(rd,-1))),2)*(.13+Math.max(0,dot(n,sunPos))*.28);let shade=[base[0]*(diff+rim),base[1]*(diff+rim),base[2]*(diff+rim)];if(o.mat==='wing'){shade=[mix(shade[0],.58,transparency),mix(shade[1],.72,transparency),mix(shade[2],.77,transparency)];}const spec=Math.pow(Math.max(0,dot(n,norm(sub(sunPos,mul(rd,-1))))),o.mat==='skin'?34:52)*.24;shade=[shade[0]+spec*.95,shade[1]+spec*.68,shade[2]+spec*.38];if(o.mat==='city'){shade=[shade[0]+base[0]*.35,shade[1]+base[1]*.32,shade[2]+base[2]*.25];}
 const fog=clamp((best-11)/14)*.72;const far=sky(rd);shade=[mix(shade[0],far[0],fog),mix(shade[1],far[1],fog),mix(shade[2],far[2],fog)];if(o.glow)shade=[shade[0]+o.glow*.24,shade[1]+o.glow*.09,shade[2]+o.glow*.035];return shade;}
const pix=new Float32Array(W*H*3);const aspect=W/H,fov=0.70;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let acc=[0,0,0];for(let s=0;s<2;s++){const ox=s===0?.27:.73,oy=s===0?.71:.29,xx=((x+ox)/W*2-1)*aspect*Math.tan(fov), yy=(1-(y+oy)/H*2)*Math.tan(fov);const rd=norm(add(add(forward,mul(right,xx)),mul(up,yy)));const c=trace(cam,rd);acc[0]+=c[0]*.5;acc[1]+=c[1]*.5;acc[2]+=c[2]*.5;}const i=(y*W+x)*3;pix[i]=acc[0];pix[i+1]=acc[1];pix[i+2]=acc[2];}
// Bloom from a bright pass, using compact separable Gaussian taps.
const glow=new Float32Array(pix.length);for(let i=0;i<W*H;i++){const k=i*3,l=.2126*pix[k]+.7152*pix[k+1]+.0722*pix[k+2],b=Math.max(0,l-.70)*.75;glow[k]=pix[k]*b;glow[k+1]=pix[k+1]*b;glow[k+2]=pix[k+2]*b;}
const tmp=new Float32Array(glow.length),weights=[.24,.20,.13,.07,.03];for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(let c=0;c<3;c++){let q=0;for(let d=-4;d<=4;d++){const xx=clamp(x+d,0,W-1),w=weights[Math.abs(d)];q+=glow[(y*W+xx)*3+c]*w;}tmp[(y*W+x)*3+c]=q;}
const bloom=new Float32Array(glow.length);for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(let c=0;c<3;c++){let q=0;for(let d=-4;d<=4;d++){const yy=clamp(y+d,0,H-1),w=weights[Math.abs(d)];q+=tmp[(yy*W+x)*3+c]*w;}bloom[(y*W+x)*3+c]=q;}
function srgb(z:number){z=Math.max(0,z);z=z/(1+z*.30);return Math.pow(clamp(z),1/2.2)*255;}
const small=Buffer.alloc(W*H*4);let total=0,bright=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*3,j=(y*W+x)*4;const vig=1-.22*Math.pow(Math.hypot((x-W/2)/(W*.78),(y-H*.48)/(H*.78)),2);for(let c=0;c<3;c++){let z=(pix[i+c]+bloom[i+c]*1.18)*vig;z=(z-.5)*1.035+.5;const val=Math.round(srgb(z));small[j+c]=val;total+=val;if(val>230)bright++;}small[j+3]=255;}
// Bilinear upscale to the required 1024 square output.
const rgba=Buffer.alloc(OUT_W*OUT_H*4);for(let y=0;y<OUT_H;y++){const fy=y*(H-1)/(OUT_H-1),y0=Math.floor(fy),y1=Math.min(H-1,y0+1),ty=fy-y0;for(let x=0;x<OUT_W;x++){const fx=x*(W-1)/(OUT_W-1),x0=Math.floor(fx),x1=Math.min(W-1,x0+1),tx=fx-x0,j=(y*OUT_W+x)*4;for(let c=0;c<3;c++){const a=mix(small[(y0*W+x0)*4+c],small[(y0*W+x1)*4+c],tx),b=mix(small[(y1*W+x0)*4+c],small[(y1*W+x1)*4+c],tx);rgba[j+c]=Math.round(mix(a,b,ty));}rgba[j+3]=255;}}
function crc32(buf:Buffer){let crc=0xffffffff;for(const b of buf){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type:string,data:Buffer){const name=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([len,name,data,crc]);}
const raw=Buffer.alloc((OUT_W*4+1)*OUT_H);for(let y=0;y<OUT_H;y++){raw[y*(OUT_W*4+1)]=0;rgba.copy(raw,y*(OUT_W*4+1)+1,y*OUT_W*4,(y+1)*OUT_W*4);}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(OUT_W,0);ihdr.writeUInt32BE(OUT_H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);const out=process.env.MAKEFUN_OUTPUT_DIR||'/output';await mkdir(out,{recursive:true});await writeFile(join(out,'entry.png'),png);console.log(`rendered ${OUT_W}x${OUT_H}; internal luminance samples ${total}; bright ${bright}`);
