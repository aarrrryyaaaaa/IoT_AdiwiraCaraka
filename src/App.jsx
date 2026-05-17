import * as React from 'react';
import {
   Thermometer, Droplets, Waves, Activity, Power, Cpu, Wifi, LogIn, LogOut, User, Camera, BarChart3, ShieldCheck, X, Clock, Settings, Save, Bell, RefreshCw, Users, Trash2, Zap, AlertTriangle, ChevronLeft, ChevronRight, Plus, Minus, Download, MousePointer2, Globe
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

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

// Preloader Component with rotating rings and dynamic boot text
function Preloader({ onComplete }) {
   const [percent, setPercent] = React.useState(0);
   const [statusText, setStatusText] = React.useState('SYSTEM BOOTING...');

   React.useEffect(() => {
      const interval = setInterval(() => {
         setPercent(prev => {
            if (prev >= 100) {
               clearInterval(interval);
               setTimeout(onComplete, 800); // 800ms fade-out transition
               return 100;
            }

            // Dynamic simulated boot messages
            if (prev === 25) setStatusText('ESTABLISHING SUPABASE SECURE LINK...');
            if (prev === 55) setStatusText('SYNCING DATABASE PROFILE TABLES...');
            if (prev === 75) setStatusText('PINGING ESP32 AT LOCAL NODE 192.168.100.15...');
            if (prev === 92) setStatusText('SECURITY HANDSHAKE OK. LAUNCHING...');

            return prev + 1;
         });
      }, 20); // Dynamic speedy load (approx 2 seconds total)
      return () => clearInterval(interval);
   }, []);

   return (
      <motion.div
         initial={{ opacity: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         transition={{ duration: 0.6, ease: "easeInOut" }}
         className="fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center font-sans select-none"
      >
         {/* Background Subtle Neon Effects */}
         <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full" />
         <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-orange-500/10 blur-[100px] rounded-full" />

         {/* Outer container */}
         <div className="relative flex flex-col items-center justify-center z-10">

            {/* Dual Counter-Rotating Holographic Rings */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-10">
               {/* Outer Ring - Orange */}
               <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className={`absolute inset-0 rounded-full border-[3px] border-t-transparent ${percent === 100 ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]'}`}
               />
               {/* Inner Ring - Blue */}
               <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className={`absolute inset-4 rounded-full border-[2px] border-b-transparent ${percent === 100 ? 'border-green-400' : 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'}`}
               />
               {/* Glowing Core Percentage */}
               <span className="absolute text-3xl font-black italic tracking-wider bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
                  {percent}%
               </span>
            </div>

            {/* Centered Logo / Title with blue-orange gradient */}
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-center bg-gradient-to-r from-blue-400 via-purple-500 to-orange-500 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(249,115,22,0.25)] select-none">
               ADIWIRA CARAKA
            </h1>
            <div className="h-[2px] w-24 bg-gradient-to-r from-blue-500 to-orange-500 mt-4 rounded-full shadow-[0_0_10px_orange]" />

            {/* Boot sequence logs */}
            <p className="mt-8 text-[9px] md:text-[11px] font-mono tracking-[0.3em] text-slate-500 uppercase h-4 animate-pulse">
               {statusText}
            </p>
         </div>
      </motion.div>
   );
}

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
   const [showLogin, setShowLogin] = React.useState(false);
   const [authMode, setAuthMode] = React.useState('login');
   const [role, setRole] = React.useState('anggota');
   const [secretKey, setSecretKey] = React.useState('');
   const [testStatus, setTestStatus] = React.useState({});
   const [email, setEmail] = React.useState('');
   const [password, setPassword] = React.useState('');

   React.useEffect(() => {
      const saved = localStorage.getItem('caraka_user');
      if (saved) {
         const p = JSON.parse(saved); setUser(p); setProfile(p);
         if (p.role === 'admin') fetchAllUsers();
      }
      fetchLogs();
      const interval = setInterval(async () => {
         try {
            const res = await fetch(`http://${espIp}/api/status`);
            if (res.ok) {
               const data = await res.json();
               setStatus(prev => ({ ...prev, ...data }));
               setIsOnline(true);
               setHistory(prev => ({
                  labels: [...prev.labels, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })].slice(-30),
                  temp: [...prev.temp, data.temp].slice(-30),
                  hum: [...prev.hum, data.hum].slice(-30)
               }));
            } else { setIsOnline(false); }
         } catch (e) { setIsOnline(false); }
      }, 1500);
      return () => clearInterval(interval);
   }, [espIp]);

   const fetchLogs = async () => {
      const { data } = await supabase.from('watering_logs').select('*').order('start_time', { ascending: false }).limit(20);
      setWateringLogs(data || []);
   };

   const fetchAllUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      setAllUsers(data || []);
   };

   const testComp = async (c) => {
      setTestStatus(p => ({ ...p, [c]: 'testing' }));
      try {
         const res = await fetch(`http://${espIp}/api/test?comp=${c}`);
         setTestStatus(p => ({ ...p, [c]: res.ok ? 'success' : 'error' }));
         setTimeout(() => setTestStatus(p => ({ ...p, [c]: 'idle' })), 2000);
      } catch (e) {
         setTestStatus(p => ({ ...p, [c]: 'error' }));
         setTimeout(() => setTestStatus(p => ({ ...p, [c]: 'idle' })), 2000);
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
               <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#1e293b]/40 backdrop-blur-3xl p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-6 md:gap-10">
                     <div className="relative group shrink-0">
                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-[2rem] md:rounded-[3.5rem] bg-slate-900/80 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-all group-hover:scale-105">
                           {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-700" />}
                        </div>
                        {user && (
                           <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-[2rem] cursor-pointer transition-all">
                              <Camera size={28} />
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
                        )}
                     </div>
                     <div>
                        <h1 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter">ADIWIRA <span className="text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">CARAKA</span></h1>
                        <div className="flex items-center gap-3 mt-3">
                           <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-white/5">
                              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                              <span className="text-[8px] md:text-[11px] font-black uppercase text-slate-400">{isOnline ? 'System Online' : 'Core Offline'}</span>
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
                  </div>

                  <AnimatePresence>
                     {showIpEdit && profile.role === 'admin' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex gap-2">
                           <input type="text" className="bg-slate-900/80 border border-white/10 rounded-2xl px-6 py-3 text-[12px] font-mono text-white outline-none focus:border-blue-500" value={espIp} onChange={e => { setEspIp(e.target.value); localStorage.setItem('esp_ip', e.target.value); }} />
                           <button onClick={() => setShowIpEdit(false)} className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl hover:scale-110 active:scale-90 transition-all"><Save size={20} /></button>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <button onClick={() => user ? (localStorage.removeItem('caraka_user'), window.location.reload()) : setShowLogin(true)} className="px-10 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl md:rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all">
                     {user ? 'LOGOUT' : 'LOGIN'}
                  </button>
               </header>

               {/* ROW 2: STATUS CARDS */}
               <div className="grid grid-cols-3 gap-3 md:gap-10">
                  <MetricCard label="Thermal Status" value={status.temp.toFixed(1)} unit="°C" icon={<Thermometer className="text-orange-500" />} threshold={`${status.tempMin}-${status.tempMax}°C`} color="orange" />
                  <MetricCard label="Humid Level" value={status.hum.toFixed(0)} unit="%" icon={<Droplets className="text-blue-500" />} threshold={`${status.humMin}%+`} color="blue" />
                  <MetricCard label="Water Tank" value={status.water ? "OPTIMAL" : "EMPTY"} unit="" icon={<Waves className="text-blue-400" />} />
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

               {/* CONTROLS & DIAGNOSTICS - COMPACT VERSION */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start">
                  <div className={`lg:col-span-5 bg-[#1e293b]/40 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 shadow-2xl ${profile.role === 'pengunjung' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                     <h3 className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-6 md:mb-8"><Settings size={18} className="text-orange-500" /> Parameters</h3>
                     <form onSubmit={async (e) => {
                        e.preventDefault();
                        const p = new URLSearchParams({ tempMax: status.tempMax, tempMin: status.tempMin, humMin: status.humMin });
                        await fetch(`http://${espIp}/api/settings?${p.toString()}`);
                        alert("Command Synchronized!");
                     }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                           {['tempMax', 'tempMin', 'humMin'].map(k => (
                              <div key={k} className="space-y-2">
                                 <label className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">{k}</label>
                                 <input type="number" className="w-full bg-slate-900/80 p-4 rounded-xl text-white font-bold text-sm border border-white/5 focus:border-orange-500 outline-none" value={status[k]} onChange={e => setStatus({ ...status, [k]: e.target.value })} />
                              </div>
                           ))}
                        </div>
                        <div className="flex gap-2">
                           {['prev', 'minus', 'plus', 'next'].map(cmd => (
                              <button key={cmd} type="button" onClick={() => testComp(cmd)} className="flex-1 py-4 bg-slate-900/60 border border-white/5 rounded-xl hover:bg-orange-600 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg">{cmd}</button>
                           ))}
                        </div>
                        <button type="submit" className="w-full py-5 bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Synchronize</button>
                     </form>
                  </div>

                  <div className={`lg:col-span-7 bg-[#1e293b]/40 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 shadow-2xl h-full ${profile.role !== 'admin' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                     <h3 className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-6 md:mb-8"><Cpu size={18} className="text-blue-500" /> Diagnostics</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {['pump', 'buzzer', 'lcd', 'sensor'].map(c => (
                           <DiagnosticBtn key={c} label={c} icon={<Zap size={24} />} onClick={() => testComp(c)} status={testStatus[c] || 'idle'} />
                        ))}
                        {['next', 'prev', 'plus', 'minus'].map(c => (
                           <DiagnosticBtn key={c} label={`BTN ${c}`} icon={<MousePointer2 size={24} />} onClick={() => testComp(c)} status={testStatus[c] || 'idle'} color="blue" />
                        ))}
                     </div>
                  </div>
               </div>

               {/* LOGS & USERS */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 pb-20">
                  <div className="lg:col-span-6 bg-[#1e293b]/40 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-[10px] md:text-[13px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><Clock size={20} className="text-blue-500" /> History Logs</h3>
                        <button onClick={() => {
                           const headers = ["Time", "Duration(s)", "Temp(C)"];
                           const csvContent = "data:text/csv;charset=utf-8," + [headers, ...wateringLogs.map(l => [new Date(l.start_time).toLocaleString(), l.duration_seconds, l.temperature])].map(e => e.join(",")).join("\n");
                           const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "watering_logs.csv"); link.click();
                        }} className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl"><Download size={20} /></button>
                     </div>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {wateringLogs.map((log, i) => (
                           <div key={i} className="p-6 bg-slate-900/40 rounded-[2rem] flex justify-between items-center border border-white/5 group hover:border-orange-500/30 transition-all">
                              <div className="flex flex-col gap-2">
                                 <span className="text-[11px] font-black text-slate-100">{new Date(log.start_time).toLocaleString()}</span>
                                 <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{log.duration_seconds}S Pulse | {log.temperature}°C Baseline</span>
                              </div>
                              {profile.role === 'admin' && (
                                 <button onClick={() => deleteLog(log.id)} className="p-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 rounded-2xl"><Trash2 size={18} /></button>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  {profile.role === 'admin' && (
                     <div className="lg:col-span-6 bg-[#1e293b]/40 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                        <h3 className="text-[10px] md:text-[13px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 mb-8"><Users size={20} className="text-blue-500" /> User Database</h3>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left text-[11px]">
                              <tbody>
                                 {allUsers.map((u, i) => (
                                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/10 transition-all group">
                                       <td className="py-4 px-4 font-bold text-slate-200">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
                                                {u.avatar_url ? (
                                                   <img src={u.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                   <User size={14} className="text-slate-600" />
                                                )}
                                             </div>
                                             <span className="truncate max-w-[150px] md:max-w-none">{u.email}</span>
                                          </div>
                                       </td>
                                       <td className="py-4 px-4 uppercase font-black text-orange-500 text-center tracking-widest">{u.role}</td>
                                       <td className="py-4 px-4 text-right">
                                          <button onClick={() => deleteUser(u.id)} className="p-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20 rounded-2xl"><Trash2 size={18} /></button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* LOGIN & REGISTER MODAL */}
            <AnimatePresence>
               {showLogin && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
                     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1e293b] p-8 md:p-12 rounded-[3.5rem] md:rounded-[4rem] w-full max-w-sm border border-white/10 shadow-2xl relative">
                        <button onClick={() => { setShowLogin(false); setAuthMode('login'); }} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X /></button>

                        {/* Auth Tabs */}
                        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 mb-8">
                           <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${authMode === 'login' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                              Sign In
                           </button>
                           <button onClick={() => setAuthMode('register')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${authMode === 'register' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                              Register
                           </button>
                        </div>

                        <form onSubmit={async (e) => {
                           e.preventDefault();
                           if (authMode === 'login') {
                              const { data } = await supabase.from('profiles').select('*').eq('email', email).eq('password', password).single();
                              if (data) {
                                 setUser(data);
                                 setProfile(data);
                                 localStorage.setItem('caraka_user', JSON.stringify(data));
                                 setShowLogin(false);
                                 if (data.role === 'admin') fetchAllUsers();
                              }
                              else alert("Authentication Denied. Periksa Email & Password Anda.");
                           } else {
                              // Register mode
                              const expectedKey = role === 'admin' ? import.meta.env.VITE_KEY_ADMIN : import.meta.env.VITE_KEY_ANGGOTA;
                              if (secretKey !== expectedKey) {
                                 alert("Kunci Rahasia yang Anda masukkan salah!");
                                 return;
                              }
                              // Check if email already registered
                              const { data: existing } = await supabase.from('profiles').select('email').eq('email', email).maybeSingle();
                              if (existing) {
                                 alert("Email ini sudah terdaftar!");
                                 return;
                              }
                              // Register new user
                              const { error } = await supabase.from('profiles').insert([
                                 { email, password, role, avatar_url: null }
                              ]);
                              if (error) {
                                 alert("Registrasi Gagal: " + error.message);
                              } else {
                                 alert("Registrasi Berhasil! Silakan Masuk.");
                                 setAuthMode('login');
                                 setSecretKey('');
                              }
                           }
                        }} className="space-y-4 text-center">
                           <h2 className="text-xl md:text-2xl font-black uppercase text-white mb-4 tracking-tighter italic">
                              ADIWIRA <span className="text-orange-500">{authMode === 'login' ? 'GATEWAY' : 'SIGN UP'}</span>
                           </h2>

                           <input type="email" placeholder="Email" className="w-full bg-slate-900/80 p-4 rounded-2xl text-white outline-none border border-white/10 shadow-inner text-xs" value={email} onChange={e => setEmail(e.target.value)} required />
                           <input type="password" placeholder="Password" className="w-full bg-slate-900/80 p-4 rounded-2xl text-white outline-none border border-white/10 shadow-inner text-xs" value={password} onChange={e => setPassword(e.target.value)} required />

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
                                    <input type="password" placeholder="Secret Key" className="w-full bg-slate-900/80 p-4 rounded-2xl text-white outline-none border border-white/10 shadow-inner text-xs" value={secretKey} onChange={e => setSecretKey(e.target.value)} required />
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
         </div>
      </>
   );
}