import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenBackground from '../../components/ScreenBackground';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients, spacing, radius, type, glow } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresa tu email y contraseña');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.logoWrap}>
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
                <Ionicons name="trending-up" size={38} color="#03140C" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>MI TRADING</Text>
            <Text style={styles.subtitle}>Diario de operaciones · capital · rentabilidad</Text>

            <View style={styles.form}>
              <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
              <View style={styles.formPadding}>
                <Feedback type="error" message={error} />

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tucorreo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

                <Button title="Iniciar sesión" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />
              </View>
            </View>

            <Pressable style={styles.link} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>
                ¿No tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '800' }}>Regístrate</Text>
              </Text>
            </Pressable>

            <View style={styles.features}>
              {[
                { icon: 'analytics-outline', text: 'Gráficos de capital' },
                { icon: 'pie-chart-outline', text: 'Rentabilidad real' },
                { icon: 'git-compare-outline', text: 'Long vs Short' },
              ].map((f) => (
                <View key={f.text} style={styles.feature}>
                  <Ionicons name={f.icon} size={13} color={colors.primary} />
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  logoWrap: {
    alignSelf: 'center',
    borderRadius: radius.xl,
    ...glow(colors.primary, 0.45, 26, 12),
  },
  logo: {
    width: 86,
    height: 86,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.lg,
    letterSpacing: 3,
  },
  subtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8, letterSpacing: 0.4 },
  form: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  formPadding: { padding: spacing.md },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.textMuted, fontSize: 13 },
  features: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, flexWrap: 'wrap' },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
    marginBottom: 6,
  },
  featureText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginLeft: 5, letterSpacing: 0.4 },
});
