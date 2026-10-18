import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { colors, gradients, glow } from '../theme/colors';

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
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '800', letterSpacing: 0.6, fontSize: 16 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={gradients.tabBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ),
        ...screenHeader,
        headerTitleAlign: 'left',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Resumen',
          tabBarLabel: 'Resumen',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Trades"
        component={TradesScreen}
        options={{
          title: 'Operaciones',
          tabBarLabel: 'Operaciones',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical" color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Deposits"
        component={DepositsScreen}
        options={{
          title: 'Aportes',
          tabBarLabel: 'Aportes',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size - 2} />,
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
      <Stack.Screen name="TradeDetail" component={TradeDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="DepositForm" component={DepositFormScreen} options={{ title: 'Movimiento' }} />
    </Stack.Navigator>
  );
}

export default function Navigator() {
  const { token } = useAuth();
  return token ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    height: 64,
    borderRadius: 22,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    overflow: 'hidden',
    ...glow('#000000', 0.5, 20, 12),
  },
});
