import Anthropic from '@anthropic-ai/sdk';

// Vercel serverless function behind the in-app "Ask AI" chat.
// The app has no backend yet, so the client sends the expense data it is allowed to see
// along with the conversation; the API key stays here, server-side (ANTHROPIC_API_KEY).

const MAX_TURNS = 20;
const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 80000;

const INSTRUCTIONS = `You are the expense assistant inside Backstage, an app a film production uses to log, approve and pay on-set expenses.
Answer the user's questions using only the expense data provided below. If the data doesn't contain the answer, say so plainly rather than guessing.
Amounts are in Indian rupees: write them with the ₹ sign and Indian digit grouping (₹1,25,000), or in lakhs/crores for large totals (₹24.8L).
Your reply is shown in a small chat bubble on a phone: keep it short, use plain sentences or a brief "- " list, and never use markdown tables, headings or bold.
Statuses: "submitted" means waiting for the department manager, "escalated" means waiting for the producer, "approved" means approved but not yet paid, "paid" means reimbursed, "rejected" means declined.`;

type ChatTurn = { role: 'user' | 'assistant'; content: string };

function parseBody(body: unknown): { messages: ChatTurn[]; context: string } | string {
  if (!body || typeof body !== 'object') return 'Invalid request body.';
  const { messages, context } = body as { messages?: unknown; context?: unknown };
  if (typeof context !== 'string' || context.length > MAX_CONTEXT_CHARS) return 'Missing or oversized expense context.';
  if (!Array.isArray(messages) || messages.length === 0) return 'No messages provided.';
  const turns = messages.slice(-MAX_TURNS);
  for (const m of turns) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim()) {
      return 'Malformed message.';
    }
    if (m.content.length > MAX_MESSAGE_CHARS) return 'Message is too long.';
  }
  // The API expects the conversation to start with the user.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') return 'The last message must come from the user.';
  return { messages: turns as ChatTurn[], context };
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'AI chat is not set up yet: add ANTHROPIC_API_KEY to the Vercel project settings.' }, 503);
  }

  let parsed: ReturnType<typeof parseBody>;
  try {
    parsed = parseBody(await request.json());
  } catch {
    parsed = 'Invalid JSON.';
  }
  if (typeof parsed === 'string') return json({ error: parsed }, 400);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      cache_control: { type: 'ephemeral' },
      system: `${INSTRUCTIONS}\n\n<expense_data>\n${parsed.context}\n</expense_data>`,
      messages: parsed.messages,
    });

    if (response.stop_reason === 'refusal') {
      return json({ reply: 'Sorry, I can’t help with that. Try asking about your expenses or budgets.' });
    }
    const reply = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    return json({ reply: reply || 'I couldn’t come up with an answer. Try rephrasing the question.' });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: 'The AI is busy right now. Try again in a moment.' }, 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: 'The AI key configured on the server is invalid.' }, 502);
    }
    if (error instanceof Anthropic.APIError) {
      console.error('Claude API error', error.status, error.message);
      return json({ error: 'The AI service returned an error. Try again.' }, 502);
    }
    console.error('Chat handler failed', error);
    return json({ error: 'Something went wrong reaching the AI.' }, 500);
  }
}
