import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

import PlayStackNavigator from './PlayStackNavigator';
import HistoryScreen from '../screens/HistoryScreen';
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

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
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
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsStackNavigator}
        options={{ headerShown: false }}
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
  );
}
