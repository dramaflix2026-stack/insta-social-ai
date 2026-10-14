'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Zap,RefreshCw,CalendarClock,CheckCircle2,AlertTriangle,PauseCircle,PlayCircle} from 'lucide-react';
type Item={id:string;topic:string;scheduled_at:string;status:string;error?:string};
type Plan={id:string;status:string;created_at:string;social_plan_items:Item[]};
type Credits={used:number;limit:number;remaining:number};
export default function AutomationCenter(){
 const [plans,setPlans]=useState<Plan[]>([]);
 const [credits,setCredits]=useState<Credits|null>(null);
 const [loading,setLoading]=useState(true);
 const [working,setWorking]=useState('');
 const [notice,setNotice]=useState('');
 async function refresh(){
  setLoading(true);
  try{
   const [pr,cr]=await Promise.all([fetch('/api/instagram/plans',{cache:'no-store'}),fetch('/api/instagram/credits',{cache:'no-store'})]);
   const [p,c]=await Promise.all([pr.json(),cr.json()]);
   if(!pr.ok||!cr.ok)throw Error(p.error||c.error||'Não foi possível carregar os dados');
   setPlans(p.plans||[]);setCredits(c);
  }catch(e){setNotice(e instanceof Error?e.message:'Falha ao carregar')}finally{setLoading(false)}
 }
 useEffect(()=>{void refresh()},[]);
 async function change(plan:Plan){
  const next=plan.status==='active'?'paused':'active';
  if(next==='active'&&!window.confirm('Ativar publicação automática REAL deste plano? O sistema poderá gerar imagens, consumir créditos e publicar no Instagram sem nova confirmação por post.'))return;
  setWorking(plan.id);setNotice('');
  try{
   const r=await fetch('/api/instagram/plans/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan_id:plan.id,status:next,confirm:next==='active'?'ATIVAR_PILOTO_AUTOMATICO':undefined})});
   const j=await r.json();if(!r.ok)throw Error(j.error||'Não foi possível alterar o plano');
   setNotice(next==='active'?'Plano ativado. As publicações dependem do executor de agendamento estar operacional.':'Plano pausado.');await refresh();
  }catch(e){setNotice(e instanceof Error?e.message:'Erro ao alterar plano')}finally{setWorking('')}
 }
 const items=plans.flatMap(p=>(p.social_plan_items||[]).map(i=>({...i,planStatus:p.status})));
 const upcoming=items.filter(i=>['planned','ready','generating','publishing'].includes(i.status)).sort((a,b)=>Date.parse(a.scheduled_at)-Date.parse(b.scheduled_at));
 const published=items.filter(i=>i.status==='published').length;
 const failed=items.filter(i=>i.status==='failed').length;
 return <main className="min-h-screen bg-[#090a0d] px-5 py-10 text-white md:px-12"><div className="mx-auto max-w-6xl">
  <Link href="/instagram" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-yellow-300"><ArrowLeft size={17}/> Voltar ao Instagram AI</Link>
  <div className="mt-9 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="rounded-2xl bg-yellow-400/10 p-4 text-yellow-400"><Zap size={29}/></div><div><p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Insta Social AI</p><h1 className="text-3xl font-extrabold md:text-5xl">Central de Automação<span className="text-yellow-400">.</span></h1><p className="mt-2 text-sm text-zinc-400">Acompanhe seus planos, próximas publicações e falhas em um só lugar.</p></div></div><button onClick={()=>void refresh()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm text-zinc-300 hover:border-yellow-400/40"><RefreshCw size={16}/> Atualizar</button></div>
  {notice&&<div role="status" className="mt-6 rounded-xl border border-yellow-400/25 bg-yellow-400/10 p-4 text-sm text-yellow-200">{notice}</div>}
  <div className="mt-8 grid gap-4 sm:grid-cols-4">{[{label:'Planos ativos',value:plans.filter(p=>p.status==='active').length,icon:Zap},{label:'Na fila',value:upcoming.length,icon:CalendarClock},{label:'Publicados',value:published,icon:CheckCircle2},{label:'Com falha',value:failed,icon:AlertTriangle}].map(m=><div key={m.label} className="rounded-2xl border border-white/10 bg-[#17181e] p-5"><m.icon size={21} className="text-yellow-400"/><div className="mt-4 text-3xl font-extrabold">{m.value}</div><p className="mt-1 text-xs text-zinc-400">{m.label}</p></div>)}</div>
  <div className="mt-4 rounded-2xl border border-white/10 bg-[#17181e] p-5"><p className="text-sm font-semibold">Créditos de imagem</p><p className="mt-2 text-2xl font-extrabold text-yellow-300">{credits?credits.remaining:'—'} <span className="text-sm font-normal text-zinc-400">disponíveis de {credits?.limit??'—'} por mês</span></p><p className="mt-2 text-xs text-zinc-500">A central usa os dados reais da sua conta. A execução automática depende de um agendador de servidor ativo.</p></div>
  <div className="mt-8 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Seus planos</h2><Link href="/instagram/autopilot" className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-300">Criar ou editar plano →</Link></div>
  <div className="mt-4 space-y-3">{plans.length===0?<div className="rounded-2xl border border-white/10 bg-[#17181e] p-6 text-sm text-zinc-400">Nenhum plano encontrado. Crie seu primeiro plano no Piloto Automático.</div>:plans.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#17181e] p-5"><div><p className="font-semibold">Plano de {p.social_plan_items?.length||0} posts</p><p className="mt-1 text-xs text-zinc-400">Criado em {new Date(p.created_at).toLocaleDateString('pt-BR')} · Estado: <span className="text-yellow-300">{p.status==='active'?'Ativo':p.status==='paused'?'Pausado':'Rascunho'}</span></p></div><button disabled={working===p.id} onClick={()=>void change(p)} className="inline-flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-300 disabled:opacity-50">{p.status==='active'?<PauseCircle size={17}/>:<PlayCircle size={17}/>} {working===p.id?'Aguarde...':p.status==='active'?'Pausar plano':'Ativar plano'}</button></div>)}</div>
  <h2 className="mt-9 text-xl font-bold">Próximas publicações</h2><div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#17181e]">{upcoming.length===0?<p className="p-6 text-sm text-zinc-400">Nenhuma publicação pendente.</p>:upcoming.slice(0,15).map(i=><div key={i.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 last:border-0"><div><p className="text-sm font-semibold">{i.topic}</p><p className="mt-1 text-xs text-zinc-400">{new Date(i.scheduled_at).toLocaleString('pt-BR')} · {i.planStatus==='active'?'Plano ativo':'Plano não ativo'}</p></div><span className="rounded-lg bg-white/5 px-3 py-1 text-xs text-zinc-300">{i.status}</span></div>)}</div>
  {failed>0&&<><h2 className="mt-9 text-xl font-bold text-amber-300">Publicações com falha</h2><div className="mt-4 space-y-2">{items.filter(i=>i.status==='failed').slice(0,10).map(i=><div key={i.id} className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="text-sm font-semibold">{i.topic}</p><p className="mt-2 text-xs text-amber-200">{i.error||'Falha sem detalhes. Verifique antes de tentar publicar novamente.'}</p></div>)}</div></>}
 </div></main>;
}
