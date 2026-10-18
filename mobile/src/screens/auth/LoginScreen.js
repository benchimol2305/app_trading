import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../components/Input';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme/colors';

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="trending-up" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Mi Trading</Text>
          <Text style={styles.subtitle}>Tu diario de operaciones, capital y rentabilidad</Text>

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
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button title="Iniciar sesión" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />

          <Pressable style={styles.link} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Regístrate</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  logo: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: spacing.lg, marginTop: 6 },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.textMuted, fontSize: 14 },
});
