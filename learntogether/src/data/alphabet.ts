/**
 * Alphabet lesson content.
 *
 * Lessons are data, never markup: every alphabet screen in the app is rendered
 * from this array. Adding a language or swapping the example words is a change
 * to this file alone.
 */
import type { LearningItem } from "@/types";

interface AlphabetSeed {
  letter: string;
  word: string;
  emoji: string;
  /** How the letter sounds, spoken by "Listen to the sound". */
  sound: string;
}

const SEEDS: AlphabetSeed[] = [
  { letter: "A", word: "Apple", emoji: "🍎", sound: "ah" },
  { letter: "B", word: "Ball", emoji: "⚽", sound: "buh" },
  { letter: "C", word: "Cat", emoji: "🐱", sound: "kuh" },
  { letter: "D", word: "Dog", emoji: "🐶", sound: "duh" },
  { letter: "E", word: "Egg", emoji: "🥚", sound: "eh" },
  { letter: "F", word: "Fish", emoji: "🐟", sound: "fuh" },
  { letter: "G", word: "Goat", emoji: "🐐", sound: "guh" },
  { letter: "H", word: "Hat", emoji: "🎩", sound: "huh" },
  { letter: "I", word: "Ice", emoji: "🧊", sound: "ih" },
  { letter: "J", word: "Juice", emoji: "🧃", sound: "juh" },
  { letter: "K", word: "Key", emoji: "🔑", sound: "kuh" },
  { letter: "L", word: "Leaf", emoji: "🍃", sound: "luh" },
  { letter: "M", word: "Moon", emoji: "🌙", sound: "muh" },
  { letter: "N", word: "Nose", emoji: "👃", sound: "nuh" },
  { letter: "O", word: "Orange", emoji: "🍊", sound: "oh" },
  { letter: "P", word: "Pizza", emoji: "🍕", sound: "puh" },
  { letter: "Q", word: "Queen", emoji: "👑", sound: "kwuh" },
  { letter: "R", word: "Rain", emoji: "🌧️", sound: "ruh" },
  { letter: "S", word: "Sun", emoji: "☀️", sound: "sss" },
  { letter: "T", word: "Tree", emoji: "🌳", sound: "tuh" },
  { letter: "U", word: "Umbrella", emoji: "☂️", sound: "uh" },
  { letter: "V", word: "Van", emoji: "🚐", sound: "vuh" },
  { letter: "W", word: "Water", emoji: "💧", sound: "wuh" },
  { letter: "X", word: "Box", emoji: "📦", sound: "ks" },
  { letter: "Y", word: "Yellow", emoji: "🟡", sound: "yuh" },
  { letter: "Z", word: "Zebra", emoji: "🦓", sound: "zuh" },
];

export const ALPHABET: LearningItem[] = SEEDS.map((seed, index) => ({
  id: `letter-${seed.letter.toLowerCase()}`,
  category: "letter",
  value: seed.letter,
  displayValue: seed.letter,
  lowercase: seed.letter.toLowerCase(),
  word: seed.word,
  emoji: seed.emoji,
  // "X says ks, as in box" reads better than "X says ks" for the odd one out.
  soundHint:
    seed.letter === "X"
      ? "X says ks, as in box."
      : `${seed.letter} says ${seed.sound}.`,
  // Six letters per level, so early practice stays within a familiar group.
  level: Math.floor(index / 6) + 1,
}));

const BY_LETTER = new Map(ALPHABET.map((item) => [item.value, item]));

/** Looks a letter up case-insensitively. Returns undefined for anything else. */
export function getLetter(letter: string): LearningItem | undefined {
  return BY_LETTER.get(letter.toUpperCase());
}

/** Route params are lowercase, e.g. /learn/alphabet/a. */
export const LETTER_SLUGS = ALPHABET.map((item) => item.lowercase!);
