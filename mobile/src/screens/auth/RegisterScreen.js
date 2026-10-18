import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Input from '../../components/Input';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
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
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Registra tus operaciones y sigue tu rentabilidad</Text>

          <Feedback type="error" message={error} />

          <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secureTextEntry />
          <Input label="Repetir contraseña" value={confirm} onChangeText={setConfirm} placeholder="••••••••" secureTextEntry />

          <Button title="Registrarme" onPress={submit} loading={loading} style={{ marginTop: spacing.sm }} />

          <Pressable style={styles.link} onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '700' }}>Inicia sesión</Text>
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
  title: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: spacing.lg, marginTop: 6 },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.textMuted, fontSize: 14 },
});
