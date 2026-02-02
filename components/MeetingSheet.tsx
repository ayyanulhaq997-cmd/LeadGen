
import React from 'react';
import { Meeting } from '../types.ts';

interface MeetingSheetProps {
  meetings: Meeting[];
}

export const MeetingSheet: React.FC<MeetingSheetProps> = ({ meetings }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-700">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black mb-2 italic tracking-tighter text-white">GLOBAL_SCHEDULE</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Autonomous Fulfillment & Meeting Ledger</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-white/5 px-6 py-2 rounded-2xl flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase">Booked Total</span>
            <span className="text-xl font-black text-blue-400">{(meetings.length * 2500).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Agenda Column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-3">
              <i className="fa-solid fa-list-check text-blue-500"></i>
              Active Agenda
            </h3>
            
            <div className="space-y-4">
              {meetings.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-700">
                  <i className="fa-solid fa-calendar-plus text-5xl mb-4 opacity-20"></i>
                  <p className="text-xs font-black uppercase tracking-widest">Awaiting Pilot Conversions...</p>
                </div>
              ) : (
                meetings.sort((a,b) => b.id.localeCompare(a.id)).map((meeting) => (
                  <div key={meeting.id} className="group flex items-center gap-6 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-white/10 group-hover:bg-blue-600 transition-colors">
                      <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-blue-100">Slot</span>
                      <span className="text-sm font-black text-white">{meeting.time.split(':')[0]}<span className="text-[10px] opacity-50 uppercase">AM</span></span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                          {meeting.type}
                        </span>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">#{meeting.id}</span>
                      </div>
                      <h4 className="font-black text-white tracking-tight">{meeting.businessName}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        <i className="fa-solid fa-phone-flip mr-2"></i> {meeting.contactPhone || 'No contact provided'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">
                         Confirmed
                       </span>
                       <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase transition-all tracking-widest">
                          Manage <i className="fa-solid fa-chevron-right ml-1"></i>
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats & Tools Column */}
        <div className="space-y-6">
           <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/30">
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-200 mb-6">Delivery Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                    <div className="text-2xl font-black">{meetings.length}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Projects</div>
                 </div>
                 <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                    <div className="text-2xl font-black">100%</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Auto-Closed</div>
                 </div>
              </div>
              <button className="w-full mt-6 py-4 bg-white text-blue-600 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-blue-50 transition-all shadow-lg">
                 Export Meeting Sheet (PDF)
              </button>
           </div>

           <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Integration Status</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Google Calendar</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SMTP Server</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Dialer</span>
                    <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
