import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useSubscription } from '../contexts/SubscriptionContext';
import PaywallModal from '../components/PaywallModal';

import PlayStackNavigator from './PlayStackNavigator';
import HistoryStackNavigator from './HistoryStackNavigator';
import StatsStackNavigator from './StatsStackNavigator';
import PlayersScreen from '../screens/PlayersScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

type TabIconName = 'dice' | 'time' | 'trophy' | 'people' | 'settings';

const tabIcons: Record<string, { active: TabIconName; inactive: `${TabIconName}-outline` }> = {
  Play: { active: 'dice', inactive: 'dice-outline' },
  History: { active: 'time', inactive: 'time-outline' },
  Stats: { active: 'trophy', inactive: 'trophy-outline' },
  Players: { active: 'people', inactive: 'people-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

const PREMIUM_TABS = ['History', 'Stats'];

export default function MainTabNavigator() {
  const { isPremium } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = tabIcons[route.name];
            const iconName = focused ? icons.active : icons.inactive;
            const isPremiumTab = PREMIUM_TABS.includes(route.name);

            return (
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={size} color={color} />
                {isPremiumTab && !isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={8} color={Colors.text} />
                  </View>
                )}
              </View>
            );
          },
          tabBarActiveTintColor: Colors.tabBarActive,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          tabBarStyle: {
            backgroundColor: Colors.tabBarBackground,
            borderTopColor: Colors.border,
          },
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen
          name="Play"
          component={PlayStackNavigator}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="History"
          component={HistoryStackNavigator}
          options={{ headerShown: false }}
          listeners={{
            tabPress: (e) => {
              if (!isPremium) {
                e.preventDefault();
                setShowPaywall(true);
              }
            },
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsStackNavigator}
          options={{ headerShown: false }}
          listeners={{
            tabPress: (e) => {
              if (!isPremium) {
                e.preventDefault();
                setShowPaywall(true);
              }
            },
          }}
        />
        <Tab.Screen
          name="Players"
          component={PlayersScreen}
          options={{ title: 'Players' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.accent,
    borderRadius: 6,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
