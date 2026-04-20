import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Organization } from '@/types';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { profile, session, signOut } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    supabase
      .from('organization_members')
      .select('organizations(*)')
      .eq('profile_id', session.user.id)
      .limit(1)
      .single()
      .then(({ data }: any) => {
        setOrg(data?.organizations ?? null);
      });
  }, [session?.user.id]);

  const routes = [
    { name: 'index', label: 'Dashboard', icon: 'home-outline' as const },
    { name: 'clients', label: 'Clientes', icon: 'people-outline' as const },
  ];

  const activeRoute = props.state.routes[props.state.index]?.name;

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {profile?.full_name ?? 'Usuario'}
          </Text>
          {org && (
            <Text style={styles.orgName} numberOfLines={1}>
              {org.name}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Menu items */}
        <View style={styles.menu}>
          {routes.map((route) => {
            const isActive = activeRoute === route.name;
            return (
              <Pressable
                key={route.name}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => props.navigation.navigate(route.name)}
              >
                <Ionicons
                  name={route.icon}
                  size={20}
                  color={isActive ? '#0d1512' : '#4ade80'}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {route.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <Pressable style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#0d1512', width: 260 },
      }}
    >
      <Drawer.Screen name="index" />
      <Drawer.Screen name="clients" />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#0d1512',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#0d1512',
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    color: '#ECEDEE',
    fontSize: 16,
    fontWeight: '700',
  },
  orgName: {
    color: '#4a6358',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a3d2b',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  menu: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#22c55e',
  },
  menuIcon: {},
  menuLabel: {
    color: '#ECEDEE',
    fontSize: 15,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#0d1512',
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 26,
    paddingVertical: 14,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '500',
  },
});
