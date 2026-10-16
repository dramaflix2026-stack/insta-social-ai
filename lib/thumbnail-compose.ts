export async function composeThumbnail(source:string,headline:string):Promise<string>{
 const img=new Image();img.src=source;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível');
 const ratio=Math.max(1280/img.width,720/img.height);const w=img.width*ratio,h=img.height*ratio;
 ctx.drawImage(img,(1280-w)/2,(720-h)/2,w,h);
 const gradient=ctx.createLinearGradient(0,0,860,0);gradient.addColorStop(0,'rgba(0,0,0,.91)');gradient.addColorStop(.55,'rgba(0,0,0,.74)');gradient.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,860,720);
 const text=(headline||'SEU NOVO VÍDEO').trim().toLocaleUpperCase('pt-BR').replace(/\s+/g,' ').slice(0,85);
 const words=text.split(' ');const maxWidth=585,maxLines=4;
 let fontSize=100,lines:string[]=[];
 for(;fontSize>=44;fontSize-=2){
  ctx.font='900 '+fontSize+'px Arial, Helvetica, sans-serif';
  lines=[];let line='';
  for(const word of words){const test=line?line+' '+word:word;if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test}if(line)lines.push(line);
  if(lines.length<=maxLines&&lines.every(l=>ctx.measureText(l).width<=maxWidth)&&lines.length*fontSize*1.04<=500)break;
 }
 if(fontSize<44)fontSize=44;
 const lh=fontSize*1.04,startY=360-(lines.length-1)*lh/2;
 ctx.textBaseline='middle';ctx.textAlign='left';ctx.lineJoin='round';
 lines.forEach((line,i)=>{
  const y=startY+i*lh;
  ctx.font='900 '+fontSize+'px Arial, Helvetica, sans-serif';
  ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=16;ctx.shadowOffsetY=5;
  ctx.strokeStyle='#080808';ctx.lineWidth=Math.max(6,fontSize*.11);ctx.strokeText(line,64,y);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.fillStyle=i===Math.min(1,lines.length-1)?'#ffd43b':'#ffffff';ctx.fillText(line,64,y);
 });
 return canvas.toDataURL('image/png');
}
