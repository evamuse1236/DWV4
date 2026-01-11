/**
 * Two-level emotion data structure for the emotional check-in feature
 * Level 1: Primary emotions (5 categories)
 * Level 2: Sub-emotions (specific feelings within each category)
 */

export interface SubEmotion {
  name: string;
  emoji: string;
}

export interface EmotionCategory {
  name: string;
  emoji: string;
  color: string;
  description: string;
  subcategories: SubEmotion[];
}

export const emotionData: Record<string, EmotionCategory> = {
  happy: {
    name: "Happy",
    emoji: "😊",
    color: "#FFD93D",
    description: "Feeling good, positive, or joyful",
    subcategories: [
      { name: "Excited", emoji: "🤩" },
      { name: "Content", emoji: "😌" },
      { name: "Proud", emoji: "🥹" },
      { name: "Grateful", emoji: "🙏" },
      { name: "Playful", emoji: "😜" },
    ],
  },
  sad: {
    name: "Sad",
    emoji: "😢",
    color: "#74B9FF",
    description: "Feeling down, unhappy, or blue",
    subcategories: [
      { name: "Lonely", emoji: "😔" },
      { name: "Disappointed", emoji: "😞" },
      { name: "Hurt", emoji: "💔" },
      { name: "Tired", emoji: "😴" },
      { name: "Bored", emoji: "😐" },
    ],
  },
  angry: {
    name: "Angry",
    emoji: "😠",
    color: "#FF6B6B",
    description: "Feeling mad, upset, or frustrated",
    subcategories: [
      { name: "Frustrated", emoji: "😤" },
      { name: "Annoyed", emoji: "🙄" },
      { name: "Jealous", emoji: "😒" },
      { name: "Grumpy", emoji: "😾" },
    ],
  },
  scared: {
    name: "Scared",
    emoji: "😨",
    color: "#A29BFE",
    description: "Feeling afraid, worried, or nervous",
    subcategories: [
      { name: "Worried", emoji: "😟" },
      { name: "Nervous", emoji: "😬" },
      { name: "Shy", emoji: "🙈" },
      { name: "Confused", emoji: "😕" },
    ],
  },
  surprised: {
    name: "Surprised",
    emoji: "😲",
    color: "#FDCB6E",
    description: "Feeling amazed, curious, or shocked",
    subcategories: [
      { name: "Amazed", emoji: "🤯" },
      { name: "Curious", emoji: "🧐" },
      { name: "Shocked", emoji: "😱" },
    ],
  },
};

// Get all primary emotions as an array
export const primaryEmotions = Object.entries(emotionData).map(
  ([key, value]) => ({
    id: key,
    ...value,
  })
);

// Helper to get an emotion category by ID
export function getEmotionCategory(categoryId: string): EmotionCategory | undefined {
  return emotionData[categoryId];
}

// Helper to get a sub-emotion by category and name
export function getSubEmotion(
  categoryId: string,
  subEmotionName: string
): SubEmotion | undefined {
  const category = emotionData[categoryId];
  if (!category) return undefined;
  return category.subcategories.find((sub) => sub.name === subEmotionName);
}

// Journal prompts based on emotion category
export const journalPrompts: Record<string, string[]> = {
  happy: [
    "What made you feel this way today?",
    "Who helped make your day better?",
    "What are you looking forward to?",
  ],
  sad: [
    "What's on your mind?",
    "Is there something that would help you feel better?",
    "Would you like to talk about it?",
  ],
  angry: [
    "What happened that upset you?",
    "What do you need right now?",
    "How can we make things better?",
  ],
  scared: [
    "What's making you feel worried?",
    "What would help you feel safer?",
    "Is there something I can help with?",
  ],
  surprised: [
    "What surprised you?",
    "What are you curious about?",
    "What would you like to learn more about?",
  ],
};

// Get a random journal prompt for an emotion category
export function getRandomPrompt(categoryId: string): string {
  const prompts = journalPrompts[categoryId] || journalPrompts.happy;
  return prompts[Math.floor(Math.random() * prompts.length)];
}
