export type ThumbnailStyle='impact'|'neon'|'clean';
export type ThumbnailLayout='left'|'right';
export type ThumbnailOptions={style?:ThumbnailStyle;layout?:ThumbnailLayout;accent?:string;scale?:number;offsetY?:number};
export function suggestThumbnailHeadline(prompt:string){
 const p=prompt.toLocaleLowerCase('pt-BR');
 if(/ganh(ar|e).*dinheiro.*(inteligência artificial|\bia\b)/i.test(p))return 'GANHE DINHEIRO COM IA';
 const clean=prompt.replace(/^(crie|faça|gere|quero|preciso de)\s+(uma?\s+)?(nova?\s+)?(thumbnail|thumb|imagem)\s*(sobre|de|para|com)?\s*/i,'').split(/[.!?\n]/)[0].replace(/\b(uma thumbnail|imagem profissional|com cores vibrantes|para youtube)\b/gi,'').trim();
 return clean.split(/\s+/).filter(Boolean).slice(0,6).join(' ').toLocaleUpperCase('pt-BR')||'DESCUBRA AGORA';
}
export async function composeThumbnail(source:string,headline:string,options:ThumbnailOptions={}):Promise<string>{
 const img=new Image();img.src=source;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível');
 const ratio=Math.max(1280/img.width,720/img.height);
 ctx.drawImage(img,(1280-img.width*ratio)/2,(720-img.height*ratio)/2,img.width*ratio,img.height*ratio);
 const layout=options.layout||'left',style=options.style||'impact',accent=options.accent||'#00ed8a';
 const gradient=ctx.createLinearGradient(layout==='left'?0:1280,0,layout==='left'?850:430,0);
 gradient.addColorStop(0,'rgba(0,0,0,.94)');gradient.addColorStop(.7,'rgba(0,0,0,.65)');gradient.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=gradient;ctx.fillRect(layout==='left'?0:430,0,850,720);
 const words=(headline||'SEU NOVO VÍDEO').trim().toLocaleUpperCase('pt-BR').replace(/\s+/g,' ').slice(0,65).split(' ');
 const maxWidth=660,scale=Math.max(.75,Math.min(1.15,options.scale||1));
 const font=(n:number)=>'900 '+n+'px Impact, "Arial Black", Arial, sans-serif';
 let lines:string[]=[],size=140;
 for(let attempt=0;attempt<45;attempt++){
  size=Math.round((140-attempt*2)*scale);
  ctx.font=font(size);lines=[];let line='';
  for(const word of words){
   const test=line?line+' '+word:word;
   if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test;
  }
  if(line)lines.push(line);
  if(lines.length<=4&&lines.every(x=>ctx.measureText(x).width<=maxWidth)&&lines.length*size*1.05<=580)break;
 }
 if(lines.length>4||lines.some(x=>ctx.measureText(x).width>maxWidth)){
  // Enforce safe typography even with exceptionally long headlines.
  const compact=words.slice(0,Math.min(words.length,5));
  for(size=105;size>=30;size-=2){
   ctx.font=font(size);lines=[];let line='';
   for(const word of compact){const test=line?line+' '+word:word;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test}
   if(line)lines.push(line);
   if(lines.length<=4&&lines.every(x=>ctx.measureText(x).width<=maxWidth)&&lines.length*size*1.05<=580)break;
  }
 }
 const lh=size*1.05,blockHeight=lines.length*lh;
 const top=Math.max(46,Math.min(720-blockHeight-46,(720-blockHeight)/2+(options.offsetY||0)));
 const x=layout==='left'?48:1232;
 ctx.textAlign=layout==='left'?'left':'right';ctx.textBaseline='top';ctx.lineJoin='round';
 lines.forEach((line,i)=>{
  const y=top+i*lh;ctx.font=font(size);
  ctx.shadowColor='#000';ctx.shadowBlur=style==='neon'?24:12;ctx.shadowOffsetY=4;
  ctx.lineWidth=Math.max(5,size*.075);ctx.strokeStyle='#090909';ctx.strokeText(line,x,y);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.fillStyle=/\bIA\b/.test(line)?accent:/DINHEIRO/.test(line)?'#ffcf31':style==='neon'?'#f7f5ff':'#fff';
  ctx.fillText(line,x,y);
 });
 return canvas.toDataURL('image/png');
}
