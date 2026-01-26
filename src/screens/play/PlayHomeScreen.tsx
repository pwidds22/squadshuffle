import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import BannerAd from '../../components/BannerAd';
import type { PlayStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<PlayStackParamList, 'PlayHome'>;

export default function PlayHomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleNewGame = () => {
    navigation.navigate('PlayerSelection');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="dice" size={80} color={Colors.primary} />
        <Text style={styles.title}>Squad Shuffle</Text>
        <Text style={styles.subtitle}>Random teams, real results</Text>

        <TouchableOpacity style={styles.button} onPress={handleNewGame}>
          <Ionicons name="add" size={24} color={Colors.text} />
          <Text style={styles.buttonText}>New Game</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. Select players{'\n'}
            2. Choose game type{'\n'}
            3. Shuffle teams{'\n'}
            4. Track scores & winners
          </Text>
        </View>
      </View>

      <BannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    width: '100%',
    maxWidth: 300,
  },
  infoTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
