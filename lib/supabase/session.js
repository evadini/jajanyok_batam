import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Membuat Supabase client untuk sesi admin menggunakan @supabase/ssr, cookies,
 * dan SUPABASE_PUBLISHABLE_KEY.
 * Digunakan untuk login, keluar, ganti password, dan aksi admin yang menghormati RLS.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  const rawUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!rawUrl || !publishableKey) {
    throw new Error(
      "SUPABASE_URL atau SUPABASE_PUBLISHABLE_KEY belum diatur di environment variable."
    );
  }

  const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createServerClient(supabaseUrl, publishableKey.trim(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Dipanggil dari Server Component, abaikan jika tidak bisa memodifikasi cookies
        }
      },
    },
  });
}

export const createAdminClient = createSessionClient;
export const createServerSessionClient = createSessionClient;

