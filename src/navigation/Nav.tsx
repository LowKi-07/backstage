import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/ui';
import { colors, glassBar, radius } from '../theme';

export type Route =
  | { name: 'expense'; id: string }
  | { name: 'newExpense' }
  | { name: 'department'; id: string }
  | { name: 'budgetRequest'; departmentId?: string }
  | { name: 'profile' };

export interface TabDef {
  key: string;
  label: string;
  icon: string;
  badge?: number;
  render: () => React.ReactNode;
}

interface NavApi {
  push(route: Route): void;
  pop(): void;
  setTab(key: string): void;
  popToTab(key: string): void;
}

const NavContext = createContext<NavApi | null>(null);

export function useNav(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside TabNavigator');
  return ctx;
}

// Small hand-rolled navigator: bottom tabs plus a push/pop stack on top of them.
// Kept dependency-free so the app runs the same on iOS, Android and web.
export function TabNavigator({ tabs, renderRoute }: { tabs: TabDef[]; renderRoute: (r: Route) => React.ReactNode }) {
  const [tab, setTab] = useState(tabs[0].key);
  const [stack, setStack] = useState<Route[]>([]);
  const insets = useSafeAreaInsets();

  const api = useMemo<NavApi>(
    () => ({
      push: (r) => setStack((s) => [...s, r]),
      pop: () => setStack((s) => s.slice(0, -1)),
      setTab: (k) => setTab(k),
      popToTab: (k) => {
        setStack([]);
        setTab(k);
      },
    }),
    [],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length === 0) return false;
      setStack((s) => s.slice(0, -1));
      return true;
    });
    return () => sub.remove();
  }, [stack.length]);

  const top = stack[stack.length - 1];
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <NavContext.Provider value={api}>
      <View style={{ flex: 1 }}>
        {top ? renderRoute(top) : active.render()}
        {!top ? (
          <View style={[styles.tabBar, { bottom: Math.max(insets.bottom, 12) }]}>
            {tabs.map((t) => {
              const isActive = t.key === active.key;
              return (
                <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)} accessibilityRole="tab" accessibilityState={{ selected: isActive }}>
                  <View style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                    <Icon name={isActive ? t.icon.replace('-outline', '') : t.icon} size={21} color={isActive ? colors.onInk : colors.inkMuted} />
                    {t.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t.badge > 99 ? '99+' : t.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.tabLabel, isActive && { color: colors.ink, fontWeight: '700' }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </NavContext.Provider>
  );
}

const styles = StyleSheet.create({
  // Floating frosted pill; screens leave room for it via the scroll body's bottom padding.
  tabBar: {
    ...glassBar(),
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg + 6,
    paddingVertical: 8,
    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { width: 44, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tabIconActive: { backgroundColor: colors.ink },
  tabLabel: { fontSize: 11, color: colors.inkMuted, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.ink,
    borderWidth: 1.5,
    borderColor: colors.black,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.onInk, fontSize: 10, fontWeight: '700' },
});
