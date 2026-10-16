'use client';
import {useEffect,useRef,useState} from 'react';
import WorkspaceShell from '@/components/workspace-shell';
import dynamic from 'next/dynamic';
const KonvaEditor=dynamic(()=>import('@/components/carousel-konva-editor'),{ssr:false});
type TemplateId='bold'|'minimal'|'cinematic'|'luxury'|'pop'|'tech';
const TEMPLATES:{id:TemplateId;name:string;tagline:string;bg:string;accent:string;fg:string;font:string}[]=[
{id:'bold',name:'Bold Impact',tagline:'Tipografia e contraste',bg:'#101010',accent:'#b6f533',fg:'#ffffff',font:'Arial'},
{id:'minimal',name:'Minimalista',tagline:'Elegância e respiro',bg:'#f5f2e9',accent:'#111111',fg:'#171717',font:'Arial'},
{id:'cinematic',name:'Cinematográfico',tagline:'Fotografia e profundidade',bg:'#101820',accent:'#e7be74',fg:'#ffffff',font:'Arial'},
{id:'luxury',name:'Editorial Luxo',tagline:'Revista e sofisticação',bg:'#ede4d8',accent:'#735b45',fg:'#241f1b',font:'Georgia'},
{id:'pop',name:'Criativo Pop',tagline:'Cores e movimento',bg:'#fbecff',accent:'#f04b83',fg:'#21144c',font:'Arial'},
{id:'tech',name:'Tech Futurista',tagline:'Interfaces e circuitos',bg:'#080d23',accent:'#54e5fb',fg:'#ffffff',font:'Arial'}
];
type Brand={id:string;name:string;niche:string;instructions:string};
type Slide={headline:string;body:string;image?:string;rendered?:boolean;visualConcept?:string;composition?:string;visualElements?:string};
type LocalProject={id:string;name:string;date:string;slides:Slide[];topic:string;caption:string;brandId:string;hashtags?:string[];background?:string;accent?:string;foreground?:string;font?:string;templateId?:TemplateId};
export default function Page(){
 const [brands,setBrands]=useState<Brand[]>([]);
 const [brandId,setBrandId]=useState('');
 const [topic,setTopic]=useState('');
 const [count,setCount]=useState(5);
 const [slides,setSlides]=useState<Slide[]>([]);
 const [caption,setCaption]=useState('');
 const [hashtags,setHashtags]=useState<string[]>([]);
 const [selected,setSelected]=useState(0);
 const [busy,setBusy]=useState(false);
 const [progress,setProgress]=useState('');
 const [konvaMode,setKonvaMode]=useState(false);
 const konvaExport=useRef<()=>string>(()=>'');
 const onKonvaExportReady=useRef((fn:()=>string)=>{konvaExport.current=fn}).current;
 const [showTextOverlay,setShowTextOverlay]=useState(false);
 const imageCache=useRef<Map<string,HTMLImageElement>>(new Map());
 const [error,setError]=useState('');
 const [background,setBackground]=useState('#151515');
 const [accent,setAccent]=useState('#facc15');
 const [foreground,setForeground]=useState('#ffffff');
 const [font,setFont]=useState('Arial');
 const [templateId,setTemplateId]=useState<TemplateId>('bold');
 const template=TEMPLATES.find(t=>t.id===templateId)||TEMPLATES[0];
 function chooseTemplate(id:TemplateId){const t=TEMPLATES.find(x=>x.id===id);if(!t)return;setTemplateId(id);setBackground(t.bg);setAccent(t.accent);setForeground(t.fg);setFont(t.font);setShowTextOverlay(true)}
 function selectBrand(id:string){setBrandId(id);const b=brands.find(x=>x.id===id);if(!b)return;const colors=b.instructions.match(/#[0-9a-fA-F]{6}/g);if(colors?.[0])setBackground(colors[0]);if(colors?.[1])setAccent(colors[1]);}
 const canvas=useRef<HTMLCanvasElement>(null);
 const brand=brands.find(x=>x.id===brandId);
 const [ready,setReady]=useState(false);
 const [cloudProjects,setCloudProjects]=useState<Array<{id:string;name:string;content:{slides:Slide[];topic:string;caption:string;brandId:string;hashtags?:string[];background?:string;accent?:string;foreground?:string;font?:string;templateId?:TemplateId}}>>([]);
 const [cloudStatus,setCloudStatus]=useState('');
 const [localStatus,setLocalStatus]=useState('');
 const [cloudBusy,setCloudBusy]=useState(false);
 const [activeCloudId,setActiveCloudId]=useState('');
 const [projects,setProjects]=useState<LocalProject[]>([]);
 useEffect(()=>{try{const v=window.localStorage.getItem('carousel-draft-v1');if(v){const d=JSON.parse(v);if(Array.isArray(d.slides)){setSlides(d.slides.slice(0,10));setTopic(d.topic||'');setCaption(d.caption||'');setHashtags(d.hashtags||[]);setBackground(d.background||'#151515');setAccent(d.accent||'#facc15');setForeground(d.foreground||'#ffffff');setFont(d.font||'Arial');if(TEMPLATES.some(t=>t.id===d.templateId))setTemplateId(d.templateId);setBrandId(d.brandId||'')}}}catch{}try{const saved=window.localStorage.getItem('carousel-projects-v1');if(saved)setProjects(JSON.parse(saved))}catch{}setReady(true)},[]);
 useEffect(()=>{if(!ready)return;try{const lightweight=slides.map(({image,...rest})=>rest);window.localStorage.setItem('carousel-draft-v1',JSON.stringify({slides:lightweight,topic,caption,brandId,hashtags,background,accent,foreground,font,templateId}))}catch{setLocalStatus('Rascunho muito grande para o armazenamento local; salve na nuvem.')}},[ready,slides,topic,caption,brandId,hashtags,background,accent,foreground,font,templateId]);
 useEffect(()=>{fetch('/api/instagram/brands').then(r=>r.json()).then(j=>setBrands(j.brands||[])).catch(()=>{})},[]);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const incoming=params.get('topic');if(incoming){setTopic(incoming.slice(0,350));const id=params.get('brandId');if(id)setBrandId(id)}},[]);
 async function generate(){setBusy(true);setError('');setProgress('Criando roteiro editorial...');try{const r=await fetch('/api/carousels/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,count,brandId})});const j=await r.json();if(!r.ok)throw Error(j.error||'Falha ao gerar');const base:Slide[]=j.slides.map((s:Slide)=>({...s}));setSlides(base);setCaption(j.caption);setHashtags(j.hashtags);setActiveCloudId('');setSelected(0);setShowTextOverlay(true);const b=brands.find(x=>x.id===brandId);const generated=base.slice();let completed=0;let failed=0;const artDirection=['Create a cohesive premium Instagram carousel campaign based on the USERS TOPIC and BRAND. Every slide is a separate, COMPLETE, publish-ready editorial advertisement with its own distinct art-directed visual.','MASTER VISUAL SYSTEM: Choose an appropriate art direction from the actual topic, niche, brand guidelines and brand colors. Maintain the SAME typography language, palette, visual motifs, lighting, texture and creative campaign across all panels. Never force unrelated SaaS, dark green, black backgrounds, laptop scenes or generic templates.','Strong commercial design, sophisticated composition, purposeful visual storytelling, high contrast legible typography, authentic subject-specific photos or 3D imagery. Each slide must look beautiful alone and visually belong to the same series when swiped in order.','The series has a narrative: cover with an attention-grabbing hook; middle slides build sequential knowledge with distinct relevant scenes; final slide closes with the user-approved CTA. Keep continuity of subject, identity and campaign style, but vary composition and imagery.','Produce a premium full-bleed BACKGROUND PLATE for an editorial carousel; typographic layout is rendered separately by the app. Do not produce a plain background, placeholder or generic text card. Do not render any words, typography, letters, numerals or logos in the image. The app adds all text later as a separate overlay. Produce rich cinematic photography, meaningful environmental storytelling, layered depth and sophisticated lighting instead of isolated 3D icons or black template backgrounds.','Never invent statistics, performance claims, third-party logos or testimonials.'].join(' ');const compactReference=async(uri:string)=>{const img=new Image();img.src=uri;await img.decode();const c=document.createElement('canvas');c.width=512;c.height=768;const x=c.getContext('2d');if(!x)throw Error('Falha ao preparar referência');x.drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.72)};let masterReference='';const makeImage=async(i:number)=>{const s=base[i];const prompt=[artDirection,'SERIES IDENTITY / SHARED BRIEF: '+topic,'BRAND: '+(b?.name||'Marca pessoal'),'NICHE: '+(b?.niche||'General'),'BRAND GUIDELINES: '+(b?.instructions||'No additional brand rules').slice(0,500),'SELECTED DESIGN SYSTEM: '+template.name+' - '+template.tagline+'. Develop relevant visuals compatible with this exact visual theme.','COLOR GUIDANCE: background '+background+', accent '+accent+', typography '+foreground+'. Adapt intelligently to the topic.','PANEL '+(i+1)+' OF '+base.length+'.','DETAILED SCENE TO CREATE (NOT TO BE WRITTEN): '+(s.visualConcept||s.headline), 'SHOT AND COMPOSITION: '+(s.composition||'cinematic wide environmental scene with meaningful foreground, middle ground and background'), 'PURPOSEFUL EDITORIAL DETAILS: '+(s.visualElements||'subtle topic-relevant graphic accents'),'VISUAL CONTEXT (NOT TO BE WRITTEN): '+s.body,'PREVIOUS STORY BEATS: '+base.slice(0,i).map(x=>x.headline).join(' | '),'NEXT STORY BEATS: '+base.slice(i+1).map(x=>x.headline).join(' | '),i===0?'Create a dramatic magazine-cover style opening that establishes the campaign visual identity.':i===base.length-1?'Create a visually distinctive final campaign panel with a clear conclusion and CTA.':'Create a new distinct visual scene advancing the same editorial story; do not simply repeat the cover.','Portrait artwork 1024x1536, which will be CENTER-CROPPED to 4:5. CRITICAL: keep ALL text and logos within the central 1024x1280 safe area, leaving the top 150px and bottom 150px free of any text or key elements. Leave at least 100px lateral padding. Do not place any text in the image. Reserve an uncluttered but visually interesting area on the LEFT 55 percent for the app typography; keep the detailed main photographic subject on the RIGHT 45 percent, with a naturally darker left portion for readability. Avoid placing faces and key subjects near outer 12 percent edges.'].join('\\n');try{const ir=await fetch('/api/images/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt+(i>0?'\nUse the supplied first-slide reference as the VISUAL STYLE GUIDE ONLY. Create a NEW composition and NEW subject-specific scene for this slide, preserving campaign palette, typography style, lighting and motifs. DO NOT duplicate or simply modify the previous image.':'') ,format:'portrait',style:'editorial',quality:'high',...(i>0&&masterReference?{reference:masterReference}:{})})});const data=await ir.json();if(!ir.ok||!data.image)throw Error(data.error||'Imagem indisponível');generated[i]={...generated[i],image:data.image,rendered:true};if(i===0){try{masterReference=await compactReference(data.image)}catch{masterReference=''}}setSlides([...generated]);return true}catch(e){setError(old=>[old,'Slide '+(i+1)+': '+(e instanceof Error?e.message:'Falha na imagem')].filter(Boolean).join(' • '));return false}finally{completed++;setProgress('Artes geradas: '+completed+' de '+base.length)}};for(let i=0;i<base.length;i++){setProgress('Gerando arte '+(i+1)+' de '+base.length+(i>0?' com referência visual da capa...':' e definindo a identidade visual...'));if(!await makeImage(i))failed++}if(failed)setError(old=>old+' • '+failed+' arte(s) não foram geradas; os slides sem imagem são apenas rascunhos, não artes finais.');setProgress(failed?'Geração incompleta: '+failed+' slide(s) sem arte':'Carrossel cinematográfico pronto!')}catch(e){setError(e instanceof Error?e.message:'Erro na geração')}finally{setBusy(false)}}
 function draw(index:number,preview=false){
  const el=(preview?canvas.current:null)||document.createElement('canvas');
  if(!el)return document.createElement('canvas');
  el.width=1080;el.height=1350;
  const context=el.getContext('2d');if(!context)return el;
  const g:CanvasRenderingContext2D=context;
  const slide=slides[index];if(!slide)return el;
  const variant=index===0?0:index===slides.length-1?4:1+((index-1)%3);
  const dark=templateId==='bold'||templateId==='cinematic'||templateId==='tech';
  const ink=foreground, highlight=accent;
  g.fillStyle=background;g.fillRect(0,0,1080,1350);
  // Five layout compositions for each of the six design systems.
  function imageRect(x:number,y:number,w:number,h:number){
   if(!slide.image)return;
   let img=imageCache.current.get(slide.image);
   if(!img){img=new Image();img.onload=()=>{if(preview)draw(index,true)};img.src=slide.image;imageCache.current.set(slide.image,img)}
   if(img.complete&&img.naturalWidth){
    g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
    const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
    g.drawImage(img,x+(w-img.naturalWidth*scale)/2,y+(h-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
    g.restore();
   }
  }
  const fullBleed=templateId==='cinematic'||(templateId==='bold'&&variant===0);
  if(fullBleed)imageRect(0,0,1080,1350);
  else if(templateId==='minimal'||templateId==='luxury'){
   imageRect(variant===2?75:variant===3?595:515,variant===0?430:variant===4?200:310,variant===2?930:variant===3?415:490,variant===2?540:variant===4?760:700);
  }else if(templateId==='pop'){
   g.fillStyle=accent;g.beginPath();g.arc(variant===2?150:950,variant===4?1100:280,variant===0?320:270,0,Math.PI*2);g.fill();
   imageRect(variant===1?60:450,variant===0?530:350,variant===1?650:550,variant===4?520:650);
  }else if(templateId==='tech'){
   g.strokeStyle=accent;g.globalAlpha=.3;g.lineWidth=2;
   for(let i=0;i<7;i++){g.beginPath();g.moveTo(30+i*165,200);g.lineTo(30+i*165,1130);g.stroke()}
   g.globalAlpha=1;imageRect(variant===3?100:440,variant===0?510:320,variant===3?880:580,variant===4?420:710);
  }else imageRect(variant===2?80:485,variant===0?430:310,variant===2?920:520,variant===4?550:690);
  if(fullBleed){
   const sh=g.createLinearGradient(0,0,860,200);sh.addColorStop(0,'rgba(0,0,0,.88)');sh.addColorStop(.58,'rgba(0,0,0,.48)');sh.addColorStop(1,'rgba(0,0,0,.08)');
   g.fillStyle=sh;g.fillRect(0,0,1080,1350);
  }else if(dark){
   const sh=g.createLinearGradient(0,0,800,0);sh.addColorStop(0,'rgba(0,0,0,.68)');sh.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=sh;g.fillRect(0,0,1080,1350);
  }
  if(templateId==='minimal'){g.strokeStyle='#191919';g.lineWidth=2;g.strokeRect(54,55,972,1238);g.fillStyle=highlight;g.fillRect(78,82,78,6)}
  if(templateId==='luxury'){g.strokeStyle=accent;g.lineWidth=2;g.strokeRect(58,63,964,1220);g.beginPath();g.moveTo(80,205);g.lineTo(1000,205);g.stroke()}
  if(templateId==='pop'){g.save();g.translate(790,130);g.rotate(-.15);g.fillStyle='#f8ce3f';g.fillRect(-160,-42,315,72);g.restore()}
  if(templateId==='tech'){g.strokeStyle=accent;g.lineWidth=3;g.strokeRect(45,65,990,1220);g.fillStyle=accent;g.fillRect(45,65,210,8)}
  if(templateId==='bold'){g.fillStyle=accent;g.fillRect(0,0,19,1350);g.fillRect(78,102,100,11)}
  const safeX=78,maxWidth=variant===2?900:variant===3?760:805;
  g.textBaseline='top';
  g.fillStyle=ink;
  const brandName=(brand?.name||'INSTA SOCIAL AI').toUpperCase().slice(0,36);
  g.font='bold 26px '+font;g.fillText(brandName,safeX,variant===0?145:120,840);
  function wrap(text:string,size:number,weight:string,max:number){
   g.font=weight+' '+size+'px '+font;
   const words=text.trim().split(/\s+/).filter(Boolean),lines:string[]=[];
   let line='';
   for(const word of words){
    const candidate=line?line+' '+word:word;
    if(g.measureText(candidate).width>max&&line){lines.push(line);line=word}
    else line=candidate;
    if(g.measureText(line).width>max){
     let part='';for(const char of line){if(part&&g.measureText(part+char).width>max){lines.push(part);part=char}else part+=char}line=part;
    }
   }
   if(line)lines.push(line);
   return lines;
  }
  const headline=slide.headline.trim();
  const body=slide.body.trim();
  let titleSize=80,bodySize=33,titleLines:string[]=[],bodyLines:string[]=[];
  // Fit BOTH the number of lines and the vertical space into strict bounds.
  for(let t=80;t>=38;t-=2){
   const lines=wrap(headline,t,'bold',maxWidth);
   if(lines.length<=5 && lines.every(l=>{g.font='bold '+t+'px '+font;return g.measureText(l).width<=maxWidth})){
    titleSize=t;titleLines=lines;break;
   }
  }
  if(!titleLines.length)titleLines=wrap(headline,titleSize,'bold',maxWidth);
  for(let t=33;t>=22;t--){
   const lines=wrap(body,t,'normal',maxWidth);
   if(lines.length<=6){bodySize=t;bodyLines=lines;break}
  }
  if(!bodyLines.length)bodyLines=wrap(body,bodySize,'normal',maxWidth);
  let headingHeight=titleLines.length*titleSize*1.16,bodyHeight=bodyLines.length*bodySize*1.42;
  while(headingHeight+bodyHeight+95>835&&titleSize>34){
   titleSize-=2;titleLines=wrap(headline,titleSize,'bold',maxWidth);
   headingHeight=titleLines.length*titleSize*1.16;
  }
  while(headingHeight+bodyHeight+95>835&&bodySize>18){
   bodySize-=1;bodyLines=wrap(body,bodySize,'normal',maxWidth);
   bodyHeight=bodyLines.length*bodySize*1.42;
  }
  // Layout role changes between cover, three content arrangements and CTA.
  const left=variant===3?135:safeX;
  const allowedWidth=variant===2?900:variant===3?755:maxWidth;
  let y=variant===0?270:variant===1?260:variant===2?780:variant===3?245:760;
  const maxBottom=variant===2||variant===4?1140:1130;
  const available=maxBottom-y;
  while(headingHeight+bodyHeight+43>available&&titleSize>30){
   titleSize-=2;titleLines=wrap(headline,titleSize,'bold',allowedWidth);
   headingHeight=titleLines.length*titleSize*1.16;
  }
  while(headingHeight+bodyHeight+43>available&&bodySize>17){
   bodySize--;bodyLines=wrap(body,bodySize,'normal',allowedWidth);
   bodyHeight=bodyLines.length*bodySize*1.42;
  }
  if(variant===2||variant===4){
   g.fillStyle=templateId==='minimal'||templateId==='luxury'?'rgba(245,242,233,.96)':dark?'rgba(4,6,14,.86)':'rgba(255,245,255,.92)';
   g.fillRect(49,y-38,982,Math.min(450,headingHeight+bodyHeight+110));
  }
  g.fillStyle=foreground;
  g.shadowColor=dark?'rgba(0,0,0,.6)':'transparent';g.shadowBlur=dark?9:0;
  for(const line of titleLines){g.font='bold '+titleSize+'px '+font;g.fillText(line,left,y,allowedWidth);y+=titleSize*1.16}
  y+=24;g.fillStyle=foreground;
  for(const line of bodyLines){if(y+bodySize>maxBottom)break;g.font=bodySize+'px '+font;g.fillText(line,left,y,allowedWidth);y+=bodySize*1.42}
  g.shadowBlur=0;
  g.fillStyle=accent;g.fillRect(safeX,1190,924,3);
  g.fillStyle=foreground;g.font='bold 24px '+font;
  g.fillText(String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0'),safeX,1224);
  g.textAlign='right';g.font='bold 21px '+font;
  g.fillText(index===slides.length-1?'SALVE E COMPARTILHE':'DESLIZE PARA O LADO  →',1000,1224);
  g.textAlign='left';
  return el;
 }
 async function download(index:number){const s=slides[index];if(s?.image){await new Promise<void>(resolve=>{const img=new Image();img.onload=()=>{imageCache.current.set(s.image!,img);resolve()};img.onerror=()=>resolve();img.src=s.image!})}const el=draw(index);const a=document.createElement('a');a.href=konvaMode&&index===selected?(konvaExport.current()||el.toDataURL('image/png')):el.toDataURL('image/png');a.download='carrossel-'+String(index+1).padStart(2,'0')+'.png';a.click()}
 useEffect(()=>{fetch('/api/carousels/projects').then(async r=>{const j=await r.json();if(!r.ok)throw Error(j.error||'Falha ao carregar projetos');return j}).then(j=>{if(Array.isArray(j.projects))setCloudProjects(j.projects)}).catch(e=>setCloudStatus(e instanceof Error?e.message:'Não foi possível carregar a biblioteca'))},[]);
 async function saveCloud(){if(!slides.length||cloudBusy)return;const existing=cloudProjects.find(p=>p.id===activeCloudId);const name=window.prompt('Nome do projeto na nuvem',existing?.name||topic.slice(0,60)||'Meu carrossel');if(!name?.trim())return;setCloudBusy(true);setCloudStatus('Salvando...');try{const r=await fetch('/api/carousels/projects',{method:activeCloudId?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:activeCloudId,name,content:{slides,topic,caption,brandId,hashtags,background,accent,foreground,font,templateId}})});const j=await r.json();if(!r.ok)throw Error(j.error||'Erro ao salvar');setCloudProjects(old=>[j.project,...old.filter(p=>p.id!==j.project.id)]);setActiveCloudId(j.project.id);setCloudStatus('Salvo na nuvem')}catch(e){setCloudStatus(e instanceof Error?e.message:'Erro ao salvar')}finally{setCloudBusy(false)}}
 function openCloud(id:string){const p=cloudProjects.find(x=>x.id===id);if(!p)return;setActiveCloudId(id);setSlides(p.content.slides.map(x=>({...x})));setTopic(p.content.topic||'');setCaption(p.content.caption||'');setBrandId(p.content.brandId||'');setHashtags(p.content.hashtags||[]);setBackground(p.content.background||'#151515');setAccent(p.content.accent||'#facc15');setForeground(p.content.foreground||'#ffffff');setFont(p.content.font||'Arial');setTemplateId(p.content.templateId||'bold');setSelected(0);setShowTextOverlay(true)}
 async function deleteCloud(id:string){if(cloudBusy)return;const p=cloudProjects.find(x=>x.id===id);if(!p||!window.confirm('Excluir definitivamente o projeto '+p.name+'?'))return;setCloudBusy(true);setCloudStatus('Excluindo...');try{const r=await fetch('/api/carousels/projects',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});const j=await r.json();if(!r.ok)throw Error(j.error||'Erro ao excluir');setCloudProjects(old=>old.filter(x=>x.id!==id));if(activeCloudId===id)setActiveCloudId('');setCloudStatus('Projeto excluído')}catch(e){setCloudStatus(e instanceof Error?e.message:'Erro ao excluir')}finally{setCloudBusy(false)}}
 function saveProject(){if(!slides.length)return;const name=window.prompt('Nome do projeto',topic.slice(0,60)||'Meu carrossel');if(!name?.trim())return;const item:LocalProject={id:String(Date.now()),name:name.trim().slice(0,80),date:new Date().toLocaleDateString('pt-BR'),slides:slides.map(({image,...rest})=>rest),topic,caption,brandId,hashtags:[...hashtags],background,accent,foreground,font,templateId};const next=[item,...projects].slice(0,30);try{window.localStorage.setItem('carousel-projects-v1',JSON.stringify(next));setProjects(next);setLocalStatus('Projeto salvo neste navegador')}catch{setError('Armazenamento do navegador cheio');setLocalStatus('Falha ao salvar projeto')}}
 function deleteProject(id:string){const item=projects.find(x=>x.id===id);if(!item||!window.confirm('Excluir o projeto local '+item.name+'?'))return;const next=projects.filter(x=>x.id!==id);try{window.localStorage.setItem('carousel-projects-v1',JSON.stringify(next));setProjects(next);setLocalStatus('Projeto local excluído')}catch{setError('Não foi possível atualizar projetos locais')}}
 function openProject(id:string){const item=projects.find(x=>x.id===id);if(!item)return;setSlides(item.slides.map(x=>({...x})));setTopic(item.topic);setCaption(item.caption);setBrandId(item.brandId);setHashtags(item.hashtags||[]);setBackground(item.background||'#151515');setAccent(item.accent||'#facc15');setForeground(item.foreground||'#ffffff');setFont(item.font||'Arial');setTemplateId(item.templateId||'bold');setActiveCloudId('');setSelected(0);setShowTextOverlay(true)}
 async function downloadZip(){if(!slides.length)return;try{await Promise.all(slides.map(s=>s.image?new Promise<void>(resolve=>{const img=imageCache.current.get(s.image!);if(img?.complete&&img.naturalWidth)return resolve();const image=new Image();image.onload=()=>resolve();image.onerror=()=>resolve();image.src=s.image!}):Promise.resolve()));const {default:JSZip}=await import('jszip');const zip=new JSZip();for(let i=0;i<slides.length;i++){const uri=konvaMode&&i===selected?(konvaExport.current()||draw(i).toDataURL('image/png')):draw(i).toDataURL('image/png');zip.file('slide-'+String(i+1).padStart(2,'0')+'.png',uri.split(',')[1],{base64:true})}zip.file('legenda.txt',[caption,hashtags.join(' ')].join('\n\n'));const blob=await zip.generateAsync({type:'blob'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='carrossel.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}catch{setError('Não foi possível gerar o ZIP')}}
 function downloadAll(){slides.forEach((_,i)=>setTimeout(()=>download(i),i*250))}
 function copyCaption(){const text=[caption,hashtags.join(' ')].filter(Boolean).join('\n\n');if(text)navigator.clipboard.writeText(text).catch(()=>setError('Falha ao copiar legenda'))}
 function newProject(){setActiveCloudId('');setSlides([]);setTopic('');setCaption('');setHashtags([]);setSelected(0)}
 useEffect(()=>{if(slides.length)draw(selected,true)},[slides,selected,background,accent,foreground,font,brandId,showTextOverlay,templateId]);
 const input='mt-2 w-full rounded-xl border border-white/10 bg-[#101115] p-3 text-white';
 return <WorkspaceShell><main className="min-h-screen bg-[#090a0d] px-5 py-9 text-white"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Estúdio criativo</p><h1 className="mt-3 text-4xl font-black">Carrosséis <span className="text-yellow-400">com IA</span></h1><p className="mt-3 text-zinc-400">Gere carrosséis cinematográficos completos com IA, com artes prontas para publicar em 1080 × 1350.</p><div className="mt-8 grid items-start gap-5 xl:grid-cols-[350px_1fr]"><section className="rounded-2xl border border-white/10 bg-[#17181e] p-6"><h2 className="font-bold">Briefing criativo</h2><div className="mt-4 rounded-xl border border-yellow-400/20 p-3"><p className="text-xs font-bold text-yellow-300">Biblioteca na nuvem</p>{cloudProjects.map(p=><div key={p.id} className="mt-2 flex items-center gap-2 rounded-lg bg-white/5 p-1"><button disabled={cloudBusy} onClick={()=>openCloud(p.id)} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-xs">{p.name}</button><button disabled={cloudBusy} onClick={()=>deleteCloud(p.id)} aria-label={"Excluir "+p.name} className="rounded-md px-2 py-2 text-xs text-red-300 hover:bg-red-500/10">Excluir</button></div>)}<p role="status" className="mt-2 text-xs text-zinc-400">{cloudStatus}</p></div>{projects.length>0&&<div className="mt-4 rounded-xl border border-white/10 p-3"><p className="mb-2 text-xs font-bold text-yellow-300">Projetos salvos neste navegador</p><div className="max-h-36 space-y-1 overflow-auto">{projects.map(p=><div key={p.id} className="flex items-center gap-2 rounded-lg hover:bg-white/10"><button onClick={()=>openProject(p.id)} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-xs text-zinc-300">{p.name} · {p.date}</button><button onClick={()=>deleteProject(p.id)} aria-label={'Excluir projeto local '+p.name} className="rounded-md px-2 py-2 text-xs text-red-300 hover:bg-red-500/10">Excluir</button></div>)}</div></div>}{localStatus&&<p role="status" className="mt-2 text-xs text-zinc-400">{localStatus}</p>}<label className="mt-5 block text-sm">Marca<select className={input} value={brandId} onChange={e=>selectBrand(e.target.value)}><option value="">Sem marca definida</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label className="mt-5 block text-sm">Tema<textarea className={input} value={topic} maxLength={350} onChange={e=>setTopic(e.target.value)} rows={4} placeholder="Ex.: 5 dicas para aumentar o engajamento"/></label><label className="mt-5 block text-sm">Quantidade de slides<select className={input} value={count} onChange={e=>setCount(Number(e.target.value))}>{[3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} slides</option>)}</select></label><button disabled={busy||topic.trim().length<5} onClick={generate} className="mt-6 w-full rounded-xl bg-yellow-400 p-4 font-extrabold text-black disabled:opacity-40">{busy?'Criando artes completas...':'Gerar carrossel visual com IA'}</button>{progress&&<p role="status" className="mt-3 text-sm text-yellow-300">{progress}</p>}{error&&<p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}<div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-bold">Escolha um template</h3><p className="mt-1 text-xs text-zinc-400">6 estilos originais, com 5 composições diferentes para capa, conteúdo e encerramento.</p><div className="mt-4 grid grid-cols-2 gap-2">{TEMPLATES.map(t=><button type="button" key={t.id} aria-pressed={templateId===t.id} onClick={()=>chooseTemplate(t.id)} className={'overflow-hidden rounded-xl border p-2 text-left transition '+(templateId===t.id?'border-yellow-400 ring-2 ring-yellow-400/40':'border-white/10 hover:border-white/40')}><div className="relative aspect-[4/3] overflow-hidden rounded-md p-2" style={{background:t.bg,color:t.fg,fontFamily:t.font}}><div className="absolute right-[-8px] top-6 h-14 w-14 rotate-12 rounded-md opacity-50" style={{background:t.accent}}/><div className="relative text-[8px] font-bold uppercase tracking-widest">STUDIO / 01</div><div className="relative mt-3 max-w-[90%] text-sm font-black leading-tight">Crie mais.<br/>Inspire mais.</div><div className="absolute bottom-2 left-2 h-1 w-12" style={{background:t.accent}}/></div><div className="mt-2 text-xs font-bold">{t.name}</div><div className="text-[10px] text-zinc-400">{t.tagline}</div></button>)}</div></div><div className="mt-7 border-t border-white/10 pt-5"><h3 className="font-bold">Estilo visual</h3><div className="mt-4 grid grid-cols-3 gap-3">{[['Fundo',background,setBackground],['Destaque',accent,setAccent],['Texto',foreground,setForeground]].map(([label,value,set])=><label key={String(label)} className="text-xs">{String(label)}<input type="color" value={String(value)} onChange={e=>(set as (v:string)=>void)(e.target.value)} className="mt-2 h-10 w-full cursor-pointer"/></label>)}</div><label className="mt-4 block text-sm">Fonte<select className={input} value={font} onChange={e=>setFont(e.target.value)}><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option></select></label></div></section><section className="min-w-0 rounded-2xl border border-white/10 bg-[#17181e] p-5 md:p-7">{slides.length===0?<div className="flex min-h-[450px] flex-col items-center justify-center text-center"><span className="text-5xl">✦</span><h2 className="mt-6 text-2xl font-black">Seu carrossel começa aqui.</h2><p className="mt-3 max-w-md text-sm text-zinc-400">Escolha uma marca e informe um tema para criar seu primeiro conjunto de slides.</p></div>:<><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Editor de slides · {selected+1} de {slides.length}</h2><div className="flex flex-wrap gap-2"><button onClick={newProject} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold">Novo</button><button disabled={cloudBusy} onClick={saveCloud} className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black">Salvar na nuvem</button><button onClick={saveProject} className="rounded-lg border border-yellow-400/40 px-4 py-2 text-xs font-bold text-yellow-300">Salvar projeto</button><button onClick={()=>download(selected)} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold">Baixar slide</button><button onClick={downloadZip} className="rounded-lg border border-yellow-400/40 px-4 py-2 text-xs font-bold text-yellow-300">Baixar ZIP</button><button onClick={downloadAll} className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-black">Baixar todos PNG</button></div></div><div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div><div className="mb-3 flex justify-center gap-2"><button type="button" onClick={()=>setKonvaMode(false)} className={"rounded-lg px-3 py-2 text-xs font-bold "+(!konvaMode?"bg-yellow-400 text-black":"bg-white/10")}>Editor clássico</button><button type="button" onClick={()=>setKonvaMode(true)} className={"rounded-lg px-3 py-2 text-xs font-bold "+(konvaMode?"bg-yellow-400 text-black":"bg-white/10")}>Editor Konva · arrastar</button></div>{konvaMode?<KonvaEditor headline={slides[selected].headline} body={slides[selected].body} image={slides[selected].image} background={background} accent={accent} foreground={foreground} font={font} brand={brand?.name||"INSTA SOCIAL AI"} index={selected} count={slides.length} onExportReady={onKonvaExportReady}/>:null}<canvas ref={canvas} width={1080} height={1350} aria-label="Prévia do slide" className={"mx-auto w-full max-w-[420px] rounded-xl border border-white/10 "+(konvaMode?"hidden":"")}/><div className="mt-4 flex flex-wrap justify-center gap-2">{slides.map((_,i)=><button key={i} onClick={()=>setSelected(i)} className={'h-9 w-9 rounded-lg text-sm font-bold '+(selected===i?'bg-yellow-400 text-black':'bg-white/10')}>{i+1}</button>)}</div></div><div>{slides[selected]?.rendered&&<div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3"><p className="text-xs font-bold text-yellow-300">Arte gerada com tipografia editável</p><p className="mt-2 text-xs leading-5 text-zinc-300">A fotografia é criada sem textos. Títulos, corpo e paginação são adicionados pelo editor para evitar cortes e permitir alterações.</p><label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={showTextOverlay} onChange={e=>setShowTextOverlay(e.target.checked)}/> Exibir tipografia</label></div>}<label className="block text-sm font-bold">Título<textarea rows={4} maxLength={75} value={slides[selected].headline} onChange={e=>setSlides(old=>old.map((x,i)=>i===selected?{...x,headline:e.target.value}:x))} className={input}/></label><label className="mt-5 block text-sm font-bold">Texto<textarea rows={8} maxLength={230} value={slides[selected].body} onChange={e=>setSlides(old=>old.map((x,i)=>i===selected?{...x,body:e.target.value}:x))} className={input}/></label></div></div><div className="mt-7 border-t border-white/10 pt-5"><div className="flex items-center justify-between"><h3 className="font-bold">Legenda sugerida</h3><button onClick={copyCaption} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold">Copiar legenda</button></div><textarea value={caption} onChange={e=>setCaption(e.target.value)} rows={4} className={input}/><label className="mt-4 block text-xs font-bold text-zinc-300">Hashtags<textarea rows={2} className={input} value={hashtags.join(' ')} onChange={e=>setHashtags(e.target.value.split(/\s+/).filter(Boolean).slice(0,30))} placeholder="#marketing #conteudo" /></label></div></>}</section></div></div></main></WorkspaceShell>
}
