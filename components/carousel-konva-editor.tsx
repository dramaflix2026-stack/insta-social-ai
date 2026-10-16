'use client';
import {useEffect,useRef,useState} from 'react';
import {Stage,Layer,Rect,Image as KImage,Text,Transformer} from 'react-konva';
import type Konva from 'konva';
type Props={headline:string;body:string;image?:string;background:string;foreground:string;accent:string;font:string;brand:string;index:number;count:number;onExportReady?:(fn:()=>string)=>void};
export default function CarouselKonvaEditor({headline,body,image,background,foreground,accent,font,brand,index,count,onExportReady}:Props){
 const stage=useRef<Konva.Stage>(null);
 const transform=useRef<Konva.Transformer>(null);
 const title=useRef<Konva.Text>(null);
 const bodyNode=useRef<Konva.Text>(null);
 const [selected,setSelected]=useState<'title'|'body'|null>(null);
 const [photo,setPhoto]=useState<HTMLImageElement|null>(null);
 const [positions,setPositions]=useState({title:{x:82,y:260},body:{x:82,y:710}});
 const [width,setWidth]=useState(420);
 const scale=width/1080;
 useEffect(()=>{const fit=()=>setWidth(Math.min(420,Math.max(240,window.innerWidth-100)));fit();window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit)},[]);
 useEffect(()=>{if(!image){setPhoto(null);return}const img=new window.Image();img.onload=()=>setPhoto(img);img.onerror=()=>setPhoto(null);img.src=image;return()=>{img.onload=null;img.onerror=null}},[image]);
 useEffect(()=>{setPositions({title:{x:82,y:260},body:{x:82,y:710}});setSelected(null)},[index]);
 useEffect(()=>{const node=selected==='title'?title.current:selected==='body'?bodyNode.current:null;if(node&&transform.current){transform.current.nodes([node]);transform.current.getLayer()?.batchDraw()}else transform.current?.nodes([])},[selected,index]);
 useEffect(()=>{onExportReady?.(()=>stage.current?.toDataURL({pixelRatio:1/scale,mimeType:'image/png'})||'')},[onExportReady,headline,body,image,background,foreground,accent,font,brand,index,count,positions,scale]);
 const imgScale=photo?Math.max(1080/photo.width,1350/photo.height):1;
 const imgWidth=photo?photo.width*imgScale:0,imgHeight=photo?photo.height*imgScale:0;
 const textBase={fontFamily:font,fill:foreground,wrap:'word' as const,draggable:true};
 return <div className="mx-auto max-w-[420px]">
  <div className="mb-2 text-center text-xs text-zinc-400">Arraste títulos e textos. Clique para redimensionar.</div>
  <Stage ref={stage} width={1080*scale} height={1350*scale} scaleX={scale} scaleY={scale} onMouseDown={e=>{if(e.target===e.target.getStage())setSelected(null)}} className="overflow-hidden rounded-xl border border-white/10">
   <Layer>
    <Rect x={0} y={0} width={1080} height={1350} fill={background}/>
    {photo&&<KImage image={photo} x={(1080-imgWidth)/2} y={(1350-imgHeight)/2} width={imgWidth} height={imgHeight} listening={false}/>}
    <Rect x={0} y={0} width={820} height={1350} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:820,y:0}} fillLinearGradientColorStops={[0,'rgba(0,0,0,.76)',1,'rgba(0,0,0,0)']} listening={false}/>
    <Rect x={80} y={93} width={110} height={8} fill={accent} listening={false}/>
    <Text x={82} y={135} width={800} fontFamily={font} fontStyle="bold" fontSize={28} text={brand.toUpperCase()} fill="#fff" listening={false}/>
    <Text ref={title} {...textBase} x={positions.title.x} y={positions.title.y} width={880} text={headline} fontStyle="bold" fontSize={68} lineHeight={1.13} onClick={()=>setSelected('title')} onTap={()=>setSelected('title')} onDragEnd={e=>setPositions(p=>({...p,title:{x:e.target.x(),y:e.target.y()}}))} dragBoundFunc={pos=>({x:Math.max(25,Math.min(pos.x,1080*scale-200*scale)),y:Math.max(40,Math.min(pos.y,1350*scale-100*scale))})}/>
    <Text ref={bodyNode} {...textBase} x={positions.body.x} y={positions.body.y} width={880} text={body} fontSize={34} lineHeight={1.4} onClick={()=>setSelected('body')} onTap={()=>setSelected('body')} onDragEnd={e=>setPositions(p=>({...p,body:{x:e.target.x(),y:e.target.y()}}))}/>
    <Rect x={80} y={1190} width={920} height={3} fill={accent} listening={false}/>
    <Text x={80} y={1225} fontSize={27} text={String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0')} fontFamily={font} fill="#fff" listening={false}/>
    <Transformer ref={transform} enabledAnchors={['middle-left','middle-right','top-left','top-right','bottom-left','bottom-right']} rotateEnabled={false} boundBoxFunc={(oldBox,newBox)=>newBox.width<120||newBox.height<25?oldBox:newBox}/>
   </Layer>
  </Stage>
 </div>;
}
