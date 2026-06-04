/**
 * auth.js — Caraka Dashboard Trusted Device Authentication
 * 
 * Sistem baru ini tidak menggunakan Supabase atau akun pengguna/email.
 * Melainkan menggunakan sebuah Secret PIN tunggal. Jika pengguna memasukkan
 * PIN yang benar, browser mereka akan ditandai sebagai "Trusted Device"
 * dan disimpan di localStorage.
 */

// Kunci sesi penyimpanan di browser
const SESSION_KEY = 'caraka_trusted_device';

// PIN Master (Bisa diset di file .env menggunakan VITE_MASTER_PIN)
// Secara default jika belum ada di .env, gunakan "123456" untuk uji coba
const MASTER_PIN = import.meta.env.VITE_MASTER_PIN || '123456';

/**
 * Memverifikasi PIN dan menyimpan sesi Trusted Device.
 * @param {string} inputPin - PIN yang dimasukkan pengguna
 * @returns {boolean} true jika berhasil, false jika gagal
 */
export function loginTrustedDevice(inputPin) {
   if (inputPin === MASTER_PIN) {
      // Simpan penanda bahwa perangkat ini dipercaya
      localStorage.setItem(SESSION_KEY, 'true');
      return true;
   }
   return false;
}

/**
 * Mengecek apakah perangkat ini adalah Trusted Device.
 * @returns {boolean}
 */
export function isTrustedDevice() {
   return localStorage.getItem(SESSION_KEY) === 'true';
}

/**
 * Menghapus akses Trusted Device (Logout).
 */
export function clearTrustedDevice() {
   localStorage.removeItem(SESSION_KEY);
   // Bersihkan sesi lama dari Supabase jika ada sisa
   localStorage.removeItem('caraka_session_token');
   localStorage.removeItem('caraka_user');
}
