"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { 
    Package, Sparkles, Trash2, Receipt, 
    AlertTriangle, TrendingUp, Calendar, Info, 
    Settings2, ChevronRight, X, Plus, Beaker
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InventoryPage() {
  const { 
    inventory, addProduct, predictInventory, 
    usageNorms, services, addUsageNorm, updateUsageNorm 
  } = useStore();
  const [aiInput, setAiInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleAiInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput) return;
    
    // Simulate AI extraction logic
    let name = "Yeni Ürün";
    let category = "Genel";
    let price = 0;
    let stock = 1;

    const lower = aiInput.toLowerCase();
    
    // Name extraction (example patterns)
    if (lower.includes("yağ")) name = "Hindistan Cevizi Yağı";
    if (lower.includes("jel")) name = "Temizleme Jeli";
    if (lower.includes("krem")) name = "Bakım Kremi";
    
    // Category extraction
    if (lower.includes("yağ") || lower.includes("jel")) category = "Tüketim";
    
    // Amount extraction
    const amountMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:tl|lira|₺)/i);
    if (amountMatch) price = parseFloat(amountMatch[1]);

    // Stock extraction
    const stockMatch = lower.match(/(\d+)\s*(?:adet|birim|litre|lt)/i);
    if (stockMatch) stock = parseInt(stockMatch[1]);

    addProduct({
      name: name || aiInput.slice(0, 20),
      category,
      price: price || 0,
      stock: stock || 1
    });
    
    setAiInput('');
  };

  const predictions = useMemo(() => predictInventory(), [inventory, usageNorms]);
  const totalValue = inventory.reduce((s, p) => s + (p.price * p.stock), 0);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <Package className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase text-gray-900">Envanter & Stok</h1>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aura Intelligence Akıllı Stok Takip Merkezi</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Portföy Değeri</p>
            <p className="text-4xl font-black text-indigo-700 italic tracking-tighter">₺{totalValue.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      {/* Prediction Insights */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {predictions.sort((a,b) => a.daysLeft - b.daysLeft).slice(0, 3).map((pred, i) => (
            <motion.div 
              key={pred.productId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-[3rem] border shadow-sm relative overflow-hidden group ${
                pred.daysLeft < 10 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'
              }`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <AlertTriangle size={120} className={pred.daysLeft < 10 ? 'text-red-600' : 'text-indigo-600'} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    pred.daysLeft < 10 ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {pred.daysLeft < 10 ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                    pred.daysLeft < 10 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                    Tahmini Bitiş
                  </span>
                </div>
                <h4 className="text-xl font-black italic tracking-tighter uppercase mb-1 text-gray-900">{pred.productName}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Mevcut: {pred.currentStock} Birim</p>
                
                <div className="flex items-end gap-2">
                  <span className={`text-5xl font-black italic tracking-tighter ${pred.daysLeft < 10 ? 'text-red-600' : 'text-indigo-600'}`}>
                    {pred.daysLeft}
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">GÜN KALDI</span>
                </div>
                
                <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-500 uppercase">{new Date(pred.runoutDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Şipariş Geç</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* AI Management Section */}
      <div className="bg-indigo-600 rounded-[4rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-indigo-600/30">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform">
          <Sparkles size={240} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-4">Ürün Girişi</h2>
          <p className="text-indigo-100 text-sm font-bold mb-10 leading-relaxed uppercase tracking-tighter italic opacity-80">
            Fatura veya ürün bilgilerini asistanınıza iletin. Aura Intelligence stok adetlerini, maliyetleri ve kategorileri otomatik ayrıştırır.
          </p>
          <form onSubmit={handleAiInput} className="flex gap-4">
            <div className="flex-1 relative">
              <Sparkles className="w-4 h-4 absolute left-6 top-6 text-indigo-600" />
              <input 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full bg-white text-gray-900 rounded-[2rem] pl-14 pr-8 py-5 text-sm font-black italic outline-none focus:ring-4 focus:ring-white/20 transition-all placeholder:text-gray-300"
                placeholder='Örn: "Bugün 10 adet hindistan cevizi masaj yağı aldım, ₺1200 ödedim"'
              />
            </div>
            <button className="px-10 py-5 bg-white text-indigo-600 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95">
              İşle
            </button>
          </form>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-[#FBFCFF]">
          <div>
            <h4 className="text-2xl font-black italic tracking-tighter uppercase italic text-gray-900">Stok Portföyü</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kayıtlı Ürünlerin Detay Listesi</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400">Ürün / Detay</th>
                <th className="px-10 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400">Kategori</th>
                <th className="px-10 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400">Birim Maliyet</th>
                <th className="px-10 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">Mevcut Stok</th>
                <th className="px-10 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-all group">
                  <td className="px-10 py-8">
                    <p className="font-black text-lg italic tracking-tighter text-gray-900 uppercase italic">{item.name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ref ID: {item.id.slice(0,8)}</p>
                  </td>
                  <td className="px-10 py-8">
                    <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-xl font-black italic text-gray-900 tracking-tighter italic">₺{item.price.toLocaleString('tr-TR')}</p>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-2xl font-black italic ${item.stock < 5 ? 'text-red-600' : 'text-indigo-600'}`}>
                        {item.stock}
                      </span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ADET / BİRİM</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedProduct(item)}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all"
                      >
                        <Settings2 className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-red-600 hover:border-red-100 shadow-sm transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Norms Management Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-[#FBFCFF]">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase italic text-gray-900">Kullanım Normları</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedProduct.name}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-widest italic pt-1">
                    Hangi hizmette ne kadar ürün kullanıldığını belirleyerek "Aura Predictor" stok öngörücüsünü aktifleştirin.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanımlı Normlar</p>
                    <Plus className="w-4 h-4 text-indigo-600 cursor-pointer" />
                  </div>
                  
                  {usageNorms.filter(n => n.productId === selectedProduct.id).map(norm => (
                    <div key={norm.id} className="p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Beaker className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase text-gray-900 italic tracking-tight">
                            {services.find(s => s.id === norm.serviceId)?.name || 'Hizmet Tanımsız'}
                          </p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            Seans Başı: {norm.amountPerService} Birim
                          </p>
                        </div>
                      </div>
                      <X className="w-4 h-4 text-gray-300 hover:text-red-500 cursor-pointer" />
                    </div>
                  ))}

                  {usageNorms.filter(n => n.productId === selectedProduct.id).length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                       <Beaker className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Henüz norm tanımlanmamış</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-10 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex-1">
                    <select 
                      className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-600 shadow-sm transition-all"
                      onChange={(e) => {
                        if(e.target.value) {
                           addUsageNorm({
                             productId: selectedProduct.id,
                             serviceId: e.target.value,
                             amountPerService: 1
                           });
                        }
                      }}
                    >
                      <option value="">Yeni Hizmet Seç...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                    Kaydet ve Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
