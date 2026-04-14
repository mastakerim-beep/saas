"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { 
  AlertTriangle, TrendingUp, Wallet, ShieldAlert, Receipt, 
  Award, Zap, LayoutGrid, PieChart as PieChartIcon, ArrowUpRight
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export default function FinancesPage() {
  const { appointments, payments, debts, calculateCommission, expenses, staffMembers } = useStore();

  const totalExpected = appointments.reduce((s, a) => s + (a.status === 'completed' || a.status === 'pending' ? a.price : 0), 0);
  const totalCollected = payments.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalActiveDebt = debts.filter(d => d.status === 'açık').reduce((s, d) => s + d.amount, 0);
  
  const staffCommData = staffMembers.map(st => {
    const staffAppointments = appointments.filter(a => a.staffName === st.name && a.status === 'completed');
    const totalSales = staffAppointments.reduce((s, a) => s + a.price, 0);
    const totalComm = staffAppointments.reduce((s, a) => s + calculateCommission(st.id, a.service, a.price, a.packageId), 0);
    return { name: st.name, sales: totalSales, commission: totalComm };
  }).filter(s => s.sales > 0);

  const totalCommissions = staffCommData.reduce((s, d) => s + d.commission, 0);
  const totalOtherExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalCommissions + totalOtherExpenses;
  const netProfit = totalCollected - totalExpenses;

  const suspiciousActivities: any[] = [];
  appointments.filter(a => 
      a.status === 'completed' && a.price > 0 && 
      !payments.some(p => p.appointmentId === a.id) &&
      !debts.some(d => d.appointmentId === a.id)
  ).forEach(a => {
      suspiciousActivities.push({
          type: 'Kayıtsız İşlem',
          desc: `${a.customerName} için ${a.service} randevusu tahsilat girişi yapılmadan kapatıldı.`,
          severity: 'high',
          date: a.date
      });
  });

  const chartData = useMemo(() => {
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dailyCiro = payments.filter(p => p.date === dateStr).reduce((s, p) => s + (p.totalAmount || 0), 0);
        const dailyExpense = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + (e.amount || 0), 0);
        result.push({ name: days[d.getDay()], ciro: dailyCiro, kar: Math.max(0, dailyCiro - dailyExpense) });
    }
    return result;
  }, [payments, expenses]);

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-[fadeIn_0.5s_ease] space-y-10 pb-32">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-indigo-950 dark:text-white mb-2 italic">Aura Financials</h1>
          <p className="text-indigo-500 font-bold text-sm flex items-center gap-2 opacity-60">
            <Zap className="w-4 h-4 fill-indigo-500" /> Yapay zeka destekli finansal denetim motoru aktif.
          </p>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex flex-col items-end border border-white/10">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-1">Net Nakit Akışı</p>
            <p className="text-5xl font-black tracking-tighter">₺{netProfit.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
          {[
              { label: "Beklenen Gelir", val: totalExpected, icon: Receipt, color: "text-indigo-600", bg: "bg-indigo-50", sub: "Brüt Potansiyel" },
              { label: "Net Tahsilat", val: totalCollected, icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50", sub: "Kasaya Giren" },
              { label: "Açık Hesap", val: totalActiveDebt, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", sub: "Dışarıdaki Para" },
              { label: "Personel Prim", val: totalCommissions, icon: Award, color: "text-purple-600", bg: "bg-purple-50", sub: "Tahakkuk Eden" },
          ].map((item, i) => (
              <div key={i} className="card-apple p-8 flex flex-col justify-between group">
                  <div className="flex justify-between items-start mb-8">
                      <div className={`p-4 ${item.bg} dark:bg-indigo-900/30 rounded-2xl group-hover:scale-110 transition-transform`}><item.icon className={`w-6 h-6 ${item.color} dark:text-white`} /></div>
                      <ArrowUpRight className="w-4 h-4 text-indigo-200" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={`text-3xl font-black text-indigo-950 dark:text-white tracking-tighter`}>₺{item.val.toLocaleString('tr-TR')}</div>
                  </div>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 card-apple p-10 relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-indigo-950 dark:text-white tracking-tight flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-indigo-500" /> Performans Trendi
                 </h3>
             </div>

             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorKar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#6366f1'}} dy={10} />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: '900', background: 'white'}} />
                        <Area type="monotone" dataKey="ciro" stroke="#6366f1" strokeWidth={6} fillOpacity={1} fill="url(#colorCiro)" />
                        <Area type="monotone" dataKey="kar" stroke="#a855f7" strokeWidth={6} fillOpacity={1} fill="url(#colorKar)" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-indigo-950 dark:bg-indigo-900/10 border border-white/5 rounded-[3rem] p-10 flex flex-col shadow-2xl text-white">
              <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/50"><ShieldAlert className="w-7 h-7" /></div>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] leading-tight">Fraud Engine<br/><span className="text-red-500 text-[10px]">{suspiciousActivities.length} Kritik Risk</span></h4>
              </div>
              
              <div className="space-y-4 flex-1">
                 {suspiciousActivities.slice(0, 3).map((act, i) => (
                    <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                        <p className="text-[10px] font-black text-red-500 uppercase mb-1">{act.type}</p>
                        <p className="text-xs font-bold text-indigo-100 leading-snug opacity-80">{act.desc}</p>
                    </div>
                 ))}
                 {suspiciousActivities.length === 0 && (
                     <div className="py-20 text-center opacity-30">
                         <Zap className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
                         <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-200">Sistem Temiz</p>
                     </div>
                 )}
              </div>

              <button className="w-full mt-10 py-5 bg-white/10 hover:bg-white/20 transition-all rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/10">Denetim Merkezine Git</button>
          </div>
      </div>

      <div className="card-apple p-12">
          <div className="flex justify-between items-center mb-12">
              <h3 className="text-2xl font-black text-indigo-950 dark:text-white tracking-tight flex items-center gap-3">
                  <PieChartIcon className="w-8 h-8 text-indigo-500" /> Personel Verimlilik & Prim
              </h3>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                      <tr className="text-left border-b border-indigo-50 dark:border-indigo-500/10">
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest">Uzman / Terapist</th>
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest text-center">Toplam Ciro</th>
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest text-center">Performans</th>
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest text-right text-indigo-600">Hak Ediş (Prim)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 dark:divide-indigo-500/10 font-sans">
                      {staffCommData.map((st, i) => (
                          <tr key={i} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                              <td className="py-8">
                                  <div className="flex gap-4 items-center">
                                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">{st.name[0]}</div>
                                      <div>
                                        <p className="font-black text-indigo-950 dark:text-white leading-none mb-1">{st.name}</p>
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-tight">Kıdemli Uzman</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="py-8 text-center font-bold text-indigo-900 dark:text-indigo-200">₺{st.sales.toLocaleString('tr-TR')}</td>
                              <td className="py-8 text-center">
                                  <div className="flex items-center justify-center gap-1.5 grayscale opacity-50">
                                      {[1,2,3,4,5].map(s => <div key={s} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />)}
                                  </div>
                              </td>
                              <td className="py-8 text-right font-black text-2xl text-indigo-600 tracking-tighter">₺{st.commission.toLocaleString('tr-TR')}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
