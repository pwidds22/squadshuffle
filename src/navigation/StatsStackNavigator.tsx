import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/theme';

import StatsHomeScreen from '../screens/stats/StatsHomeScreen';
import PlayerDetailScreen from '../screens/stats/PlayerDetailScreen';
import TeamRecordsScreen from '../screens/stats/TeamRecordsScreen';

export type StatsStackParamList = {
  StatsHome: undefined;
  PlayerDetail: { playerId: string; playerName: string };
  TeamRecords: { gameId?: string };
};

const Stack = createNativeStackNavigator<StatsStackParamList>();

export default function StatsStackNavigator() {
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
      }}
    >
      <Stack.Screen
        name="StatsHome"
        component={StatsHomeScreen}
        options={{ title: 'Stats' }}
      />
      <Stack.Screen
        name="PlayerDetail"
        component={PlayerDetailScreen}
        options={({ route }) => ({ title: route.params.playerName })}
      />
      <Stack.Screen
        name="TeamRecords"
        component={TeamRecordsScreen}
        options={{ title: 'Team Records' }}
      />
    </Stack.Navigator>
  );
}
