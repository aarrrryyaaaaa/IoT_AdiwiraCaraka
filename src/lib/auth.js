/**
 * auth.js — Caraka Dashboard Authentication & Session Engine
 * 
 * Menyediakan:
 *   - Password hashing (bcrypt, cost factor 10)
 *   - JWT session token (8 jam expiry) 
 *   - Session persistence via localStorage
 *   - Auto-migration helper untuk akun plaintext lama
 */
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// ===== KONFIGURASI =====
const JWT_SECRET_RAW = import.meta.env.VITE_JWT_SECRET || 'caraka_fallback_secret';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const SESSION_KEY = 'caraka_session_token';
const SESSION_DURATION_HOURS = 8;

// ===== PASSWORD HASHING =====

/**
 * Membuat bcrypt hash dari password plaintext.
 * Cost factor 10 — keseimbangan keamanan & kecepatan di browser.
 * @param {string} plainPassword 
 * @returns {Promise<string>} bcrypt hash string
 */
export async function hashPassword(plainPassword) {
   const salt = await bcrypt.genSalt(10);
   return bcrypt.hash(plainPassword, salt);
}

/**
 * Memverifikasi password plaintext terhadap bcrypt hash.
 * @param {string} plainPassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, hashedPassword) {
   return bcrypt.compare(plainPassword, hashedPassword);
}

// ===== JWT SESSION MANAGEMENT =====

/**
 * Membuat JWT token sesi baru yang berlaku selama 8 jam.
 * Payload berisi data profil pengguna (id, username, fullname, role).
 * @param {object} userData - { id, username, fullname, role, avatar_url }
 * @returns {Promise<string>} signed JWT token
 */
export async function createSessionToken(userData) {
   return new SignJWT({ 
      sub: String(userData.id),
      username: userData.username,
      fullname: userData.fullname,
      role: userData.role,
      avatar_url: userData.avatar_url || null
   })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
      .setIssuer('caraka-dashboard')
      .sign(JWT_SECRET);
}

/**
 * Memverifikasi dan mendekode JWT token.
 * Mengembalikan payload jika valid, null jika expired/invalid.
 * @param {string} token 
 * @returns {Promise<object|null>} decoded payload atau null
 */
export async function verifySessionToken(token) {
   try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
         issuer: 'caraka-dashboard'
      });
      return payload;
   } catch (err) {
      // Token expired, invalid signature, atau malformed
      return null;
   }
}

// ===== SESSION PERSISTENCE (localStorage) =====

/**
 * Menyimpan JWT token ke localStorage.
 * @param {string} token
 */
export function saveSession(token) {
   localStorage.setItem(SESSION_KEY, token);
}

/**
 * Membaca dan memverifikasi sesi aktif dari localStorage.
 * Mengembalikan decoded payload jika sesi masih valid.
 * Menghapus token jika sudah expired.
 * @returns {Promise<object|null>} payload atau null
 */
export async function loadSession() {
   const token = localStorage.getItem(SESSION_KEY);
   if (!token) return null;

   const payload = await verifySessionToken(token);
   if (!payload) {
      // Token expired atau invalid — bersihkan
      clearSession();
      return null;
   }
   return payload;
}

/**
 * Menghapus sesi (logout). 
 * Membersihkan JWT token dan data user lama dari localStorage.
 */
export function clearSession() {
   localStorage.removeItem(SESSION_KEY);
   localStorage.removeItem('caraka_user'); // Bersihkan sisa format lama
}

/**
 * Mengecek apakah sesi saat ini masih valid (tanpa menghapus jika invalid).
 * Cocok untuk guard check sebelum aksi sensitif.
 * @returns {Promise<boolean>}
 */
export async function isSessionValid() {
   const token = localStorage.getItem(SESSION_KEY);
   if (!token) return false;
   const payload = await verifySessionToken(token);
   return payload !== null;
}

/**
 * Menghitung sisa waktu sesi dalam menit.
 * @returns {Promise<number>} menit tersisa, 0 jika expired/tidak ada sesi
 */
export async function getSessionTimeRemaining() {
   const token = localStorage.getItem(SESSION_KEY);
   if (!token) return 0;
   const payload = await verifySessionToken(token);
   if (!payload || !payload.exp) return 0;
   const remainingMs = (payload.exp * 1000) - Date.now();
   return Math.max(0, Math.floor(remainingMs / 60000));
}
