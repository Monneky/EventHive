import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { OrganizationMember } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  organizer: 'Organizador',
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#22c55e',
  organizer: '#4ade80',
};

const ORG_ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  member: 'Miembro',
};

export default function HomeScreen() {
  const { profile, signOut, session } = useAuth();
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);

  const role = profile?.role ?? 'organizer';
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? '#0a7ea4';

  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('profile_id', session.user.id)
      .then(async ({ data }) => {
        const memberships = data ?? [];
        setMemberships(memberships);
        const pending = await AsyncStorage.getItem('@eventhive/pendingOrg');
        if (pending === 'true') {
          await AsyncStorage.removeItem('@eventhive/pendingOrg');
          router.push('/(app)/create-org');
        }
      });
  }, [session?.user.id]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.greeting}>
          Hola, {profile?.full_name ?? 'Usuario'} 👋
        </ThemedText>

        <View style={[styles.badge, { backgroundColor: roleColor }]}>
          <ThemedText style={styles.badgeText}>{roleLabel}</ThemedText>
        </View>

        <ThemedText style={styles.sectionTitle}>Organizaciones</ThemedText>

        {memberships.length === 0 ? (
          <View style={styles.emptyOrgs}>
            <ThemedText style={styles.emptyText}>No perteneces a ninguna organización.</ThemedText>
            <Pressable style={styles.createOrgButton} onPress={() => router.push('/(app)/create-org')}>
              <ThemedText style={styles.createOrgText}>Crear organización</ThemedText>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={memberships}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.orgCard}>
                <ThemedText style={styles.orgName}>{item.organizations?.name ?? '—'}</ThemedText>
                <View style={styles.orgRoleBadge}>
                  <ThemedText style={styles.orgRoleText}>
                    {ORG_ROLE_LABELS[item.role] ?? item.role}
                  </ThemedText>
                </View>
              </View>
            )}
            ListFooterComponent={
              <Pressable style={styles.addOrgButton} onPress={() => router.push('/(app)/create-org')}>
                <ThemedText style={styles.addOrgText}>+ Crear otra organización</ThemedText>
              </Pressable>
            }
          />
        )}
      </View>

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  greeting: {
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#0d1512',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  list: {
    width: '100%',
  },
  orgCard: {
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
  orgName: {
    fontSize: 15,
    fontWeight: '600',
  },
  orgRoleBadge: {
    backgroundColor: '#1a3d2b',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orgRoleText: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '600',
  },
  emptyOrgs: {
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  emptyText: {
    opacity: 0.5,
    fontSize: 14,
    textAlign: 'center',
  },
  createOrgButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  createOrgText: {
    color: '#0d1512',
    fontWeight: '700',
    fontSize: 15,
  },
  addOrgButton: {
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addOrgText: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 16,
  },
});
