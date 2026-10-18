import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenBackground from '../../components/ScreenBackground';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients, spacing, radius } from '../../theme/colors';

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
    if (!name.trim() || !email.trim() || !password) return setError('Completa todos los campos');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirm) return setError('Las contraseñas no coinciden');

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
    <ScreenBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>CREAR CUENTA</Text>
            <Text style={styles.subtitle}>Empieza a medir tu rentabilidad como un profesional</Text>

            <View style={styles.form}>
              <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
              <View style={styles.formPadding}>
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
              </View>
            </View>

            <Pressable style={styles.link} onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta? <Text style={{ color: colors.primary, fontWeight: '800' }}>Inicia sesión</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 2.4 },
  subtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
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
});
