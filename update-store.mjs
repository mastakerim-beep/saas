import fs from 'fs';

const filePath = '/Users/kerim/.gemini/antigravity/scratch/spa-saas/lib/store.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Insert toCamel and toSnake helpers before StoreContext
const helperCode = `
const toCamel = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toCamel(v));
    if (obj !== null && typeof obj === 'object') {
        const n: any = {};
        for(let k of Object.keys(obj)) {
            const camelK = k.replace(/_([a-z])/g, (_, m) => m.toUpperCase());
            n[camelK] = toCamel(obj[k]);
        }
        return n;
    }
    return obj;
}

const toSnake = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toSnake(v));
    if (obj !== null && typeof obj === 'object') {
        const n: any = {};
        for(let k of Object.keys(obj)) {
            const snakeK = k.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);
            n[snakeK] = obj[k]; 
        }
        return n;
    }
    return obj;
}

`;
content = content.replace('const StoreContext = createContext', helperCode + 'const StoreContext = createContext');

// 2. Replace empty array Initializations between // MOCK DB and useEffect
const mockDbRegex = /\/\/ MOCK DB[\s\S]*?useEffect\(\(\) => \{/m;
const newStates = `
    const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [allPackages, setAllPackages] = useState<Package[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
    const [customerMemberships, setCustomerMemberships] = useState<CustomerMembership[]>([]);
    const [allNotifs, setAllNotifs] = useState<NotificationLog[]>([]);
    const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
    const [allBlocks, setAllBlocks] = useState<CalendarBlock[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [allDebts, setAllDebts] = useState<Debt[]>([]);
    const [allStaff, setAllStaff] = useState<Staff[]>([]);
    const [allInventory, setAllInventory] = useState<Product[]>([]);
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [allCommissionRules, setAllCommissionRules] = useState<CommissionRule[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
    const [settings, setSettings] = useState<BusinessSettings>({ startHour: 9, endHour: 21, openDays: [1,2,3,4,5,6], isAutoMarketingEnabled: true });

    const fetchData = async (bizId: string) => {
        const [biz, br, apt, cus, mem, cmem, pay, deb, stf, inv, room, exp, log] = await Promise.all([
            supabase.from('businesses').select('*').eq('id', bizId),
            supabase.from('branches').select('*').eq('business_id', bizId),
            supabase.from('appointments').select('*').eq('business_id', bizId),
            supabase.from('customers').select('*').eq('business_id', bizId),
            supabase.from('membership_plans').select('*').eq('business_id', bizId),
            supabase.from('customer_memberships').select('*').eq('business_id', bizId),
            supabase.from('payments').select('*').eq('business_id', bizId),
            supabase.from('debts').select('*').eq('business_id', bizId),
            supabase.from('staff').select('*').eq('business_id', bizId),
            supabase.from('inventory').select('*').eq('business_id', bizId),
            supabase.from('rooms').select('*').eq('business_id', bizId),
            supabase.from('expenses').select('*').eq('business_id', bizId),
            supabase.from('audit_logs').select('*').eq('business_id', bizId)
        ]);

        if (biz.data) setAllBusinesses(toCamel(biz.data));
        if (br.data) setAllBranches(toCamel(br.data));
        if (apt.data) setAllAppointments(toCamel(apt.data));
        if (cus.data) setAllCustomers(toCamel(cus.data));
        if (mem.data) setMembershipPlans(toCamel(mem.data));
        if (cmem.data) setCustomerMemberships(toCamel(cmem.data));
        if (pay.data) setAllPayments(toCamel(pay.data));
        if (deb.data) setAllDebts(toCamel(deb.data));
        if (stf.data) setAllStaff(toCamel(stf.data));
        if (inv.data) setAllInventory(toCamel(inv.data));
        if (room.data) setAllRooms(toCamel(room.data));
        if (exp.data) setAllExpenses(toCamel(exp.data));
        if (log.data) setAllLogs(toCamel(log.data));
    };

    useEffect(() => {`;
content = content.replace(mockDbRegex, newStates);

// 3. Inject fetchData() call into initAuth
content = content.replace(
    'setCurrentUser(loggedUser as AppUser);',
    'setCurrentUser(loggedUser as AppUser);\n                fetchData(loggedUser.businessId);'
);

// 4. Update Actions for Optimistic UI + DB sync
// Let's replace the whole Provide action block
const actionsRegex = /const addAppointment.*/s;
const newActions = `
    // DB SYNC HELPER
    const syncDb = (table: string, op: 'insert'|'update'|'delete', data: any, id?: string) => {
        if (!currentUser?.businessId) return;
        const payload = toSnake(data);
        if (op === 'insert') supabase.from(table).insert(payload).then();
        if (op === 'update') supabase.from(table).update(payload).eq('id', id).then();
        if (op === 'delete') supabase.from(table).delete().eq('id', id).then();
    };

    const addAppointment = async (data: any) => {
        setSyncStatus('syncing');
        return new Promise<boolean>(res => {
            setTimeout(() => {
                const a = { ...data, id: crypto.randomUUID(), businessId: currentUser?.businessId, branchId: currentUser?.branchId || 'main', createdAt: new Date().toISOString(), syncStatus: 'synced' };
                setAllAppointments(prev => [a, ...prev]);
                syncDb('appointments', 'insert', a);
                addLog('Yeni Randevu Oluşturuldu', data.customerName, '', data.service);
                setSyncStatus('idle');
                res(true);
            }, 300);
        });
    };

    const processCheckout = async (data: any, debtInfo?: any) => {
        const pay = { ...data, id: crypto.randomUUID(), businessId: currentUser?.businessId, branchId: currentUser?.branchId || 'main', syncStatus: 'synced' };
        setAllPayments(prev => [pay, ...prev]);
        syncDb('payments', 'insert', pay);

        setAllAppointments(as => as.map(a => a.id === data.appointmentId ? { ...a, status: 'completed' } : a));
        syncDb('appointments', 'update', { status: 'completed' }, data.appointmentId);
        
        if (debtInfo) {
            const deb = { ...debtInfo, id: crypto.randomUUID(), businessId: currentUser!.businessId, status: 'açık', createdAt: new Date().toISOString() };
            setAllDebts(prev => [deb, ...prev]);
            syncDb('debts', 'insert', deb);
        }

        if (data.service.includes('Ürün')) {
            const p = allInventory.find(x => x.name === data.service);
            if (p) {
                setAllInventory(prev => prev.map(x => x.id === p.id ? { ...x, stock: x.stock - 1 } : x));
                syncDb('inventory', 'update', { stock: p.stock - 1 }, p.id);
            }
        }

        if (data.methods.some((m: any) => m.method === 'abonelik')) {
            const appt = allAppointments.find(a => a.id === data.appointmentId);
            const mem = customerMemberships.find(m => m.customerId === appt?.customerId && m.status === 'active');
            if (mem) {
                setCustomerMemberships(ms => ms.map(m => m.id === mem.id ? { ...m, remainingSessions: m.remainingSessions - 1 } : m));
                syncDb('customer_memberships', 'update', { remaining_sessions: mem.remainingSessions - 1 }, mem.id);
            }
        }

        addLog('Tahsilat Tamamlandı', data.customerName, '', 'Ödeme: ' + data.totalAmount);
        return true;
    };

    const sendNotification = (cid: string, type: any, content: string) => {
        const n = { id: crypto.randomUUID(), businessId: currentUser!.businessId, customerId: cid, type, content, status: 'SENT', sentAt: new Date().toISOString() };
        setAllNotifs(prev => [n, ...prev]);
        syncDb('notification_logs', 'insert', n);
    };

    const assignMembership = (cid: string, pid: string) => {
        const plan = membershipPlans.find(p => p.id === pid);
        if (!plan) return;
        const m = { id: crypto.randomUUID(), businessId: currentUser!.businessId, customerId: cid, planId: pid, startDate: new Date().toISOString(), expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), remainingSessions: plan.sessionsPerMonth, status: 'active' as const };
        setCustomerMemberships(prev => [m, ...prev]);
        syncDb('customer_memberships', 'insert', m);
        addLog('Üyelik Atandı', cid, '', plan.name);
    };

    const calculateCommission = (staffName: string, serviceName: string, price: number, packageId?: string, membershipId?: string) => {
        return price * 0.1;
    };

    const payDebt = async (debtId: string, amount: number, methods: any) => {
        const debt = allDebts.find(d => d.id === debtId);
        if(!debt) return false;
        const newStatus = debt.amount - amount <= 0 ? 'kapandı' : 'açık';
        setAllDebts(prev => prev.map(d => d.id === debtId ? { ...d, status: newStatus } : d));
        syncDb('debts', 'update', { status: newStatus }, debtId);

        const pay = { id: crypto.randomUUID(), businessId: currentUser!.businessId, branchId: currentUser!.branchId || 'main', appointmentId: debt.appointmentId || crypto.randomUUID(), customerId: debt.customerId, customerName: 'Borç Ödemesi', service: 'Borç Tahsilatı', methods, totalAmount: amount, date: new Date().toISOString().split('T')[0], note: 'Borç ödemesi' };
        setAllPayments(prev => [pay, ...prev]);
        syncDb('payments', 'insert', pay);
        return true;
    };

    const addLog = (action: string, customer: string, oldValue?: string, newValue?: string) => {
        const id = crypto.randomUUID();
        const l = { id, businessId: currentUser?.businessId || 'sys', date: new Date().toISOString(), customerName: customer, action, oldValue, newValue, user: currentUser?.name || 'Sistem' };
        setAllLogs(prev => [l, ...prev]);
        if(currentUser?.businessId) syncDb('audit_logs', 'insert', l);
    };

    const addProduct = (p: any) => {
        const np = { ...p, id: crypto.randomUUID(), businessId: currentUser!.businessId };
        setAllInventory(prev => [np, ...prev]);
        syncDb('inventory', 'insert', np);
        addLog('Envanter', 'Depo', '', p.name);
    };

    const addExpense = (e: any) => {
        const ne = { ...e, id: crypto.randomUUID(), businessId: currentUser!.businessId, user: currentUser!.name };
        setAllExpenses(prev => [ne, ...prev]);
        syncDb('expenses', 'insert', ne);
        addLog('Gider', 'Muhasebe', '', e.desc);
    };

    if (!isInitialized) return null;

    return (
        <StoreContext.Provider value={{
            currentUser, currentBusiness, currentBranch: null, isOnline, syncStatus,
            allBusinesses, customers, packages: filterByBiz(allPackages), appointments,
            membershipPlans: filterByBiz(membershipPlans), customerMemberships: filterByBiz(customerMemberships),
            notifs: filterByBiz(allNotifs), aiInsights: filterByBiz(aiInsights),
            blocks: filterByBiz(allBlocks), payments: filterByBiz(allPayments), staffMembers: filterByBiz(allStaff), debts: filterByBiz(allDebts),
            branches: allBranches.filter(b => b.businessId === currentUser?.businessId), logs: allLogs.filter(l => l.businessId === currentUser?.businessId),
            inventory: filterByBiz(allInventory), rooms: filterByBiz(allRooms), commissionRules: filterByBiz(allCommissionRules), rates: [], expenses: filterByBiz(allExpenses), settings,
            login, logout, 
            addCustomer: (c) => { 
                const n = { ...c, id: crypto.randomUUID(), businessId: currentUser?.businessId, createdAt: new Date().toISOString() }; 
                setAllCustomers(prev => [n, ...prev]); 
                syncDb('customers', 'insert', n);
                addLog('Müşteri', n.name); 
                return n; 
            },
            addPackage: (p) => { 
                const np = { ...p, id: crypto.randomUUID(), businessId: currentUser?.businessId, usedSessions: 0, createdAt: new Date().toISOString() };
                setAllPackages(prev => [np, ...prev]); 
                addLog('Paket', p.customerId); 
            },
            addMembershipPlan: (p) => { 
                const np = { ...p, id: crypto.randomUUID(), businessId: currentUser?.businessId };
                setMembershipPlans(prev => [np, ...prev]);
                syncDb('membership_plans', 'insert', np);
            },
            assignMembership, addAppointment, 
            moveAppointment: async (id, nt, nsi) => { 
                setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, time: nt, staffId: nsi } : a)); 
                syncDb('appointments', 'update', { time: nt, staff_id: nsi }, id);
                addLog('Randevu', id, '', nt); return true; 
            },
            deleteAppointment: async (id) => { 
                setAllAppointments(prev => prev.filter(a => a.id !== id)); 
                syncDb('appointments', 'delete', {}, id);
                addLog('Randevu Silindi', id); return true; 
            },
            updateAppointmentStatus: async (id, s) => { 
                setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, status: s } : a)); 
                syncDb('appointments', 'update', { status: s }, id);
                return true; 
            },
            addBlock: (b) => {
                const nb = { ...b, id: crypto.randomUUID(), businessId: currentUser?.businessId };
                setAllBlocks(prev => [nb, ...prev]);
                syncDb('calendar_blocks', 'insert', nb);
            },
            removeBlock: (id) => {
                setAllBlocks(prev => prev.filter(b => b.id !== id));
                syncDb('calendar_blocks', 'delete', {}, id);
            },
            updateSettings: (s) => setSettings(prev => ({ ...prev, ...s })),
            processCheckout, sendNotification, calculateCommission, addLog, addProduct, addExpense, 
            updateBusinessLicense: (id, max) => setAllBusinesses(bs => bs.map(b => b.id === id ? { ...b, maxUsers: max } : b)),
            payDebt, 
            updateRoomStatus: (id, status) => {
                setAllRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r));
                syncDb('rooms', 'update', { status }, id);
            },
            addCommissionRule: (rule) => {
                const r = { ...rule, id: crypto.randomUUID(), businessId: currentUser!.businessId };
                setAllCommissionRules(prev => [r, ...prev]);
                syncDb('commission_rules', 'insert', r);
            },
            removeCommissionRule: (id) => {
                setAllCommissionRules(prev => prev.filter(r => r.id !== id));
                syncDb('commission_rules', 'delete', {}, id);
            },
            getCustomerPackages: (cid: string) => filterByBiz(allPackages).filter(p => p.customerId === cid),
            getCustomerAppointments: (cid) => appointments.filter(a => a.customerId === cid),
            getCustomerPayments: (cid) => filterByBiz(allPayments).filter(p => p.customerId === cid),
            getTodayPayments: () => filterByBiz(allPayments).filter(p => p.date === new Date().toISOString().split('T')[0]),
            can: (p) => true
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('Store context error');
    return ctx;
}
`;
content = content.replace(actionsRegex, newActions);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Store updated with Supabase DB logic.');
