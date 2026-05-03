"use client";

import { motion } from 'framer-motion';
import { ChevronRight, Plus, Download, Info, Edit2, X, FileText } from 'lucide-react';
import { Appointment, Room, StaffMember } from '@/lib/store';

interface CustomerTabRandevuProps {
    appts: Appointment[];
    rooms: Room[];
    staffMembers: StaffMember[];
    statusLabels: any;
    can: (p: string) => boolean;
    updateAppointmentStatus: (id: string, status: any) => void;
    onAddAppointment: () => void;
}

export function CustomerTabRandevu({ 
    appts, 
    rooms, 
    staffMembers, 
    statusLabels, 
    can, 
    updateAppointmentStatus, 
    onAddAppointment 
}: CustomerTabRandevuProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                     <h3 className="text-xl font-black italic tracking-tighter uppercase">Randevular</h3>
                     <div className="relative group">
                         <button className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                             İşlemler <ChevronRight className="w-4 h-4 rotate-90 group-focus-within:-rotate-90 transition-transform" />
                         </button>
                         <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all z-[100] overflow-hidden transform origin-top-right scale-95 group-focus-within:scale-100 p-2">
                             <button 
                                onClick={onAddAppointment}
                                className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-3"><Plus className="w-4 h-4" /> Yeni Randevu</button>
                             <div className="my-1 border-t border-gray-50"></div>
                             <button className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><Download className="w-4 h-4" /> Çıktı Al</button>
                         </div>
                     </div>
                 </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#FBFCFF] text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Tarih</th>
                                <th className="px-8 py-5">Saat</th>
                                <th className="px-8 py-5">Personel</th>
                                <th className="px-8 py-5">Oda</th>
                                <th className="px-8 py-5">Hizmetler</th>
                                <th className="px-8 py-5">Durum</th>
                                <th className="px-8 py-5 text-center">İşlem Kartı</th>
                                <th className="px-8 py-5 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {appts.map((a: Appointment) => {
                                const s = statusLabels[a.status] ?? { label: a.status, cls: 'bg-gray-50 text-gray-400', icon: Info };
                                return (
                                    <tr key={a.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-gray-600">{new Date(a.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</p>
                                        </td>
                                        <td className="px-8 py-5 font-black text-gray-900">{a.time}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-gray-500 uppercase">{a.staffName}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-indigo-600 italic">
                                            {rooms.find((r: Room) => r.id === a.roomId)?.name || 'Atanmamış'}
                                        </td>
                                        <td className="px-8 py-5 font-black text-gray-700 italic">{a.service}</td>
                                        <td className="px-8 py-5">
                                            <select 
                                                disabled={!can('update_appointment_status')}
                                                value={a.status}
                                                onChange={(e) => updateAppointmentStatus(a.id, e.target.value as any)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 outline-none appearance-none cursor-pointer tracking-widest disabled:opacity-50 transition-all ${s.cls}`}
                                            >
                                                {Object.entries(statusLabels).map(([k, v]: [string, any]) => <option key={k} value={k}>{v.label}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    disabled={!can('delete_appointment')}
                                                    onClick={() => updateAppointmentStatus(a.id, 'cancelled')}
                                                    title="Randevuyu İptal Et"
                                                    className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-200 disabled:opacity-30 disabled:grayscale"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div 
                                                    title={a.note ? `Randevu Notu: ${a.note}` : 'Not eklenmemiş'}
                                                    className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white cursor-help hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100">
                                                <button 
                                                    disabled={!can('update_appointment')}
                                                    className="p-2 bg-white border border-gray-100 rounded-lg hover:border-indigo-600 transition-all disabled:opacity-30"
                                                >
                                                    <Edit2 className="w-4 h-4 text-gray-400" />
                                                </button>
                                                <button 
                                                    disabled={!can('manage_appointments')}
                                                    className="p-2 bg-white border border-gray-100 rounded-lg disabled:opacity-30"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-gray-300 rotate-90" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
