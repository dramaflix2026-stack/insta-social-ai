'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard,Instagram,Zap,Sparkles,Layers3,Youtube,Clapperboard,CalendarDays,ArrowRight,LogOut} from 'lucide-react';
export default function InstagramLayout({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 if(pathname==='/instagram')return <>{children}</>;
 const links=[{href:'/dashboard',label:'Visão geral',icon:LayoutDashboard},{href:'/instagram',label:'Instagram AI',icon:Instagram},{href:'/instagram/autopilot',label:'Piloto automático',icon:Sparkles},{href:'/instagram/automation',label:'Central de Automação',icon:Zap},{href:'/youtube',label:'YouTube AI · Beta',icon:Youtube},{href:'/clipper',label:'Video Clipper · Lab',icon:Clapperboard},{href:'/calendar',label:'Calendário editorial',icon:CalendarDays}];
 return <div className="min-h-screen bg-[#090a0d] text-white lg:pl-[260px]">
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-white/[.07] bg-[#111216] p-5 lg:flex">
   <Link href="/" className="mb-11 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black"><Layers3 size={23} strokeWidth={2.5}/></span><span className="text-lg font-extrabold tracking-[-.05em]">insta<span className="text-yellow-400">social</span><span className="ml-1 text-[10px] tracking-widest text-zinc-400">AI</span></span></Link>
   <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-zinc-600">Seu workspace</p>
   <nav className="space-y-1">
    <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"><LayoutDashboard size={18}/>Visão geral</Link>
    <Link href="/instagram" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-400/10"><Instagram size={18}/>Instagram AI</Link>
    <div className="ml-6 mt-1 space-y-1 border-l border-yellow-400/20 pl-3">
     <Link href="/instagram/autopilot" aria-current={pathname==='/instagram/autopilot'?'page':undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-white/5 ${pathname==='/instagram/autopilot'?'bg-yellow-400/10 font-semibold text-yellow-300':'text-zinc-300 hover:text-yellow-300'}`}><Sparkles size={15}/>Piloto Automático</Link>
     <Link href="/instagram/automation" aria-current={pathname==='/instagram/automation'?'page':undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-white/5 ${pathname==='/instagram/automation'?'bg-yellow-400/10 font-semibold text-yellow-300':'text-zinc-300 hover:text-yellow-300'}`}><Zap size={15}/>Central de Automação</Link>
    </div>
    <Link href="/youtube" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"><Youtube size={18}/>YouTube AI <span className="ml-auto text-[9px] text-yellow-400">BETA</span></Link>
    <Link href="/clipper" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"><Clapperboard size={18}/>Video Clipper <span className="ml-auto text-[9px] text-yellow-400">LAB</span></Link>
    <Link href="/calendar" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"><CalendarDays size={18}/>Calendário <span className="ml-auto text-[9px] text-emerald-400">INSTAGRAM</span></Link>
   </nav>
   <div className="mt-auto rounded-2xl border border-yellow-400/15 bg-yellow-400/[.045] p-4"><Sparkles size={20} className="text-yellow-400"/><p className="mt-3 text-sm font-bold">Seu estúdio criativo</p><p className="mt-2 text-xs leading-5 text-zinc-400">Da ideia à publicação, em um só lugar.</p><Link href="/instagram" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-yellow-300">Começar a criar <ArrowRight size={14}/></Link></div>
   <Link href="/login" className="mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"><LogOut size={17}/>Sair da conta</Link>
  </aside>
  <nav aria-label="Navegação do Instagram" className="sticky top-0 z-30 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#111216] px-4 py-3 lg:hidden">{links.map(({href,label})=><Link key={href} href={href} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${pathname===href?'bg-yellow-400 text-black':'bg-white/5 text-zinc-300'}`}>{label}</Link>)}</nav>
  {children}
 </div>;
}
