'use client';

import { useState, useMemo } from 'react';
import { Database } from '@/lib/supabase';
import { Check, Calendar, Clock, User, Phone, ArrowRight, Loader2, Sparkles, MapPin } from 'lucide-react';
import { submitBooking } from './actions';

type Business = Database['public']['Tables']['businesses']['Row'];
type Staff = Database['public']['Tables']['staff']['Row'];
type BookedSlot = { date: string; time: string; duration: number; staff_id: string };

interface Service {
  name: string;
  duration: number;
  price: number;
}

const generateSlots = () => {
  const slots = [];
  for (let h = 9; h < 20; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
};
const ALL_SLOTS = generateSlots();

export default function BookingClient({
  business,
  staff,
  bookedSlots,
  services = []
}: {
  business: Business;
  staff: Staff[];
  bookedSlots: BookedSlot[];
  services?: Service[];
}) {
  const getToday = () => new Date().toLocaleDateString('sv-SE');

  const [step, setStep] = useState(1);
  const [service, setService] = useState(services[0] || { name: 'Bali Masajı', duration: 60, price: 3400 });
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sadece bugünden itibaren 14 gün
  const DATES = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('sv-SE');
  });

  const availableSlots = useMemo(() => {
    if (!selectedStaff) return [];
    
    // Basit çakışma mantığı: Personelin o günkü dolu saatlerini buluyoruz.
    // MVP içi sadece başlangıç saati çakışmasını engelliyoruz, süreyi hesaplamak daha kapsamlıdır.
    const staffBookings = bookedSlots.filter(b => b.staff_id === selectedStaff.id && b.date === date);
    const bookedTimes = new Set(staffBookings.map(b => b.time));

    return ALL_SLOTS.filter(s => !bookedTimes.has(s));
  }, [selectedStaff, date, bookedSlots]);

  const handleSubmit = async () => {
    if (!name || !phone || !selectedStaff || !time) return;
    setIsSubmitting(true);
    setError('');

    const res = await submitBooking({
      businessId: business.id,
      customerName: name,
      phone,
      service: service.name,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      date,
      time,
      duration: service.duration,
      price: service.price
    });

    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center max-w-lg mx-auto w-full mt-10 animate-[slideUp_0.5s_ease]">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Randevunuz Alındı!</h2>
        <p className="text-gray-500 font-medium mb-8">İşleminiz başarıyla sisteme iletildi. {business.name} ekibi sizi yakında ağırlamayı bekliyor.</p>
        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-2 text-sm font-bold text-gray-700 text-left">
          <p>📌 Hizmet: <span className="text-gray-900">{service.name}</span></p>
          <p>📅 Tarih: <span className="text-gray-900">{date} - {time}</span></p>
          <p>👩‍⚕️ Uzman: <span className="text-gray-900">{selectedStaff?.name}</span></p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Online Rezervasyon</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-3">{business.name}</h1>
        <p className="text-gray-400 font-semibold flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4" /> İstanbul
        </p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        {/* Sol Panel: Adımlar */}
        <div className="w-full md:w-1/3 bg-gray-50/50 p-8 border-b md:border-b-0 md:border-r border-gray-100">
          {[
            { id: 1, title: 'Hizmet Seçimi' },
            { id: 2, title: 'Zaman & Uzman' },
            { id: 3, title: 'Kişisel Bilgiler' },
          ].map(s => (
            <div key={s.id} className="flex items-center gap-4 mb-8 last:mb-0">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${step >= s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-200 text-gray-400'}`}>
                {step > s.id ? <Check className="w-5 h-5" /> : s.id}
              </div>
              <p className={`font-black uppercase tracking-tight text-sm ${step >= s.id ? 'text-gray-900' : 'text-gray-400'}`}>{s.title}</p>
            </div>
          ))}

          {/* Özet */}
          <div className="mt-12 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Randevu Özeti</p>
            <div className="space-y-3 text-xs font-bold text-gray-700">
              <p className="flex justify-between"><span>Hizmet:</span> <span className="text-gray-900">{service.name}</span></p>
              <p className="flex justify-between"><span>Tutar:</span> <span className="text-indigo-600">₺{service.price}</span></p>
              {time && <p className="flex justify-between"><span>Tarih:</span> <span className="text-gray-900">{date} • {time}</span></p>}
              {selectedStaff && <p className="flex justify-between"><span>Uzman:</span> <span className="text-gray-900">{selectedStaff.name}</span></p>}
            </div>
          </div>
        </div>

        {/* Sağ Panel: İçerik */}
        <div className="w-full md:w-2/3 p-8 md:p-12">
          
          {step === 1 && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <h2 className="text-2xl font-black mb-6">Size Uygun Hizmeti Seçin</h2>
              <div className="grid grid-cols-1 gap-4">
                {services.map((s: Service) => (
                  <button 
                    key={s.name}
                    onClick={() => { setService(s); setStep(2); }}
                    className={`p-6 rounded-3xl border-2 flex items-center justify-between text-left transition-all hover:border-indigo-300 ${service.name === s.name ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100'}`}
                  >
                    <div>
                      <p className="font-black text-gray-900 text-lg">{s.name}</p>
                      <p className="text-gray-500 font-semibold text-sm mt-1">{s.duration} Dakika Özel Seans</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-indigo-600 text-xl">₺{s.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <h2 className="text-2xl font-black mb-6">Tarih ve Uzman</h2>
              
              {/* Günler */}
              <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar mb-6">
                {DATES.map(d => {
                  const dayObj = new Date(d);
                  const isSun = dayObj.getDay() === 0;
                  const dayName = dayObj.toLocaleDateString('tr-TR', { weekday: 'short' });
                  const dayNum = dayObj.getDate();
                  return (
                    <button 
                      key={d}
                      onClick={() => setDate(d)}
                      className={`flex-none w-20 p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${date === d ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-300'}`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${date === d ? 'text-indigo-200' : (isSun ? 'text-red-400' : 'text-gray-400')}`}>{dayName}</span>
                      <span className="text-2xl font-black mt-1">{dayNum}</span>
                    </button>
                  );
                })}
              </div>

              {/* Personel */}
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Uzman Seçimi</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {staff.map(st => (
                  <button
                    key={st.id}
                    onClick={() => { setSelectedStaff(st); setTime(''); }}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${selectedStaff?.id === st.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-600 hover:border-gray-300'}`}
                  >
                    <p className="font-black text-sm uppercase">{st.name}</p>
                    <p className="text-[10px] font-bold opacity-70 mt-1">{st.role}</p>
                  </button>
                ))}
              </div>

              {/* Saatler */}
              {selectedStaff && (
                <>
                  <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-3">Uygun Saatler ({availableSlots.length})</h3>
                  {availableSlots.length === 0 ? (
                    <p className="text-red-500 font-bold bg-red-50 p-4 rounded-xl text-sm">Bu tarihte hiç boş yer yok. Başka tarih seçin.</p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                      {availableSlots.map(t => (
                        <button
                          key={t}
                          onClick={() => setTime(t)}
                          className={`p-3 rounded-xl border-2 font-black text-sm transition-all ${time === t ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-gray-100 text-gray-700 hover:border-indigo-300'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="mt-10 flex text-left border-t border-gray-100 pt-6">
                <button 
                  onClick={() => setStep(1)} 
                  className="font-black text-gray-400 hover:text-gray-900 transition mr-auto py-3 px-6"
                >
                  Geri
                </button>
                <button 
                  disabled={!time || !selectedStaff}
                  onClick={() => setStep(3)} 
                  className="bg-indigo-600 text-white font-black py-4 px-8 rounded-full flex items-center gap-2 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-100 active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100"
                >
                  Devam Et <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-[fadeIn_0.3s_ease]">
              <h2 className="text-2xl font-black mb-6">Bilgilerinizi Onaylayın</h2>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-5 mb-8">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Adınız Soyadınız</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      type="text" placeholder="Ad Soyad"
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Telefon Numaranız</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input 
                      value={phone} onChange={e => setPhone(e.target.value)}
                      type="tel" placeholder="05XX XXX XX XX"
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl mb-8 flex gap-4 items-start">
                <Clock className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-indigo-900">
                  Lütfen randevudan <strong className="font-black">15 dakika önce</strong> işletmede bulunmaya özen gösterin. İptalleriniz için en az 6 saat önce haber vermeniz gerekmektedir.
                </p>
              </div>

              <div className="flex border-t border-gray-100 pt-6">
                <button 
                  onClick={() => setStep(2)} 
                  className="font-black text-gray-400 hover:text-gray-900 transition mr-auto py-3 px-6"
                >
                  Geri
                </button>
                <button 
                  disabled={!name || !phone || isSubmitting}
                  onClick={handleSubmit} 
                  className="bg-indigo-600 text-white font-black py-4 px-8 rounded-full flex items-center gap-3 hover:shadow-xl hover:shadow-indigo-200 transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {isSubmitting ? 'İletiliyor...' : 'Randevuyu Tamamla'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
