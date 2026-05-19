const fs = require('fs');
const filePath = 'c:\\Users\\aryat\\OneDrive\\Documents\\ITSB\\Project AI\\IoT_AdiwiraCaraka\\Caraka-Dashboard\\src\\App.jsx';

function run() {
   try {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/\r\n/g, '\n');

      // Let's locate the Primary Environmental Telemetry Cards wrapper
      const oldWrapper = '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">';
      const newWrapper = '<div className="grid grid-cols-3 gap-3 md:gap-10">';

      if (!content.includes(oldWrapper)) {
         console.log('Error: Could not locate the primary cards wrapper element.');
         return;
      }

      content = content.replace(oldWrapper, newWrapper);

      // Now let's extract the three cards to apply precision styling updates.
      // We will target Card 1, Card 2, and Card 3.
      // Let's replace the whole blocks with highly polished, ultra-responsive widgets!

      // Let's view the exact old block of the 3 cards.
      const startCardMarker = '{/* CARD 1: THERMAL STATUS (TEMPERATURE) */}';
      const endCardMarker = '{/* ROW 3: GRAPHS */}';
      
      const startIdx = content.indexOf(startCardMarker);
      const endIdx = content.indexOf(endCardMarker);

      if (startIdx === -1 || endIdx === -1) {
         console.log('Error: Could not locate cards markers.');
         return;
      }

      const oldCardsBlock = content.substring(startIdx, endIdx);

      const newCardsBlock = `{/* CARD 1: THERMAL STATUS (TEMPERATURE) */}
                   <div className={\`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/60 backdrop-blur-2xl border border-orange-500/30 shadow-[0_0_35px_rgba(249,115,22,0.12)] transition-all hover:scale-[1.03] group \${status.temp > status.tempMax || status.temp < status.tempMin ? 'border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.2)]' : ''}\`}>
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
                            animate={{ width: \`\${Math.max(0, Math.min(100, (status.temp / 50) * 100))}%\` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 rounded-full"
                         />
                      </div>
                   </div>

                   {/* CARD 2: HUMID LEVEL (HUMIDITY) */}
                   <div className={\`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/60 backdrop-blur-2xl border border-blue-500/30 shadow-[0_0_35px_rgba(59,130,246,0.12)] transition-all hover:scale-[1.03] group \${status.hum < status.humMin ? 'border-yellow-500/50 shadow-[0_0_35px_rgba(234,179,8,0.2)]' : ''}\`}>
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
                            animate={{ width: \`\${Math.max(0, Math.min(100, status.hum))}%\` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full"
                         />
                      </div>
                   </div>

                   {/* CARD 3: WATER TANK (LIQUID WAVE ACCENT) */}
                   <div className={\`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] p-3 md:p-8 bg-[#1e293b]/60 backdrop-blur-2xl border transition-all hover:scale-[1.03] group \${status.water ? 'border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)]' : 'border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.25)] animate-pulse'}\`}>
                      
                      {/* Dynamic wave container visualizer inside card background */}
                      {status.water ? (
                         <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent blur-[10px] pointer-events-none rounded-b-[2.5rem] liquid-wave" />
                      ) : (
                         <div className="absolute inset-0 bg-red-500/5 pointer-events-none rounded-b-[2.5rem]" />
                      )}

                      <div className="flex justify-between items-start mb-2 md:mb-6 relative z-10">
                         <div className={\`p-1.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner \${status.water ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'bg-rose-500/15 border border-rose-500/30 text-rose-500 animate-spin-slow'}\`}>
                            <Waves size={14} className="md:w-8 md:h-8" />
                         </div>
                         <span className={\`hidden sm:inline-block text-[7px] md:text-[9px] font-black uppercase px-3 py-1 rounded-full border \${status.water ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}\`}>
                            {status.water ? 'TANK HEALTHY' : 'CRITICAL ALERT'}
                         </span>
                      </div>

                      <p className="text-[7px] md:text-[11px] font-black uppercase text-slate-400 tracking-wider md:tracking-[0.25em] mb-1 relative z-10">
                         <span className="block md:hidden">Water</span>
                         <span className="hidden md:block">Water Tank</span>
                      </p>
                      <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
                         <span className={\`text-xs sm:text-lg md:text-5xl font-black italic uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] \${status.water ? 'text-cyan-400' : 'text-rose-500'}\`}>
                            {status.water ? 'OPTIMAL' : 'EMPTY'}
                         </span>
                      </div>

                      {/* Animated wave visual progress */}
                      <div className="w-full h-1 md:h-2 bg-slate-950/80 rounded-full overflow-hidden mt-3 md:mt-6 border border-white/5 relative">
                         <motion.div 
                            initial={{ width: '0%' }}
                            animate={{ width: status.water ? '100%' : '5%' }}
                            transition={{ duration: 0.8 }}
                            className={\`h-full rounded-full \${status.water ? 'bg-gradient-to-r from-cyan-600 to-blue-500' : 'bg-rose-600'}\`}
                         />
                      </div>
                   </div>
                </div>\n\n               `;

      content = content.replace(oldCardsBlock, newCardsBlock);
      fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
      console.log('Success: Replaced old vertical stack environmental cards with highly optimized, side-by-side responsive widgets!');
   } catch (e) {
      console.error(e);
   }
}

run();
