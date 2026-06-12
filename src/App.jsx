import * as React from 'react';
import mqtt from 'mqtt';
import { 
  Thermometer, Droplets, Waves, Power, Cpu, Wifi, LogIn, 
  LogOut, User, Camera, BarChart3, X, Clock, Settings, 
  Users, Trash2, Zap, ChevronLeft, ChevronRight, Plus, 
  Minus, Download, Globe, Volume2, Tv, Radio 
} from 'lucide-react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { loginTrustedDevice, isTrustedDevice, clearTrustedDevice } from './lib/auth';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler
);

// =====================================================================
// GLOBAL MEMORY LOCK (SENJATA PAMUNGKAS ANTI DOUBLE LOG)
// Variabel ini berada di luar siklus render React (di luar komponen App).
// Mustahil bagi React Strict Mode untuk menembus dan me-reset nilai ini.
// =====================================================================
let globalInsertLock = 0; 

// ---------------------------------------------------------------------
// Komponen Diagnostic Button
// ---------------------------------------------------------------------
function DiagnosticBtn({ label, icon, onClick, status, color = "orange" }) {
   const statusColors = {
      idle: "bg-slate-700",
      testing: "bg-yellow-500 animate-pulse",
      success: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]",
      error: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
   };
   
   return (
      <button 
         onClick={onClick} 
         className={`relative py-3 md:py-5 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-[40px] backdrop-saturate-[180%] border-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ${
            color === 'orange' ? 'border-orange-500/20 hover:bg-orange-600' : 'border-blue-500/20 hover:bg-blue-600'
         } rounded-xl md:rounded-2xl flex flex-col items-center gap-1.5 md:gap-2 hover:text-white transition-all hover:scale-105 active:scale-95 group shadow-xl`}
      >
         <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
         <div className={color === 'orange' ? 'text-orange-500 group-hover:text-white' : 'text-blue-400 group-hover:text-white'}>
            {icon}
         </div>
         <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">
            {label}
         </span>
      </button>
   );
}

// ---------------------------------------------------------------------
// Komponen Preloader (Booting System)
// ---------------------------------------------------------------------
function Preloader({ onComplete }) {
   const [percent, setPercent] = React.useState(0);
   const [bootStarted, setBootStarted] = React.useState(false);
   const [statusText, setStatusText] = React.useState('CLICK ANYWHERE TO BOOT ADIWIRA SYSTEM...');

    const playStartupSound = () => {
      try {
         const AudioContext = window.AudioContext || window.webkitAudioContext;
         if (!AudioContext) return;
         const ctx = new AudioContext();
         if (ctx.state === 'suspended') ctx.resume();
         
         const now = ctx.currentTime;
         const subOsc1 = ctx.createOscillator();
         const subGain1 = ctx.createGain();
         subOsc1.type = 'sine'; 
         subOsc1.frequency.setValueAtTime(82.41, now); 
         
         const subOsc2 = ctx.createOscillator();
         const subGain2 = ctx.createGain();
         subOsc2.type = 'triangle'; 
         subOsc2.frequency.setValueAtTime(110.00, now); 
         
         subGain1.gain.setValueAtTime(0, now);
         subGain1.gain.linearRampToValueAtTime(0.5, now + 0.05); 
         subGain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.2); 
         
         subGain2.gain.setValueAtTime(0, now);
         subGain2.gain.linearRampToValueAtTime(0.35, now + 0.05); 
         subGain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.0); 
         
         subOsc1.connect(subGain1); subGain1.connect(ctx.destination);
         subOsc2.connect(subGain2); subGain2.connect(ctx.destination);
         subOsc1.start(now); subOsc1.stop(now + 2.2);
         subOsc2.start(now); subOsc2.stop(now + 2.2);
         
         const notes = [1046.50, 1318.51, 1567.98, 2093.00];
         const tempo = 0.18; 
         notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(freq, now + idx * tempo);
            gain.gain.setValueAtTime(0, now + idx * tempo);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * tempo + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * tempo + 1.4); 
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
               setTimeout(onComplete, 800); 
               return 100;
            }
            if (prev === 20) setStatusText('ESTABLISHING SUPABASE SECURE LINK...');
            if (prev === 45) setStatusText('SYNCING DATABASE PROFILE TABLES...');
            if (prev === 70) setStatusText('COMMUNICATING WITH ESP32 HARDWARE...');
            if (prev === 90) setStatusText('SYSTEM ONLINE. ACCESS GRANTED.');
            return prev + 1;
         });
      }, 20); 
   };

   return (
      <motion.div 
         initial={{ opacity: 1 }} 
         exit={{ opacity: 0, scale: 0.95 }} 
         transition={{ duration: 0.6, ease: 'easeInOut' }} 
         className="fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center font-sans select-none cursor-pointer" 
         onClick={handleStartBoot}
      >
         <style>{`
            @keyframes stripe-slide { 
               0% { background-position: 0 0; } 
               100% { background-position: 40px 0; } 
            }
            .cartoon-stripes { 
               background-image: repeating-linear-gradient(
                  45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, 
                  rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent
               ); 
               background-size: 40px 40px; 
               animation: stripe-slide 1s linear infinite; 
            }
         `}</style>
         
         <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full" />
         <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/10 blur-[100px] rounded-full" />
         
         <div className="relative flex flex-col items-center justify-center z-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-center bg-gradient-to-r from-blue-400 via-purple-500 to-orange-500 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(249,115,22,0.25)] select-none mb-10">
               ADIWIRA CARAKA
            </h1>
            <div className="relative w-72 md:w-96 h-6 bg-slate-950/80 rounded-full border border-white/10 overflow-hidden p-1 shadow-[0_0_25px_rgba(249,115,22,0.15)] mb-6">
               <motion.div 
                  initial={{ width: '0%' }} 
                  animate={{ width: `${percent}%` }} 
                  transition={{ duration: 0.1 }} 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 rounded-full cartoon-stripes" 
               />
            </div>
            <span className="text-xl font-black italic tracking-widest bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent mb-4">
               {percent}%
            </span>
            <p className="text-[9px] md:text-[11px] font-mono tracking-[0.3em] text-slate-500 uppercase h-4 animate-pulse mb-8">
               {statusText}
            </p>
            <p className="text-[7px] font-mono text-slate-600 tracking-wider">
               {!bootStarted ? '[ CLICK ANYWHERE ON SCREEN TO ACTIVATE SYSTEM CHIME & BOOT ]' : '[ SYSTEM SECURELY BOOTING ]'}
            </p>
         </div>
      </motion.div>
   );
}

// ---------------------------------------------------------------------
// Fungsi Utilitas Email & Format Uptime
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// KOMPONEN UTAMA (App)
// ---------------------------------------------------------------------
export default function App() {
   // State Dasar
   const [isLoading, setIsLoading] = React.useState(true);
   const [isMqttConnected, setIsMqttConnected] = React.useState(false);
   const [isEspOnline, setIsEspOnline] = React.useState(false);
   const espTimeoutRef = React.useRef(null);
   const mqttClientRef = React.useRef(null);
   
   // State Data
   const [history, setHistory] = React.useState({ temp: [], hum: [], labels: [] });
   const [wateringLogs, setWateringLogs] = React.useState([]);
   const [allUsers, setAllUsers] = React.useState([]);
   const [status, setStatus] = React.useState({ 
      temp: 0, hum: 0, water: true, relay: false, mode: 'AUTO', 
      tempMax: 30, tempMin: 20, humMin: 60 
   });
   
   // State Pengguna
   const [isTrusted, setIsTrusted] = React.useState(false);
   
   // State Hardware
   const [hwStats, setHwStats] = React.useState({
       chipTemp: 41.2, freeHeap: 182440, heapSize: 288672, 
       ramPercent: 36.8, wifiRssi: -58, cpuFreq: 240, 
       uptime: 120, flashSize: 4194304, isReal: false 
   });
   
   // State Auth & Modal
   const [showLogin, setShowLogin] = React.useState(false);
   const [secretKey, setSecretKey] = React.useState('');
   const [testStatus, setTestStatus] = React.useState({});

   // Referensi untuk Logic Pompa
   const lastRelayState = React.useRef(false);
   const wateringStartTime = React.useRef(null);
   const wateringStartTemp = React.useRef(0);
   const isTestingPump = React.useRef(false);
   
   // Leader Election Referensi
   const syncClientId = React.useRef(Math.random().toString(36).substring(2, 15));
   const pendingLogRef = React.useRef(null);
   
   const [currentTime, setCurrentTime] = React.useState(new Date());
   const [sessionMinutes, setSessionMinutes] = React.useState(0);

   // Effect: Update Waktu & Simulasi Fluktuasi Telemetri Mikro
   React.useEffect(() => {
      const timer = setInterval(() => {
         setCurrentTime(new Date());
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

   // Fungsi Publish Perintah ke ESP
   const publishCmd = (cmd, payload = {}) => {
      if (mqttClientRef.current?.connected) {
         mqttClientRef.current.publish('adiwira/v3/commands', JSON.stringify({ cmd, ...payload }));
      }
   };

   // Effect: Konfigurasi MQTT
   React.useEffect(() => {
      const uniqueClientId = 'adiwira_web_' + Math.random().toString(16).substring(2, 10);
      
      const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
         clientId: uniqueClientId, 
         clean: true, 
         connectTimeout: 5000, 
         reconnectPeriod: 2000,
      });
      
      mqttClientRef.current = client;

      client.on('connect', () => {
         console.log('Connected to HiveMQ WSS Broker');
         setIsMqttConnected(true);
         client.subscribe('adiwira/v3/telemetry');
         client.subscribe('adiwira/v3/react_sync');
      });

      client.on('message', (topic, message) => {
         if (topic === 'adiwira/v3/react_sync') {
            try {
               const syncData = JSON.parse(message.toString());
               // Jika ada browser lain nge-klaim dengan ID lebih besar, kita mengalah (yield)
               if (syncData.action === 'claim_log' && pendingLogRef.current) {
                  if (syncData.id > syncClientId.current) {
                     pendingLogRef.current.active = false;
                  }
               }
            } catch(e){}
            return;
         }

         if (topic === 'adiwira/v3/telemetry') {
            setIsEspOnline(true);
            if (espTimeoutRef.current) clearTimeout(espTimeoutRef.current);
            espTimeoutRef.current = setTimeout(() => setIsEspOnline(false), 15000);

            try {
               const data = JSON.parse(message.toString());
               const isRelayOn = (data.relay === true || data.relay === 1 || data.relay === "1" || data.relay === "true" || data.relay === "on" || data.relay === "ON" || data.relay === "Active" || data.relay === "ACTIVE");

               // 1. DETEKSI MULAI (ON)
               if (lastRelayState.current === false && isRelayOn === true) {
                  wateringStartTime.current = new Date();
                  wateringStartTemp.current = data.temp || 0;
               } 
               // 2. DETEKSI SELESAI (OFF)
               else if (lastRelayState.current === true && isRelayOn === false) {
                  if (wateringStartTime.current) {
                     // --- FIX ATOMIC: AMBIL DATA LALU HAPUS VARIABEL SEGERA ---
                     const startTime = wateringStartTime.current;
                     const startTemp = wateringStartTemp.current;
                     wateringStartTime.current = null; // DIHAPUS SEBELUM PROSES APAPUN
                     
                     if (!isTestingPump.current) {
                        const durationSeconds = Math.round((new Date() - startTime) / 1000);
                        const baseTemp = startTemp;

                        // --- MQTT LEADER ELECTION ---
                        // Memasukkan log ke state antrean
                        pendingLogRef.current = {
                           active: true,
                           startTime: startTime,
                           duration: durationSeconds,
                           temp: baseTemp
                        };
                        
                        // Teriak ke semua browser yang sedang terbuka
                        if (mqttClientRef.current) {
                           mqttClientRef.current.publish('adiwira/v3/react_sync', JSON.stringify({
                              action: 'claim_log',
                              id: syncClientId.current,
                              ts: Date.now()
                           }));
                        }

                        // Beri waktu 3 detik bagi semua browser untuk berdebat siapa Leadernya
                        setTimeout(async () => {
                           if (pendingLogRef.current && pendingLogRef.current.active) {
                              
                              // --- DOUBLE SAFETY: ANTI-FLAPPING ---
                              const nowMs = Date.now();
                              const lastMs = parseInt(localStorage.getItem('last_log_ms') || '0', 10);
                              if (Math.abs(nowMs - lastMs) < 30000) {
                                 console.log("♻️ [Safety Lock] Log penyiraman dalam 30 detik terakhir sudah ada. Membatalkan insert.");
                                 pendingLogRef.current = null;
                                 return;
                              }
                              localStorage.setItem('last_log_ms', nowMs.toString());
                              
                              console.log("🏆 Leader Election dimenangkan oleh browser ini. Mengirim data ke Google Sheets API...");
                              const scriptUrl = import.meta.env.VITE_GOOGLE_SHEETS_API_URL;
                              if (scriptUrl) {
                                 fetch(scriptUrl, {
                                    method: 'POST',
                                    mode: 'no-cors',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                       start_time: pendingLogRef.current.startTime.toISOString(),
                                       duration_seconds: pendingLogRef.current.duration,
                                       temperature: pendingLogRef.current.temp
                                    })
                                 }).then(() => { setTimeout(fetchLogs, 2000); }).catch(e => console.error(e));
                              }
                           } else {
                              console.log("♻️ Browser lain menjadi Leader. Membatalkan log duplikat...");
                           }
                           pendingLogRef.current = null;
                        }, 3000);
                     }
                  }
               }
               
               lastRelayState.current = isRelayOn;

               // Update State UI
               setStatus(prev => ({ ...prev, ...data, relay: isRelayOn }));
               if (data.hardware) setHwStats(prev => ({ ...data.hardware, isReal: true }));
               setHistory(prev => ({
                  labels: [...prev.labels, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })].slice(-30),
                  temp: [...prev.temp, data.temp].slice(-30),
                  hum: [...prev.hum, data.hum].slice(-30)
               }));
            } catch (e) { console.error('MQTT Parse Error', e); }
         }
      });

      client.on('offline', () => setIsMqttConnected(false));
      client.on('error', () => setIsMqttConnected(false));
      client.on('close', () => setIsMqttConnected(false));
      client.on('reconnect', () => setIsMqttConnected(false));

      return () => {
         if (espTimeoutRef.current) clearTimeout(espTimeoutRef.current);
         client.end(true);
      };
   }, []);

   // Fungsi Fetch Logs
   async function fetchLogs() {
      const scriptUrl = import.meta.env.VITE_GOOGLE_SHEETS_API_URL;
      if (!scriptUrl) return;
      try {
         const res = await fetch(scriptUrl);
         const json = await res.json();
         if (json && json.data) {
             setWateringLogs(json.data.slice(0, 20)); // Ambil 20 terbaru
         }
      } catch (e) { console.error("Error fetching logs:", e); }
   }

   // Effect: Mengelola Sesi Pengguna
   React.useEffect(() => {
      setIsTrusted(isTrustedDevice());
      fetchLogs();
   }, []);

   // Fungsi Hapus Log
   const deleteLog = async (timestamp) => {
      if (!confirm("Hapus log penyiraman ini?")) return;
      const scriptUrl = import.meta.env.VITE_GOOGLE_SHEETS_API_URL;
      if (!scriptUrl) return;
      try {
         await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "delete", timestamp })
         });
         setWateringLogs(prev => prev.filter(log => log.start_time !== timestamp));
      } catch (e) {
         console.error("Gagal menghapus log:", e);
      }
   };


   // =====================================================================
   // RENDER KOMPONEN UI
   // =====================================================================
   return (
      <>
         <AnimatePresence mode="wait">
            {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}
         </AnimatePresence>

         <div className="apple-mesh-bg">
            <div className="mesh-orb"></div>
         </div>

         <div className="min-h-screen text-slate-100 p-3 md:p-8 font-sans selection:bg-purple-500/30 relative z-10">
            <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-6 relative">

               {/* ----------------- BAGIAN HEADER ----------------- */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-[40px] backdrop-saturate-[180%] border border-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-4 md:p-8 rounded-[2rem] md:rounded-[4rem] relative overflow-hidden w-full">
                  <div className="flex flex-col gap-2 md:gap-3 items-center md:items-start text-center md:text-left flex-1 w-full md:w-auto">
                     <h1 className="text-xl md:text-4xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-blue-400 via-purple-500 to-orange-500 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(249,115,22,0.25)] select-none">
                        Adiwira Caraka
                     </h1>
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-md ${isEspOnline ? 'bg-white/10 border-white/20' : 'bg-red-500/10 border-red-500/20'}`}>
                           <div className={`w-2 h-2 rounded-full ${isEspOnline ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-500'}`} />
                           <span className={`text-[9px] md:text-[11px] font-black uppercase ${isEspOnline ? 'text-white/90' : 'text-red-400'}`}>
                              {isEspOnline ? 'Core Online' : 'Core Offline'}
                           </span>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] md:text-[11px] font-bold border shadow-lg backdrop-blur-md ${isMqttConnected ? 'bg-white/10 text-blue-300 border-white/20' : 'bg-slate-800/50 text-slate-400 border-slate-700/50'}`}>
                           <Globe size={12} className={isMqttConnected ? "animate-pulse text-blue-400" : "text-slate-500"} /> 
                           {isMqttConnected ? 'MQTT WSS CLOUD' : 'WSS DISCONNECTED'}
                        </div>
                     </div>
                  </div>

                  {/* Premium Complete Digital Clock (iOS Style) - CENTERED */}
                  <div className="flex flex-col items-center justify-center my-0 md:my-1 flex-shrink-0">
                     <div className="text-xs md:text-xl font-semibold text-white/90 drop-shadow-md tracking-wider">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                     </div>
                     <div className="text-[3.5rem] md:text-[6rem] font-bold tracking-tighter leading-none text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)] flex items-baseline gap-0 md:gap-2 my-1 md:my-2" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                        {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                        <span className="text-2xl md:text-[3.5rem] text-white/70 font-medium">
                           :{currentTime.getSeconds().toString().padStart(2, '0')}
                        </span>
                     </div>
                  </div>

                  <div className="flex items-center justify-center md:justify-end gap-3 md:gap-4 flex-1 w-full md:w-auto">
                     <div className="flex items-center gap-2 md:gap-4 bg-slate-950/40 p-1.5 md:p-3 rounded-full border border-white/5 shadow-inner backdrop-blur-md">
                        {isTrusted ? (
                           <>
                              <div className="flex flex-col text-left pr-2 max-w-[100px] md:max-w-[150px] overflow-hidden">
                                 <span className="text-[10px] md:text-[11px] font-black text-white truncate">
                                    Trusted Device
                                 </span>
                                 <span className="text-[7px] md:text-[8px] font-mono text-orange-500 uppercase tracking-widest">
                                    Administrator
                                 </span>
                              </div>
                              <div className="flex gap-1">
                                 <button 
                                    onClick={() => { 
                                       clearTrustedDevice(); 
                                       setIsTrusted(false);
                                    }} 
                                    className="p-2 md:p-3 bg-white/10 hover:bg-orange-600 text-white/80 hover:text-white rounded-full transition-all" 
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
                              <LogIn size={12} /> Access Gateway
                           </button>
                        )}
                     </div>
                  </div>
               </header>

               {/* ----------------- BAGIAN KARTU TELEMETRI ----------------- */}
               <div className="grid grid-cols-3 gap-3 md:gap-10">
                  
                  {/* Kartu Suhu */}
                  <div className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-[40px] backdrop-saturate-[180%] border-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all hover:scale-[1.03] group ${status.temp > status.tempMax || status.temp < status.tempMin ? 'border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.2)]' : ''}`}>
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
                     <p className="text-[7px] md:text-[11px] font-black uppercase text-white/80 tracking-wider md:tracking-[0.25em] mb-1 relative z-10">
                        <span className="block md:hidden">Temp</span>
                        <span className="hidden md:block">Thermal Status</span>
                     </p>
                     <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
                        <span className="text-xl md:text-6xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                           {status.temp.toFixed(1)}
                        </span>
                        <span className="text-xs md:text-2xl font-black text-orange-500 uppercase">°C</span>
                     </div>
                     <div className="w-full h-1 md:h-2 bg-slate-950/80 rounded-full overflow-hidden mt-3 md:mt-6 border border-white/5 relative">
                        <motion.div 
                           initial={{ width: '0%' }} 
                           animate={{ width: `${Math.max(0, Math.min(100, (status.temp / 50) * 100))}%` }} 
                           transition={{ duration: 0.8 }} 
                           className="h-full bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 rounded-full" 
                        />
                     </div>
                  </div>

                  {/* Kartu Kelembapan */}
                  <div className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-[40px] backdrop-saturate-[180%] border-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all hover:scale-[1.03] group ${status.hum < status.humMin ? 'border-yellow-500/50 shadow-[0_0_35px_rgba(234,179,8,0.2)]' : ''}`}>
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
                     <p className="text-[7px] md:text-[11px] font-black uppercase text-white/80 tracking-wider md:tracking-[0.25em] mb-1 relative z-10">
                        <span className="block md:hidden">Humid</span>
                        <span className="hidden md:block">Humid Level</span>
                     </p>
                     <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
                        <span className="text-xl md:text-6xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                           {status.hum.toFixed(0)}
                        </span>
                        <span className="text-xs md:text-2xl font-black text-blue-400 uppercase">%</span>
                     </div>
                     <div className="w-full h-1 md:h-2 bg-slate-950/80 rounded-full overflow-hidden mt-3 md:mt-6 border border-white/5 relative">
                        <motion.div 
                           initial={{ width: '0%' }} 
                           animate={{ width: `${Math.max(0, Math.min(100, status.hum))}%` }} 
                           transition={{ duration: 0.8 }} 
                           className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full" 
                        />
                     </div>
                  </div>

                  {/* Kartu Status Air */}
                  <div className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/60 backdrop-blur-2xl border transition-all hover:scale-[1.03] group ${status.water ? 'border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)]' : 'border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.25)] animate-pulse'}`}>
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
                     <p className="text-[7px] md:text-[11px] font-black uppercase text-white/80 tracking-wider md:tracking-[0.25em] mb-1 relative z-10">
                        <span className="block md:hidden">Water</span>
                        <span className="hidden md:block">Water Tank</span>
                     </p>
                     <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
                        <span className={`text-xs sm:text-lg md:text-5xl font-black italic uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${status.water ? 'text-cyan-400' : 'text-rose-500'}`}>
                           {status.water ? 'OPTIMAL' : 'EMPTY'}
                        </span>
                     </div>
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

               {/* ----------------- BAGIAN GRAFIK ----------------- */}
               <div className="grid grid-cols-1 gap-6 md:gap-10">
                  <div className="bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-[40px] backdrop-saturate-[180%] p-6 md:p-8 rounded-[3rem] border border-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] h-[250px] md:h-[350px] transition-all hover:border-white/30">
                     <h3 className="text-[8px] md:text-[11px] font-black text-white/60 uppercase tracking-widest mb-4 flex items-center gap-3">
                        <BarChart3 size={16} className="text-white/80" /> Suhu & Kelembapan
                     </h3>
                     <div className="h-[170px] md:h-[250px]">
                        <Line 
                           data={{ 
                              labels: history.labels, 
                              datasets: [
                                 { 
                                    label: 'Suhu (°C)', 
                                    data: history.temp, 
                                    borderColor: '#f97316', 
                                    backgroundColor: 'rgba(249, 115, 22, 0.05)', 
                                    fill: true, 
                                    tension: 0.4, 
                                    pointRadius: 0, 
                                    borderWidth: 3 
                                 },
                                 { 
                                    label: 'Kelembapan (%)', 
                                    data: history.hum, 
                                    borderColor: '#3b82f6', 
                                    backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                                    fill: true, 
                                    tension: 0.4, 
                                    pointRadius: 0, 
                                    borderWidth: 3 
                                 }
                              ] 
                           }} 
                           options={{ 
                              responsive: true, 
                              maintainAspectRatio: false, 
                              plugins: { 
                                 legend: { 
                                    display: true, 
                                    labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } } 
                                 } 
                              }, 
                              scales: { 
                                 x: { display: false }, 
                                 y: { 
                                    grid: { color: 'rgba(255,255,255,0.03)' }, 
                                    ticks: { color: '#475569', font: { size: 10 } } 
                                 } 
                              } 
                           }} 
                        />
                     </div>
                  </div>
               </div>
               
               {/* ----------------- KONTROL & DIAGNOSTIK ----------------- */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-stretch pb-20">
                  <div className={`bg-black/30 backdrop-blur-[80px] p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-none flex flex-col justify-between ${!isTrusted ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                     <div>
                        {/* Sinkronisasi Parameter */}
                        <div className="mb-6">
                           <h3 className="text-[10px] md:text-[12px] font-black text-white/60 uppercase tracking-widest flex items-center gap-3 mb-6">
                              <Settings size={18} className="text-orange-500" /> Parameters
                           </h3>
                           <form 
                              onSubmit={async (e) => {
                                 e.preventDefault(); 
                                 publishCmd('update_settings', { 
                                    tempMax: parseFloat(status.tempMax), 
                                    tempMin: parseFloat(status.tempMin), 
                                    humMin: parseFloat(status.humMin) 
                                 }); 
                                 alert("Command Synchronized via MQTT!");
                              }} 
                              className="space-y-6"
                           >
                              <div className="grid grid-cols-3 gap-4">
                                 {['tempMax', 'tempMin', 'humMin'].map(k => (
                                    <div key={k} className="space-y-1.5">
                                       <label className="text-[8px] md:text-[9px] font-black text-white/60 uppercase tracking-widest ml-1">
                                          {k}
                                       </label>
                                       <input 
                                          type="number" 
                                          step="any" 
                                          className="w-full bg-white/10 p-3.5 rounded-xl text-white font-bold text-xs border border-white/5 focus:border-orange-500 outline-none" 
                                          value={status[k]} 
                                          onChange={e => setStatus({ ...status, [k]: e.target.value })} 
                                       />
                                    </div>
                                 ))}
                              </div>
                              <button 
                                 type="submit" 
                                 className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all mt-4"
                              >
                                 Synchronize
                              </button>
                           </form>
                        </div>
                        
                        <div className="border-b border-white/5 my-6" />
                        
                        {/* Kontrol Pompa & Mode */}
                        <div className="mb-6">
                           <h3 className="text-[10px] md:text-[12px] font-black text-white/60 uppercase tracking-widest flex items-center gap-3 mb-6">
                              <Power size={18} className="text-orange-500 animate-pulse" /> System Controls
                           </h3>
                           <div className="grid grid-cols-2 gap-4 mb-5">
                              <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl border border-white/5">
                                 <span className="text-[9px] font-black uppercase text-white/80 tracking-wider">Operation Mode</span>
                                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${status.mode === 'AUTO' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                    {status.mode}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl border border-white/5">
                                 <span className="text-[9px] font-black uppercase text-white/80 tracking-wider">Water Pump</span>
                                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase ${status.relay ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' : 'bg-slate-800 text-white/60 border border-white/5'}`}>
                                    {status.relay ? 'ACTIVE' : 'STANDBY'}
                                 </span>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 mb-5">
                              <button 
                                 onClick={() => publishCmd('set_auto')} 
                                 className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${status.mode === 'AUTO' ? 'bg-green-600 text-white border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.25)]' : 'bg-white/20 text-white/80 border-white/5 hover:bg-slate-800'}`}
                              >
                                 Auto Mode
                              </button>
                              <button 
                                 onClick={() => publishCmd('set_relay', { val: status.relay })} 
                                 className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${status.mode === 'MANUAL' ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.25)]' : 'bg-white/20 text-white/80 border-white/5 hover:bg-slate-800'}`}
                              >
                                 Manual Mode
                              </button>
                           </div>
                           <div>
                              {status.mode === 'MANUAL' ? (
                                 <div className="grid grid-cols-2 gap-3">
                                    <button 
                                       onClick={() => publishCmd('set_relay', { val: true })} 
                                       className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${status.relay ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.25)]' : 'bg-white/10 text-slate-300 border-white/5 hover:bg-blue-600 hover:text-white'}`}
                                    >
                                       Start Pump
                                    </button>
                                    <button 
                                       onClick={() => publishCmd('set_relay', { val: false })} 
                                       className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border ${!status.relay ? 'bg-rose-600 text-white border-rose-500' : 'bg-white/10 text-slate-300 border-white/5 hover:bg-rose-600 hover:text-white'}`}
                                    >
                                       Stop Pump
                                    </button>
                                 </div>
                              ) : (
                                 <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl text-center">
                                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest block">
                                       Pump is Managed by Auto-Logic
                                    </span>
                                 </div>
                              )}
                           </div>
                        </div>
                        
                        <div className="border-b border-white/5 my-6" />
                        
                        {/* Tabel History Log Penyiraman */}
                        <div>
                           <div className="flex justify-between items-center mb-6">
                              <h3 className="text-[10px] md:text-[12px] font-black text-white/60 uppercase tracking-widest flex items-center gap-3">
                                 <Clock size={18} className="text-orange-500" /> History Logs
                              </h3>
                              <button 
                                 onClick={() => {
                                    const headers = ["Time", "Duration(s)", "Temp(C)"];
                                    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...wateringLogs.map(l => [new Date(l.start_time).toLocaleString(), l.duration_seconds, l.temperature])].map(e => e.join(",")).join("\n");
                                    const link = document.createElement("a"); 
                                    link.setAttribute("href", encodeURI(csvContent)); 
                                    link.setAttribute("download", "watering_logs.csv"); 
                                    link.click();
                                 }} 
                                 className="p-2.5 bg-orange-600/10 text-orange-500 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-xl"
                              >
                                 <Download size={16} />
                              </button>
                           </div>
                           <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                              {wateringLogs.length === 0 ? (
                                 <div className="text-center py-6 text-white/60 text-[10px] uppercase font-black tracking-widest">
                                    No Watering Activity Yet
                                 </div>
                              ) : (
                                 wateringLogs.map((log, i) => (
                                    <div key={i} className="p-4 bg-white/20 rounded-xl flex justify-between items-center border border-white/5 group hover:border-orange-500/30 transition-all">
                                       <div className="flex flex-col gap-1">
                                          <span className="text-[10px] font-black text-slate-100">
                                             {new Date(log.start_time).toLocaleString()}
                                          </span>
                                          <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">
                                             {log.duration_seconds}S Pulse | {log.temperature}°C Baseline
                                          </span>
                                       </div>
                                       {isTrusted && (
                                          <button 
                                             onClick={() => deleteLog(log.start_time)} 
                                             className="p-2.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 rounded-lg"
                                          >
                                             <Trash2 size={14} />
                                          </button>
                                       )}
                                    </div>
                                 ))
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Panel Kanan (Hardware Stats & User Database) */}
                  <div className={`bg-black/30 backdrop-blur-[80px] p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-none flex flex-col gap-6 justify-between ${!isTrusted ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                     <div>
                        <div className="border-b border-white/5 pb-4">
                           <h3 className="text-[10px] md:text-[12px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-3">
                              <Cpu size={18} className="text-blue-400 animate-pulse" /> Core Health & Commands
                           </h3>
                           <span className="text-[7px] font-mono text-white/60 uppercase tracking-wider block mt-1">
                              Live Hardware Telemetry Engine
                           </span>
                        </div>
                        <div className="space-y-4 mt-6">
                           <div className="bg-white/10 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                 <Clock size={14} className="text-cyan-400 animate-pulse" />
                                 <span className="text-[8px] md:text-[9px] font-black uppercase text-white/80">System Uptime</span>
                              </div>
                              <span className="text-[9px] md:text-[10px] font-mono font-black text-cyan-400 tracking-wider">
                                 {isEspOnline && hwStats.isReal ? formatUptime(hwStats.uptime) : (isEspOnline ? 'Firmware Update Needed' : 'Offline')}
                              </span>
                           </div>
                           <div className="bg-white/10 p-3.5 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                    <Thermometer size={14} className="text-orange-500" />
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-white/80">SoC Chip Temp</span>
                                 </div>
                                 <span className={`text-[9px] md:text-[10px] font-mono font-black ${isEspOnline && hwStats.isReal && hwStats.chipTemp > 65 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                                    {isEspOnline && hwStats.isReal ? `${hwStats.chipTemp.toFixed(1)}°C` : '—'}
                                 </span>
                              </div>
                              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isEspOnline && hwStats.isReal && hwStats.chipTemp > 65 ? 'bg-red-500' : isEspOnline && hwStats.isReal && hwStats.chipTemp > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                    style={{ width: `${isEspOnline && hwStats.isReal ? Math.min(100, (hwStats.chipTemp / 85) * 100) : 0}%` }} 
                                 />
                              </div>
                           </div>
                           <div className="bg-white/10 p-3.5 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                    <Cpu size={14} className="text-emerald-400" />
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-white/80">RAM Heap Load</span>
                                 </div>
                                 <span className="text-[9px] md:text-[10px] font-mono font-black text-emerald-400">
                                    {isEspOnline && hwStats.isReal ? `${hwStats.ramPercent}% (${Math.round(hwStats.freeHeap / 1024)}KB Free)` : '—'}
                                 </span>
                              </div>
                              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${isEspOnline && hwStats.isReal ? hwStats.ramPercent : 0}%` }} 
                                 />
                              </div>
                           </div>
                           <div className="bg-white/10 p-3.5 rounded-2xl border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-2">
                                    <Wifi size={14} className={isEspOnline && hwStats.isReal && hwStats.wifiRssi > -65 ? 'text-green-400 animate-pulse' : 'text-yellow-400'} />
                                    <span className="text-[8px] md:text-[9px] font-black uppercase text-white/80">RSSI Connection</span>
                                 </div>
                                 <span className="text-[9px] md:text-[10px] font-mono font-black text-slate-300">
                                    {isEspOnline && hwStats.isReal ? `${hwStats.wifiRssi} dBm (${hwStats.wifiRssi > -60 ? 'Strong' : hwStats.wifiRssi > -75 ? 'Good' : 'Weak'})` : '—'}
                                 </span>
                              </div>
                              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isEspOnline && hwStats.isReal && hwStats.wifiRssi > -60 ? 'bg-green-500' : isEspOnline && hwStats.isReal && hwStats.wifiRssi > -75 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                    style={{ width: `${isEspOnline && hwStats.isReal ? Math.max(10, Math.min(100, 2 * (hwStats.wifiRssi + 100))) : 0}%` }} 
                                 />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl text-center flex flex-col justify-center">
                                 <span className="text-[6px] font-mono text-white/60 uppercase tracking-widest block">CPU Clock</span>
                                 <span className="text-[9px] font-black text-slate-300 mt-0.5">
                                    {isEspOnline && hwStats.isReal ? `${hwStats.cpuFreq} MHz` : '—'}
                                 </span>
                              </div>
                              <div className="p-2 bg-slate-950/40 border border-white/5 rounded-xl text-center flex flex-col justify-center">
                                 <span className="text-[6px] font-mono text-white/60 uppercase tracking-widest block">Flash Size</span>
                                 <span className="text-[9px] font-black text-slate-300 mt-0.5">
                                    {isEspOnline && hwStats.isReal ? `${Math.round(hwStats.flashSize / (1024 * 1024))} MB` : '—'}
                                 </span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="border-t border-white/5 pt-4 mt-6">
                           <h4 className="text-[8px] md:text-[9px] font-black text-white/80 uppercase tracking-[0.2em] mb-4">
                              Diagnostics Test Interface
                           </h4>
                           <div className="grid grid-cols-2 gap-2">
                              {['pump', 'buzzer', 'lcd', 'sensor', 'next', 'prev', 'plus', 'minus'].map((c) => (
                                 <button 
                                    key={c} 
                                    onClick={async () => {
                                       if (c === 'pump') isTestingPump.current = true;
                                       setTestStatus(prev => ({ ...prev, [c]: 'RUNNING' }));
                                       
                                       let cmdName = c;
                                       if (c === 'pump' || c === 'buzzer' || c === 'lcd') cmdName = `test_${c}`;
                                       else if (c === 'next' || c === 'prev' || c === 'plus' || c === 'minus') cmdName = `btn_${c}`;
                                       else if (c === 'previous') cmdName = `btn_prev`;
                                       
                                       publishCmd(cmdName);
                                       
                                       setTimeout(() => setTestStatus(prev => ({ ...prev, [c]: 'SUCCESS' })), 500);
                                       if (c === 'pump') setTimeout(() => { isTestingPump.current = false; }, 1200);
                                    }}
                                    className={`relative py-3.5 md:py-4 px-4 bg-white/10 border rounded-xl flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all text-slate-300 hover:text-white ${testStatus[c] === 'RUNNING' ? 'border-amber-500/40 bg-amber-500/5 animate-pulse text-amber-400' : testStatus[c] === 'SUCCESS' ? 'border-green-500/40 bg-green-500/5 text-green-400' : testStatus[c] === 'FAILED' || testStatus[c] === 'ERROR' ? 'border-rose-500/40 bg-rose-500/5 text-rose-400' : 'border-white/5 hover:border-white/20'}`}
                                 >
                                    {c === 'pump' && <Zap size={12} className="shrink-0 text-amber-400" />}
                                    {c === 'buzzer' && <Volume2 size={12} className="shrink-0 text-indigo-400" />}
                                    {c === 'lcd' && <Tv size={12} className="shrink-0 text-cyan-400" />}
                                    {c === 'sensor' && <Radio size={12} className="shrink-0 text-emerald-400" />}
                                    {c === 'next' && <ChevronRight size={12} className="shrink-0 text-white/80" />}
                                    {c === 'prev' && <ChevronLeft size={12} className="shrink-0 text-white/80" />}
                                    {c === 'plus' && <Plus size={12} className="shrink-0 text-sky-400" />}
                                    {c === 'minus' && <Minus size={12} className="shrink-0 text-rose-400" />}
                                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider">{c}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                     
                  </div>
               </div>
            </div>

            {/* ----------------- MODAL LOGIN ----------------- */}
            <AnimatePresence>
               {showLogin && (
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                     className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6"
                  >
                     <motion.div 
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }} 
                        className="bg-[#1e293b] p-8 md:p-12 rounded-[3.5rem] md:rounded-[4rem] w-full max-w-sm border border-white/20 shadow-2xl relative animate-fadeIn"
                     >
                        <button 
                           onClick={() => { setShowLogin(false); setSecretKey(''); }} 
                           className="absolute top-8 right-8 text-white/60 hover:text-white"
                        >
                           <X />
                        </button>
                        
                        <form 
                           onSubmit={(e) => {
                              e.preventDefault();
                              if (loginTrustedDevice(secretKey)) {
                                 setIsTrusted(true);
                                 setShowLogin(false);
                                 setSecretKey('');
                              } else {
                                 alert("Secret PIN Salah! Akses Ditolak.");
                              }
                           }} 
                           className="space-y-4 text-center mt-4"
                        >
                           <h2 className="text-xl md:text-2xl font-black uppercase text-white mb-8 tracking-tighter italic">
                              ADIWIRA <span className="text-orange-500">GATEWAY</span>
                           </h2>
                           
                           <input 
                              type="password" 
                              placeholder="Secret PIN" 
                              className="w-full bg-white/10 p-4 rounded-2xl text-center font-bold text-white outline-none border border-white/20 shadow-inner text-sm focus:border-orange-500" 
                              value={secretKey} 
                              onChange={e => setSecretKey(e.target.value)} 
                              required 
                           />
                           
                           <button className="w-full py-4 mt-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl shadow-xl uppercase tracking-[0.2em] transition-all hover:scale-[1.02]">
                              Authorize
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