import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, NavGlow, NavGlyph, NavGlyphName } from '../components/icons';
import { Text } from '../components/Text';
import { colors, font, shadow } from '../theme';

export type Route =
  | { name: 'expense'; id: string }
  | { name: 'newExpense' }
  | { name: 'department'; id: string }
  | { name: 'budgetRequest'; departmentId?: string }
  | { name: 'profile' };

export interface TabDef {
  key: string;
  label: string;
  glyph: NavGlyphName;
  badge?: number;
  render: () => React.ReactNode;
}

// The raised round button in the middle of the bar: either opens a tab or runs an action.
export interface CenterDef {
  icon: string;
  label: string;
  badge?: number;
  tab?: { key: string; render: () => React.ReactNode };
  route?: Route;
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

// Small hand-rolled navigator: four tabs around a centre button, plus a push/pop stack on top.
// Kept dependency-free so the app runs the same on iOS, Android and web.
export function TabNavigator({ tabs, center, renderRoute }: { tabs: TabDef[]; center: CenterDef; renderRoute: (r: Route) => React.ReactNode }) {
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
  const centerActive = center.tab?.key === tab;
  const active = tabs.find((t) => t.key === tab);
  const body = top ? renderRoute(top) : centerActive ? center.tab!.render() : (active ?? tabs[0]).render();
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  const renderTab = (t: TabDef) => {
    const isActive = !centerActive && t.key === (active ?? tabs[0]).key;
    return (
      <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)} accessibilityRole="tab" accessibilityState={{ selected: isActive }} accessibilityLabel={t.label}>
        <View style={styles.glyphWrap}>
          {isActive ? <NavGlow /> : null}
          <NavGlyph name={t.glyph} active={isActive} />
          {t.badge ? <Badge count={t.badge} /> : null}
        </View>
        <Text style={[styles.tabLabel, isActive && { color: colors.accentInk }]} numberOfLines={1}>
          {t.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <NavContext.Provider value={api}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.content}>{body}</View>
        {!top ? (
          <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {left.map(renderTab)}
            <View style={styles.centerSlot}>
              <Pressable
                onPress={() => (center.route ? api.push(center.route) : center.tab ? setTab(center.tab.key) : undefined)}
                style={({ pressed }) => [styles.centerOuter, pressed && { transform: [{ scale: 0.96 }] }]}
                accessibilityRole="button"
                accessibilityLabel={center.label}
              >
                <View style={[styles.centerInner, centerActive && styles.centerInnerActive]}>
                  <Icon name={center.icon} size={28} color={colors.onInk} strokeWidth={2} />
                </View>
                {center.badge ? <Badge count={center.badge} /> : null}
              </Pressable>
            </View>
            {right.map(renderTab)}
          </View>
        ) : null}
      </View>
    </NavContext.Provider>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingHorizontal: 2,
    backgroundColor: colors.nav,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    boxShadow: '0 -4px 20px rgba(22,23,43,0.05)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 4 },
  glyphWrap: { width: 56, height: 36, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: font.semibold, fontSize: 11.5, color: colors.navInk },
  centerSlot: { width: 84, alignItems: 'center', paddingBottom: 6 },
  centerOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginTop: -24,
    padding: 4,
    backgroundColor: colors.nav,
    boxShadow: '0 -2px 10px rgba(22,23,43,0.06)',
  },
  centerInner: {
    flex: 1,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.button,
  },
  centerInnerActive: { backgroundColor: colors.accentInk },
  badge: {
    position: 'absolute',
    top: 0,
    right: 6,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.badge,
    borderWidth: 1.5,
    borderColor: colors.nav,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: font.bold, fontSize: 10, color: colors.onInk },
});
