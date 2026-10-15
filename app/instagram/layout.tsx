'use client';
import {usePathname} from 'next/navigation';
import WorkspaceShell from '@/components/workspace-shell';
export default function InstagramLayout({children}:{children:React.ReactNode}){
 const pathname=usePathname();
 if(pathname==='/instagram')return <>{children}</>;
 return <WorkspaceShell>{children}</WorkspaceShell>;
}
