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
  // Supabase/PostgREST can reject with plain objects instead of Error instances.
  const obj = e && typeof e === 'object' ? e as Record<string, unknown> : null;
  const raw = e instanceof Error ? e.message : obj && typeof obj.message === 'string' ? obj.message : '';
  const code = obj && typeof obj.code === 'string' ? obj.code : undefined;
  const message = raw || 'Falha interna ao consultar o serviço';
  const unauthorized = message === 'UNAUTHORIZED';
  // Do not leak secrets, request headers, tokens, stack traces or arbitrary objects.
  const safeMessage = unauthorized ? 'Sessão expirada' : message
    .replace(/(sb_secret_|sb_publishable_|eyJ[A-Za-z0-9_-]{20,})[A-Za-z0-9_.-]*/g, '[credencial omitida]')
    .slice(0, 350);
  return Response.json(
    { error: safeMessage, ...(code ? { code } : {}) },
    { status: unauthorized ? 401 : 400 },
  );
}
