import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/theme';

import HistoryScreen from '../screens/HistoryScreen';
import ManualGameEntryScreen from '../screens/ManualGameEntryScreen';

export type HistoryStackParamList = {
  HistoryHome: undefined;
  ManualGameEntry: undefined;
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStackNavigator() {
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
        name="HistoryHome"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Stack.Screen
        name="ManualGameEntry"
        component={ManualGameEntryScreen}
        options={{ title: 'Add Game' }}
      />
    </Stack.Navigator>
  );
}
