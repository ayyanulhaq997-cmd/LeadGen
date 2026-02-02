
import React from 'react';
import { Meeting } from '../types.ts';

interface MeetingSheetProps {
  meetings: Meeting[];
}

export const MeetingSheet: React.FC<MeetingSheetProps> = ({ meetings }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom duration-500">
      <header className="mb-10">
        <h2 className="text-4xl font-black mb-2 italic tracking-tight">GLOBAL_SCHEDULE</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">All projects closed by Agent One</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetings.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-900/50 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-600">
            <i className="fa-solid fa-calendar-xmark text-4xl mb-4"></i>
            <p className="text-sm font-black uppercase tracking-widest">No meetings booked yet</p>
            <p className="text-xs font-medium mt-2">Launch a campaign to start autonomous scheduling</p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <div key={meeting.id} className="bg-slate-900 border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                 <i className="fa-solid fa-calendar-check text-4xl text-blue-500"></i>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                 <span className="px-3 py-1 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                   {meeting.type}
                 </span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    ID: {meeting.id}
                 </span>
              </div>

              <h3 className="text-xl font-black text-white mb-4 leading-tight">{meeting.businessName}</h3>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <i className="fa-solid fa-clock"></i>
                   </div>
                   <div>
                      <div className="text-xs font-black text-white">{meeting.time}</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Scheduled Slot</div>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                      <i className="fa-solid fa-calendar-day"></i>
                   </div>
                   <div>
                      <div className="text-xs font-black text-white">{meeting.date}</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Confirmed Date</div>
                   </div>
                </div>
              </div>

              <button className="w-full mt-8 py-4 bg-slate-800 hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3">
                 <i className="fa-solid fa-video"></i> Join Discovery Call
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
