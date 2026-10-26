import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildExpenseContext } from '../../ai/expenseContext';
import { Chip, Icon, Screen } from '../../components/ui';
import { useStore } from '../../store/Store';
import { colors, glass, radius, space } from '../../theme';
import { Role } from '../../types';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

// On web the chat endpoint is served from the same Vercel deployment; native builds need its origin.
const CHAT_URL = Platform.OS === 'web' ? '/api/chat' : process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api/chat` : null;

const SUGGESTIONS: Record<Role, string[]> = {
  crew: ['How much am I still owed?', 'Which of my bills are pending?', 'What did I spend most on?'],
  manager: ['Which department is closest to its budget?', 'What needs my approval?', 'Biggest expenses this week?'],
  producer: ['Are we on track for budget?', 'What is waiting on me?', 'Top spending categories?'],
};

// Tabs unmount when you switch away, so keep each user's conversation for the session here.
const historyByUser = new Map<string, ChatTurn[]>();

export function AiChatScreen() {
  const { state, currentUser } = useStore();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [messages, setMessages] = useState<ChatTurn[]>(() => (currentUser ? historyByUser.get(currentUser.id) ?? [] : []));
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) historyByUser.set(currentUser.id, messages);
  }, [currentUser, messages]);

  if (!currentUser) return null;

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;
    const next: ChatTurn[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setDraft('');
    setError(null);
    if (!CHAT_URL) {
      setError('AI chat needs EXPO_PUBLIC_API_URL set to the deployed web app’s address.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, context: buildExpenseContext(state, currentUser) }),
      });
      const data: { reply?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) throw new Error(data.error ?? `AI request failed (${res.status}).`);
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the AI.');
    } finally {
      setSending(false);
    }
  };

  // Leave room for the floating tab bar under the input.
  const bottomGap = Math.max(insets.bottom, 12) + 78;

  return (
    <Screen title="Ask AI" subtitle="Questions about your expenses" scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Icon name="sparkles" size={26} color={colors.onInk} />
              </View>
              <Text style={styles.introTitle}>Ask about your expenses</Text>
              <Text style={styles.introText}>Totals, pending approvals, budgets, top categories — answered from the data you can see.</Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS[currentUser.role].map((s) => (
                  <Chip key={s} label={s} onPress={() => send(s)} />
                ))}
              </View>
            </View>
          ) : (
            messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, m.role === 'user' && { color: colors.onInk }]} selectable>
                  {m.content}
                </Text>
              </View>
            ))
          )}
          {sending ? (
            <View style={[styles.bubble, styles.aiBubble, styles.thinking]}>
              <ActivityIndicator size="small" color={colors.inkSoft} />
              <Text style={styles.thinkingText}>Thinking…</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.error}>
              <Icon name="alert-circle-outline" size={16} color={colors.ink} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.composer, { marginBottom: bottomGap }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask anything about expenses…"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            multiline
            maxLength={2000}
            numberOfLines={1}
            onSubmitEditing={() => send(draft)}
            blurOnSubmit
            returnKeyType="send"
          />
          <Pressable
            onPress={() => send(draft)}
            disabled={!draft.trim() || sending}
            style={[styles.send, (!draft.trim() || sending) && { opacity: 0.35 }]}
            accessibilityLabel="Send"
          >
            <Icon name="arrow-up" size={20} color={colors.onInk} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thread: { padding: space.lg, gap: space.sm, flexGrow: 1 },
  intro: { alignItems: 'center', gap: space.sm, paddingTop: space.xl },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 36px rgba(255,255,255,0.35)',
  },
  introTitle: { fontSize: 20, fontWeight: '700', color: colors.ink, letterSpacing: -0.4, marginTop: space.sm },
  introText: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 20, paddingHorizontal: space.lg },
  suggestions: { gap: space.sm, alignItems: 'center', marginTop: space.md },
  bubble: { maxWidth: '86%', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  aiBubble: { ...glass(), alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: colors.ink },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  thinkingText: { fontSize: 14, color: colors.inkSoft },
  error: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', ...glass(), borderRadius: radius.md, padding: space.md },
  errorText: { flex: 1, fontSize: 13.5, color: colors.ink, lineHeight: 19 },
  composer: {
    ...glass(),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    marginHorizontal: space.lg,
    borderRadius: radius.lg,
    padding: 6,
    paddingLeft: space.md,
  },
  input: { flex: 1, color: colors.ink, fontSize: 15, maxHeight: 120, paddingVertical: 9 },
  send: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
