import { createClient } from '@supabase/supabase-js';

// Ambil nilai dari .env
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🛡️ AUTO-SANITIZE URL (Membersihkan spasi, tanda kutip, dan garis miring di akhir)
const cleanUrl = rawUrl?.trim().replace(/\/$/, "").replace(/['"]/g, "");
const cleanKey = rawKey?.trim().replace(/['"]/g, "");

// Validasi Dasar
const isReady = cleanUrl && cleanUrl.startsWith('http') && cleanKey && cleanKey.length > 20;

export const supabase = isReady 
  ? createClient(cleanUrl, cleanKey)
  : { 
      auth: { 
        getSession: () => Promise.resolve({ data: { session: null } }), 
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ error: { message: "Konfigurasi .env belum benar (Cek URL & Key)" } }),
        signUp: () => Promise.resolve({ error: { message: "Konfigurasi .env belum benar (Cek URL & Key)" } }),
        signOut: () => Promise.resolve()
      },
      from: () => ({ 
        select: () => ({ 
          order: () => ({ limit: () => Promise.resolve({ data: [] }) }), 
          eq: () => ({ single: () => Promise.resolve({ data: null }), delete: () => Promise.resolve({}) }) 
        }), 
        insert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({}) }),
        delete: () => ({ eq: () => Promise.resolve({}) })
      }),
      storage: { from: () => ({ upload: () => Promise.resolve({}), getPublicUrl: () => ({ data: { publicUrl: null } }) }) }
    };
