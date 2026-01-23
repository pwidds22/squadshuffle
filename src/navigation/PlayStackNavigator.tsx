import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/theme';
import type { PlayStackParamList } from '../types';

import PlayHomeScreen from '../screens/play/PlayHomeScreen';
import PlayerSelectionScreen from '../screens/play/PlayerSelectionScreen';
import GameSelectionScreen from '../screens/play/GameSelectionScreen';
import TeamConfigScreen from '../screens/play/TeamConfigScreen';
import RandomizerScreen from '../screens/play/RandomizerScreen';
import TeamRevealScreen from '../screens/play/TeamRevealScreen';
import ActiveGameScreen from '../screens/play/ActiveGameScreen';

const Stack = createNativeStackNavigator<PlayStackParamList>();

export default function PlayStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen
        name="PlayHome"
        component={PlayHomeScreen}
        options={{ title: 'Play' }}
      />
      <Stack.Screen
        name="PlayerSelection"
        component={PlayerSelectionScreen}
        options={{ title: 'Select Players' }}
      />
      <Stack.Screen
        name="GameSelection"
        component={GameSelectionScreen}
        options={{ title: 'Choose Game' }}
      />
      <Stack.Screen
        name="TeamConfig"
        component={TeamConfigScreen}
        options={{ title: 'Configure Teams' }}
      />
      <Stack.Screen
        name="Randomizer"
        component={RandomizerScreen}
        options={{
          title: 'Shuffle!',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TeamReveal"
        component={TeamRevealScreen}
        options={{
          title: 'Your Teams',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="ActiveGame"
        component={ActiveGameScreen}
        options={{
          title: 'Game On!',
          headerBackVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
