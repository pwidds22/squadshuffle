import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Public RevenueCat SDK keys, inlined at build time from .env or EAS environment variables.
// See .env.example.
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const PREMIUM_ENTITLEMENT_ID = 'premium';
const SUBSCRIPTION_CACHE_KEY = '@squadshuffle_subscription_status';

// ⚠️ SCREENSHOT MODE: Set to true to bypass paywall for taking App Store screenshots
// ⚠️ IMPORTANT: Set back to false before submitting to App Store!
const DEV_BYPASS_PAYWALL = false;

// Module-level flag to prevent double initialization (survives re-renders and Strict Mode)
let revenueCatConfigured = false;

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  checkSubscription: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isPremium, setIsPremium] = useState(DEV_BYPASS_PAYWALL);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Initialize RevenueCat
  useEffect(() => {
    const init = async () => {
      try {
        const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

        if (!apiKey) {
          console.warn('RevenueCat API key not configured for this platform');
          setIsLoading(false);
          return;
        }

        // Only configure once (module-level flag survives Strict Mode double-mount)
        if (!revenueCatConfigured) {
          await Purchases.configure({ apiKey });
          revenueCatConfigured = true;
        }
        setIsConfigured(true);

        // Load cached status first for instant UI (skip if dev bypass enabled)
        if (!DEV_BYPASS_PAYWALL) {
          const cached = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
          if (cached) {
            const { isPremium: cachedPremium } = JSON.parse(cached);
            setIsPremium(cachedPremium);
          }
        }

        // Then verify with server
        await checkSubscriptionStatus();
        await loadOfferings();
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    // Skip if RevenueCat hasn't been configured yet
    if (!revenueCatConfigured) {
      return;
    }

    // Don't overwrite if dev bypass is enabled
    if (DEV_BYPASS_PAYWALL) {
      return;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const premium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
      setIsPremium(premium);

      // Cache the status
      await AsyncStorage.setItem(
        SUBSCRIPTION_CACHE_KEY,
        JSON.stringify({ isPremium: premium, checkedAt: Date.now() })
      );
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, []);

  const loadOfferings = async () => {
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      if (fetchedOfferings.current) {
        setOfferings(fetchedOfferings.current);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const premium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
      setIsPremium(premium);

      // Update cache
      await AsyncStorage.setItem(
        SUBSCRIPTION_CACHE_KEY,
        JSON.stringify({ isPremium: premium, checkedAt: Date.now() })
      );

      return premium;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const premium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
      setIsPremium(premium);

      // Update cache
      await AsyncStorage.setItem(
        SUBSCRIPTION_CACHE_KEY,
        JSON.stringify({ isPremium: premium, checkedAt: Date.now() })
      );

      return premium;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        offerings,
        checkSubscription: checkSubscriptionStatus,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
