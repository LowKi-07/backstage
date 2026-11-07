import { ExpenseDraft } from '../types';

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALE: Record<string, number> = { hundred: 100, thousand: 1000, lakh: 100000, lakhs: 100000, lac: 100000, crore: 10000000, crores: 10000000 };

// "two thousand four hundred and fifty" -> 2450. Returns the value and the span of words it used.
function wordsToNumber(words: string[]): { value: number; start: number; end: number } | null {
  let best: { value: number; start: number; end: number } | null = null;
  for (let i = 0; i < words.length; i++) {
    let total = 0;
    let current = 0;
    let used = 0;
    let j = i;
    for (; j < words.length; j++) {
      const w = words[j];
      if (w in SMALL) {
        current += SMALL[w];
        used++;
      } else if (w === 'hundred') {
        current = (used ? current : 1) * 100; // "hundred dollars" means one hundred
        used++;
      } else if (w in SCALE) {
        if (!used) current = 1;
        used++;
        total += current * SCALE[w];
        current = 0;
      } else if (w === 'and' && used) {
        continue;
      } else break;
    }
    const value = total + current;
    if (used && value > 0 && (!best || value > best.value)) best = { value, start: i, end: j };
  }
  return best;
}

// Words that point at a category; the hint that appears earliest in what was said wins.
const CATEGORY_HINTS: [string, string[]][] = [
  ['Fuel', ['diesel', 'petrol', 'fuel', 'cng', 'gas station', 'indianoil', 'hp petrol', 'bharat petroleum']],
  ['Accommodation', ['hotel', 'room', 'stay', 'lodge', 'homestay']],
  ['Food & Catering', ['lunch', 'dinner', 'breakfast', 'food', 'snacks', 'tea', 'catering', 'meal', 'water bottles']],
  ['Transport', ['taxi', 'cab', 'auto', 'uber', 'ola', 'toll', 'parking', 'bus', 'train', 'flight']],
  ['Equipment Rental', ['camera', 'lens', 'light', 'battery', 'batteries', 'drone', 'rental', 'rent', 'generator hire']],
  ['Costume & Fabric', ['costume', 'fabric', 'saree', 'tailor', 'stitching', 'dry cleaning']],
  ['Makeup Supplies', ['makeup', 'wig', 'prosthetic', 'cosmetics']],
  ['Location Fees', ['location', 'permit', 'permission']],
  ['Labour / Daily Wages', ['labour', 'wages', 'helper', 'daily wage']],
  ['Printing & Stationery', ['print', 'printing', 'stationery', 'signage', 'xerox']],
  ['Props & Materials', ['prop', 'props', 'material', 'paint', 'nails', 'rope', 'wood', 'furniture']],
];

export function suggestCategory(text: string): string | undefined {
  const t = text.toLowerCase();
  let best: { cat: string; at: number } | undefined;
  for (const [cat, hints] of CATEGORY_HINTS) {
    for (const h of hints) {
      const at = t.search(new RegExp(`\\b${h}`));
      if (at >= 0 && (!best || at < best.at)) best = { cat, at };
    }
  }
  return best?.cat;
}

// Best-effort parse of a spoken expense into the fields the review step shows.
export function parseSpokenExpense(transcript: string): ExpenseDraft {
  const text = transcript.trim();
  let amount: number | undefined;
  let amountText = '';

  // Numbers written as digits: prefer one marked as money (₹, rs, rupees), else the largest.
  const candidates = [...text.matchAll(/(₹|rs\.?\s|inr\s)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(rupees|rs\b|lakhs?|k\b)?/gi)].map((m) => {
    let v = Number(m[2].replace(/,/g, ''));
    const unit = (m[3] ?? '').toLowerCase();
    if (unit.startsWith('lakh')) v *= 100000;
    else if (unit === 'k') v *= 1000;
    return { v, money: !!(m[1] || m[3]), text: m[0].trim() };
  }).filter((c) => c.v > 0);
  const pick = candidates.find((c) => c.money) ?? candidates.sort((a, b) => b.v - a.v)[0];
  if (pick) {
    amount = pick.v;
    amountText = pick.text;
  }
  if (amount === undefined) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    const found = wordsToNumber(words);
    if (found) {
      amount = found.value;
      amountText = words.slice(found.start, found.end).join(' ');
    }
  }

  // Split into phrases; the first is the description, a later one without the amount is the vendor.
  const parts = text.split(/,(?!\d)|\.(?!\d)|\bat\b|\bfrom\b/i).map((p) => p.trim()).filter(Boolean);
  const amountPart = (p: string) => !!amountText && p.toLowerCase().trim() === amountText.toLowerCase();
  const stripAmount = (p: string) => (amountText ? p.replace(amountText, '') : p).replace(/\s+(rupees|rs)\b.*$/i, '').replace(/[\s,]+$/, '').replace(/\s{2,}/g, ' ').trim();
  const description = stripAmount(parts.find((p) => !amountPart(p)) ?? text);
  const vendorPart = parts.slice(1).reverse().find((p) => !amountPart(p) && p !== description);

  return {
    transcript: text,
    description: description ? description.charAt(0).toUpperCase() + description.slice(1) : '',
    amount,
    category: suggestCategory(text),
    vendor: vendorPart,
  };
}
