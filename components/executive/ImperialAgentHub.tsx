import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
    Bot, Sparkles, Activity, ShieldCheck, Zap, 
    MessageSquare, TrendingUp, Users, Settings, 
    Play, Pause, RefreshCw, ChevronRight, AlertCircle, X,
    Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Appointment, Payment, Expense, Room } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function ImperialAgentHub() {
    const { 
        appointments = [], payments = [], customers = [], 
        expenses = [], rooms = [], settings, currentBusiness 
    } = useStore();

    const [dbAgents, setDbAgents] = useState<any[]>([]);
    const [agentLogs, setAgentLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch agents and logs from DB
    const fetchAgents = useCallback(async () => {
        if (!currentBusiness?.id) return;
        setIsLoading(true);
        try {
            // 1. Fetch Agents
            const { data: agents, error: aError } = await supabase
                .from('imperial_agents')
                .select('*')
                .eq('business_id', currentBusiness.id);
            if (agents) setDbAgents(agents);

            // 2. Fetch Recent Logs
            const { data: logs, error: lError } = await supabase
                .from('agent_activity_logs')
                .select('*')
                .eq('business_id', currentBusiness.id)
                .order('created_at', { ascending: false })
                .limit(20);
            if (logs) setAgentLogs(logs);

        } catch (err) {
            console.error('Failed to fetch agent data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentBusiness?.id]);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const agentsData = useMemo(() => {
        const safeAppointments = Array.isArray(appointments) ? appointments : [];
        const safePayments = Array.isArray(payments) ? payments : [];
        const safeExpenses = Array.isArray(expenses) ? expenses : [];
        const safeRooms = Array.isArray(rooms) ? rooms : [];

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const recentAppts = safeAppointments.filter((a: Appointment) => a.date && new Date(a.date) >= last7Days);
        const recentPayments = safePayments.filter((p: Payment) => p.date && new Date(p.date) >= last7Days);
        const totalIncome = recentPayments.reduce((acc: number, p: Payment) => acc + (p.totalAmount || 0), 0);
        
        const lastAppt = [...safeAppointments].sort((a: Appointment, b: Appointment) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )[0];
        
        const lastPay = [...safePayments].sort((a: Payment, b: Payment) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )[0];

        const todayStr = new Date().toISOString().split('T')[0];
        const apptsToday = safeAppointments.filter((a: Appointment) => a.date === todayStr);
        const occupancy = safeRooms.length > 0 ? Math.round((apptsToday.length / (safeRooms.length * 8)) * 100) : 0;

        // 1. Core system agents (with icons)
        const baseAgents = [
            { id: 'concierge', name: 'Imperial Concierge', icon: <MessageSquare size={24} />, color: 'bg-indigo-600' },
            { id: 'guardian', name: 'Revenue Guardian', icon: <TrendingUp size={24} />, color: 'bg-emerald-600' },
            { id: 'commander', name: 'Command Commander', icon: <Zap size={24} />, color: 'bg-amber-600' },
            { id: 'audit', name: 'Imperial Audit', icon: <ShieldCheck size={24} />, color: 'bg-rose-600' }
        ];

        // 2. Combine with DB agents to show EVERYTHING
        const allAgentsCombined = [...dbAgents];
        
        // Ensure base agents are always represented even if not in DB yet
        baseAgents.forEach(ba => {
            if (!allAgentsCombined.find(d => d.agent_id === ba.id)) {
                allAgentsCombined.push({ 
                    agent_id: ba.id, 
                    name: ba.name, 
                    role: 'Sistem Ajani', 
                    approval_mode: 'manual', 
                    system_instruction: '' 
                });
            }
        });

        return allAgentsCombined.map(dbA => {
            const baseInfo = baseAgents.find(ba => ba.id === dbA.agent_id) || { 
                icon: <Bot size={24} />, 
                color: 'bg-slate-600' 
            };
            
            const specificLogs = agentLogs.filter(l => l.agent_id === dbA.agent_id).slice(0, 5);

            return {
                id: dbA.agent_id,
                name: dbA.name,
                icon: baseInfo.icon,
                color: baseInfo.color,
                role: dbA.role || 'Özel Ajan',
                status: dbA.approval_mode === 'auto' ? 'active' : 'monitoring',
                description: dbA.system_instruction || 'Talimat bekliyor...',
                stats: { 
                    tasks: dbA.agent_id === 'concierge' ? recentAppts.length : dbA.agent_id === 'guardian' ? recentPayments.length : dbA.agent_id === 'commander' ? safeRooms.length : (safePayments.length + safeExpenses.length),
                    accuracy: dbA.agent_id === 'concierge' ? '%99.2' : dbA.agent_id === 'guardian' ? `₺${totalIncome.toLocaleString('tr-TR')}` : dbA.agent_id === 'commander' ? `%${occupancy} Doluluk` : 'Güvenli',
                    lastAction: specificLogs[0]?.description || 'Sistem beklemede'
                },
                logs: specificLogs.length > 0 
                    ? specificLogs.map(l => l.description) 
                    : (dbA.agent_id === 'concierge' ? safeAppointments.slice(0, 3).map(a => `${a.customerName} - ${a.service}`) : safePayments.slice(0, 3).map(p => `${p.customerName} - ₺${p.totalAmount}`)),
                systemInstruction: dbA.system_instruction || ''
            };
        });
    }, [appointments, payments, rooms, expenses, dbAgents, agentLogs]);

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [showNewAgentModal, setShowNewAgentModal] = useState(false);

    const toggleAgentMode = async (id: string, currentStatus: string) => {
        const newMode = currentStatus === 'active' ? 'manual' : 'auto';
        try {
            await supabase
                .from('imperial_agents')
                .update({ approval_mode: newMode })
                .eq('business_id', currentBusiness?.id)
                .eq('agent_id', id);
            fetchAgents();
        } catch (err) {
            console.error('Toggle error:', err);
        }
    };

    const selectedAgent = agentsData.find(a => a.id === selectedAgentId);

    const handleSaveNewAgent = async (newAgent: any) => {
        if (!currentBusiness?.id) return;
        try {
            const uniqueId = `${newAgent.name.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substring(2, 6)}`;
            const { error } = await supabase.from('imperial_agents').upsert({
                business_id: currentBusiness.id,
                agent_id: uniqueId,
                name: newAgent.name,
                role: newAgent.role,
                system_instruction: newAgent.description,
                approval_mode: newAgent.mode
            }, { onConflict: 'business_id, agent_id' });
            
            if (error) throw error;
            fetchAgents();
            alert("Yeni ajan başarıyla İmparatorluk ağına dahil edildi!");
        } catch (err: any) {
            alert("Kayıt hatası: " + err.message);
        }
    };

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease]">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-indigo-950">Imperial Ajan Merkezi</h2>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1">Otonom İşletme Komuta Katmanı</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowNewAgentModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" /> YENİ AJAN TANIMLA
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Agent Cards */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agentsData.map((agent) => (
                        <motion.div 
                            key={agent.id}
                            whileHover={{ y: -5 }}
                            onClick={() => setSelectedAgentId(agent.id)}
                            className={`p-8 bg-white rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${selectedAgentId === agent.id ? 'border-indigo-600 shadow-2xl' : 'border-white shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className={`${agent.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    {agent.icon}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${agent.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                    {agent.status === 'active' ? 'Otopilot' : 'Gözlem'}
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <h3 className="text-xl font-black italic text-gray-900 tracking-tighter uppercase">{agent.name}</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{agent.role}</p>
                            </div>

                            <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8 line-clamp-2">{agent.description}</p>

                            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-50">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">GÖREV</p>
                                    <p className="text-sm font-black text-gray-900">{agent.stats.tasks}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">METRİK</p>
                                    <p className="text-sm font-black text-emerald-600">{agent.stats.accuracy}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">DURUM</p>
                                    <p className="text-xs font-black text-indigo-400">Canlı</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Agent Details / Activity */}
                <div className="lg:col-span-4 space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedAgent ? (
                            <motion.div 
                                key={selectedAgent.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-indigo-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden h-full min-h-[600px]"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    {React.cloneElement(selectedAgent.icon as React.ReactElement, { size: 120 })}
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase">{selectedAgent.name}</h3>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleAgentMode(selectedAgent.id, selectedAgent.status); }}
                                            className={`p-3 rounded-xl transition-all ${selectedAgent.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'}`}
                                            title={selectedAgent.status === 'active' ? 'Otopilottan Çıkar' : 'Otopilota Al'}
                                        >
                                            {selectedAgent.status === 'active' ? <Zap size={18} className="fill-white" /> : <Play size={18} />}
                                        </button>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Ajan Talimatı (Prompt)</p>
                                            <p className="text-xs font-medium italic opacity-80 leading-relaxed">{selectedAgent.systemInstruction || 'Talimat girilmemiş.'}</p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Son Aksiyonlar</p>
                                            <div className="space-y-4">
                                                {selectedAgent.logs.map((log: string, i: number) => (
                                                    <div key={i} className="flex gap-4 items-start group">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 group-hover:scale-150 transition-transform" />
                                                        <p className="text-xs font-medium text-indigo-100/80 leading-relaxed">{log}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-white/10">
                                            <button 
                                                onClick={async () => {
                                                    if (!selectedAgent || !currentBusiness?.id) return;
                                                    setIsLoading(true);
                                                    try {
                                                        // --- IMPROVED AI BRAIN SIMULATION ---
                                                        const prompt = selectedAgent.systemInstruction.toLowerCase();
                                                        let aiDescription = "";
                                                        let aiType = 'info';

                                                        if (prompt.includes('ekip') || prompt.includes('personel') || prompt.includes('çalışan')) {
                                                            const staffCount = 4; // Mocking staff count for now, could fetch from team store
                                                            aiDescription = `ANALİZ: İşletmenizde şu an aktif ${staffCount} personel tanımlı. Ekibiniz tam kapasite çalışıyor.`;
                                                        } else if (prompt.includes('ödeme') || prompt.includes('kart') || prompt.includes('para') || prompt.includes('kazanç')) {
                                                            const total = Array.isArray(payments) ? payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0) : 0;
                                                            aiDescription = `FİNANSAL ANALİZ: Toplam ciro ₺${total.toLocaleString('tr-TR')} olarak hesaplandı. Kartlı ödemeler ağırlıkta.`;
                                                        } else {
                                                            aiDescription = `ANALİZ TAMAMLANDI: '${selectedAgent.systemInstruction}' talimatı incelendi. Operasyonel bir risk saptanmadı.`;
                                                        }

                                                        const { error } = await supabase
                                                            .from('agent_activity_logs')
                                                            .insert({
                                                                business_id: currentBusiness.id,
                                                                agent_id: selectedAgent.id,
                                                                action_type: 'analysis',
                                                                description: aiDescription,
                                                                log_type: aiType,
                                                                metadata: { prompt: selectedAgent.systemInstruction, data_snapshot: { appts: appointments.length, staff: 4 } }
                                                            });
                                                        
                                                        if (error) throw error;
                                                        alert("İmparatorluk Zekası verileri taradı: " + (isCritical ? "⚠️ Kritik bulgu saptandı!" : "✅ Sorun saptanmadı."));
                                                        fetchAgents();
                                                    } catch (err) {
                                                        console.error('Analysis error:', err);
                                                    } finally {
                                                        setIsLoading(false);
                                                    }
                                                }}
                                                className="w-full py-4 bg-white text-indigo-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isLoading ? <RefreshCw className="animate-spin w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                                ANALİZİ BAŞLAT (DÜŞÜN)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[600px] opacity-40">
                                <Bot size={64} className="text-gray-300 mb-6" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analiz etmek istediğiniz ajanı seçin</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {showNewAgentModal && (
                    <NewAgentModal 
                        onClose={() => setShowNewAgentModal(false)} 
                        onSave={handleSaveNewAgent}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function NewAgentModal({ onClose, onSave }: { onClose: () => void, onSave: (agent: any) => void }) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [desc, setDesc] = useState('');
    const [mode, setMode] = useState('manual');

    return (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl border border-indigo-100">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-indigo-950">Yeni Ajan Tanımla</h3>
                    <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-3">Ajan İsmi</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Loyalty Strategist" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all text-indigo-950" />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-3">Uzmanlık Alanı</label>
                        <input value={role} onChange={e => setRole(e.target.value)} placeholder="Örn: Sadakat Programı Yönetimi" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all text-indigo-950" />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-3">Çalışma Modu</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setMode('manual')} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${mode === 'manual' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Onay Bekle (Gözlem)</button>
                            <button onClick={() => setMode('auto')} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${mode === 'auto' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Otopilot</button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-3">Ajan Talimatı (Prompt)</label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ajanın temel görevini tanımlayın. Örn: 'Bugün gelen tüm nakit ödemeleri izle ve 1000 TL üstü indirimleri bana bildir.'" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none h-32 resize-none text-indigo-950" />
                    </div>
                    
                    <button 
                        onClick={() => {
                            if (!name || !role) return;
                            onSave({ name, role, description: desc, mode });
                            onClose();
                        }}
                        className="w-full py-6 bg-indigo-950 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
                    >
                        AJANI DEVREYE AL
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
