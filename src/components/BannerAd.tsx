import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  BannerAd as GoogleBannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Colors } from '../constants/theme';

// Use test ads in development, or when no production ad unit is configured.
// The production ad unit comes from EXPO_PUBLIC_ADMOB_IOS_BANNER_ID (see .env.example).
const AD_UNIT_ID =
  __DEV__ || !process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID
    ? TestIds.BANNER
    : process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID;

interface BannerAdProps {
  position?: 'top' | 'bottom';
}

export default function BannerAd({ position = 'bottom' }: BannerAdProps) {
  const { isPremium, isLoading } = useSubscription();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't show ads for premium users, during loading, or if there's an error
  if (isPremium || isLoading || adError) {
    return null;
  }

  // Only show on iOS for now (Android key not configured)
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        !adLoaded && styles.hidden,
      ]}
    >
      <GoogleBannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => setAdLoaded(true)}
        onAdFailedToLoad={(error) => {
          console.log('Ad failed to load:', error);
          setAdError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    width: '100%',
  },
  top: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
});
