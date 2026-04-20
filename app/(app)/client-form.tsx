import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

export default function ClientFormScreen() {
  const { orgId, clientId } = useLocalSearchParams<{ orgId: string; clientId?: string }>();
  const isEditing = !!clientId;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
      .then(({ data }: { data: Client | null }) => {
        if (!data) return;
        setName(data.name);
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');
        setNotes(data.notes ?? '');
      });
  }, [clientId]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido.');
      return;
    }
    setLoading(true);
    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    const { error } = isEditing
      ? await supabase.from('clients').update(payload).eq('id', clientId)
      : await supabase.from('clients').insert({ ...payload, organization_id: orgId });

    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    router.back();
  }

  async function handleDelete() {
    Alert.alert('Eliminar cliente', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('clients').delete().eq('id', clientId!);
          router.back();
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <ThemedText style={styles.back}>‹ Volver</ThemedText>
            </Pressable>
            <ThemedText type="title">{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</ThemedText>
          </View>

          <Field label="Nombre *" value={name} onChangeText={setName} placeholder="Nombre completo o empresa" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="correo@ejemplo.com" keyboardType="email-address" />
          <Field label="Teléfono" value={phone} onChangeText={setPhone} placeholder="+52 55 0000 0000" keyboardType="phone-pad" />
          <Field label="Dirección" value={address} onChangeText={setAddress} placeholder="Calle, ciudad, estado" />
          <Field label="Notas" value={notes} onChangeText={setNotes} placeholder="Notas internas..." multiline />

          <Pressable style={[styles.saveButton, loading && styles.disabled]} onPress={handleSave} disabled={loading}>
            <ThemedText style={styles.saveText}>{loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente'}</ThemedText>
          </Pressable>

          {isEditing && (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <ThemedText style={styles.deleteText}>Eliminar cliente</ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4a6358"
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  scroll: {
    paddingBottom: 40,
    gap: 4,
  },
  header: {
    gap: 8,
    marginBottom: 28,
  },
  back: {
    color: '#22c55e',
    fontSize: 16,
  },
  field: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1a3d2b',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#ECEDEE',
    backgroundColor: '#0d1f18',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: {
    color: '#0d1512',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 15,
  },
});
