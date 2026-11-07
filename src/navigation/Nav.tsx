import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, NavGlow, NavGlyph, NavGlyphName } from '../components/icons';
import { Text } from '../components/Text';
import { colors, font } from '../theme';
import { ExpenseDraft } from '../types';

export type Route =
  | { name: 'expense'; id: string }
  | { name: 'newExpense'; draft?: ExpenseDraft }
  | { name: 'voiceExpense' }
  | { name: 'reviewExpense'; draft: ExpenseDraft }
  | { name: 'submitted'; id: string }
  | { name: 'projects' }
  | { name: 'payouts' }
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
  // A bottom sheet opened over the current screen; it gets `close` and the nav API.
  sheet?: (close: () => void, nav: NavApi) => React.ReactNode;
}

export interface NavApi {
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
export function TabNavigator({
  tabs,
  center,
  renderRoute,
  initialTab,
}: {
  tabs: TabDef[];
  center: CenterDef;
  renderRoute: (r: Route) => React.ReactNode;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab ?? tabs[0].key);
  const [sheetOpen, setSheetOpen] = useState(false);
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
        <Text style={[styles.tabLabel, isActive && { color: colors.onInk }]} numberOfLines={1}>
          {t.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <NavContext.Provider value={api}>
      <View style={{ flex: 1, backgroundColor: colors.nav }}>
        <View style={[styles.content, !top && styles.contentRounded]}>{body}</View>
        {!top ? (
          <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {left.map(renderTab)}
            <View style={styles.centerSlot}>
              <Pressable
                onPress={() => (center.sheet ? setSheetOpen(true) : center.route ? api.push(center.route) : center.tab ? setTab(center.tab.key) : undefined)}
                style={({ pressed }) => [styles.centerOuter, pressed && { transform: [{ scale: 0.96 }] }]}
                accessibilityRole="button"
                accessibilityLabel={center.label}
              >
                <View style={[styles.centerInner, centerActive && styles.centerInnerActive]}>
                  <Icon name={center.icon} size={30} color={colors.onInk} strokeWidth={1.6} />
                </View>
                {center.badge ? <Badge count={center.badge} /> : null}
              </Pressable>
            </View>
            {right.map(renderTab)}
          </View>
        ) : null}
        {center.sheet ? (
          <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
            <View style={styles.sheetBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheetOpen(false)} accessibilityLabel="Close" />
              {center.sheet(() => setSheetOpen(false), api)}
            </View>
          </Modal>
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
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  content: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  contentRounded: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 12, paddingHorizontal: 2, backgroundColor: colors.nav },
  tab: { flex: 1, alignItems: 'center', gap: 8, paddingBottom: 4 },
  glyphWrap: { width: 64, height: 40, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: font.semibold, fontSize: 11.5, color: colors.navInk },
  centerSlot: { width: 84, alignItems: 'center', paddingBottom: 6 },
  centerOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    marginTop: -22,
    padding: 3,
    backgroundColor: '#2A2A2A',
    boxShadow: '0 0 0 1px #3C3C3C, 0 -4px 22px rgba(255,255,255,0.10), 0 10px 20px rgba(0,0,0,0.6)',
  },
  centerInner: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: '#0E0E0E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.10)',
  },
  centerInnerActive: { borderColor: '#9A9A9A' },
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
