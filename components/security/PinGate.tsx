"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Check, Lock, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

interface PinGateProps {
    children: React.ReactNode;
    onSuccess?: () => void;
    title?: string;
    description?: string;
}

export default function PinGate({ 
    children, 
    onSuccess, 
    title = "YÖNETİCİ ONAYI GEREKLİ", 
    description = "Bu işlemi gerçekleştirmek için 4 haneli müdür PIN kodunu giriniz." 
}: PinGateProps) {
    const { currentBusiness, isManagerAuthorized, setManagerAuthorized } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    const managerPin = currentBusiness?.managerPin || "0000";

    const handlePinSubmit = (val: string) => {
        if (val === managerPin) {
            setIsOpen(false);
            setPin("");
            setError(false);
            setManagerAuthorized(true); // Seans boyunca yetki ver
            if (onSuccess) onSuccess();
        } else {
            setError(true);
            setPin("");
            // Hata efektini göstermek için salla
            setTimeout(() => setError(false), 500);
        }
    };

    const handleDigitClick = (digit: string) => {
        if (pin.length < 4) {
            const newPin = pin + digit;
            setPin(newPin);
            if (newPin.length === 4) {
                handlePinSubmit(newPin);
            }
        }
    };

    return (
        <>
            <div onClick={(e) => {
                e.stopPropagation();
                if (isManagerAuthorized) {
                    if (onSuccess) onSuccess();
                } else {
                    setIsOpen(true);
                }
            }}>
                {children}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ 
                                scale: 1, 
                                opacity: 1, 
                                y: 0,
                                x: error ? [0, -10, 10, -10, 10, 0] : 0
                            }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-[#0A0A1F] rounded-[3.5rem] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border border-indigo-100 dark:border-white/5"
                        >
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <Shield size={32} />
                                </div>
                                
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-2">{title}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed mb-10 max-w-[200px] mx-auto">
                                    {description}
                                </p>

                                {/* PIN Display */}
                                <div className="flex justify-center gap-4 mb-12">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div 
                                            key={i} 
                                            className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                                pin.length > i 
                                                ? 'bg-indigo-600 scale-125 shadow-lg shadow-indigo-200' 
                                                : 'bg-gray-100 dark:bg-white/5'
                                            } ${error ? 'bg-red-500' : ''}`}
                                        />
                                    ))}
                                </div>

                                {/* Numpad */}
                                <div className="grid grid-cols-3 gap-4 max-w-[240px] mx-auto">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((d, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (d === 'DEL') setPin(pin.slice(0, -1));
                                                else if (d !== '') handleDigitClick(d);
                                            }}
                                            disabled={d === ''}
                                            className={`h-16 rounded-2xl flex items-center justify-center font-black text-lg transition-all active:scale-90 ${
                                                d === '' ? 'opacity-0' : 
                                                d === 'DEL' ? 'text-gray-400 hover:text-red-500' : 
                                                'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-indigo-600 hover:text-white shadow-sm'
                                            }`}
                                        >
                                            {d === 'DEL' ? <X size={20} /> : d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-0 inset-x-0 bg-red-500 text-white py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={14} /> HATALI PIN KODU
                                </motion.div>
                            )}

                            <button 
                                onClick={() => setIsOpen(false)}
                                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
