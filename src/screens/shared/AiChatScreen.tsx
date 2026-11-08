import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { buildExpenseContext } from '../../ai/expenseContext';
import { Text, TextInput } from '../../components/Text';
import { Icon, IconCircle, Screen } from '../../components/ui';
import { useStore } from '../../store/Store';
import { colors, font, radius, shadow, space } from '../../theme';
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


  return (
    <Screen title="ask ai" scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.intro}>
              <IconCircle name="sparkles" size={72} />
              <Text style={styles.introTitle}>ask about your expenses</Text>
              <Text style={styles.introText}>Totals, pending approvals, budgets and top categories, answered from the data you can see.</Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS[currentUser.role].map((s) => (
                  <Pressable key={s} onPress={() => send(s)} style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}>
                    <Text style={styles.suggestionText}>{s}</Text>
                    <Icon name="arrow-up-right" size={17} color={colors.inkSoft} />
                  </Pressable>
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
              <Icon name="alert" size={18} color={colors.negative} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask anything about expenses…"
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
            <Icon name="arrow-up" size={20} color={colors.onInk} strokeWidth={2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thread: { paddingHorizontal: space.xl, paddingVertical: space.lg, gap: space.sm, flexGrow: 1 },
  intro: { alignItems: 'center', gap: space.md, paddingTop: space.lg },
  introTitle: { fontFamily: font.display, fontSize: 23, letterSpacing: -0.6, color: colors.ink, textAlign: 'center', marginTop: space.sm },
  introText: { fontFamily: font.regular, fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 21, paddingHorizontal: space.md },
  suggestions: { gap: space.sm, alignSelf: 'stretch', marginTop: space.md },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    boxShadow: shadow.soft,
  },
  suggestionText: { flex: 1, fontFamily: font.medium, fontSize: 14.5, color: colors.ink },
  bubble: { maxWidth: '86%', borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.button, borderBottomRightRadius: 6 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.lineSoft, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 22, color: colors.ink },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  thinkingText: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft },
  error: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: radius.md, padding: space.md, backgroundColor: '#FDEDEA' },
  errorText: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.negative, lineHeight: 19 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    marginHorizontal: space.xl,
    marginBottom: space.md,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 6,
    paddingLeft: space.lg,
    boxShadow: shadow.raised,
  },
  input: { flex: 1, fontFamily: font.medium, color: colors.ink, fontSize: 15, maxHeight: 120, paddingVertical: 11 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.button, alignItems: 'center', justifyContent: 'center' },
});
