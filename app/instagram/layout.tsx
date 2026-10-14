'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard,Instagram,Zap,Sparkles,ArrowLeft} from 'lucide-react';
export default function InstagramLayout({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 if(pathname==='/instagram')return <>{children}</>;
 const links=[{href:'/dashboard',label:'Visão geral',icon:LayoutDashboard},{href:'/instagram',label:'Instagram AI',icon:Instagram},{href:'/instagram/autopilot',label:'Piloto automático',icon:Sparkles},{href:'/instagram/automation',label:'Central de Automação',icon:Zap}];
 return <div className="min-h-screen bg-[#090a0d] text-white lg:pl-[260px]">
  <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[260px] flex-col border-r border-white/10 bg-[#101115] px-5 py-7">
   <Link href="/instagram" className="flex items-center gap-3 font-extrabold tracking-tight"><span className="rounded-xl bg-yellow-400 p-2 text-black"><Sparkles size={22}/></span><span>instasocial <span className="text-yellow-400">AI</span></span></Link>
   <p className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[.22em] text-zinc-500">Seu workspace</p>
   <nav className="mt-4 space-y-1">{links.map(({href,label,icon:Icon},index)=><Link key={href} href={href} aria-current={pathname===href?'page':undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${pathname===href?'bg-yellow-400/10 font-bold text-yellow-400':'text-zinc-400 hover:bg-white/5 hover:text-white'} ${index>1?'pl-8':''}`}><Icon size={17}/>{label}</Link>)}</nav>
   <Link href="/instagram" className="mt-auto flex items-center gap-2 px-3 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16}/> Voltar ao Instagram</Link>
  </aside>
  <nav aria-label="Navegação do Instagram" className="sticky top-0 z-30 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#101115] px-4 py-3 lg:hidden">{links.map(({href,label})=><Link key={href} href={href} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${pathname===href?'bg-yellow-400 text-black':'bg-white/5 text-zinc-300'}`}>{label}</Link>)}</nav>
  {children}
 </div>;
}
