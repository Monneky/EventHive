import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

export default function CreateOrgScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Ingresa el nombre de la organización.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('No hay sesión activa.');
      setLoading(false);
      return;
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single();

    if (orgError) {
      setError(orgError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({ organization_id: org.id, profile_id: user.id, role: 'owner' });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace('/(app)/(tabs)/');
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ThemedText type="title" style={styles.title}>Crear organización</ThemedText>
        <ThemedText style={styles.subtitle}>
          Las organizaciones agrupan tus eventos. Puedes crear más después.
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Nombre de la organización"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleCreate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Crear organización</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.replace('/(app)/(tabs)/')}>
          <ThemedText type="link" style={styles.skip}>Saltar por ahora</ThemedText>
        </Pressable>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 13,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1a3d2b',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#0d1f18',
  },
  error: {
    color: '#ff4d4d',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#0d1512',
    fontSize: 16,
    fontWeight: '700',
  },
  skip: {
    textAlign: 'center',
    marginTop: 4,
  },
});
