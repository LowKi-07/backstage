import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/ui';
import { colors } from '../theme';

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
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {top ? renderRoute(top) : active.render()}
        {!top ? (
          <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {tabs.map((t) => {
              const isActive = t.key === active.key;
              return (
                <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)} accessibilityRole="tab" accessibilityState={{ selected: isActive }}>
                  <View>
                    <Icon name={isActive ? t.icon.replace('-outline', '') : t.icon} size={23} color={isActive ? colors.ink : colors.inkMuted} />
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 11, color: colors.inkMuted, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});
