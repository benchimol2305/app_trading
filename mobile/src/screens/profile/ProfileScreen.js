import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../api/client';
import { colors, spacing, radius } from '../../theme/colors';

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={34} color={colors.primary} />
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <Card title="Editar mis datos">
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
      </Card>

      <Card title="Sesión">
        <Button title="Cerrar sesión" variant="ghost" onPress={confirmSignOut} />
        <View style={{ height: spacing.sm }} />
        <Button title="Eliminar mi cuenta" variant="danger" onPress={confirmDelete} />
      </Card>

      <Text style={styles.footer}>Mi Trading · Diario de operaciones</Text>
      <Text style={styles.footerSmall}>Servidor: {BASE_URL}</Text>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  avatar: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  name: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: spacing.sm },
  email: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: spacing.lg },
  footer: { color: colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: spacing.md },
  footerSmall: { color: colors.border, textAlign: 'center', fontSize: 10, marginTop: 4 },
});
