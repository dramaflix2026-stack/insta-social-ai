'use client';
import {useEffect,useState} from 'react';
import WorkspaceShell from '@/components/workspace-shell';
type Brand={id:string;name:string;niche:string;instructions:string;reference_paths?:string[];reference_urls?:string[]};
export default function Page(){
 const [brands,setBrands]=useState<Brand[]>([]);
 const [current,setCurrent]=useState('');
 const [name,setName]=useState('');
 const [niche,setNiche]=useState('');
 const [instructions,setInstructions]=useState('');
 const [status,setStatus]=useState('');
 const [paths,setPaths]=useState<string[]>([]);
 const [urls,setUrls]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{fetch('/api/instagram/brands').then(r=>r.json()).then(j=>{setBrands(j.brands||[])}).catch(()=>setStatus('Não foi possível carregar as marcas'))},[]);
 function choose(id:string){const b=brands.find(x=>x.id===id);setCurrent(id);setName(b?.name||'');setNiche(b?.niche||'');setInstructions(b?.instructions||'');setPaths(b?.reference_paths||[]);setUrls(b?.reference_urls||[])}
 async function upload(file:File){if(paths.length>=6)return setStatus('Limite de 6 imagens');if(!['image/png','image/jpeg'].includes(file.type)||file.size>4*1024*1024)return setStatus('Envie JPG ou PNG de até 4 MB');setBusy(true);try{const fd=new FormData();fd.set('file',file);const r=await fetch('/api/instagram/media',{method:'POST',body:fd});const j=await r.json();if(!r.ok)throw Error(j.error||'Erro no upload');setPaths(old=>[...old,j.asset.storage_path]);setUrls(old=>[...old,j.asset.url]);setStatus('Imagem adicionada. Salve a marca para confirmar.')}catch(e){setStatus(e instanceof Error?e.message:'Falha no upload')}finally{setBusy(false)}}
 async function save(){setStatus('Salvando...');try{const r=await fetch('/api/instagram/brands',{method:current?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:current,name,niche,instructions,reference_paths:paths})});const j=await r.json();if(!r.ok)throw Error(j.error||'Erro');setBrands(old=>[{...j.brand,reference_urls:urls},...old.filter(x=>x.id!==j.brand.id)]);setCurrent(j.brand.id);setStatus('Marca salva!')}catch(e){setStatus(e instanceof Error?e.message:'Erro ao salvar')}}
 return <WorkspaceShell><main className="min-h-screen bg-[#090a0d] p-8 text-white"><div className="mx-auto max-w-5xl"><h1 className="text-4xl font-black">Minha Marca / Brand Kit</h1><p className="mt-3 text-zinc-400">Identidade visual e tom de voz das marcas do Instagram AI.</p><div className="mt-8 grid gap-5 md:grid-cols-[240px_1fr]"><aside className="rounded-xl border border-white/10 bg-[#17181e] p-5"><h2 className="font-bold">Suas marcas</h2>{brands.map(b=><button key={b.id} onClick={()=>choose(b.id)} className="mt-3 block w-full rounded-lg border border-white/10 p-3 text-left">{b.name}</button>)}<button onClick={()=>choose('')} className="mt-5 text-yellow-400">+ Nova marca</button></aside><section className="rounded-xl border border-white/10 bg-[#17181e] p-6"><label className="block">Nome<input value={name} onChange={e=>setName(e.target.value)} maxLength={100} className="mt-2 w-full rounded-lg bg-black/30 p-3"/></label><label className="mt-5 block">Nicho<input value={niche} onChange={e=>setNiche(e.target.value)} maxLength={200} className="mt-2 w-full rounded-lg bg-black/30 p-3"/></label><label className="mt-5 block">Cores, fontes e tom de voz<textarea value={instructions} onChange={e=>setInstructions(e.target.value)} maxLength={4000} rows={7} className="mt-2 w-full rounded-lg bg-black/30 p-3"/></label><button disabled={!name.trim()} onClick={save} className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black disabled:opacity-40">Salvar Brand Kit</button><p role="status" className="mt-3 text-yellow-300">{status}</p></section></div></div></main></WorkspaceShell>
}
