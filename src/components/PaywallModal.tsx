import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { useSubscription } from '../contexts/SubscriptionContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const { offerings, purchasePackage, restorePurchases } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    const pkg = offerings?.availablePackages.find(
      (p) => p.identifier === packageId
    );
    if (!pkg) {
      setError('Product not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    const success = await purchasePackage(pkg);
    setIsLoading(false);

    if (success) {
      onClose();
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    setError(null);

    const restored = await restorePurchases();
    setIsLoading(false);

    if (restored) {
      onClose();
    } else {
      setError('No purchases found to restore');
    }
  };

  const features = [
    { icon: 'trophy-outline' as const, text: 'Full leaderboard & player stats' },
    { icon: 'time-outline' as const, text: 'Complete game history' },
    { icon: 'close-circle-outline' as const, text: 'Remove all ads' },
    { icon: 'heart-outline' as const, text: 'Support indie development' },
  ];

  const monthlyPackage = offerings?.availablePackages.find(
    (p) => p.identifier === '$rc_monthly'
  );
  const lifetimePackage = offerings?.availablePackages.find(
    (p) => p.identifier === '$rc_lifetime'
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="star" size={40} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Unlock Premium</Text>
              <Text style={styles.subtitle}>
                Get the full Squad Shuffle experience
              </Text>
            </View>

            <View style={styles.featureList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons
                    name={feature.icon}
                    size={22}
                    color={Colors.primary}
                  />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.loader}
              />
            ) : (
              <View style={styles.buttonContainer}>
                {lifetimePackage && (
                  <TouchableOpacity
                    style={[styles.purchaseButton, styles.lifetimeButton]}
                    onPress={() => handlePurchase('$rc_lifetime')}
                  >
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                    <Text style={styles.priceText}>
                      {lifetimePackage.product.priceString} forever
                    </Text>
                    <Text style={styles.buttonSubtext}>One-time purchase</Text>
                  </TouchableOpacity>
                )}

                {monthlyPackage && (
                  <TouchableOpacity
                    style={styles.purchaseButton}
                    onPress={() => handlePurchase('$rc_monthly')}
                  >
                    <Text style={styles.priceText}>
                      {monthlyPackage.product.priceString}/month
                    </Text>
                    <Text style={styles.buttonSubtext}>Cancel anytime</Text>
                  </TouchableOpacity>
                )}

                {!monthlyPackage && !lifetimePackage && (
                  <View style={styles.noProductsContainer}>
                    <Text style={styles.noProductsText}>
                      Products loading...
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              Payment will be charged to your Apple ID account. Subscriptions
              automatically renew unless cancelled at least 24 hours before the
              end of the current period.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  featureList: {
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  featureText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: Colors.error + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: Spacing.sm,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  lifetimeButton: {
    backgroundColor: Colors.accent,
    position: 'relative',
    paddingTop: Spacing.lg,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  bestValueText: {
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
    color: Colors.text,
  },
  priceText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  buttonSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    opacity: 0.8,
    marginTop: 2,
  },
  noProductsContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  noProductsText: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  restoreButton: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
});
