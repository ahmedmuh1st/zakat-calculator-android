/**
 * Maps a calculator category to the FAQ topics worth surfacing inside that screen.
 *
 * Osama's feedback was that the Learn tab and the calculator felt disconnected: the
 * answers exist, but a user filling in gold has no reason to go hunting for them.
 * Rather than duplicating content, each category screen pulls a few questions from
 * the same curated FAQ list.
 */
import { FAQ_ITEMS, type FaqCategory, type FaqItem } from "./faq";
import type { CategoryId } from "../zakat/types";

/**
 * FAQ topics per calculator category, most relevant first. Several categories have no
 * dedicated FAQ topic of their own, so they borrow the closest ones plus basics.
 */
const CATEGORY_FAQ_TOPICS: Record<CategoryId, FaqCategory[]> = {
  cash: ["cash", "basics"],
  gold: ["gold", "family"],
  silver: ["gold", "basics"],
  stocks: ["stocks", "basics"],
  business: ["business", "debts"],
  realEstate: ["property", "basics"],
  debts: ["debts", "cash"],
  agriculture: ["basics", "payment"],
  crypto: ["stocks", "basics"],
};

/** Questions pinned to the top for a category, by FAQ item id. */
const CATEGORY_PINNED: Partial<Record<CategoryId, string[]>> = {
  gold: ["gold-karat"],
};

/**
 * The questions to show inside a category screen.
 *
 * Deterministic: pinned ids first in their listed order, then items from the mapped
 * topics in FAQ order. Never returns duplicates, and returns at most `limit`.
 */
export function faqForCategory(categoryId: CategoryId, limit = 3): FaqItem[] {
  const topics = CATEGORY_FAQ_TOPICS[categoryId] ?? ["basics"];
  const pinnedIds = CATEGORY_PINNED[categoryId] ?? [];

  const picked: FaqItem[] = [];
  const seen = new Set<string>();

  const push = (item: FaqItem | undefined) => {
    if (!item || seen.has(item.id) || picked.length >= limit) return;
    seen.add(item.id);
    picked.push(item);
  };

  for (const id of pinnedIds) {
    push(FAQ_ITEMS.find((f) => f.id === id));
  }

  for (const topic of topics) {
    for (const item of FAQ_ITEMS) {
      if (item.category === topic) push(item);
    }
  }

  return picked;
}

/** The FAQ topic a category should deep-link into when "see all" is tapped. */
export function primaryFaqTopic(categoryId: CategoryId): FaqCategory {
  return (CATEGORY_FAQ_TOPICS[categoryId] ?? ["basics"])[0];
}
