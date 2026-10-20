import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy / Middleware (Next.js 16) untuk memproteksi rute admin.
 * Semua rute /admin kecuali /admin/login wajib memiliki sesi login Supabase Auth.
 */
export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Jangan blokir halaman login
  if (pathname === "/admin/login") {
    return response;
  }

  // Proteksi semua rute /admin dan sub-ruternya
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const rawUrl = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!rawUrl || !publishableKey) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

    const supabase = createServerClient(supabaseUrl, publishableKey.trim(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export default proxy;
export const middleware = proxy;

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

