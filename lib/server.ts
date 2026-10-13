import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

type CookieToSet = { name: string; value: string; options?: Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2] };

export async function session() {
  const jar = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return jar.getAll(); },
        setAll(items: CookieToSet[]) {
          try {
            items.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // Server Components may not allow writing cookies.
          }
        },
      },
    },
  );
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new Error('UNAUTHORIZED');
  return { sb, user };
}

export function admin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing service key');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

export function failure(e: unknown) {
  const message = e instanceof Error ? e.message : 'Erro inesperado';
  return Response.json(
    { error: message === 'UNAUTHORIZED' ? 'Sessão expirada' : message },
    { status: message === 'UNAUTHORIZED' ? 401 : 400 },
  );
}
