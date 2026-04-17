import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Business, Branch, BusinessSettings, CurrencyRate, BookingSettings, PaymentDefinition, BankAccount, ExpenseCategory, ReferralSource, ConsentFormTemplate, AppUser } from './types';
import { supabase } from '@/lib/supabase';
import { toCamel } from '@/lib/utils/converter';

interface BusinessContextType {
    allBusinesses: Business[];
    currentTenant: Business | null;
    currentBranch: Branch | null;
    branches: Branch[];
    settings: BusinessSettings;
    bookingSettings: BookingSettings | null;
    allRates: CurrencyRate[];
    paymentDefinitions: PaymentDefinition[];
    bankAccounts: BankAccount[];
    expenseCategories: ExpenseCategory[];
    referralSources: ReferralSource[];
    consentFormTemplates: ConsentFormTemplate[];
    
    setAllBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
    setCurrentTenant: React.Dispatch<React.SetStateAction<Business | null>>;
    setCurrentBranch: React.Dispatch<React.SetStateAction<Branch | null>>;
    setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
    setSettings: (s: Partial<BusinessSettings> | ((prev: BusinessSettings) => BusinessSettings)) => void;
    setBookingSettings: React.Dispatch<React.SetStateAction<BookingSettings | null>>;
    setAllRates: React.Dispatch<React.SetStateAction<CurrencyRate[]>>;
    setPaymentDefinitions: React.Dispatch<React.SetStateAction<PaymentDefinition[]>>;
    setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
    setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
    setReferralSources: React.Dispatch<React.SetStateAction<ReferralSource[]>>;
    setConsentFormTemplates: React.Dispatch<React.SetStateAction<ConsentFormTemplate[]>>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
    const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
    const [currentTenant, setCurrentTenant] = useState<Business | null>(null);
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
    const [allRates, setAllRates] = useState<CurrencyRate[]>([
        { code: 'USD', name: 'US Dollar', rate: 44.74 },
        { code: 'EUR', name: 'Euro', rate: 52.75 }
    ]);
    const [paymentDefinitions, setPaymentDefinitions] = useState<PaymentDefinition[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
    const [consentFormTemplates, setConsentFormTemplates] = useState<ConsentFormTemplate[]>([]);
    const [settings, setSettingsState] = useState<BusinessSettings>({ 
        startHour: 9, 
        endHour: 21, 
        openDays: [1,2,3,4,5,6], 
        isAutoMarketingEnabled: false,
        aiApprovalMode: 'manual'
    });

    const setSettings = React.useCallback((s: Partial<BusinessSettings> | ((prev: BusinessSettings) => BusinessSettings)) => {
        if (typeof s === 'function') {
            setSettingsState(s);
        } else {
            setSettingsState(prev => ({ ...prev, ...s }));
        }
    }, []);

    const contextValue = useMemo(() => ({
        allBusinesses, currentTenant, currentBranch, branches, settings, bookingSettings, allRates,
        paymentDefinitions, bankAccounts, expenseCategories, referralSources, consentFormTemplates,
        setAllBusinesses, setCurrentTenant, setCurrentBranch, setBranches, setSettings, setBookingSettings,
        setAllRates, setPaymentDefinitions, setBankAccounts, setExpenseCategories, setReferralSources, setConsentFormTemplates
    }), [
        allBusinesses, currentTenant, currentBranch, branches, settings, bookingSettings, allRates,
        paymentDefinitions, bankAccounts, expenseCategories, referralSources, consentFormTemplates
    ]);

    return (
        <BusinessContext.Provider value={contextValue}>
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusiness = () => {
    const context = useContext(BusinessContext);
    if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
    return context;
};
