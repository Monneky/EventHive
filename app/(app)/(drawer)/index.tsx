import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Client, OrganizationMember } from '@/types';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

export default function DashboardScreen() {
  const { profile, session } = useAuth();
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState<number>(0);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
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

  const loadData = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const [countRes, recentRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', activeOrgId),
      supabase
        .from('clients')
        .select('*')
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    setTotalClients(countRes.count ?? 0);
    setRecentClients(recentRes.data ?? []);
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeOrg = memberships.find((m) => m.organization_id === activeOrgId);

  return (
    <ThemedView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <DrawerToggleButton tintColor="#22c55e" />
        <View style={styles.topBarRight}>
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
        </View>
      </View>

      <FlatList
        data={recentClients}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Greeting */}
            <View style={styles.greeting}>
              <ThemedText type="title">Hola, {profile?.full_name?.split(' ')[0] ?? 'Usuario'} 👋</ThemedText>
              {activeOrg && (
                <ThemedText style={styles.orgLabel}>{activeOrg.organizations?.name}</ThemedText>
              )}
            </View>

            {/* Metric cards */}
            <View style={styles.cards}>
              <View style={styles.card}>
                <ThemedText style={styles.cardValue}>{loading ? '—' : totalClients}</ThemedText>
                <ThemedText style={styles.cardLabel}>Clientes</ThemedText>
              </View>
              <View style={[styles.card, styles.cardMuted]}>
                <ThemedText style={styles.cardValue}>0</ThemedText>
                <ThemedText style={styles.cardLabel}>Cotizaciones{'\n'}pendientes</ThemedText>
              </View>
            </View>

            {/* Recent clients header */}
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Clientes recientes</ThemedText>
              <Pressable onPress={() => router.push('/(app)/(drawer)/clients')}>
                <ThemedText style={styles.sectionLink}>Ver todos</ThemedText>
              </Pressable>
            </View>

            {!activeOrgId && (
              <View style={styles.empty}>
                <ThemedText style={styles.emptyText}>Crea una organización para comenzar.</ThemedText>
              </View>
            )}

            {activeOrgId && !loading && recentClients.length === 0 && (
              <View style={styles.empty}>
                <ThemedText style={styles.emptyText}>Aún no hay clientes.</ThemedText>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.clientRow}
            onPress={() => router.push({ pathname: '/(app)/client-form', params: { orgId: activeOrgId, clientId: item.id } })}
          >
            <View style={styles.clientAvatar}>
              <ThemedText style={styles.clientAvatarText}>
                {item.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.clientInfo}>
              <ThemedText style={styles.clientName}>{item.name}</ThemedText>
              {item.email ? <ThemedText style={styles.clientSub}>{item.email}</ThemedText> : null}
              {!item.email && item.phone ? <ThemedText style={styles.clientSub}>{item.phone}</ThemedText> : null}
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </Pressable>
        )}
        ListFooterComponent={
          activeOrgId ? (
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push({ pathname: '/(app)/client-form', params: { orgId: activeOrgId } })}
            >
              <ThemedText style={styles.quickActionText}>+ Nuevo cliente</ThemedText>
            </Pressable>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 24,
    marginBottom: 8,
  },
  topBarRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  orgSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  orgChip: {
    borderWidth: 1,
    borderColor: '#1a3d2b',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  orgChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  orgChipText: {
    fontSize: 12,
    color: '#4ade80',
  },
  orgChipTextActive: {
    color: '#0d1512',
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 0,
  },
  greeting: {
    marginBottom: 24,
    gap: 4,
  },
  orgLabel: {
    color: '#4a6358',
    fontSize: 14,
  },
  cards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  card: {
    flex: 1,
    backgroundColor: '#0d1f18',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  cardMuted: {
    borderColor: '#1a3d2b',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22c55e',
  },
  cardLabel: {
    fontSize: 12,
    opacity: 0.6,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLink: {
    fontSize: 13,
    color: '#22c55e',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3d2b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#0d1f18',
    gap: 12,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a3d2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    color: '#4ade80',
    fontWeight: '700',
    fontSize: 15,
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
  },
  clientSub: {
    fontSize: 12,
    opacity: 0.55,
  },
  chevron: {
    fontSize: 20,
    color: '#4ade80',
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 14,
  },
  quickAction: {
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  quickActionText: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 14,
  },
});
