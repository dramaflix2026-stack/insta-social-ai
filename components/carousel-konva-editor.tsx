'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Stage,Layer,Rect,Line,Circle,Image as KImage,Text,Transformer,Group} from 'react-konva';
import type Konva from 'konva';

export type LayoutRole='cover'|'split-left'|'split-right'|'feature'|'quote'|'checklist'|'cta';
export type TextPlacement={x:number;y:number;width:number;fontSize:number};
export type SlideLayout={role:LayoutRole;title:TextPlacement;body:TextPlacement};
type Props={headline:string;body:string;image?:string;background:string;foreground:string;accent:string;font:string;brand:string;index:number;count:number;templateId:string;layout:SlideLayout;onChange:(value:SlideLayout)=>void;registerExport:(index:number,fn:(()=>string)|null)=>void;active:boolean};
export function defaultSlideLayout(index:number,count:number):SlideLayout{
const roles:LayoutRole[]=['cover','split-left','split-right','feature','checklist','quote','cta'];
 const role=index===0?'cover':index===count-1?'cta':roles[1+((index-1)%5)];
 const positions:Record<LayoutRole,[TextPlacement,TextPlacement]>={
 cover:[{x:80,y:275,width:870,fontSize:86},{x:85,y:770,width:830,fontSize:36}],
 'split-left':[{x:80,y:250,width:570,fontSize:70},{x:80,y:610,width:540,fontSize:32}],
 'split-right':[{x:470,y:245,width:525,fontSize:64},{x:480,y:620,width:515,fontSize:30}],
 feature:[{x:85,y:835,width:890,fontSize:65},{x:85,y:1030,width:850,fontSize:29}],
 quote:[{x:150,y:420,width:785,fontSize:75},{x:155,y:820,width:765,fontSize:32}],
 checklist:[{x:80,y:245,width:830,fontSize:69},{x:90,y:660,width:805,fontSize:33}],
 cta:[{x:95,y:430,width:860,fontSize:83},{x:100,y:820,width:835,fontSize:35}]
 };
 return {role,title:{...positions[role][0]},body:{...positions[role][1]}};
}
const roles:LayoutRole[]=['cover','split-left','split-right','feature','checklist','quote','cta'];
 function defaultSlideLayoutForRole(role:LayoutRole):SlideLayout{const index=role==='cover'?0:role==='cta'?6:Math.max(1,['split-left','split-right','feature','checklist','quote'].indexOf(role)+1);return defaultSlideLayout(index,7)}
function readableColor(hex:string){const s=hex.replace('#','');if(s.length!==6)return '#ffffff';const r=parseInt(s.slice(0,2),16),g=parseInt(s.slice(2,4),16),b=parseInt(s.slice(4,6),16);return .2126*r+.7152*g+.0722*b>145?'#1b1b1b':'#ffffff'}
export default function CarouselKonvaEditor({headline,body,image,background,foreground,accent,font,brand,index,count,templateId,layout,onChange,registerExport,active}:Props){
 const stage=useRef<Konva.Stage>(null);
 const transformer=useRef<Konva.Transformer>(null);
 const titleRef=useRef<Konva.Text>(null),bodyRef=useRef<Konva.Text>(null);
 const [selected,setSelected]=useState<'title'|'body'|null>(null);
 const [photo,setPhoto]=useState<HTMLImageElement|null>(null);
 const [width,setWidth]=useState(420);
 const scale=width/1080;
 const light=templateId==='minimal'||templateId==='luxury'||templateId==='pop';
 const role=layout.role||defaultSlideLayout(index,count).role;
 const exported=useCallback(()=>{
  const node=stage.current;if(!node)return '';
  const previous=transformer.current?.visible();
  transformer.current?.hide();transformer.current?.getLayer()?.batchDraw();
  try{return node.toDataURL({pixelRatio:1/scale,mimeType:'image/png'})}
  finally{if(previous)transformer.current?.show();transformer.current?.getLayer()?.batchDraw()}
 },[scale]);
 useEffect(()=>{registerExport(index,exported);return()=>registerExport(index,null)},[index,registerExport,exported]);
 useEffect(()=>{const resize=()=>setWidth(Math.min(420,Math.max(240,window.innerWidth-110)));resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);
 useEffect(()=>{setPhoto(null);if(!image)return;const img=new window.Image();img.onload=()=>setPhoto(img);img.onerror=()=>setPhoto(null);img.src=image;return()=>{img.onload=null;img.onerror=null}},[image]);
 useEffect(()=>{if(!active){setSelected(null);return}const node=selected==='title'?titleRef.current:selected==='body'?bodyRef.current:null;transformer.current?.nodes(node?[node]:[]);transformer.current?.getLayer()?.batchDraw()},[selected,active]);
 const update=(key:'title'|'body',change:Partial<TextPlacement>)=>onChange({...layout,[key]:{...layout[key],...change}});
 const darkInk=readableColor(background);
 const ink=light?foreground:'#ffffff';
 const titleSize=Math.min(layout.title.fontSize,Math.max(30,Math.floor(layout.title.width/Math.max(10,headline.length)*5.8)));
 const availableText=titleSize*1.18*Math.ceil(headline.length/Math.max(12,layout.title.width/titleSize*1.8));
 const bodyY=Math.min(1090,Math.max(layout.body.y,layout.title.y+availableText+35));
 const photoRect={x:0,y:0,w:1080,h:1350};
 const picture=photo?(()=>{const region=photoRect;const cover=Math.max(region.w/photo.width,region.h/photo.height);return {x:region.x+(region.w-photo.width*cover)/2,y:region.y+(region.h-photo.height*cover)/2,w:photo.width*cover,h:photo.height*cover}})():null;
 const hasFull=role==='cover'||role==='cta';
 const textPanel=role==='split-left'?{x:42,y:207,w:605,h:755}:role==='split-right'?{x:434,y:207,w:608,h:755}:role==='feature'?{x:38,y:802,w:1004,h:350}:role==='quote'?{x:72,y:350,w:940,h:570}:role==='checklist'?{x:43,y:205,w:610,h:820}:null;
 const panelFill=light?'rgba(250,247,241,.88)':'rgba(5,9,13,.76)';
 const growth=templateId==='growth';
 const cleanHeadline=headline.trim().replace(/\\s+/g,' ');
 const words=cleanHeadline.split(' ').filter(Boolean);
 const leadNumber=words.find(w=>/^\\d+$/.test(w))||'';
 const remaining=leadNumber?words.filter(w=>w!==leadNumber):words;
 const spotlight=remaining.length>1?remaining[remaining.length-1]:(remaining[0]||'');
 const titleMain=remaining.slice(0,-1).join(' ')||cleanHeadline;
 const coverMode=index===0;
 const heroTop=coverMode?300:285;
 const mainSize=leadNumber&&coverMode?112:Math.min(108,Math.max(57,900/(Math.max(9,titleMain.length)*.115)));
 const spotlightSize=Math.min(118,Math.max(68,760/Math.max(5,spotlight.length)*.8));
 const labelOne=(body.trim().split(/[.!?]/)[0]||'').slice(0,100);
 const featureLabels=[...new Set([...(labelOne.split(/[,;:]/).map(t=>t.trim()).filter(t=>t.length>=4)),...remaining.filter(w=>w.length>=4)])].slice(0,5);
 const features=featureLabels.length?featureLabels:['CRIAR','PLANEJAR','EVOLUIR'];

 const photoShade=role==='split-right'?{x:370,y:0,w:710,h:1350}:role==='feature'?{x:0,y:740,w:1080,h:610}:{x:0,y:0,w:770,h:1350};
 return <div className={active?'mx-auto max-w-[420px]':'absolute -left-[20000px] top-0 pointer-events-none'} aria-hidden={!active}>
  {active&&<div className="mb-3 space-y-2"><p className="text-center text-xs text-zinc-400">Arraste os textos, selecione para redimensionar. Alterações ficam salvas por slide.</p><div className="flex gap-2 items-center justify-center"><label className="text-xs text-zinc-300" htmlFor={'role-'+index}>Composição</label><select id={'role-'+index} className="rounded-lg bg-zinc-800 p-2 text-xs text-white" value={role} onChange={e=>{const next=defaultSlideLayout(index,count);next.role=e.target.value as LayoutRole;onChange({...defaultSlideLayoutForRole(next.role),role:next.role})}}>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select></div></div>}
  <Stage ref={stage} width={1080*scale} height={1350*scale} scaleX={scale} scaleY={scale} className="overflow-hidden rounded-xl border border-white/10" onMouseDown={e=>{if(e.target===e.target.getStage())setSelected(null)}}>
   <Layer>
    <Rect width={1080} height={1350} fill={background} listening={false}/>
    {photo&&picture&&<Group clipX={photoRect.x} clipY={photoRect.y} clipWidth={photoRect.w} clipHeight={photoRect.h} listening={false}><KImage image={photo} x={picture.x} y={picture.y} width={picture.w} height={picture.h}/></Group>}
    <Rect x={photoShade.x} y={photoShade.y} width={photoShade.w} height={photoShade.h} fill={light?'rgba(0,0,0,.10)':'rgba(0,0,0,.21)'} listening={false}/>
    {textPanel&&<Rect x={textPanel.x} y={textPanel.y} width={textPanel.w} height={textPanel.h} cornerRadius={14} fill={panelFill} listening={false}/>}
    {hasFull&&<Rect width={1080} height={1350} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:930,y:170}} fillLinearGradientColorStops={[0,'rgba(0,0,0,.78)',.6,'rgba(0,0,0,.38)',1,'rgba(0,0,0,.05)']} listening={false}/>}
    {templateId==='tech'&&Array.from({length:7},(_,i)=><Line key={'grid'+i} points={[70+i*160,105,70+i*160,1160]} stroke={accent} opacity={.18} strokeWidth={2} listening={false}/>)}
    {templateId==='pop'&&<><Circle x={955} y={225} radius={250} fill={accent} opacity={.55} listening={false}/><Circle x={140} y={1100} radius={135} fill={accent} opacity={.25} listening={false}/></>}
    {templateId==='minimal'&&<Rect x={48} y={55} width={984} height={1220} stroke={foreground} strokeWidth={2} listening={false}/>}
    {templateId==='luxury'&&<Rect x={58} y={61} width={964} height={1210} stroke={accent} strokeWidth={2} listening={false}/>}
    {templateId==='bold'&&<Rect x={0} y={0} width={18} height={1350} fill={accent} listening={false}/>}
    {growth&&<Group listening={false}>
      <Rect x={0} y={0} width={1080} height={1350} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:960,y:90}} fillLinearGradientColorStops={[0,'rgba(0,0,0,.91)',.48,'rgba(0,0,0,.65)',1,'rgba(0,0,0,.05)']}/>
      <Text x={82} y={209} width={800} text="ESTRATÉGIA   •   PRODUTO   •   CRESCIMENTO" fontFamily={font} fontSize={16} letterSpacing={5} fill="#f5f5f5"/>
      {leadNumber&&coverMode&&<Text x={68} y={294} text={leadNumber} fontFamily={font} fontStyle="bold" fontSize={282} fill={accent} shadowColor={accent} shadowBlur={20} shadowOpacity={.45}/>}
      <Text x={leadNumber&&coverMode?338:80} y={heroTop} width={leadNumber&&coverMode?690:910} text={titleMain.toUpperCase()} fontFamily={font} fontStyle="bold" fontSize={leadNumber&&coverMode?102:mainSize} lineHeight={.97} fill="#ffffff" shadowColor="#000000" shadowBlur={9}/>
      <Text x={78} y={leadNumber&&coverMode?590:507} width={850} text={spotlight.toUpperCase()} fontFamily={font} fontStyle="bold" fontSize={spotlightSize} fill={accent} shadowColor={accent} shadowBlur={20} shadowOpacity={.35}/>
      {coverMode&&<Group x={740} y={250}><Line points={[0,80,38,24,110,0]} stroke={accent} strokeWidth={6} tension={.3}/><Text x={18} y={103} width={220} text="IDEIA  →  AÇÃO" fontSize={23} fontFamily={font} fill="#ffffff" rotation={-8}/></Group>}
      <Rect x={62} y={1010} width={956} height={144} cornerRadius={22} fill="rgba(9,18,21,.86)" stroke="rgba(255,255,255,.17)" strokeWidth={1}/>
      {features.slice(0,5).map((label,i,arr)=><Group key={i} x={77+i*(932/arr.length)} y={1026}>
        <Rect width={Math.min(170,920/arr.length-10)} height={112} cornerRadius={14} fill="rgba(255,255,255,.055)"/>
        <Circle x={Math.min(170,920/arr.length-10)/2} y={29} radius={11} stroke={accent} strokeWidth={3}/>
        <Text x={8} y={61} width={Math.min(155,920/arr.length-26)} align="center" text={label.toUpperCase().slice(0,18)} fontFamily={font} fontStyle="bold" fontSize={17} fill="#ffffff"/>
      </Group>)}
      <Rect x={713} y={1253} width={307} height={61} cornerRadius={32} stroke={accent} strokeWidth={3} shadowColor={accent} shadowBlur={10} shadowOpacity={.34}/>
      <Text x={726} y={1273} width={280} align="center" text={index===count-1?'SALVE E COMPARTILHE →':'DESLIZE PARA VER →'} fontFamily={font} fontStyle="bold" fontSize={18} fill="#ffffff"/>
    </Group>}
    {!growth&&role==='quote'&&<Text x={85} y={255} text="“" fontSize={220} fontFamily="Georgia" fill={accent} listening={false}/>}
    {role==='checklist'&&[0,1,2].map(i=><Group key={i} listening={false}><Rect x={90} y={930+i*72} width={32} height={32} stroke={accent} strokeWidth={3}/><Line points={[99,945+i*72,106,951+i*72,117,937+i*72]} stroke={accent} strokeWidth={4}/></Group>)}
    {!growth&&role==='cta'&&<Rect x={78} y={1020} width={410} height={88} cornerRadius={12} fill={accent} listening={false}/>}
    {!growth&&role==='cta'&&<Text x={99} y={1045} width={370} align="center" text="SALVE ESTE CONTEÚDO  →" fontSize={24} fontStyle="bold" fill={readableColor(accent)} listening={false}/>}
    <Rect x={0} y={0} width={1080} height={210} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:0,y:210}} fillLinearGradientColorStops={[0,'rgba(0,0,0,.68)',1,'rgba(0,0,0,0)']} listening={false}/>
    <Rect x={0} y={1165} width={1080} height={185} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:0,y:185}} fillLinearGradientColorStops={[0,'rgba(0,0,0,0)',1,'rgba(0,0,0,.84)']} listening={false}/>
    <Rect x={78} y={93} width={95} height={9} fill={accent} listening={false}/>
    <Text x={80} y={140} width={860} text={brand.toUpperCase().slice(0,45)} fontFamily={font} fontSize={27} fontStyle="bold" fill="#ffffff" listening={false}/>
    {!growth&&<Text ref={titleRef} text={headline} x={layout.title.x} y={layout.title.y} width={layout.title.width} fontSize={titleSize} fontStyle="bold" lineHeight={1.11} fontFamily={font} fill={hasFull?'#ffffff':ink} shadowColor={hasFull?'#000000':'transparent'} shadowBlur={hasFull?9:0} draggable={active} onClick={()=>setSelected('title')} onTap={()=>setSelected('title')} onDragEnd={e=>update('title',{x:e.target.x(),y:e.target.y()})} onTransformEnd={()=>{const n=titleRef.current;if(!n)return;update('title',{x:n.x(),y:n.y(),width:Math.max(160,n.width()*n.scaleX()),fontSize:Math.max(22,n.fontSize()*n.scaleY())});n.scale({x:1,y:1})}}/>}
    <Text ref={bodyRef} text={body} x={growth?83:layout.body.x} y={growth?792:bodyY} width={growth?700:layout.body.width} fontSize={growth?32:layout.body.fontSize} lineHeight={1.35} fontFamily={font} fill={hasFull?'#ffffff':ink} draggable={active} onClick={()=>setSelected('body')} onTap={()=>setSelected('body')} onDragEnd={e=>update('body',{x:e.target.x(),y:e.target.y()})} onTransformEnd={()=>{const n=bodyRef.current;if(!n)return;update('body',{x:n.x(),y:n.y(),width:Math.max(160,n.width()*n.scaleX()),fontSize:Math.max(18,n.fontSize()*n.scaleY())});n.scale({x:1,y:1})}}/>
    {!growth&&<Rect x={80} y={1190} width={920} height={3} fill={accent} listening={false}/>}
    <Text x={80} y={1227} text={String(index+1).padStart(2,'0')+' / '+String(count).padStart(2,'0')} fontSize={27} fontStyle="bold" fontFamily={font} fill="#ffffff" listening={false}/>
    {!growth&&<Text x={745} y={1229} width={255} align="right" text={index===count-1?'COMPARTILHE':'DESLIZE  →'} fontSize={23} fontFamily={font} fill={hasFull?'#ffffff':ink} listening={false}/>}
    <Transformer ref={transformer} rotateEnabled={false} keepRatio={false} enabledAnchors={['middle-left','middle-right','top-left','top-right','bottom-left','bottom-right']} boundBoxFunc={(oldBox,newBox)=>newBox.width<110||newBox.height<25?oldBox:newBox}/>
   </Layer>
  </Stage>
 </div>;
}
