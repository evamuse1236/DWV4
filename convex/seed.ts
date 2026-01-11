import { mutation } from "./_generated/server";
import { hashPassword } from "./utils";

/**
 * Seed all starter content (emotions, domains, books)
 * Called from SetupPage after admin account creation
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded (by checking if emotion categories exist)
    const existingEmotions = await ctx.db.query("emotionCategories").first();
    if (existingEmotions) {
      return { success: true, message: "Already seeded" };
    }

    // Seed emotion categories and subcategories
    const emotions = [
      { name: "Happy", emoji: "😊", color: "#4ade80", subEmotions: ["Joyful", "Excited", "Content", "Grateful", "Proud"] },
      { name: "Calm", emoji: "😌", color: "#60a5fa", subEmotions: ["Peaceful", "Relaxed", "Focused", "Balanced", "Hopeful"] },
      { name: "Anxious", emoji: "😰", color: "#facc15", subEmotions: ["Worried", "Nervous", "Overwhelmed", "Stressed", "Uncertain"] },
      { name: "Sad", emoji: "😢", color: "#a78bfa", subEmotions: ["Down", "Lonely", "Disappointed", "Tired", "Homesick"] },
      { name: "Frustrated", emoji: "😤", color: "#f87171", subEmotions: ["Annoyed", "Stuck", "Confused", "Impatient", "Discouraged"] },
    ];

    for (let i = 0; i < emotions.length; i++) {
      const emotion = emotions[i];
      const categoryId = await ctx.db.insert("emotionCategories", {
        name: emotion.name,
        emoji: emotion.emoji,
        color: emotion.color,
        order: i,
      });

      // Insert subcategories for this category
      for (let j = 0; j < emotion.subEmotions.length; j++) {
        await ctx.db.insert("emotionSubcategories", {
          categoryId,
          name: emotion.subEmotions[j],
          emoji: emotion.emoji,
          order: j,
        });
      }
    }

    // Seed learning domains
    const domains = [
      { name: "Mathematics", icon: "🔢", description: "Numbers, patterns, and problem-solving", color: "#a78bfa" },
      { name: "Reading", icon: "📖", description: "Comprehension and literary analysis", color: "#60a5fa" },
      { name: "Coding", icon: "💻", description: "Programming and computational thinking", color: "#f472b6" },
      { name: "Writing", icon: "✍️", description: "Expression and communication", color: "#4ade80" },
    ];

    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      await ctx.db.insert("domains", {
        name: domain.name,
        icon: domain.icon,
        description: domain.description,
        color: domain.color,
        order: i,
      });
    }

    // Seed starter books
    const books = [
      { title: "Atomic Habits", author: "James Clear", genre: "Self-Help", description: "An easy and proven way to build good habits and break bad ones" },
      { title: "The Alchemist", author: "Paulo Coelho", genre: "Fiction", description: "A magical fable about following your dreams" },
      { title: "Sapiens", author: "Yuval Noah Harari", genre: "Non-Fiction", description: "A brief history of humankind" },
      { title: "Deep Work", author: "Cal Newport", genre: "Productivity", description: "Rules for focused success in a distracted world" },
      { title: "The Code Breaker", author: "Walter Isaacson", genre: "Science", description: "Jennifer Doudna, gene editing, and the future of the human race" },
      { title: "Mindset", author: "Carol Dweck", genre: "Psychology", description: "The new psychology of success" },
      { title: "Range", author: "David Epstein", genre: "Self-Help", description: "Why generalists triumph in a specialized world" },
      { title: "A Short History of Nearly Everything", author: "Bill Bryson", genre: "Science", description: "A journey through science and discovery" },
    ];

    for (const book of books) {
      await ctx.db.insert("books", {
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        isPrePopulated: true,
        createdAt: Date.now(),
      });
    }

    return { success: true, message: "Seeded emotions, domains, and books" };
  },
});

/**
 * Seed students for both batches
 * Username and password are the lowercase version of the name
 */
export const seedStudents = mutation({
  args: {},
  handler: async (ctx) => {
    const batch2156 = [
      "Riya",
      "Zuhayr",
      "Vihaan",
      "Aadithya",
      "Zara",
      "Aarav",
      "Krishna",
    ];

    const batch2153 = [
      "Aria",
      "Jagaraam",
      "Ibrahim",
      "Dev",
      "Johan",
      "Norah",
      "Rochi",
      "Adi",
    ];

    const results: { name: string; status: string }[] = [];

    // Seed batch 2156
    for (const name of batch2156) {
      const username = name.toLowerCase();

      // Check if user already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();

      if (existing) {
        results.push({ name, status: "already exists" });
        continue;
      }

      const passwordHash = await hashPassword(username);
      await ctx.db.insert("users", {
        username,
        passwordHash,
        displayName: name,
        role: "student",
        batch: "2156",
        createdAt: Date.now(),
      });
      results.push({ name, status: "created" });
    }

    // Seed batch 2153
    for (const name of batch2153) {
      const username = name.toLowerCase();

      // Check if user already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .unique();

      if (existing) {
        results.push({ name, status: "already exists" });
        continue;
      }

      const passwordHash = await hashPassword(username);
      await ctx.db.insert("users", {
        username,
        passwordHash,
        displayName: name,
        role: "student",
        batch: "2153",
        createdAt: Date.now(),
      });
      results.push({ name, status: "created" });
    }

    const createdCount = results.filter(r => r.status === "created").length;

    return {
      success: true,
      message: "Seeded " + createdCount + " students",
      results,
    };
  },
});
