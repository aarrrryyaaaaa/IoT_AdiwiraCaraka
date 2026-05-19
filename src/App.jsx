import * as React from 'react';
import { Thermometer, Droplets, Waves, Activity, Power, Cpu, Wifi, LogIn, LogOut, User, Camera, BarChart3, ShieldCheck, X, Clock, Settings, Save, Bell, RefreshCw, Users, Trash2, Zap, AlertTriangle, ChevronLeft, ChevronRight, Plus, Minus, Download, MousePointer2, Globe, Volume2, Tv, Radio } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { hashPassword, verifyPassword, createSessionToken, loadSession, saveSession, clearSession, isSessionValid, getSessionTimeRemaining } from './lib/auth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Diagnostic Button with LED
function DiagnosticBtn({ label, icon, onClick, status, color = "orange" }) {
   const statusColors = {
      idle: "bg-slate-700",
      testing: "bg-yellow-500 animate-pulse",
      success: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]",
      error: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
   };
   return (
      <button onClick={onClick} className={`relative py-3 md:py-5 bg-slate-800/40 backdrop-blur-md border ${color === 'orange' ? 'border-orange-500/20 hover:bg-orange-600' : 'border-blue-500/20 hover:bg-blue-600'} rounded-xl md:rounded-2xl flex flex-col items-center gap-1.5 md:gap-2 hover:text-white transition-all hover:scale-105 active:scale-95 group shadow-xl`}>
         <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
         <div className={color === 'orange' ? 'text-orange-500 group-hover:text-white' : 'text-blue-400 group-hover:text-white'}>{icon}</div>
         <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">{label}</span>
      </button>
   );
}

// Metric Card Component
function MetricCard({ label, value, unit, icon, color, threshold }) {
   return (
      <div className="rounded-xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/50 backdrop-blur-xl shadow-2xl border border-white/10 transition-all hover:scale-105 group relative overflow-hidden">
         <div className={`absolute -top-10 -right-10 w-24 h-24 bg-${color === 'orange' ? 'orange' : 'blue'}-500/10 blur-[40px] rounded-full`} />
         <div className="flex justify-between items-start mb-2 md:mb-6 relative z-10">
            <div className="p-2 md:p-4 rounded-xl md:rounded-2xl bg-slate-900 shadow-inner border border-white/5">
               {React.cloneElement(icon, { size: window.innerWidth < 768 ? 16 : 28 })}
            </div>
            {threshold && <div className="text-[6px] md:text-[9px] font-black uppercase text-slate-400 bg-slate-900/80 px-2 md:px-4 py-1 rounded-full border border-white/5">{threshold}</div>}
         </div>
         <p className="text-[6px] md:text-[10px] font-black uppercase text-slate-500 mb-1 tracking-[0.2em] relative z-10">{label}</p>
         <div className="flex items-baseline gap-1 md:gap-3 relative z-10">
            <span className="text-sm md:text-5xl font-black text-white drop-shadow-lg">{value}</span>
            <span className="text-[7px] md:text-base font-black text-slate-600 uppercase">{unit}</span>
         </div>
      </div>
   );
}

// Preloader Component with stylized progress bar and startup audio
function Preloader({ onComplete }) {
   const [percent, setPercent] = React.useState(0);
   const [bootStarted, setBootStarted] = React.useState(false);
   const [statusText, setStatusText] = React.useState('CLICK ANYWHERE TO BOOT ADIWIRA SYSTEM...');

    const playStartupSound = () => {
      try {
         const AudioContext = window.AudioContext || window.webkitAudioContext;
         if (!AudioContext) return;
         const ctx = new AudioContext();
         if (ctx.state === 'suspended') {
            ctx.resume();
         }
         
         const now = ctx.currentTime;
         
         // 1. Heavy Cybernetic Sub Bass Impact (Sustained Triangle + Sine hybrid for chest-thump bass)
         const subOsc1 = ctx.createOscillator();
         const subGain1 = ctx.createGain();
         subOsc1.type = 'sine';
         subOsc1.frequency.setValueAtTime(82.41, now); // E2 Deep Sub Bass
         
         const subOsc2 = ctx.createOscillator();
         const subGain2 = ctx.createGain();
         subOsc2.type = 'triangle';
         subOsc2.frequency.setValueAtTime(110.00, now); // A2 Warm Low-Mid Bass (Perfect for phone speaker audibility)
         
         // Set high gains and long warm decay
         subGain1.gain.setValueAtTime(0, now);
         subGain1.gain.linearRampToValueAtTime(0.5, now + 0.05); // Strong attack
         subGain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.2); // Extremely long decay
         
         subGain2.gain.setValueAtTime(0, now);
         subGain2.gain.linearRampToValueAtTime(0.35, now + 0.05); // Warm attack
         subGain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.0); // Balanced decay
         
         subOsc1.connect(subGain1);
         subGain1.connect(ctx.destination);
         
         subOsc2.connect(subGain2);
         subGain2.connect(ctx.destination);
         
         subOsc1.start(now);
         subOsc1.stop(now + 2.2);
         
         subOsc2.start(now);
         subOsc2.stop(now + 2.2);
         
         // 2. Crisp Majestic Cyberpunk/Linux Ascending Startup Chime (Slower tempo & longer sustain)
         // Notes: C6 (1046.50 Hz), E6 (1318.51 Hz), G6 (1567.98 Hz), C7 (2093.00 Hz)
         const notes = [1046.50, 1318.51, 1567.98, 2093.00];
         const tempo = 0.18; // Majestic slower tempo (180ms delay between notes instead of 80ms)
         notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * tempo);
            
            gain.gain.setValueAtTime(0, now + idx * tempo);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * tempo + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * tempo + 1.4); // Long sustain
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + idx * tempo);
            osc.stop(now + idx * tempo + 1.4);
         });
      } catch (e) {
         console.warn('Audio Context failed to play:', e);
      }
   };

   const handleStartBoot = () => {
      if (bootStarted) return;
      setBootStarted(true);
      setStatusText('SYSTEM BOOTING...');
      playStartupSound();

      const interval = setInterval(() => {
         setPercent(prev => {
            if (prev >= 100) {
               clearInterval(interval);
               setTimeout(onComplete, 800); // 800ms fade-out transition
               return 100;
            }

            // Dynamic simulated boot messages
            if (prev === 20) setStatusText('ESTABLISHING SUPABASE SECURE LINK...');
            if (prev === 45) setStatusText('SYNCING DATABASE PROFILE TABLES...');
            if (prev === 70) setStatusText('COMMUNICATING WITH ESP32 HARDWARE...');
            if (prev === 90) setStatusText('SYSTEM ONLINE. ACCESS GRANTED.');

            return prev + 1;
         });
      }, 20); // Dynamic speedy load (approx 2 seconds total)
   };

   return (
      <motion.div
         initial={{ opacity: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         transition={{ duration: 0.6, ease: 'easeInOut' }}
         className="fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center font-sans select-none cursor-pointer"
         onClick={handleStartBoot}
      >
         {/* Embedded CSS for stripes animation */}
         <style>{`
            @keyframes stripe-slide {
               0% { background-position: 0 0; }
               100% { background-position: 40px 0; }
            }
            .cartoon-stripes {
               background-image: repeating-linear-gradient(
                  45deg,
                  rgba(255, 255, 255, 0.15) 25%,
                  transparent 25%,
                  transparent 50%,
                  rgba(255, 255, 255, 0.15) 50%,
                  rgba(255, 255, 255, 0.15) 75%,
                  transparent 75%,
                  transparent
               );
               background-size: 40px 40px;
               animation: stripe-slide 1s linear infinite;
            }
         `}</style>

         {/* Background Subtle Neon Effects */}
         <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full" />
         <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/10 blur-[100px] rounded-full" />

         {/* Outer container */}
         <div className="relative flex flex-col items-center justify-center z-10">
            {/* Centered Logo / Title with blue-orange gradient */}
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-center bg-gradient-to-r from-blue-400 via-purple-500 to-orange-500 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(249,115,22,0.25)] select-none mb-10">
               ADIWIRA CARAKA
            </h1>

            {/* Premium Cartoon/Futuristic Loading Bar */}
            <div className="relative w-72 md:w-96 h-6 bg-slate-950/80 rounded-full border border-white/10 overflow-hidden p-1 shadow-[0_0_25px_rgba(249,115,22,0.15)] mb-6">
               {/* Inner Progress with Stripes */}
               <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.1 }}
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 rounded-full cartoon-stripes"
               />
            </div>

            {/* Percentage Display */}
            <span className="text-xl font-black italic tracking-widest bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent mb-4">
               {percent}%
            </span>

            {/* Boot sequence logs */}
            <p className="text-[9px] md:text-[11px] font-mono tracking-[0.3em] text-slate-500 uppercase h-4 animate-pulse mb-8">
               {statusText}
            </p>

            {/* Subtle aesthetic terminal helper */}
            <p className="text-[7px] font-mono text-slate-600 tracking-wider">
               {!bootStarted ? '[ CLICK ANYWHERE ON SCREEN TO ACTIVATE SYSTEM CHIME & BOOT ]' : '[ SYSTEM SECURELY BOOTING ]'}
            </p>
         </div>
      </motion.div>
   );
}

// Helper functions for parsing and formatting composite emails (username|fullname)
const parseUserEmail = (compositeEmail) => {
   if (!compositeEmail) return { username: '', fullname: '' };
   if (compositeEmail.includes('|')) {
      const [username, fullname] = compositeEmail.split('|');
      return { username, fullname };
   }
   return { username: compositeEmail, fullname: 'Anggota Adiwira' };
};

const formatUserEmail = (username, fullname) => {
   return `${username.trim()}|${fullname.trim()}`;
};

const formatUptime = (seconds) => {
   if (!seconds) return '0m';
   const d = Math.floor(seconds / (3600 * 24));
   const h = Math.floor((seconds % (3600 * 24)) / 3600);
   const m = Math.floor((seconds % 3600) / 60);
   const s = Math.floor(seconds % 60);
   
   const parts = [];
   if (d > 0) parts.push(`${d}d`);
   if (h > 0) parts.push(`${h}h`);
   if (m > 0 || h > 0) parts.push(`${m}m`);
   if (parts.length === 0) return `${s}s`;
   return parts.join(' ');
};

export default function App() {
   const [isLoading, setIsLoading] = React.useState(true);
   const [espIp, setEspIp] = React.useState(localStorage.getItem('esp_ip') || '192.168.100.15');
   const [isOnline, setIsOnline] = React.useState(false);
   const [showIpEdit, setShowIpEdit] = React.useState(false);
   const [history, setHistory] = React.useState({ temp: [], hum: [], labels: [] });
   const [wateringLogs, setWateringLogs] = React.useState([]);
   const [allUsers, setAllUsers] = React.useState([]);
   const [status, setStatus] = React.useState({ temp: 0, hum: 0, water: true, relay: false, mode: 'AUTO', tempMax: 30, tempMin: 20, humMin: 60 });
   const [user, setUser] = React.useState(null);
   const [profile, setProfile] = React.useState({ role: 'pengunjung', avatar_url: null });
   
   // ESP32 Microcontroller Health Telemetry Stats
       const [hwStats, setHwStats] = React.useState({
       chipTemp: 41.2,
       freeHeap: 182440,
       heapSize: 288672,
       ramPercent: 36.8,
       wifiRssi: -58,
       cpuFreq: 240,
       uptime: 120, // starts at 2 minutes
       flashSize: 4194304,
       isReal: false // tracks if hardware telemetry is supplied by ESP32 firmware
    });
   
   // Auth modals
   const [showLogin, setShowLogin] = React.useState(false);
   const [authMode, setAuthMode] = React.useState('login');
   const [role, setRole] = React.useState('anggota');
   const [secretKey, setSecretKey] = React.useState('');
   const [testStatus, setTestStatus] = React.useState({});
   
   // Auth form inputs
   const [username, setUsername] = React.useState('');
   const [fullname, setFullname] = React.useState('');
   const [password, setPassword] = React.useState('');
   
   // Profile Settings Modal states
   const [showProfileModal, setShowProfileModal] = React.useState(false);
   const [newUsername, setNewUsername] = React.useState('');
   const [newFullname, setNewFullname] = React.useState('');
   const [newPassword, setNewPassword] = React.useState('');
   const [confirmPassword, setConfirmPassword] = React.useState('');
   const [avatarBase64, setAvatarBase64] = React.useState(null);

   const lastRelayState = React.useRef(false);
   const wateringStartTime = React.useRef(null);
   const isTestingPump = React.useRef(false);
   const [currentTime, setCurrentTime] = React.useState(new Date());
   const [sessionMinutes, setSessionMinutes] = React.useState(0);

   React.useEffect(() => {
      const timer = setInterval(() => {
         setCurrentTime(new Date());
         
         // Dynamically increment uptime second-by-second and simulate micro-telemetry fluctuations
         setHwStats(prev => {
            const tempDiff = (Math.random() - 0.5) * 0.3;
            let newTemp = Math.max(38.5, Math.min(48.5, prev.chipTemp + tempDiff));
            
            const ramDiff = Math.floor((Math.random() - 0.5) * 120);
            let newFree = Math.max(150000, Math.min(210000, prev.freeHeap + ramDiff));
            let newPercent = Number(((1.0 - (newFree / prev.heapSize)) * 100).toFixed(1));
            
            const rssiDiff = Math.floor((Math.random() - 0.5) * 1.5);
            let newRssi = Math.max(-78, Math.min(-45, prev.wifiRssi + rssiDiff));

            return {
               ...prev,
               uptime: prev.uptime + 1,
               chipTemp: Number(newTemp.toFixed(1)),
               freeHeap: newFree,
               ramPercent: newPercent,
               wifiRssi: newRssi
            };
         });
      }, 1000);
      return () => clearInterval(timer);
   }, []);

   const fetchStatus = React.useCallback(async () => {
      try {
         const res = await fetch(`http://${espIp}/api/status?t=${Date.now()}`);
         if (res.ok) {
            const data = await res.json();
            
            // Robust Normalisasi logika Active-High sensor dengan String Falsy Handling
            let isWaterAvailable = false;
            if (data.water !== undefined) {
               if (data.water === true || data.water === 1 || data.water === "1" || data.water === "true" || data.water === "OPTIMAL") {
                  isWaterAvailable = true;
               }
            } else if (data.waterAvailable !== undefined) {
               if (data.waterAvailable === true || data.waterAvailable === 1 || data.waterAvailable === "1" || data.waterAvailable === "true") {
                  isWaterAvailable = true;
               }
            }

            // Robust Normalisasi status Relay (pompa) dari ESP32
            let isRelayOn = false;
            if (data.relay !== undefined) {
               if (data.relay === true || data.relay === 1 || data.relay === "1" || data.relay === "true" || data.relay === "on" || data.relay === "ON" || data.relay === "Active" || data.relay === "ACTIVE") {
                  isRelayOn = true;
               }
            }

            // Robust Normalisasi status Mode (Auto/Manual) dari ESP32
            let systemMode = 'AUTO';
            if (data.mode !== undefined) {
               if (data.mode === 'MANUAL' || data.mode === 'manual' || data.mode === 'Manual' || data.mode === false || data.mode === 0 || data.mode === "0" || data.mode === "false") {
                  systemMode = 'MANUAL';
               }
            }

            // Pencatatan Log Penyiraman Otomatis ke Supabase Database saat Pompa Menyala dan Mati
            if (lastRelayState.current === false && isRelayOn === true) {
               // Pompa baru saja dinyalakan
               wateringStartTime.current = new Date();
            } else if (lastRelayState.current === true && isRelayOn === false) {
               // Pompa baru saja dimatikan
               if (wateringStartTime.current) {
                  const durationSeconds = Math.round((new Date() - wateringStartTime.current) / 1000);
                  if (durationSeconds > 0 && !isTestingPump.current) {
                     const baseTemp = data.temp || 0;
                     supabase.from('watering_logs').insert([
                        {
                           start_time: wateringStartTime.current.toISOString(),
                           duration_seconds: durationSeconds,
                           temperature: baseTemp
                        }
                     ]).then(({ error }) => {
                        if (!error) {
                           fetchLogs(); // Segarkan riwayat di web secara instan
                        }
                     });
                  }
                  wateringStartTime.current = null;
               }
            }
            lastRelayState.current = isRelayOn;

            setStatus(prev => ({ ...prev, ...data, water: isWaterAvailable, relay: isRelayOn, mode: systemMode }));
            
            if (data.hardware) {
                setHwStats(prev => ({
                   ...data.hardware,
                   uptime: data.hardware.uptime !== undefined ? data.hardware.uptime : prev.uptime,
                   isReal: true
                }));
             }

            setIsOnline(true);
            setHistory(prev => ({
               labels: [...prev.labels, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })].slice(-30),
               temp: [...prev.temp, data.temp].slice(-30),
               hum: [...prev.hum, data.hum].slice(-30)
            }));
         } else { setIsOnline(false); }
      } catch (e) { setIsOnline(false); }
   }, [espIp]);

   // Session restoration via JWT — memuat sesi yang tersimpan dan memvalidasi expiry
   React.useEffect(() => {
      const restoreSession = async () => {
         const session = await loadSession();
         if (session) {
            // Sesi JWT masih valid — restore user state dari database
            const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', parseInt(session.sub)).limit(1);
            if (userProfile && userProfile.length > 0) {
               const p = userProfile[0];
               setUser(p);
               setProfile(p);
               if (p.role === 'admin') fetchAllUsers();
            }
            const remaining = await getSessionTimeRemaining();
            setSessionMinutes(remaining);
         } else {
            // Fallback: cek format localStorage lama untuk migrasi
            const saved = localStorage.getItem('caraka_user');
            if (saved) {
               // Bersihkan format lama — user harus login ulang dengan sistem baru
               localStorage.removeItem('caraka_user');
            }
         }
      };
      restoreSession();
      fetchLogs();
      
      // Polling real-time yang aman untuk ESP32 (setiap 2000ms, selaras dengan interval pembacaan DHT22)
      fetchStatus();
      const interval = setInterval(fetchStatus, 2000);

      // Session expiry checker — update sisa waktu sesi setiap 60 detik
      const sessionChecker = setInterval(async () => {
         const valid = await isSessionValid();
         if (!valid && user) {
            clearSession();
            setUser(null);
            setProfile({ role: 'pengunjung', avatar_url: null });
            alert('Sesi Anda telah berakhir setelah 8 jam. Silakan login kembali.');
         } else {
            const remaining = await getSessionTimeRemaining();
            setSessionMinutes(remaining);
         }
      }, 60000);

      return () => { clearInterval(interval); clearInterval(sessionChecker); };
   }, [espIp, fetchStatus]);

   const fetchLogs = async () => {
      const { data } = await supabase.from('watering_logs').select('*').order('start_time', { ascending: false }).limit(20);
      setWateringLogs(data || []);
   };

   const fetchAllUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      setAllUsers(data || []);
   };

   const testComp = async (c) => {
      if (c === 'pump') {
         isTestingPump.current = true;
         setTimeout(() => { isTestingPump.current = false; }, 3500);
      }
      setTestStatus(p => ({ ...p, [c]: 'testing' }));
      try {
         const res = await fetch(`http://${espIp}/api/test?comp=${c}`);
         
         // Fail-safe: Jika tombol prev bermasalah atau menggunakan nama berbeda di ESP32, tembak juga 'previous'
         if (c === 'prev') {
            await fetch(`http://${espIp}/api/test?comp=previous`).catch(() => {});
         }

         setTestStatus(p => ({ ...p, [c]: res.ok ? 'success' : 'error' }));
         setTimeout(() => setTestStatus(p => ({ ...p, [c]: 'idle' })), 2000);
         setTimeout(fetchStatus, 50);
      } catch (e) {
         if (c === 'prev') {
            try {
               const fallbackRes = await fetch(`http://${espIp}/api/test?comp=previous`);
               setTestStatus(p => ({ ...p, [c]: fallbackRes.ok ? 'success' : 'error' }));
               setTimeout(() => setTestStatus(p => ({ ...p, [c]: 'idle' })), 2000);
               setTimeout(fetchStatus, 50);
               return;
            } catch (err) {}
         }
         setTestStatus(p => ({ ...p, [c]: 'error' }));
         setTimeout(() => setTestStatus(p => ({ ...p, [c]: 'idle' })), 2000);
         setTimeout(fetchStatus, 50);
      }
   };

   const deleteUser = async (id) => {
      if (!confirm("Hapus user ini?")) return;
      await supabase.from('profiles').delete().eq('id', id); fetchAllUsers();
   };

   const deleteLog = async (id) => {
      if (!confirm("Hapus log penyiraman ini?")) return;
      await supabase.from('watering_logs').delete().eq('id', id); fetchLogs();
   };

   return (
      <>
         <AnimatePresence mode="wait">
            {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
         </AnimatePresence>

         <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-3 md:p-8 font-sans selection:bg-orange-500/30">
            <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-10 relative">

               {/* ROW 1: HEADER */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#1e293b]/40 backdrop-blur-3xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden w-full">
                  {/* Left Column: Agricultural Core Title & Badges */}
                  <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
                     <h1 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-blue-400 via-purple-500 to-orange-500 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(249,115,22,0.25)] select-none">
                        ADIWIRA CARAKA
                     </h1>
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-white/5">
                           <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                           <span className="text-[8px] md:text-[11px] font-black uppercase text-slate-400">{isOnline ? 'System Online' : 'Core Offline'}</span>
                        </div>
                        
                        {/* Real-time Device Digital Clock Badge */}
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900/90 rounded-full border border-white/10 text-xs md:text-sm font-mono font-black text-slate-100 shadow-2xl backdrop-blur-md">
                           <Clock size={16} className="text-orange-500 animate-pulse" />
                           {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>

                        {profile.role === 'admin' ? (
                           <button onClick={() => setShowIpEdit(!showIpEdit)} className="flex items-center gap-2 px-4 py-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-full text-blue-400 text-[9px] md:text-[12px] font-mono transition-all border border-blue-500/20">
                              <Globe size={12} /> {espIp}
                           </button>
                        ) : (
                           <div className="flex items-center gap-2 px-4 py-1 bg-slate-800/80 rounded-full text-slate-500 text-[9px] md:text-[12px] font-mono border border-slate-700/50">
                              <Globe size={12} className="text-slate-600" /> {espIp}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Right Column: Premium Compact User Pill / Corner Center */}
                  <div className="flex items-center gap-4 bg-slate-950/40 p-2 md:p-3 rounded-full border border-white/5 shadow-inner backdrop-blur-md">
                     {user ? (
                        <>
                           {/* Small circular profile photo upload container */}
                           <div className="relative group shrink-0">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-900 border border-orange-500/30 flex items-center justify-center overflow-hidden shadow-2xl transition-all group-hover:border-orange-500 relative">
                                 {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={18} className="text-slate-500" />}
                                 
                                 {/* Transparent upload label on hover */}
                                 <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-all rounded-full">
                                    <Camera size={12} className="text-white" />
                                    <input type="file" className="hidden" onChange={async (e) => {
                                       const reader = new FileReader();
                                       reader.onloadend = async () => {
                                          await supabase.from('profiles').update({ avatar_url: reader.result }).eq('id', user.id);
                                          setProfile({ ...profile, avatar_url: reader.result });
                                          localStorage.setItem('caraka_user', JSON.stringify({ ...profile, avatar_url: reader.result }));
                                       };
                                       reader.readAsDataURL(e.target.files[0]);
                                    }} />
                                 </label>
                              </div>
                           </div>

                           {/* Compact user text details */}
                           <div className="flex flex-col text-left pr-2 max-w-[100px] md:max-w-[150px] overflow-hidden">
                              <span className="text-[10px] md:text-[11px] font-black text-white truncate">
                                 {parseUserEmail(user.email).fullname}
                              </span>
                              <span className="text-[7px] md:text-[8px] font-mono text-orange-500 uppercase tracking-widest">
                                 {profile.role}
                              </span>
                           </div>

                           {/* Action button icon triggers */}
                           <div className="flex gap-1">
                              <button 
                                 onClick={() => {
                                    const parsed = parseUserEmail(user.email);
                                    setNewUsername(parsed.username);
                                    setNewFullname(parsed.fullname);
                                    setAvatarBase64(profile.avatar_url || user.avatar_url);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setShowProfileModal(true);
                                 }} 
                                 className="p-2 md:p-3 bg-slate-900/80 hover:bg-blue-600 text-slate-400 hover:text-white rounded-full transition-all"
                                 title="Profile Settings"
                              >
                                 <Settings size={14} />
                              </button>
                              <button 
                                 onClick={() => { clearSession(); window.location.reload(); }} 
                                 className="p-2 md:p-3 bg-slate-900/80 hover:bg-orange-600 text-slate-400 hover:text-white rounded-full transition-all"
                                 title="Logout"
                              >
                                 <LogOut size={14} />
                              </button>
                           </div>
                        </>
                     ) : (
                        <button 
                           onClick={() => setShowLogin(true)} 
                           className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-full font-black uppercase text-[9px] md:text-xs tracking-wider transition-all shadow-md flex items-center gap-2"
                        >
                           <LogIn size={12} /> Login Gateway
                        </button>
                     )}
                  </div>
               </header>

               <AnimatePresence>
                  {showIpEdit && profile.role === 'admin' && (
                     <div className="flex justify-center w-full mt-2">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex gap-2">
                           <input type="text" className="bg-slate-900/80 border border-white/10 rounded-2xl px-6 py-3 text-[12px] font-mono text-white outline-none focus:border-blue-500" value={espIp} onChange={e => { setEspIp(e.target.value); localStorage.setItem('esp_ip', e.target.value); }} />
                           <button onClick={() => setShowIpEdit(false)} className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl hover:scale-110 active:scale-90 transition-all"><Save size={20} /></button>
                        </motion.div>
                     </div>
                  )}
               </AnimatePresence>

               {/* ROW 2: PRIMARY ENVIRONMENTAL TELEMETRY CARDS (AESTHETIC AGRICULTURAL STANDOUTS) */}
               <div className="grid grid-cols-3 gap-3 md:gap-10">
                  
                  {/* CARD 1: THERMAL STATUS (TEMPERATURE) */}
                   <div className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/60 backdrop-blur-2xl border border-orange-500/30 shadow-[0_0_35px_rgba(249,115,22,0.12)] transition-all hover:scale-[1.03] group ${status.temp > status.tempMax || status.temp < status.tempMin ? 'border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.2)]' : ''}`}>
                      {/* Background decorative soft glow */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-all" />
                      
                      <div className="flex justify-between items-start mb-2 md:mb-6 relative z-10">
                         <div className="p-1.5 md:p-4 rounded-xl md:rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 group-hover:scale-110 transition-all shadow-inner">
                            <Thermometer size={14} className="md:w-8 md:h-8 animate-pulse" />
                         </div>
                         <div className="flex flex-col items-end gap-1">
                            <span className="hidden sm:inline-block text-[7px] md:text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                               Target: {status.tempMin}-{status.tempMax}°C
                            </span>
                            {(status.temp > status.tempMax || status.temp < status.tempMin) && (
                               <span className="hidden sm:inline-block text-[6px] md:text-[8px] font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 animate-bounce">
                                  CRITICAL TEMP
                               </span>
                            )}
                         </div>
                      </div>

                      <p className="text-[7px] md:text-[11px] font-black uppercase text-slate-400 tracking-wider md:tracking-[0.25em] mb-1 relative z-10">
                         <span className="block md:hidden">Temp</span>
                         <span className="hidden md:block">Thermal Status</span>
                      </p>
                      <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
                         <span className="text-xl md:text-6xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            {status.temp.toFixed(1)}
                         </span>
                         <span className="text-xs md:text-2xl font-black text-orange-500 uppercase">°C</span>
                      </div>

                      {/* Temperature visual meter track */}
                      <div className="w-full h-1 md:h-2 bg-slate-950/80 rounded-full overflow-hidden mt-3 md:mt-6 border border-white/5 relative">
                         <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: `${Math.max(0, Math.min(100, (status.temp / 50) * 100))}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 rounded-full"
                         />
                      </div>
                   </div>

                   {/* CARD 2: HUMID LEVEL (HUMIDITY) */}
                   <div className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/60 backdrop-blur-2xl border border-blue-500/30 shadow-[0_0_35px_rgba(59,130,246,0.12)] transition-all hover:scale-[1.03] group ${status.hum < status.humMin ? 'border-yellow-500/50 shadow-[0_0_35px_rgba(234,179,8,0.2)]' : ''}`}>
                      {/* Background decorative soft glow */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-all" />
                      
                      <div className="flex justify-between items-start mb-2 md:mb-6 relative z-10">
                         <div className="p-1.5 md:p-4 rounded-xl md:rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-all shadow-inner">
                            <Droplets size={14} className="md:w-8 md:h-8 animate-bounce" />
                         </div>
                         <div className="flex flex-col items-end gap-1">
                            <span className="hidden sm:inline-block text-[7px] md:text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                               Threshold: {status.humMin}%+
                            </span>
                            {status.hum < status.humMin && (
                               <span className="hidden sm:inline-block text-[6px] md:text-[8px] font-black uppercase text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 animate-pulse">
                                  DRY WARNING
                               </span>
                            )}
                         </div>
                      </div>

                      <p className="text-[7px] md:text-[11px] font-black uppercase text-slate-400 tracking-wider md:tracking-[0.25em] mb-1 relative z-10">
                         <span className="block md:hidden">Humid</span>
                         <span className="hidden md:block">Humid Level</span>
                      </p>
                      <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
                         <span className="text-xl md:text-6xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            {status.hum.toFixed(0)}
                         </span>
                         <span className="text-xs md:text-2xl font-black text-blue-400 uppercase">%</span>
                      </div>

                      {/* Humidity visual progress track */}
                      <div className="w-full h-1 md:h-2 bg-slate-950/80 rounded-full overflow-hidden mt-3 md:mt-6 border border-white/5 relative">
                         <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: `${Math.max(0, Math.min(100, status.hum))}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full"
                         />
                      </div>
                   </div>

                   {/* CARD 3: WATER TANK (LIQUID WAVE ACCENT) */}
                   <div className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/60 backdrop-blur-2xl border transition-all hover:scale-[1.03] group ${status.water ? 'border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)]' : 'border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.25)] animate-pulse'}`}>
                      
                      {/* Dynamic wave container visualizer inside card background */}
                      {status.water ? (
                         <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent blur-[10px] pointer-events-none rounded-b-[2.5rem] liquid-wave" />
                      ) : (
                         <div className="absolute inset-0 bg-red-500/5 pointer-events-none rounded-b-[2.5rem]" />
                      )}

                      <div className="flex justify-between items-start mb-2 md:mb-6 relative z-10">
                         <div className={`p-1.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner ${status.water ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-rose-500/15 border border-rose-500/30 text-rose-500 animate-spin-slow'}`}>
                            <Waves size={14} className="md:w-8 md:h-8" />
                         </div>
                         <span className={`hidden sm:inline-block text-[7px] md:text-[9px] font-black uppercase px-3 py-1 rounded-full border ${status.water ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                            {status.water ? 'TANK HEALTHY' : 'CRITICAL ALERT'}
                         </span>
                      </div>

                      <p className="text-[7px] md:text-[11px] font-black uppercase text-slate-400 tracking-wider md:tracking-[0.25em] mb-1 relative z-10">
                         <span className="block md:hidden">Water</span>
                         <span className="hidden md:block">Water Tank</span>
                      </p>
                      <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
                         <span className={`text-xs sm:text-lg md:text-5xl font-black italic uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${status.water ? 'text-cyan-400' : 'text-rose-500'}`}>
                            {status.water ? 'OPTIMAL' : 'EMPTY'}
                         </span>
                      </div>

                      {/* Animated wave visual progress */}
                      <div className="w-full h-1 md:h-2 bg-slate-950/80 rounded-full overflow-hidden mt-3 md:mt-6 border border-white/5 relative">
                         <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: status.water ? '100%' : '5%' }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${status.water ? 'bg-gradient-to-r from-cyan-600 to-blue-500' : 'bg-rose-600'}`}
                         />
                      </div>
                   </div>
                </div>

               {/* ROW 3: GRAPHS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  <div className="bg-[#1e293b]/40 backdrop-blur-2xl p-6 md:p-8 rounded-[3rem] border border-white/10 shadow-2xl h-[220px] md:h-[320px] transition-all hover:border-orange-500/20">
                     <h3 className="text-[8px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-3"><BarChart3 size={16} className="text-orange-500" /> Temp Wave</h3>
                     <div className="h-[140px] md:h-[220px]">
                        <Line data={{
                           labels: history.labels,
                           datasets: [{ label: 'T', data: history.temp, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.05)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 4 }]
                        }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 10 } } } } }} />
                     </div>
                  </div>
                  <div className="bg-[#1e293b]/40 backdrop-blur-2xl p-6 md:p-8 rounded-[3rem] border border-white/10 shadow-2xl h-[220px] md:h-[320px] transition-all hover:border-blue-500/20">
                     <h3 className="text-[8px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-3"><BarChart3 size={16} className="text-blue-500" /> Hum Wave</h3>
                     <div className="h-[140px] md:h-[220px]">
                        <Line data={{
                           labels: history.labels,
                           datasets: [{ label: 'H', data: history.hum, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 4 }]
                        }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 10 } } } } }} />
                     </div>
                  </div>
               </div>
               {/* CONTROLS, SYSTEM STATE & DIAGNOSTICS - 2-COLUMN UNIFIED LAYOUT */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-stretch pb-20">
                  {/* COLUMN 1: INTEGRATED SYSTEM OPERATION, PARAMETERS & HISTORY LOGS */}
                  <div className={`bg-[#1e293b]/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col justify-between ${profile.role === 'pengunjung' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                     <div>
                        {/* Sub-Section 1: Parameters */}
                        <div className="mb-6">
                           <h3 className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-6"><Settings size={18} className="text-orange-500" /> Parameters</h3>
                           <form onSubmit={async (e) => {
                              e.preventDefault();
                              const p = new URLSearchParams({ tempMax: status.tempMax, tempMin: status.tempMin, humMin: status.humMin });
                              await fetch(`http://${espIp}/api/settings?${p.toString()}`);
                              alert("Command Synchronized!");
                              fetchStatus();
                           }} className="space-y-6">
                              <div className="grid grid-cols-3 gap-4">
                                 {['tempMax', 'tempMin', 'humMin'].map(k => (
                                    <div key={k} className="space-y-1.5">
                                       <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{k}</label>
                                       <input type="number" step="any" className="w-full bg-slate-900/80 p-3.5 rounded-xl text-white font-bold text-xs border border-white/5 focus:border-orange-500 outline-none" value={status[k]} onChange={e => setStatus({ ...status, [k]: e.target.value })} />
                                    </div>
                                 ))}
                              </div>
                              <button type="submit" className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all mt-4">Synchronize</button>
                           </form>
                        </div>

                        {/* Subtle premium divider line */}
                        <div className="border-b border-white/5 my-6" />

                        {/* Sub-Section 2: System Controls */}
                        <div className="mb-6">
                           <h3 className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-6"><Power size={18} className="text-orange-500 animate-pulse" /> System Controls</h3>
                           
                           {/* Status Badges Row (Auto/Manual & Pump Status side-by-side) */}
                           <div className="grid grid-cols-2 gap-4 mb-5">
                              {/* Operation Mode Status Badge */}
                              <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-white/5">
                                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Operation Mode</span>
                                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${status.mode === 'AUTO' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                    {status.mode}
                                 </span>
                              </div>

                              {/* Pump Status Badge */}
                              <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-white/5">
                                 <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Water Pump</span>
                                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${status.relay ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>
                                    {status.relay ? 'ACTIVE' : 'STANDBY'}
                                 </span>
                              </div>
                           </div>

                           {/* Mode Toggle Button Grid */}
                           <div className="grid grid-cols-2 gap-3 mb-5">
                              <button
                                 onClick={async () => {
                                    await fetch(`http://${espIp}/auto`);
                                    fetchStatus();
                                 }}
                                 className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${status.mode === 'AUTO' ? 'bg-green-600 text-white border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.25)]' : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800'}`}
                              >
                                 Auto Mode
                              </button>
                              <button
                                 onClick={async () => {
                                    await fetch(`http://${espIp}/relay?state=${status.relay ? 'on' : 'off'}`);
                                    fetchStatus();
                                 }}
                                 className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${status.mode === 'MANUAL' ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)]' : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-slate-800'}`}
                              >
                                 Manual Mode
                              </button>
                           </div>

                           {/* Pump Manual Control Switches */}
                           <div>
                              {status.mode === 'MANUAL' ? (
                                 <div className="grid grid-cols-2 gap-3">
                                    <button
                                       onClick={async () => {
                                          await fetch(`http://${espIp}/relay?state=on`);
                                          fetchStatus();
                                       }}
                                       className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${status.relay ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.25)]' : 'bg-slate-900/60 text-slate-300 border-white/5 hover:bg-blue-600 hover:text-white'}`}
                                    >
                                       Start Pump
                                    </button>
                                    <button
                                       onClick={async () => {
                                          await fetch(`http://${espIp}/relay?state=off`);
                                          fetchStatus();
                                       }}
                                       className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${!status.relay ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900/60 text-slate-300 border-white/5 hover:bg-rose-600 hover:text-white'}`}
                                    >
                                       Stop Pump
                                    </button>
                                 </div>
                              ) : (
                                 <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl text-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">
                                       Pump is Managed by Auto-Logic
                                    </span>
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Subtle premium divider line */}
                        <div className="border-b border-white/5 my-6" />

                        {/* Sub-Section 3: History Logs */}
                        <div>
                           <div className="flex justify-between items-center mb-6">
                              <h3 className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><Clock size={18} className="text-orange-500" /> History Logs</h3>
                              <button onClick={() => {
                                 const headers = ["Time", "Duration(s)", "Temp(C)"];
                                 const csvContent = "data:text/csv;charset=utf-8," + [headers, ...wateringLogs.map(l => [new Date(l.start_time).toLocaleString(), l.duration_seconds, l.temperature])].map(e => e.join(",")).join("\n");
                                 const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "watering_logs.csv"); link.click();
                              }} className="p-2.5 bg-orange-600/10 text-orange-500 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-xl"><Download size={16} /></button>
                           </div>
                           <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                              {wateringLogs.length === 0 ? (
                                 <div className="text-center py-6 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                    No Watering Activity Yet
                                 </div>
                              ) : (
                                 wateringLogs.map((log, i) => (
                                    <div key={i} className="p-4 bg-slate-900/40 rounded-xl flex justify-between items-center border border-white/5 group hover:border-orange-500/30 transition-all">
                                       <div className="flex flex-col gap-1">
                                          <span className="text-[10px] font-black text-slate-100">{new Date(log.start_time).toLocaleString()}</span>
                                          <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">{log.duration_seconds}S Pulse | {log.temperature}°C Baseline</span>
                                       </div>
                                       {profile.role === 'admin' && (
                                          <button onClick={() => deleteLog(log.id)} className="p-2.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 rounded-lg"><Trash2 size={14} /></button>
                                       )}
                                    </div>
                                 ))
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* COLUMN 2: ESP32 CORE COMMAND, HEALTH DIAGNOSTICS & USER DATABASE */}
                  <div className={`bg-[#1e293b]/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col gap-6 justify-between ${profile.role !== 'admin' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                     <div>
                        {/* Title Header */}
                        <div className="border-b border-white/5 pb-4">
                           <h3 className="text-[10px] md:text-[12px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-3"><Cpu size={18} className="text-blue-400 animate-pulse" /> Core Health & Commands</h3>
                           <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider block mt-1">Live Hardware Telemetry Engine</span>
                        </div>

                        {/* Subsection 1: Microcontroller Health Telemetry Stats */}
                        <div className="space-y-4 mt-6">
                           {/* Uptime Counter */}
                           <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                 <Clock size={14} className="text-cyan-400 animate-pulse" />
                                 <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">System Uptime</span>
                              </div>
                              <span className="text-[9px] md:text-[10px] font-mono font-black text-cyan-400 tracking-wider">
                                 {isOnline && hwStats.isReal ? formatUptime(hwStats.uptime) : (isOnline ? 'Firmware Update Needed' : 'Offline')}
                              </span>
                           </div>

                           {/* SoC Chip Temperature */}
                           <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                    <Thermometer size={14} className="text-orange-500" />
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">SoC Chip Temp</span>
                                 </div>
                                 <span className={`text-[9px] md:text-[10px] font-mono font-black ${isOnline && hwStats.isReal && hwStats.chipTemp > 65 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                                    {isOnline && hwStats.isReal ? `${hwStats.chipTemp.toFixed(1)}°C` : '—'}
                                 </span>
                              </div>
                              {/* Linear visualizer bar */}
                              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isOnline && hwStats.isReal && hwStats.chipTemp > 65 ? 'bg-red-500' : isOnline && hwStats.isReal && hwStats.chipTemp > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${isOnline && hwStats.isReal ? Math.min(100, (hwStats.chipTemp / 85) * 100) : 0}%` }}
                                 />
                              </div>
                           </div>

                           {/* RAM Heap Memory Allocation */}
                           <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                    <Cpu size={14} className="text-emerald-400" />
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">RAM Heap Load</span>
                                 </div>
                                 <span className="text-[9px] md:text-[10px] font-mono font-black text-emerald-400">
                                    {isOnline && hwStats.isReal ? `${hwStats.ramPercent}% (${Math.round(hwStats.freeHeap / 1024)}KB Free)` : '—'}
                                 </span>
                              </div>
                              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${isOnline && hwStats.isReal ? hwStats.ramPercent : 0}%` }}
                                 />
                              </div>
                           </div>

                           {/* WiFi RSSI Signal decibel */}
                           <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                    <Wifi size={14} className={isOnline && hwStats.isReal && hwStats.wifiRssi > -65 ? 'text-green-400 animate-pulse' : 'text-yellow-400'} />
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">RSSI Connection</span>
                                 </div>
                                 <span className="text-[9px] md:text-[10px] font-mono font-black text-slate-300">
                                    {isOnline && hwStats.isReal ? `${hwStats.wifiRssi} dBm (${hwStats.wifiRssi > -60 ? 'Strong' : hwStats.wifiRssi > -75 ? 'Good' : 'Weak'})` : '—'}
                                 </span>
                              </div>
                              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isOnline && hwStats.isReal && hwStats.wifiRssi > -60 ? 'bg-green-500' : isOnline && hwStats.isReal && hwStats.wifiRssi > -75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${isOnline && hwStats.isReal ? Math.max(10, Math.min(100, 2 * (hwStats.wifiRssi + 100))) : 0}%` }}
                                 />
                              </div>
                           </div>

                           {/* Technical Chip specifications (CPU & Flash) */}
                           <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl text-center flex flex-col justify-center">
                                 <span className="text-[6px] font-mono text-slate-500 uppercase tracking-widest block">CPU Clock</span>
                                 <span className="text-[9px] font-black text-slate-300 mt-0.5">{isOnline && hwStats.isReal ? `${hwStats.cpuFreq} MHz` : '—'}</span>
                              </div>
                              <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl text-center flex flex-col justify-center">
                                 <span className="text-[6px] font-mono text-slate-500 uppercase tracking-widest block">Flash Size</span>
                                 <span className="text-[9px] font-black text-slate-300 mt-0.5">{isOnline && hwStats.isReal ? `${Math.round(hwStats.flashSize / (1024 * 1024))} MB` : '—'}</span>
                              </div>
                           </div>
                        </div>

                        {/* Subsection 2: Microcontroller Hardware Command Diagnostics */}
                        <div className="border-t border-white/5 pt-4 mt-6">
                           <h4 className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Diagnostics Test Interface</h4>
                           <div className="grid grid-cols-2 gap-2">
                              {['pump', 'buzzer', 'lcd', 'sensor', 'next', 'prev', 'plus', 'minus'].map((c) => (
                                 <button 
                                    key={c}
                                    onClick={async () => {
                                       if (c === 'pump') {
                                          isTestingPump.current = true;
                                       }
                                       setTestStatus(prev => ({ ...prev, [c]: 'RUNNING' }));
                                       try {
                                          const res = await fetch(`http://${espIp}/api/test?comp=${c}`);
                                          if (res.ok) {
                                             setTestStatus(prev => ({ ...prev, [c]: 'SUCCESS' }));
                                          } else {
                                             setTestStatus(prev => ({ ...prev, [c]: 'FAILED' }));
                                          }
                                       } catch (e) {
                                          setTestStatus(prev => ({ ...prev, [c]: 'ERROR' }));
                                       }
                                       if (c === 'pump') {
                                          setTimeout(() => { isTestingPump.current = false; }, 1200);
                                       }
                                    }}
                                    className={`relative py-3.5 md:py-4 px-4 bg-slate-900/60 border rounded-xl flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all text-slate-300 hover:text-white ${testStatus[c] === 'RUNNING' ? 'border-amber-500/40 bg-amber-500/5 animate-pulse text-amber-400' : testStatus[c] === 'SUCCESS' ? 'border-green-500/40 bg-green-500/5 text-green-400' : testStatus[c] === 'FAILED' || testStatus[c] === 'ERROR' ? 'border-rose-500/40 bg-rose-500/5 text-rose-400' : 'border-white/5 hover:border-white/10'}`}
                                 >
                                    {c === 'pump' && <Zap size={12} className="shrink-0 text-amber-400" />}
                                    {c === 'buzzer' && <Volume2 size={12} className="shrink-0 text-indigo-400" />}
                                    {c === 'lcd' && <Tv size={12} className="shrink-0 text-cyan-400" />}
                                    {c === 'sensor' && <Radio size={12} className="shrink-0 text-emerald-400" />}
                                    {c === 'next' && <ChevronRight size={12} className="shrink-0 text-slate-400" />}
                                    {c === 'prev' && <ChevronLeft size={12} className="shrink-0 text-slate-400" />}
                                    {c === 'plus' && <Plus size={12} className="shrink-0 text-sky-400" />}
                                    {c === 'minus' && <Minus size={12} className="shrink-0 text-rose-400" />}
                                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider">{c}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Subsection 3: User Database (ONLY FOR ADMIN) */}
                     {profile.role === 'admin' && (
                        <div className="mt-6 border-t border-white/5 pt-6">
                           <h3 className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-6"><Users size={18} className="text-blue-500" /> User Database</h3>
                           <div className="overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                              <table className="w-full text-left text-[10px]">
                                 <tbody>
                                    {allUsers.map((u, i) => {
                                       const parsed = parseUserEmail(u.email);
                                       return (
                                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all group">
                                             <td className="py-3 px-2 font-bold text-slate-200">
                                                <div className="flex items-center gap-2.5">
                                                   <div className="w-7 h-7 rounded-lg bg-slate-950 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                                                      {u.avatar_url ? (
                                                         <img src={u.avatar_url} className="w-full h-full object-cover" />
                                                      ) : (
                                                         <User size={12} className="text-slate-600" />
                                                      )}
                                                   </div>
                                                   <div className="flex flex-col">
                                                      <span className="font-black text-slate-100">{parsed.fullname}</span>
                                                      <span className="text-[8px] text-slate-500 font-mono">@{parsed.username}</span>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="py-3 px-2 uppercase font-black text-orange-500 text-center tracking-widest text-[9px]">{u.role}</td>
                                             <td className="py-3 px-2 text-right">
                                                <button onClick={() => deleteUser(u.id)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20 rounded-lg"><Trash2 size={14} /></button>
                                             </td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
            {/* LOGIN & REGISTER MODAL */}
            <AnimatePresence>
               {showLogin && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
                     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1e293b] p-8 md:p-12 rounded-[3.5rem] md:rounded-[4rem] w-full max-w-sm border border-white/10 shadow-2xl relative animate-fadeIn">
                        <button onClick={() => { setShowLogin(false); setAuthMode('login'); setUsername(''); setFullname(''); setPassword(''); setSecretKey(''); }} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X /></button>

                        {/* Auth Tabs */}
                        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 mb-8">
                           <button onClick={() => { setAuthMode('login'); setUsername(''); setFullname(''); setPassword(''); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${authMode === 'login' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                              Sign In
                           </button>
                           <button onClick={() => { setAuthMode('register'); setUsername(''); setFullname(''); setPassword(''); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${authMode === 'register' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                              Register
                           </button>
                        </div>

                        <form onSubmit={async (e) => {
                           e.preventDefault();
                           if (authMode === 'login') {
                              // === SECURE LOGIN: bcrypt verify + JWT session ===
                              const { data: allProfiles, error } = await supabase.from('profiles').select('*');
                              if (error) {
                                 alert("Database connection failure!");
                                 return;
                              }
                              const matched = allProfiles.find(u => {
                                 const parsed = parseUserEmail(u.email);
                                 return parsed.username.toLowerCase() === username.trim().toLowerCase();
                              });

                              if (!matched) {
                                 alert("Username tidak ditemukan!");
                                 return;
                              }

                              let isAuthenticated = false;

                              // Cek apakah akun sudah migrasi ke bcrypt (punya password_hash)
                              if (matched.password_hash) {
                                 isAuthenticated = await verifyPassword(password, matched.password_hash);
                              } else if (matched.password && matched.password === password) {
                                 // MIGRASI OTOMATIS: Akun lama dengan plaintext password
                                 isAuthenticated = true;
                                 const newHash = await hashPassword(password);
                                 await supabase.from('profiles').update({ 
                                    password_hash: newHash, 
                                    password: null 
                                 }).eq('id', matched.id);
                                 console.log('Akun berhasil dimigrasi ke bcrypt hash.');
                              }

                              if (isAuthenticated) {
                                 const parsed = parseUserEmail(matched.email);
                                 const token = await createSessionToken({
                                    id: matched.id,
                                    username: parsed.username,
                                    fullname: parsed.fullname,
                                    role: matched.role,
                                    avatar_url: matched.avatar_url
                                 });
                                 saveSession(token);
                                 const remaining = await getSessionTimeRemaining();
                                 setSessionMinutes(remaining);
                                 setUser(matched);
                                 setProfile(matched);
                                 setShowLogin(false);
                                 setUsername('');
                                 setPassword('');
                                 if (matched.role === 'admin') fetchAllUsers();
                              } else {
                                 alert("Password salah! Periksa kembali Password Anda.");
                              }
                           } else {
                              // === SECURE REGISTER: bcrypt hash + composite email ===
                              const expectedKey = role === 'admin' ? import.meta.env.VITE_KEY_ADMIN : import.meta.env.VITE_KEY_ANGGOTA;
                              if (secretKey !== expectedKey) {
                                 alert("Kunci Rahasia yang Anda masukkan salah!");
                                 return;
                              }
                              
                              const { data: allProfiles } = await supabase.from('profiles').select('email');
                              const isTaken = allProfiles?.some(u => {
                                 const parsed = parseUserEmail(u.email);
                                 return parsed.username.toLowerCase() === username.trim().toLowerCase();
                              });

                              if (isTaken) {
                                 alert("Username ini sudah terdaftar! Pilih username lain.");
                                 return;
                              }

                              const composite = formatUserEmail(username, fullname);
                              const hashedPw = await hashPassword(password);
                              const { error } = await supabase.from('profiles').insert([
                                 { email: composite, password: null, password_hash: hashedPw, role, avatar_url: null }
                              ]);

                              if (error) {
                                 alert("Registrasi Gagal: " + error.message);
                              } else {
                                 alert("Registrasi Berhasil! Silakan Masuk.");
                                 setAuthMode('login');
                                 setUsername('');
                                 setFullname('');
                                 setPassword('');
                                 setSecretKey('');
                              }
                           }
                        }} className="space-y-4 text-center">
                           <h2 className="text-xl md:text-2xl font-black uppercase text-white mb-4 tracking-tighter italic">
                              ADIWIRA <span className="text-orange-500">{authMode === 'login' ? 'GATEWAY' : 'SIGN UP'}</span>
                           </h2>

                           {authMode === 'register' && (
                              <input type="text" placeholder="Nama Lengkap" className="w-full bg-slate-900/80 p-4 rounded-2xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-orange-500" value={fullname} onChange={e => setFullname(e.target.value)} required />
                           )}

                           <input type="text" placeholder="Username" className="w-full bg-slate-900/80 p-4 rounded-2xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-orange-500" value={username} onChange={e => setUsername(e.target.value)} required />
                           <input type="password" placeholder="Password" className="w-full bg-slate-900/80 p-4 rounded-2xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-orange-500" value={password} onChange={e => setPassword(e.target.value)} required />

                           {authMode === 'register' && (
                              <div className="space-y-4 text-left animate-fadeIn">
                                 <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Level</label>
                                    <div className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5 gap-2">
                                       <button type="button" onClick={() => setRole('anggota')} className={`flex-1 py-2 text-[8px] font-bold uppercase rounded-lg transition-all ${role === 'anggota' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/20' : 'text-slate-500'}`}>Anggota</button>
                                       <button type="button" onClick={() => setRole('admin')} className={`flex-1 py-2 text-[8px] font-bold uppercase rounded-lg transition-all ${role === 'admin' ? 'bg-orange-600/30 text-orange-400 border border-orange-500/20' : 'text-slate-500'}`}>Admin</button>
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Registration Key</label>
                                    <input type="password" placeholder="Secret Key" className="w-full bg-slate-900/80 p-4 rounded-2xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-orange-500" value={secretKey} onChange={e => setSecretKey(e.target.value)} required />
                                 </div>
                              </div>
                           )}

                           <button className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-[0.2em] transition-all hover:scale-[1.02]">
                              {authMode === 'login' ? 'Authorize' : 'Register Account'}
                           </button>
                        </form>
                     </motion.div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* PROFILE SETTINGS MODAL */}
            <AnimatePresence>
               {showProfileModal && user && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
                     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1e293b] p-8 md:p-12 rounded-[3.5rem] md:rounded-[4rem] w-full max-w-sm border border-white/10 shadow-2xl relative animate-fadeIn">
                        <button onClick={() => { setShowProfileModal(false); setNewPassword(''); setConfirmPassword(''); }} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X /></button>

                        <form onSubmit={async (e) => {
                           e.preventDefault();
                           if (newPassword && newPassword !== confirmPassword) {
                              alert("Password baru dan konfirmasi tidak cocok!");
                              return;
                           }

                           if (!newUsername.trim() || !newFullname.trim()) {
                              alert("Username dan Nama Lengkap tidak boleh kosong!");
                              return;
                           }

                           // Check if updated username is already taken by another user
                           const currentParsed = parseUserEmail(user.email);
                           if (newUsername.trim().toLowerCase() !== currentParsed.username.toLowerCase()) {
                              const { data: allProfiles } = await supabase.from('profiles').select('email');
                              const isTaken = allProfiles?.some(u => {
                                 const parsed = parseUserEmail(u.email);
                                 return parsed.username.toLowerCase() === newUsername.trim().toLowerCase();
                              });
                              if (isTaken) {
                                 alert("Username baru ini sudah terdaftar! Gunakan yang lain.");
                                 return;
                              }
                           }

                           const composite = formatUserEmail(newUsername, newFullname);
                           const updateData = {
                              email: composite,
                              avatar_url: avatarBase64
                           };
                           
                           if (newPassword) {
                              updateData.password_hash = await hashPassword(newPassword);
                              updateData.password = null;
                           }

                           const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);
                           if (error) {
                              alert("Gagal memperbarui profil: " + error.message);
                           } else {
                              alert("Setelan Profil berhasil diperbarui!");
                              const updatedUser = { 
                                 ...user, 
                                 email: composite, 
                                 avatar_url: avatarBase64 
                              };
                              setUser(updatedUser);
                              setProfile(updatedUser);
                              // Buat JWT token baru dengan data profil terbaru
                              const parsed = parseUserEmail(composite);
                              const newToken = await createSessionToken({
                                 id: user.id,
                                 username: parsed.username,
                                 fullname: parsed.fullname,
                                 role: user.role,
                                 avatar_url: avatarBase64
                              });
                              saveSession(newToken);
                              setShowProfileModal(false);
                              setNewPassword('');
                              setConfirmPassword('');
                              if (profile.role === 'admin') fetchAllUsers();
                           }
                        }} className="space-y-6 text-center">
                           <h2 className="text-xl md:text-2xl font-black uppercase text-white mb-4 tracking-tighter italic">
                              PROFILE <span className="text-blue-400">SETTINGS</span>
                           </h2>

                           {/* Premium Profile Photo Upload Area */}
                           <div className="flex flex-col items-center gap-3">
                              <div className="relative group w-24 h-24 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-all hover:border-blue-500/40">
                                 {avatarBase64 ? (
                                    <img src={avatarBase64} className="w-full h-full object-cover" />
                                 ) : (
                                    <User size={36} className="text-slate-700" />
                                 )}
                                 <label className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                                    <Camera size={22} className="text-white" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                       if (e.target.files[0]) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                             setAvatarBase64(reader.result);
                                          };
                                          reader.readAsDataURL(e.target.files[0]);
                                       }
                                    }} />
                                 </label>
                              </div>
                              <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">Tap to Change Avatar</span>
                           </div>

                           <div className="space-y-3 text-left">
                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                 <input type="text" className="w-full bg-slate-900/80 p-3.5 rounded-xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-blue-500" value={newFullname} onChange={e => setNewFullname(e.target.value)} required />
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                                 <input type="text" className="w-full bg-slate-900/80 p-3.5 rounded-xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-blue-500 font-mono" value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password (Optional)</label>
                                 <input type="password" placeholder="Biarkan kosong jika tidak diubah" className="w-full bg-slate-900/80 p-3.5 rounded-xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-blue-500" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                              </div>

                              {newPassword && (
                                 <div className="space-y-1.5 animate-fadeIn">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                                    <input type="password" placeholder="Ulangi password baru" className="w-full bg-slate-900/80 p-3.5 rounded-xl text-white outline-none border border-white/10 shadow-inner text-xs focus:border-blue-500" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                                 </div>
                              )}
                           </div>

                           <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-[0.2em] transition-all hover:scale-[1.02] mt-4">
                              Save Changes
                           </button>
                        </form>
                     </motion.div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </>
   );
}