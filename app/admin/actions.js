"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/session";

/**
 * Memeriksa apakah admin sedang login di server.
 * Memenuhi Aturan Keamanan #3 dan kriteria US-06.
 */
export async function requireAdmin() {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(
      "/admin/login?error=" + encodeURIComponent("Anda harus login terlebih dahulu.")
    );
  }

  return { supabase, user };
}

/**
 * Server Action untuk login admin menggunakan Supabase Auth (email dan password).
 */
export async function login(formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    redirect("/admin/login?error=" + encodeURIComponent("Email dan password wajib diisi."));
  }

  let errorMessage = null;

  try {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("invalid grant")
      ) {
        errorMessage = "Email atau password salah.";
      } else {
        errorMessage = error.message;
      }
    }
  } catch (err) {
    errorMessage = err.message || "Terjadi kesalahan saat proses login.";
  }

  if (errorMessage) {
    redirect("/admin/login?error=" + encodeURIComponent(errorMessage));
  }

  redirect("/admin");
}

/**
 * Server Action untuk mengakhiri sesi admin (logout) lalu kembali ke halaman login.
 */
export async function logout() {
  try {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Gagal keluar:", err);
  }

  redirect("/admin/login");
}

/**
 * Server Action untuk mengganti password admin yang sedang login.
 * Memeriksa sesi login di server serta validasi password minimal 8 karakter & kecocokan konfirmasi.
 */
export async function gantiPassword(formData) {
  const passwordBaru = formData.get("password_baru")?.toString();
  const konfirmasiPassword = formData.get("konfirmasi_password")?.toString();

  if (!passwordBaru || !konfirmasiPassword) {
    redirect(
      "/admin/password?error=" + encodeURIComponent("Password baru dan konfirmasi password wajib diisi.")
    );
  }

  if (passwordBaru.length < 8) {
    redirect(
      "/admin/password?error=" + encodeURIComponent("Password baru minimal 8 karakter.")
    );
  }

  if (passwordBaru !== konfirmasiPassword) {
    redirect(
      "/admin/password?error=" + encodeURIComponent("Password baru dan konfirmasi password tidak sama.")
    );
  }

  // Aturan Keamanan #3 & US-06: Aksi pengubahan data wajib memeriksa login di server
  const { supabase } = await requireAdmin();

  let errorMessage = null;

  try {
    const { error } = await supabase.auth.updateUser({
      password: passwordBaru,
    });

    if (error) {
      errorMessage = error.message;
    }
  } catch (err) {
    errorMessage = err.message || "Terjadi kesalahan saat mengganti password.";
  }

  if (errorMessage) {
    redirect("/admin/password?error=" + encodeURIComponent(errorMessage));
  }

  redirect(
    "/admin/password?sukses=" + encodeURIComponent("Password berhasil diganti.")
  );
}

export const masuk = login;
export const keluar = logout;
export const updatePassword = gantiPassword;
export const verifikasiAdmin = requireAdmin;
