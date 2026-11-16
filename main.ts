import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024, H = 1024;
const pixels = Buffer.alloc(W * H * 4);
let seed = 0x4e4f5641;
function rand() { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const clamp=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
function blend(x:number,y:number,c:number[],a=1) { x=Math.floor(x); y=Math.floor(y); if(x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*4, q=1-a; pixels[i]=clamp(c[0]*a+pixels[i]*q);pixels[i+1]=clamp(c[1]*a+pixels[i+1]*q);pixels[i+2]=clamp(c[2]*a+pixels[i+2]*q);pixels[i+3]=255; }
function ellipse(cx:number,cy:number,rx:number,ry:number,c:number[],alpha=1,rot=0) { const co=Math.cos(rot),si=Math.sin(rot),r=Math.ceil(Math.max(rx,ry)); for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){const dx=x-cx,dy=y-cy,u=dx*co+dy*si,v=-dx*si+dy*co;if(u*u/(rx*rx)+v*v/(ry*ry)<=1)blend(x,y,c,alpha);} }
function poly(points:number[][],c:number[],alpha=1) { let minY=H,maxY=0;for(const p of points){minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);} for(let y=Math.max(0,Math.floor(minY));y<=Math.min(H-1,Math.ceil(maxY));y++){const xs:number[]=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi<=y&&yj>y)||(yj<=y&&yi>y))xs.push(xi+(y-yi)*(xj-xi)/(yj-yi));}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.ceil(xs[k]);x<=xs[k+1];x++)blend(x,y,c,alpha);} }
function line(x1:number,y1:number,x2:number,y2:number,width:number,c:number[],alpha=1){const n=Math.ceil(Math.hypot(x2-x1,y2-y1));for(let i=0;i<=n;i++){const t=n?i/n:0;ellipse(x1+(x2-x1)*t,y1+(y2-y1)*t,width/2,width/2,c,alpha);}}
function gradient(){for(let y=0;y<H;y++){const t=y/H;const top=[13,20,57],mid=[76,42,79],low=[255,139,54];const a=t<.65?t/.65:(t-.65)/.35, c=t<.65?top:mid,d=t<.65?mid:low;for(let x=0;x<W;x++)blend(x,y,[c[0]*(1-a)+d[0]*a,c[1]*(1-a)+d[1]*a,c[2]*(1-a)+d[2]*a]);}}
function chunk(type:string,data:Buffer){const name=Buffer.from(type),len=Buffer.alloc(4);len.writeUInt32BE(data.length);const crcInput=Buffer.concat([name,data]);let crc=0xffffffff;for(const b of crcInput){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([len,name,data,tail]);}
gradient();
// Radiant sun and broad rays establish a single glowing focal zone.
ellipse(560,420,172,172,[255,184,84],.22);ellipse(560,420,104,104,[255,204,112],.48);ellipse(560,420,57,57,[255,232,171],.9);
for(let i=0;i<22;i++){const a=i*Math.PI/11+.04, r1=120,r2=470, w=10+(i%3)*8;poly([[560+Math.cos(a)*r1-Math.sin(a)*w,420+Math.sin(a)*r1+Math.cos(a)*w],[560+Math.cos(a)*r2-Math.sin(a)*w*.22,420+Math.sin(a)*r2+Math.cos(a)*w*.22],[560+Math.cos(a)*r2+Math.sin(a)*w*.22,420+Math.sin(a)*r2-Math.cos(a)*w*.22],[560+Math.cos(a)*r1+Math.sin(a)*w,420+Math.sin(a)*r1-Math.cos(a)*w]],[255,190,105],.065);}
// distant cloud banks and a few luminous atmospheric strokes
for(let i=0;i<42;i++){const x=rand()*1200-80,y=585+rand()*290,rx=24+rand()*105,ry=5+rand()*20;ellipse(x,y,rx,ry,[255,199+rand()*35,139],.10+rand()*.16);}
for(let i=0;i<18;i++){const x=rand()*1200-70,y=720+rand()*210;line(x,y,x+55+rand()*120,y+rand()*4,2+rand()*5,[255,224,163],.18);}
// gigantic swept wings: membrane silhouette, luminous edge and fan ribs
poly([[392,499],[265,375],[114,190],[47,92],[76,66],[113,111],[217,175],[327,250],[418,338],[508,438]], [21,54,82]);
poly([[559,481],[671,365],[837,287],[985,252],[1007,278],[958,329],[900,365],[835,417],[753,471],[653,520]], [20,58,83]);
poly([[392,480],[262,360],[112,178],[62,98],[79,77],[116,121],[223,185],[330,260],[425,358],[503,448]], [39,133,159],.88);
poly([[566,470],[677,369],[839,300],[984,269],[989,282],[947,327],[888,363],[823,411],[745,458],[656,499]], [39,139,162],.86);
for(let i=0;i<8;i++){const t=i/7;line(406,478,78+t*352,87+t*311,4,[163,226,218],.52);line(577,475,985-t*338,274+t*200,4,[161,227,215],.5);}
// shell: broad gold edged oval with segmented, city-bearing carapace
ellipse(514,502,236,116,[-6,15,33],1,-.07);ellipse(514,491,229,108,[255,186,76],1,-.07);ellipse(514,487,216,96,[31,64,82],1,-.07);
poly([[311,456],[368,403],[447,387],[488,431],[470,489],[398,511],[336,490]], [60,104,111]);
poly([[492,430],[552,395],[627,412],[671,460],[622,490],[535,477]], [56,99,107]);
poly([[353,501],[421,516],[470,490],[528,488],[563,532],[511,572],[430,573],[372,546]], [61,104,108]);
poly([[562,491],[628,480],[678,458],[715,494],[684,537],[621,550],[570,531]], [58,98,106]);
for(const p of [[[311,456],[368,403],[447,387],[488,431],[470,489],[398,511],[336,490]],[[492,430],[552,395],[627,412],[671,460],[622,490],[535,477]],[[353,501],[421,516],[470,490],[528,488],[563,532],[511,572],[430,573],[372,546]],[[562,491],[628,480],[678,458],[715,494],[684,537],[621,550],[570,531]]]){for(let i=0;i<p.length;i++)line(p[i][0],p[i][1],p[(i+1)%p.length][0],p[(i+1)%p.length][1],3,[232,178,94],.75);}
// city terraces and winding street of light, placed on the shell's crown
poly([[350,455],[411,424],[618,419],[685,462],[632,482],[407,483]], [16,34,54]);
line(367,456,624,453,8,[255,164,63],.85);line(395,469,655,463,5,[255,211,105],.8);
// fast diagonal wake-lines and stepped neighborhoods make the shell-city read as a vast place
for(let i=0;i<8;i++){line(116+i*17,399-i*8,275+i*12,456-i*4,3,[255,177,94],.16);line(740+i*13,458-i*5,917+i*10,383-i*8,3,[255,183,96],.15);}
for(const [x,y,w,h] of [[360,432,14,31],[379,426,13,43],[445,424,13,30],[478,424,12,32],[544,429,12,35],[585,431,13,32],[619,438,12,26],[651,447,13,20]]){
  poly([[x-w/2,y],[x,y-6],[x+w/2,y-3],[x+w/2,y+h],[x-w/2,y+h+4]],[27,72,89]);
  line(x,y-3,x,y+h,1.5,[255,191,96],.55);
  for(let wy=y+7;wy<y+h;wy+=8)for(let wx=x-w/2+3;wx<x+w/2;wx+=5)if(rand()>.35)ellipse(wx,wy,1.1,1.6,[255,218,134],.9);
}
// two luminous avenues converge toward the skyline's central spire
line(382,472,494,449,4,[255,207,116],.82);line(644,469,532,449,4,[255,207,116],.82);
const towers=[ [390,425,22,62],[420,418,27,88],[458,412,24,72],[492,403,32,105],[532,414,26,78],[567,410,22,69],[601,421,26,56],[632,435,20,45] ];
for(let n=0;n<towers.length;n++){const [x,y,w,h]=towers[n];poly([[x-w/2,y],[x+w/2,y-7],[x+w/2,y+h],[x-w/2,y+h+7]],[24,58,76]);poly([[x-w/2,y],[x,y-11],[x+w/2,y-7],[x,y+2]],[85,137,150]);line(x,y-8,x,y+h,2,[255,188,85],.38);for(let wy=y+10;wy<y+h-3;wy+=10)for(let wx=x-w/2+5;wx<x+w/2-2;wx+=8)if(rand()>.23)ellipse(wx,wy,1.8,2.2,rand()>.35?[255,219,131]:[72,214,220],.95);if(n===3||n===5){line(x,y-10,x,y-23,2,[255,221,133]);ellipse(x,y-25,4,4,[255,68,52]);}}
// shell underside, powerful neck and head
poly([[333,502],[410,543],[507,562],[593,528],[650,497],[626,580],[559,633],[448,627],[360,584]], [107,68,48]);
poly([[356,516],[432,552],[512,568],[601,530],[624,542],[579,598],[496,615],[411,590]], [208,151,83]);
for(let i=0;i<5;i++)line(393+i*39,546+i*6,413+i*35,593-i*1,3,[98,67,53],.72);
// neck angles forward into an expressive turtle head
poly([[605,458],[669,419],[729,393],[787,397],[819,424],[806,458],[771,479],[716,480],[668,500]], [31,65,75]);
poly([[619,452],[677,423],[729,402],[785,408],[806,429],[790,450],[746,466],[691,467]], [183,167,112]);
for(let i=0;i<14;i++)ellipse(672+rand()*106,426+rand()*38,3+rand()*4,2+rand()*3,[52,89,86],.7);
ellipse(761,419,15,13,[20,30,49]);ellipse(766,416,5,5,[255,234,186]);ellipse(768,414,2,2,[255,255,255]);ellipse(802,434,3,2,[34,38,46]);
// four flippers trail the glide, outlined in gold and scaled boldly
poly([[386,536],[326,593],[253,669],[184,714],[151,700],[181,658],[244,590],[305,532]], [84,58,42]);poly([[371,542],[314,593],[250,655],[187,695],[173,688],[208,646],[260,587],[318,538]], [180,126,68]);
poly([[567,544],[600,608],[657,681],[712,720],[742,700],[718,665],[657,601],[615,531]], [84,58,42]);poly([[580,541],[614,603],[665,669],[713,704],[726,694],[694,655],[642,592],[610,533]], [177,128,69]);
poly([[398,568],[366,634],[340,710],[300,760],[274,751],[280,715],[306,648],[339,582]], [90,61,44]);poly([[394,575],[366,640],[342,704],[307,745],[294,739],[307,699],[330,636],[350,581]], [180,126,69]);
poly([[600,559],[633,621],[671,691],[711,741],[738,731],[730,695],[697,637],[652,565]], [90,61,44]);poly([[605,565],[638,629],[678,691],[716,725],[727,719],[710,680],[679,625],[646,565]], [180,126,69]);
for(const [x,y] of [[184,680],[708,687],[309,724],[702,706]])for(let i=0;i<5;i++)line(x+i*5,y-i*3,x+12+i*5,y+8-i*3,2,[77,61,49],.55);
// bright contour accents unify silhouette; birds make the scale legible
line(285,368,112,152,5,[255,205,110],.85);line(82,92,97,91,4,[255,217,141],.9);line(695,364,850,302,4,[255,203,108],.85);line(879,298,965,279,4,[255,221,143],.85);
for(const [x,y,s] of [[155,313,1],[865,505,.8],[263,244,.65],[819,198,.6],[123,491,.55]]){line(x-s*13,y,x,y-s*7,2,[20,24,52],.9);line(x,y-s*7,x+s*13,y,2,[20,24,52],.9);}
// small drifting sparks around the light, deliberately sparse for PNG size
for(let i=0;i<65;i++){const x=rand()*W,y=rand()*H;if((x-560)**2+(y-420)**2<185**2&&rand()<.7)continue;const r=1+rand()*2.2;ellipse(x,y,r,r,[255,222,157],.45);}
const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){const off=y*(W*4+1);raw[off]=0;pixels.copy(raw,off+1,y*W*4,(y+1)*W*4);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const out=process.env.MAKEFUN_OUTPUT_DIR||'/output';await mkdir(out,{recursive:true});await writeFile(join(out,'entry.png'),png);
