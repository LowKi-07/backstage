import React, { useRef, useState } from 'react';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpenseList, SummaryTile, TransactionRow } from '../../components/rows';
import { Text } from '../../components/Text';
import { AppHeader, Chip, ChipRow, EmptyState, Hero, IconCircle, Money, Screen, SectionTitle, Segmented } from '../../components/ui';
import { PROJECTS } from '../../data/projects';
import { useNav } from '../../navigation/Nav';
import { byNewest, isPending, projectSummary, sum } from '../../store/selectors';
import { useStore } from '../../store/Store';
import { colors, font, radius, space } from '../../theme';
import { ExpenseStatus } from '../../types';
import { formatINR } from '../../utils/format';

function useMine() {
  const { state, currentUser } = useStore();
  const mine = currentUser ? state.expenses.filter((e) => e.userId === currentUser.id).sort(byNewest) : [];
  return { state, currentUser, mine };
}

const CARD_W = 300;
const CARD_STEP = CARD_W + 12;
const native = Platform.OS !== 'web';

// Crew home: a dark top with a carousel of current projects, and a white sheet below
// (my expenses, recent transactions) that follows the selected project and slides up to full screen.
export function CrewHomeScreen() {
  const { state, currentUser, mine } = useMine();
  const { chooseProject } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const startIdx = Math.max(0, PROJECTS.findIndex((p) => p.id === state.selectedProjectId));
  const [idx, setIdx] = useState(startIdx);
  const [viewport, setViewport] = useState(0);
  const [headH, setHeadH] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const carousel = useRef<ScrollViewInstance>(null);
  if (!currentUser) return null;

  const p = projectSummary(state);
  const listing = PROJECTS[idx];
  const sample = listing.sample;
  const pending = mine.filter(isPending);
  const paid = mine.filter((e) => e.status === 'paid');

  const select = (n: number) => {
    if (n === idx) return;
    setIdx(n);
    chooseProject(PROJECTS[n].id);
  };
  const onCarousel = (e: NativeSyntheticEvent<NativeScrollEvent>) => select(Math.max(0, Math.min(PROJECTS.length - 1, Math.round(e.nativeEvent.contentOffset.x / CARD_STEP))));
  const goTo = (n: number) => {
    carousel.current?.scrollTo({ x: n * CARD_STEP, animated: true });
    select(n);
  };

  return (
    <View style={homeStyles.root}>
      <Animated.ScrollView
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: native,
          listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const full = headH > 0 && e.nativeEvent.contentOffset.y >= headH - 4;
            if (full !== expanded) setExpanded(full);
          },
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark top: pinned in place while the white sheet scrolls up over it. */}
        <Animated.View onLayout={(e) => setHeadH(e.nativeEvent.layout.height)} style={{ zIndex: 0, paddingTop: insets.top + space.sm, transform: [{ translateY: scrollY }] }}>
          <AppHeader dark />
          <View style={{ paddingHorizontal: space.xl, paddingTop: 4, gap: 16 }}>
            <Text style={homeStyles.greeting}>
              {greeting()}, {currentUser.name.split(' ')[0]}
            </Text>
            <View style={homeStyles.titleRow}>
              <Text style={homeStyles.sectionDark}>Current projects</Text>
              <Text style={homeStyles.count}>
                {idx + 1} of {PROJECTS.length}
              </Text>
            </View>
          </View>
          <ScrollView
            ref={carousel}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_STEP}
            decelerationRate="fast"
            onScroll={onCarousel}
            scrollEventThrottle={32}
            contentOffset={{ x: startIdx * CARD_STEP, y: 0 }}
            contentContainerStyle={{ paddingHorizontal: space.xl, paddingTop: 16, paddingBottom: 6, gap: 12 }}
          >
            {PROJECTS.map((pr, n) => {
              const live = pr.status === 'Shooting';
              const schedule = pr.id === 'proj1' ? `Day ${p.daysElapsed} of ${p.totalDays}` : pr.schedule;
              return (
                <Pressable
                  key={pr.id}
                  onPress={() => (n === idx ? nav.setTab('project') : goTo(n))}
                  style={[homeStyles.card, n === idx && homeStyles.cardOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`${pr.name}, ${schedule}`}
                  accessibilityState={{ selected: n === idx }}
                >
                  <Image source={pr.poster} style={homeStyles.thumb} resizeMode="cover" />
                  <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 4 }}>
                    <Text style={homeStyles.cardTitle} numberOfLines={2}>
                      {pr.name}
                    </Text>
                    <View style={[homeStyles.pill, { backgroundColor: live ? 'rgba(31,157,92,0.18)' : 'rgba(224,138,30,0.18)' }]}>
                      <View style={[homeStyles.pillDot, { backgroundColor: live ? colors.positive : colors.pending }]} />
                      <Text style={[homeStyles.pillText, { color: live ? '#5FD39A' : '#F2B35E' }]}>{schedule}</Text>
                    </View>
                    <Text style={homeStyles.detail} numberOfLines={1}>
                      Call time · <Text style={homeStyles.detailStrong}>{pr.callTime}</Text>
                    </Text>
                    <Text style={homeStyles.detail} numberOfLines={1}>
                      Location · <Text style={homeStyles.detailStrong}>{pr.location}</Text>
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={homeStyles.dots}>
            {PROJECTS.map((pr, n) => (
              <Pressable key={pr.id} onPress={() => goTo(n)} hitSlop={8} accessibilityLabel={`Show ${pr.name}`} accessibilityRole="button">
                <View style={[homeStyles.dot, n === idx && homeStyles.dotOn]} />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* White sheet: follows the selected project. */}
        <View style={[homeStyles.sheet, { minHeight: viewport || undefined }, expanded && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <View style={homeStyles.handle} />
          <SectionTitle title="My expenses" action="View all" onAction={() => nav.setTab('expenses')} />
          <View style={{ flexDirection: 'row', gap: space.md }}>
            {sample ? (
              <>
                <SummaryTile label="Pending" dot={colors.pending} amount={sample.pending} hint={`${sample.pendingCount} ${sample.pendingCount === 1 ? 'expense' : 'expenses'}`} />
                <SummaryTile label="Received" dot={colors.positive} amount={sample.received} hint="This project" />
              </>
            ) : (
              <>
                <SummaryTile label="Pending" dot={colors.pending} amount={sum(pending)} hint={`${pending.length} ${pending.length === 1 ? 'expense' : 'expenses'}`} onPress={() => nav.setTab('expenses')} />
                <SummaryTile label="Received" dot={colors.positive} amount={sum(paid)} hint="This project" onPress={() => nav.push({ name: 'payouts' })} />
              </>
            )}
          </View>

          <SectionTitle title="Recent transactions" action={!sample && mine.length > 5 ? 'View all' : undefined} onAction={() => nav.setTab('expenses')} />
          {sample ? (
            <View>
              {sample.txns.map((t) => (
                <View key={t.title} style={homeStyles.txn}>
                  <IconCircle name={t.icon} size={44} />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={homeStyles.txnTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={homeStyles.txnMeta}>{t.when}</Text>
                  </View>
                  <Money value={t.amount} size={15.5} color={t.amount > 0 ? colors.positive : colors.ink} signed={t.amount > 0} />
                </View>
              ))}
            </View>
          ) : mine.length ? (
            <View>
              {mine.slice(0, 5).map((e) => (
                <TransactionRow key={e.id} expense={e} />
              ))}
            </View>
          ) : (
            <EmptyState icon="receipt" title="Nothing logged yet" message="Tap the + button below to log your first expense." />
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const homeStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E0E' },
  greeting: { fontFamily: font.display, fontSize: 22, color: colors.onInk, letterSpacing: -0.5 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionDark: { fontFamily: font.bold, fontSize: 17, color: colors.onInk },
  count: { fontFamily: font.semibold, fontSize: 13, color: '#8C8C8C' },
  card: { width: CARD_W, flexDirection: 'row', gap: 14, padding: 10, borderRadius: radius.lg, backgroundColor: '#1C1C1C', borderWidth: 1.5, borderColor: 'transparent' },
  cardOn: { borderColor: colors.onInk },
  thumb: { width: 112, height: 104, borderRadius: radius.md },
  cardTitle: { fontFamily: font.display, fontSize: 16, lineHeight: 20, color: colors.onInk, letterSpacing: -0.3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: font.semibold, fontSize: 12 },
  detail: { fontFamily: font.regular, fontSize: 13, color: '#A8A8A8' },
  detailStrong: { fontFamily: font.bold, fontSize: 13, color: colors.onInk },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 10, paddingBottom: 26 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A4A4A' },
  dotOn: { width: 18, backgroundColor: colors.onInk },
  sheet: { zIndex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: space.xl, paddingTop: 10, paddingBottom: 32, gap: space.lg, boxShadow: '0 -8px 24px rgba(0,0,0,0.25)' },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#E2E2E2' },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  txnTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  txnMeta: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted },
});

const FILTERS: { key: 'all' | ExpenseStatus | 'pending'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
];

export function CrewExpensesScreen() {
  const { currentUser, mine } = useMine();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  if (!currentUser) return null;
  const match = (k: (typeof FILTERS)[number]['key']) => (e: (typeof mine)[number]) => (k === 'all' ? true : k === 'pending' ? isPending(e) : e.status === k);
  const shown = mine.filter(match(filter));

  return (
    <Screen title="my expenses" subtitle={`${mine.length} bills · ${formatINR(sum(mine))}`}>
      <ChipRow>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} count={mine.filter(match(f.key)).length} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ChipRow>
      <ExpenseList expenses={shown} showPerson={false} empty={<EmptyState icon="inbox" title="nothing here" message="No expenses match this filter." />} />
    </Screen>
  );
}

export function CrewPayoutsScreen({ pushed }: { pushed?: boolean }) {
  const nav = useNav();
  const { currentUser, mine } = useMine();
  const [tab, setTab] = useState<'due' | 'paid'>('due');
  if (!currentUser) return null;
  const due = mine.filter((e) => e.status === 'approved');
  const paid = mine.filter((e) => e.status === 'paid');
  const list = tab === 'due' ? due : paid;

  return (
    <Screen title="payouts" onBack={pushed ? nav.pop : undefined}>
      <Segmented
        options={[
          { key: 'due', label: 'To be paid' },
          { key: 'paid', label: 'Paid' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Hero
        eyebrow={tab === 'due' ? 'approved, payment on the way' : 'reimbursed to your account'}
        lines={tab === 'due' ? (due.length ? ['you’re owed'] : ['nothing owed', 'right now.']) : paid.length ? ['you’ve been paid'] : ['no payouts yet.']}
        amount={list.length ? sum(list) : undefined}
      />
      <ExpenseList
        expenses={list}
        showPerson={false}
        empty={
          <EmptyState
            icon="wallet"
            title={tab === 'due' ? 'no approved bills waiting' : 'no payouts yet'}
            message={tab === 'due' ? 'Bills appear here once your manager approves them.' : 'Paid bills show up here with the date they were settled.'}
          />
        }
      />
    </Screen>
  );
}
