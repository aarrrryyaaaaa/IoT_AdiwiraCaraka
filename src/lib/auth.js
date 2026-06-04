const SESSION_KEY = 'caraka_trusted_device';

const MASTER_PIN = import.meta.env.VITE_MASTER_PIN;

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
