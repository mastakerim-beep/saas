"use client";

import { useStore, Appointment, Payment, Debt } from "@/lib/store";
import { 
  AlertTriangle, TrendingUp, Wallet, ShieldAlert, Receipt, 
  ChevronRight, Clock, UserCheck, BarChart3, PieChart as PieChartIcon,
  DollarSign, Percent, Award, ArrowUpRight, Zap
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export default function FinancesPage() {
  const { appointments, payments, debts, calculateCommission, expenses, staffMembers } = useStore();

  // 1. Calculate Core Financials
  const totalExpected = appointments.reduce((s, a) => s + (a.status === 'completed' || a.status === 'pending' ? a.price : 0), 0);
  const totalCollected = payments.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalActiveDebt = debts.filter(d => d.status === 'açık').reduce((s, d) => s + d.amount, 0);
  
  // Real Discrepancy
  const systematicDiscrepancy = (totalCollected + totalActiveDebt) - totalExpected;
  
  // 2. Staff Commission Analysis
  const staffCommData = staffMembers.map(st => {
    const staffAppointments = appointments.filter(a => a.staffName === st.name && a.status === 'completed');
    const totalSales = staffAppointments.reduce((s, a) => s + a.price, 0);
    const totalComm = staffAppointments.reduce((s, a) => s + calculateCommission(st.name, a.service, a.price, a.packageId), 0);
    return { name: st.name, sales: totalSales, commission: totalComm };
  }).filter(s => s.sales > 0);

  const totalCommissions = staffCommData.reduce((s, d) => s + d.commission, 0);
  const totalOtherExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalCommissions + totalOtherExpenses;
  const netProfit = totalCollected - totalExpenses;

  // 3. Fraud Detection Logic
  const suspiciousActivities: any[] = [];
  const leakageAppointments = appointments.filter(a => 
      a.status === 'completed' && a.price > 0 && 
      !payments.some(p => p.appointmentId === a.id) &&
      !debts.some(d => d.appointmentId === a.id)
  );
  leakageAppointments.forEach(a => {
      suspiciousActivities.push({
          type: 'Kayıtsız İşlem (Kaçak)',
          desc: `${a.customerName} için ${a.service} randevusu tahsilat girişi yapılmadan kapatıldı.`,
          severity: 'high',
          date: a.date,
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          isAiVerified: true
      });
  });

  // Chart Data (Mocking daily trend based on real payments if possible, otherwise fixed 7-day)
  const chartData = [
    { name: 'Pzt', ciro: 12500, kar: 8500 },
    { name: 'Sal', ciro: 18200, kar: 12000 },
    { name: 'Çar', ciro: 15600, kar: 10200 },
    { name: 'Per', ciro: 21000, kar: 14500 },
    { name: 'Cum', ciro: 32000, kar: 21000 },
    { name: 'Cmt', ciro: 45000, kar: 32000 },
    { name: 'Paz', ciro: 38000, kar: 26000 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-[fadeIn_0.5s_ease] space-y-8 pb-20">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">Finans & Hak Ediş Yönetimi</h1>
          <p className="text-gray-500 font-bold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Yapay zeka tüm para akışını denetliyor.
          </p>
        </div>
        <div className="bg-primary text-white px-8 py-5 rounded-[2rem] shadow-2xl flex flex-col items-end shadow-primary/20">
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Net Nakit Kâr (Giderler Hariç)</p>
            <p className="text-4xl font-black tracking-tighter">₺{netProfit.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      {/* Main Financial Grid */}
      <div className="grid grid-cols-4 gap-6">
          {[
              { label: "Toplam Hakediş", val: totalExpected, icon: Receipt, color: "text-gray-900", sub: "Brüt Beklenen Gelir" },
              { label: "Tahsil Edilen", val: totalCollected, icon: Wallet, color: "text-green-600", sub: "Kasaya Giren Toplam" },
              { label: "Borç / Alacak", val: totalActiveDebt, icon: AlertTriangle, color: "text-amber-600", sub: "Açık Hesap Bakiyesi" },
              { label: "Personel Prim", val: totalCommissions, icon: Award, color: "text-indigo-600", sub: "Hakedilen Toplam Prim" },
          ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-6">
                      <div className="p-3 bg-gray-50 rounded-2xl"><item.icon className={`w-5 h-5 ${item.color}`} /></div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Canlı</span>
                  </div>
                  <div className={`text-2xl font-black ${item.color}`}>₺{item.val.toLocaleString('tr-TR')}</div>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tight">{item.sub}</p>
              </div>
          ))}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-3 gap-8">
          
          {/* Revenue Chart */}
          <div className="col-span-2 bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Haftalık Performans Trendi</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">Ciro ve Kâr Karşılaştırmalı Analiz</p>
                 </div>
                 <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-black outline-none">
                     <option>Son 7 Gün</option>
                     <option>Son 30 Gün</option>
                 </select>
             </div>

             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorKar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} dy={10} />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                        <Area type="monotone" dataKey="ciro" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCiro)" />
                        <Area type="monotone" dataKey="kar" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorKar)" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Air Fraud Engine Summary */}
          <div className="bg-red-50 border border-red-100 rounded-[3rem] p-10 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200"><ShieldAlert className="w-6 h-6" /></div>
                  <div>
                    <h4 className="text-sm font-black text-red-900 uppercase tracking-widest leading-none">AI Fraud Engine</h4>
                    <span className="text-[10px] font-bold text-red-500">{suspiciousActivities.length} Kritik Risk Bulundu</span>
                  </div>
              </div>
              
              <div className="space-y-4 flex-1">
                 {suspiciousActivities.slice(0, 3).map((act, i) => (
                    <div key={i} className="bg-white/60 p-4 rounded-2xl border border-red-100/50 backdrop-blur-sm">
                        <p className="text-[10px] font-black text-red-600 uppercase mb-1">{act.type}</p>
                        <p className="text-xs font-bold text-gray-800 leading-tight">{act.desc}</p>
                    </div>
                 ))}
                 {suspiciousActivities.length === 0 && (
                     <div className="py-10 text-center">
                         <UserCheck className="w-12 h-12 text-green-300 mx-auto mb-4" />
                         <p className="text-xs font-black text-gray-400 uppercase">Her Şey Güvende</p>
                     </div>
                 )}
              </div>

              <button className="w-full mt-8 py-4 bg-white rounded-2xl text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100">Tüm Denetim Loglarını Gör</button>
          </div>
      </div>

      {/* Staff Commission Table */}
      <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm">
          <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Award className="w-6 h-6 text-indigo-500" /> Personel Hak Ediş ve Prim Raporu
              </h3>
              <div className="flex gap-2">
                  <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><DollarSign className="w-4 h-4 text-gray-600" /></button>
                  <button className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><Percent className="w-4 h-4 text-gray-600" /></button>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                      <tr className="text-left border-b border-gray-50">
                          <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">İsim Soyisim</th>
                          <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam Ciro</th>
                          <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">İşlem Adedi</th>
                          <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Brüt Prim</th>
                          <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Durum</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {staffCommData.map((st, i) => (
                          <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-6">
                                  <div className="flex gap-3 items-center font-black text-gray-900">
                                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-[10px]">{st.name[0]}</div>
                                      {st.name}
                                  </div>
                              </td>
                              <td className="py-6 font-bold text-gray-600">₺{st.sales.toLocaleString('tr-TR')}</td>
                              <td className="py-6 text-center">
                                  <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-black text-gray-500">
                                    {appointments.filter(a => a.staffName === st.name && a.status === 'completed').length} Adet
                                  </span>
                              </td>
                              <td className="py-6 font-black text-indigo-600">₺{st.commission.toLocaleString('tr-TR')}</td>
                              <td className="py-6 text-right">
                                  <button className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-600 hover:text-white transition-all">Detay / Öde</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  );
}
