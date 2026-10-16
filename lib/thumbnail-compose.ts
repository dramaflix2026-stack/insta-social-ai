export async function composeThumbnail(source:string,headline:string):Promise<string>{
 const img=new Image();img.src=source;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível');
 const ratio=Math.max(1280/img.width,720/img.height);
 ctx.drawImage(img,(1280-img.width*ratio)/2,(720-img.height*ratio)/2,img.width*ratio,img.height*ratio);
 const gradient=ctx.createLinearGradient(0,0,790,0);
 gradient.addColorStop(0,'rgba(0,0,0,.95)');gradient.addColorStop(.62,'rgba(0,0,0,.80)');gradient.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,790,720);
 const text=(headline||'SEU NOVO VÍDEO').trim().toLocaleUpperCase('pt-BR').replace(/\s+/g,' ').slice(0,65);
 const words=text.split(' '),maxWidth=670;
 let size=142,lines:string[]=[];
 const font=(n:number)=>'900 '+n+'px Impact, "Arial Black", Arial, sans-serif';
 for(;size>=58;size-=2){
  ctx.font=font(size);lines=[];let line='';
  for(const word of words){
   const test=line?line+' '+word:word;
   if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test;
  }
  if(line)lines.push(line);
  if(lines.length<=4&&lines.every(x=>ctx.measureText(x).width<=maxWidth)&&lines.length*size*1.04<=590)break;
 }
 const lh=size*1.04,blockHeight=lines.length*lh;
 const top=Math.max(54,(720-blockHeight)/2);
 ctx.textAlign='left';ctx.textBaseline='top';ctx.lineJoin='round';
 lines.forEach((line,i)=>{
  const y=top+i*lh;
  ctx.font=font(size);ctx.shadowColor='#000';ctx.shadowBlur=16;ctx.shadowOffsetY=5;
  ctx.lineWidth=Math.max(5,size*.075);ctx.strokeStyle='#090909';ctx.strokeText(line,48,y);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.fillStyle=/\bIA\b/.test(line)?'#00ed8a':/DINHEIRO/.test(line)?'#ffcf31':'#fff';
  ctx.fillText(line,48,y);
 });
 return canvas.toDataURL('image/png');
}
