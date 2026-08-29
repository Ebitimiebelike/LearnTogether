import type { Badge } from "@/types";

/**
 * Milestones, unlocked purely by total stars. There is no competition and no
 * leaderboard: badges only ever compare the learner to their own past self.
 */
export const BADGES: Badge[] = [
  {
    id: "first-star",
    label: "First Star",
    description: "You earned your very first star.",
    emoji: "⭐",
    requiredStars: 1,
  },
  {
    id: "getting-started",
    label: "Getting Started",
    description: "Five stars earned.",
    emoji: "🌱",
    requiredStars: 5,
  },
  {
    id: "good-listener",
    label: "Good Listener",
    description: "Fifteen stars earned.",
    emoji: "👂",
    requiredStars: 15,
  },
  {
    id: "steady-tracer",
    label: "Steady Tracer",
    description: "Thirty stars earned.",
    emoji: "✏️",
    requiredStars: 30,
  },
  {
    id: "word-explorer",
    label: "Word Explorer",
    description: "Fifty stars earned.",
    emoji: "🧭",
    requiredStars: 50,
  },
  {
    id: "number-friend",
    label: "Number Friend",
    description: "Seventy-five stars earned.",
    emoji: "🔢",
    requiredStars: 75,
  },
  {
    id: "star-collector",
    label: "Star Collector",
    description: "One hundred stars earned.",
    emoji: "🏅",
    requiredStars: 100,
  },
  {
    id: "shining-learner",
    label: "Shining Learner",
    description: "Two hundred stars earned.",
    emoji: "🌟",
    requiredStars: 200,
  },
];

