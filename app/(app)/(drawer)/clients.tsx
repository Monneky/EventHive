import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Client, OrganizationMember } from '@/types';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

export default function ClientsScreen() {
  const { session } = useAuth();
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('profile_id', session.user.id)
      .then(({ data }) => {
        const list = data ?? [];
        setMemberships(list);
        if (list.length > 0) setActiveOrgId(list[0].organization_id);
      });
  }, [session?.user.id]);

  const loadClients = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', activeOrgId)
      .order('name');
    setClients(data ?? []);
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const activeOrg = memberships.find((m) => m.organization_id === activeOrgId);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <DrawerToggleButton tintColor="#22c55e" />
        <ThemedText type="title">Clientes</ThemedText>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push({ pathname: '/(app)/client-form', params: { orgId: activeOrgId } })}
          disabled={!activeOrgId}
        >
          <ThemedText style={styles.addButtonText}>+ Nuevo</ThemedText>
        </Pressable>
      </View>

      {memberships.length > 1 && (
        <View style={styles.orgSelector}>
          {memberships.map((m) => (
            <Pressable
              key={m.organization_id}
              style={[styles.orgChip, m.organization_id === activeOrgId && styles.orgChipActive]}
              onPress={() => setActiveOrgId(m.organization_id)}
            >
              <ThemedText style={[styles.orgChipText, m.organization_id === activeOrgId && styles.orgChipTextActive]}>
                {m.organizations?.name ?? '—'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {!activeOrgId ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyText}>Crea una organización primero.</ThemedText>
        </View>
      ) : loading ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyText}>Cargando...</ThemedText>
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyText}>No hay clientes en {activeOrg?.organizations?.name}.</ThemedText>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push({ pathname: '/(app)/client-form', params: { orgId: activeOrgId } })}
          >
            <ThemedText style={styles.createButtonText}>+ Agregar cliente</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/client-form', params: { orgId: activeOrgId, clientId: item.id } })}
            >
              <View style={styles.cardLeft}>
                <ThemedText style={styles.clientName}>{item.name}</ThemedText>
                {item.email ? <ThemedText style={styles.clientSub}>{item.email}</ThemedText> : null}
                {item.phone ? <ThemedText style={styles.clientSub}>{item.phone}</ThemedText> : null}
              </View>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#0d1512',
    fontWeight: '700',
    fontSize: 14,
  },
  orgSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  orgChip: {
    borderWidth: 1,
    borderColor: '#1a3d2b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  orgChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  orgChipText: {
    fontSize: 13,
    color: '#4ade80',
  },
  orgChipTextActive: {
    color: '#0d1512',
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3d2b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#0d1f18',
  },
  cardLeft: {
    gap: 2,
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
  },
  clientSub: {
    fontSize: 13,
    opacity: 0.6,
  },
  chevron: {
    fontSize: 22,
    color: '#4ade80',
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 14,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#0d1512',
    fontWeight: '700',
    fontSize: 15,
  },
});
