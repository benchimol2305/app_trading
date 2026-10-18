import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TradesScreen from '../screens/trades/TradesScreen';
import TradeFormScreen from '../screens/trades/TradeFormScreen';
import TradeDetailScreen from '../screens/trades/TradeDetailScreen';
import DepositsScreen from '../screens/deposits/DepositsScreen';
import DepositFormScreen from '../screens/deposits/DepositFormScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenHeader = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: colors.background },
};

const tabHeader = { ...screenHeader, headerTitleAlign: 'left' };

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 60, paddingBottom: 6, paddingTop: 6 },
        ...tabHeader,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Resumen',
          tabBarLabel: 'Resumen',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Trades"
        component={TradesScreen}
        options={{
          title: 'Operaciones',
          tabBarLabel: 'Operaciones',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Deposits"
        component={DepositsScreen}
        options={{
          title: 'Aportes',
          tabBarLabel: 'Aportes',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenHeader}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="TradeForm" component={TradeFormScreen} options={{ title: 'Operación' }} />
      <Stack.Screen name="TradeDetail" component={TradeDetailScreen} options={{ title: 'Detalle de la operación' }} />
      <Stack.Screen name="DepositForm" component={DepositFormScreen} options={{ title: 'Movimiento' }} />
    </Stack.Navigator>
  );
}

export default function Navigator() {
  const { token } = useAuth();
  return token ? <AppStack /> : <AuthStack />;
}
