"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Package, Sparkles, Trash2, Receipt } from "lucide-react";

export default function InventoryPage() {
  const { inventory, addProduct } = useStore();
  const [aiInput, setAiInput] = useState('');

  const handleAiInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput) return;
    
    // Simulate AI extraction logic
    let name = "Yeni Ürün";
    let category = "Genel";
    let price = 0;
    let stock = 1;

    const lower = aiInput.toLowerCase();
    
    // Name extraction
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

  const totalValue = inventory.reduce((s, p) => s + (p.price * p.stock), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-[fadeIn_0.5s_ease]">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3 text-gray-900">
            <Package className="w-8 h-8 text-indigo-600" /> Akıllı Stok
          </h1>
          <p className="text-gray-500 text-sm font-semibold">Yapay zeka asistanına aldığınız ürünü yazın, o otomatik kaydetsin.</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Stok Değeri</p>
            <p className="text-2xl font-black text-indigo-700">₺{totalValue.toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="card-apple p-6 mb-8 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] shadow-sm group hover:border-indigo-200 transition-all">
        <form onSubmit={handleAiInput} className="flex gap-4">
          <div className="flex-1 relative">
            <Sparkles className="w-4 h-4 absolute left-4 top-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <input 
              type="text" 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="w-full bg-white border border-indigo-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder='Örn: "Bugün 10 litre hindistan cevizi masaj yağı aldım, 500 tl ödedim"'
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm hover:scale-[1.02]">
            Sisteme İşle ✓
          </button>
        </form>
      </div>

      <div className="card-apple overflow-hidden border border-gray-100 rounded-[2rem] shadow-sm bg-white">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-black text-[11px] uppercase tracking-widest text-gray-400">Ürün Adı</th>
              <th className="px-6 py-4 font-black text-[11px] uppercase tracking-widest text-gray-400">Kategori</th>
              <th className="px-6 py-4 font-black text-[11px] uppercase tracking-widest text-gray-400">Maliyet (Birim)</th>
              <th className="px-6 py-4 font-black text-[11px] uppercase tracking-widest text-gray-400 text-right">Güncel Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inventory.length === 0 ? (
                <tr>
                    <td colSpan={4} className="p-20 text-center text-gray-400 font-bold">Stok kaydı bulunamadı.</td>
                </tr>
            ) : (
                inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition group">
                        <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                        <td className="px-6 py-4">
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{item.category}</span>
                        </td>
                        <td className="px-6 py-4 font-bold">₺{item.price.toLocaleString('tr-TR')}</td>
                        <td className="px-6 py-4 text-right">
                            <span className="font-black text-gray-900 text-lg">{item.stock}</span>
                            <span className="text-xs text-gray-400 font-bold ml-1">Birim</span>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
