import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import ScreenBackground from '../../components/ScreenBackground';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../api/client';
import { colors, gradients, spacing, radius, type, glow } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, updateProfile, signOut, deleteAccount } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError('');
    setMessage('');
    if (!name.trim() || !email.trim()) return setError('Nombre y email son obligatorios');
    if (password && password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');

    setSaving(true);
    try {
      const fields = { name: name.trim(), email: email.trim() };
      if (password) fields.password = password;
      await updateProfile(fields);
      setPassword('');
      setMessage('Datos actualizados');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress: signOut },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Se eliminarán tu cuenta, tus operaciones y tus aportes. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              setError(err.message);
            }
          },
        },
      ]
    );
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.section}>
          <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
          <View style={styles.sectionPadding}>
            <Text style={styles.sectionTitle}>Editar mis datos</Text>
            <Feedback type="error" message={error} />
            {message ? <Feedback type="success" message={message} /> : null}

            <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Nueva contraseña (opcional)"
              value={password}
              onChangeText={setPassword}
              placeholder="Dejar vacío para no cambiarla"
              secureTextEntry
            />

            <Button title="Guardar cambios" onPress={save} loading={saving} />
          </View>
        </View>

        <View style={styles.section}>
          <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
          <View style={styles.sectionPadding}>
            <Text style={styles.sectionTitle}>Sesión</Text>
            <Button title="Cerrar sesión" variant="ghost" onPress={confirmSignOut} />
            <View style={{ height: spacing.sm }} />
            <Button title="Eliminar mi cuenta" variant="danger" onPress={confirmDelete} />
          </View>
        </View>

        <View style={styles.info}>
          <Ionicons name="pulse-outline" size={13} color={colors.textDim} />
          <Text style={styles.infoText}>Servidor: {BASE_URL}</Text>
        </View>
        <Text style={styles.footer}>MI TRADING · v1.0.0</Text>
        <View style={{ height: 110 }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, alignItems: 'stretch' },
  avatarWrap: { alignSelf: 'center', borderRadius: radius.round, marginTop: spacing.md, ...glow(colors.primary, 0.4, 24, 10) },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  initials: { color: '#03140C', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: spacing.md },
  email: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: spacing.lg },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionPadding: { padding: spacing.md },
  sectionTitle: { ...type.micro, color: colors.textMuted, marginBottom: spacing.md },
  info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  infoText: { color: colors.textDim, fontSize: 10, marginLeft: 5 },
  footer: { color: colors.textDim, textAlign: 'center', fontSize: 10, marginTop: 8, letterSpacing: 1.2, fontWeight: '700' },
});
