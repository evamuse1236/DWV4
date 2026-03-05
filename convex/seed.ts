import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./utils";

const defaultBadgeDefinitions = [
  {
    code: "LVL_5",
    name: "Level 5",
    description: "Reach level 5 in your character journey.",
    icon: "⭐",
    thresholdType: "level",
    thresholdValue: 5,
    displayOrder: 1,
  },
  {
    code: "LVL_10",
    name: "Level 10",
    description: "Reach level 10 in your character journey.",
    icon: "🌟",
    thresholdType: "level",
    thresholdValue: 10,
    displayOrder: 2,
  },
  {
    code: "MASTER_3",
    name: "Mastery Starter",
    description: "Master 3 major objectives.",
    icon: "🏅",
    thresholdType: "total_mastered",
    thresholdValue: 3,
    displayOrder: 3,
  },
  {
    code: "MASTER_10",
    name: "Mastery Adept",
    description: "Master 10 major objectives.",
    icon: "🎖️",
    thresholdType: "total_mastered",
    thresholdValue: 10,
    displayOrder: 4,
  },
  {
    code: "DIAG_PASS_5",
    name: "Diagnostic Striker",
    description: "Pass 5 diagnostics.",
    icon: "🧠",
    thresholdType: "diagnostic_passes",
    thresholdValue: 5,
    displayOrder: 5,
  },
  {
    code: "HABIT_STREAK_7",
    name: "Consistency Pulse",
    description: "Hold a 7-day streak on any habit.",
    icon: "🔥",
    thresholdType: "habit_streak",
    thresholdValue: 7,
    displayOrder: 6,
  },
  {
    code: "READER_3",
    name: "Reading Voice",
    description: "Present 3 books.",
    icon: "📚",
    thresholdType: "reading_presented",
    thresholdValue: 3,
    displayOrder: 7,
  },
] as const;

const defaultTarotCardSeeds = [
  {
    name: "The Initiate",
    slug: "the-initiate",
    description: "Your first step into focused mastery.",
    unlockLevel: 1,
    rarity: "common",
    displayOrder: 1,
    domainHint: "math",
    palette: { bg: "#f5e9d6", fg: "#5a3e2b" },
  },
  {
    name: "The Storyweaver",
    slug: "the-storyweaver",
    description: "Ideas woven into language and expression.",
    unlockLevel: 3,
    rarity: "rare",
    displayOrder: 2,
    domainHint: "writing",
    palette: { bg: "#e8f3e4", fg: "#335a2a" },
  },
  {
    name: "The Archivist",
    slug: "the-archivist",
    description: "Keeper of memory, meaning, and perspective.",
    unlockLevel: 5,
    rarity: "epic",
    displayOrder: 3,
    domainHint: "reading",
    palette: { bg: "#e5eff8", fg: "#25445f" },
  },
  {
    name: "The Compiler",
    slug: "the-compiler",
    description: "Builder of logic, systems, and possibility.",
    unlockLevel: 8,
    rarity: "legendary",
    displayOrder: 4,
    domainHint: "coding",
    palette: { bg: "#fbe6ea", fg: "#6a2738" },
  },
] as const;

async function ensureCharacterSeedData(ctx: any) {
  const existingDomains = await ctx.db.query("domains").collect();
  const hasMomentum = existingDomains.some(
    (domain: any) => domain.name.toLowerCase() === "momentum"
  );
  if (!hasMomentum) {
    const nextOrder =
      existingDomains.length > 0
        ? Math.max(...existingDomains.map((domain: any) => domain.order ?? 0)) + 1
        : 1;
    await ctx.db.insert("domains", {
      name: "Momentum",
      icon: "⚡",
      color: "#f59e0b",
      description: "Consistency momentum built through tasks and habits.",
      order: nextOrder,
    });
  }

  let badgeDefinitionsCreated = 0;
  for (const badge of defaultBadgeDefinitions) {
    const existing = await ctx.db
      .query("badgeDefinitions")
      .withIndex("by_code", (q: any) => q.eq("code", badge.code))
      .first();
    if (existing) continue;

    await ctx.db.insert("badgeDefinitions", {
      ...badge,
      isActive: true,
    });
    badgeDefinitionsCreated += 1;
  }

  const domains = await ctx.db.query("domains").collect();
  const resolveDomainId = (hint: string) => {
    const loweredHint = hint.toLowerCase();
    const match = domains.find((domain: any) =>
      domain.name.toLowerCase().includes(loweredHint)
    );
    return match?._id;
  };

  let fallbackImageStorageId: string | undefined;
  const existingCardWithImage = await ctx.db.query("tarotCards").first();
  if (existingCardWithImage?.imageStorageId) {
    fallbackImageStorageId = existingCardWithImage.imageStorageId;
  } else {
    const comments = await ctx.db.query("studentComments").collect();
    for (const comment of comments) {
      const attachment = (comment.attachments || [])[0];
      if (attachment?.storageId) {
        fallbackImageStorageId = attachment.storageId;
        break;
      }
    }
  }

  let tarotCardsCreated = 0;
  let tarotCardsSkipped = 0;
  for (const card of defaultTarotCardSeeds) {
    const existing = await ctx.db
      .query("tarotCards")
      .withIndex("by_slug", (q: any) => q.eq("slug", card.slug))
      .first();
    if (existing) continue;

    if (!fallbackImageStorageId) {
      tarotCardsSkipped += 1;
      continue;
    }

    await ctx.db.insert("tarotCards", {
      name: card.name,
      slug: card.slug,
      description: card.description,
      imageStorageId: fallbackImageStorageId as any,
      unlockLevel: card.unlockLevel,
      domainAffinityId: resolveDomainId(card.domainHint),
      rarity: card.rarity,
      isActive: true,
      displayOrder: card.displayOrder,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    tarotCardsCreated += 1;
  }

  return {
    badgeDefinitionsCreated,
    tarotCardsCreated,
    tarotCardsSkipped,
    tarotSeedRequiresManualImages: tarotCardsSkipped > 0,
  };
}

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
      const characterSeedSummary = await ensureCharacterSeedData(ctx);
      return {
        success: true,
        message: "Already seeded core data",
        ...characterSeedSummary,
      };
    }

    // Seed emotion categories and subcategories
    const emotions = [
      { name: "Happy", emoji: "😊", color: "#4ade80", subEmotions: ["Joyful", "Excited", "Content", "Grateful", "Proud"] },
      { name: "Calm", emoji: "😌", color: "#60a5fa", subEmotions: ["Peaceful", "Relaxed", "Focused", "Balanced", "Hopeful"] },
      { name: "Anxious", emoji: "😰", color: "#facc15", subEmotions: ["Worried", "Nervous", "Overwhelmed", "Stressed", "Uncertain"] },
      { name: "Sad", emoji: "😢", color: "#a78bfa", subEmotions: ["Down", "Lonely", "Disappointed", "Tired", "Sleepy", "Homesick"] },
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
      { name: "Momentum", icon: "⚡", description: "Consistency momentum built through tasks and habits.", color: "#f59e0b" },
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

    // Seed starter books (from DW reading curriculum)
    const books = [
      { title: "Unstoppable Us V1", author: "Yuval Noah Harari", genre: "History", pageCount: 174, readingUrl: "https://drive.google.com/file/d/1Bqwfs9YzANepld1deANl6F4EwC4MqqtO/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241659786/9780241659786-jacket-large.jpg" },
      { title: "Quick History of Money", author: "Clive Gifford", genre: "Finance", pageCount: 132, readingUrl: "https://drive.google.com/file/d/1-iZNWyZ4KzzKH0qwnuOzMktOmBw-y35E/view?usp=drive_link", coverImageUrl: "https://cloud.firebrandtech.com/api/v2/image/111/9780711262751/CoverArtHigh/XL" },
      { title: "Kay's Anatomy", author: "Adam Kay", genre: "Biology", pageCount: 386, readingUrl: "https://drive.google.com/file/d/1sZBaOsUgXEhszZzTm0k_ybpaKQOVUXiS/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241452929/9780241452929-jacket-large.jpg" },
      { title: "Astrophysics for Young People", author: "Neil deGrasse Tyson", genre: "Science", pageCount: 180, readingUrl: "https://drive.google.com/file/d/1QPAUZBDNo-C7-5f7oNtXJm72NC_zee0I/view?usp=drive_link", coverImageUrl: "https://shop.amnh.org/media/catalog/product/cache/be723dbbb91060da563c2c1837185150/a/s/astrophysics.jpg" },
      { title: "Quick History of Maths", author: "Clive Gifford", genre: "Math", pageCount: 130, readingUrl: "https://drive.google.com/file/d/110-4vpgTWq_YxJPK2eZj25jXFd10dtBj/view?usp=sharing", coverImageUrl: "https://cloud.firebrandtech.com/api/v2/image/111/9780711263352/CoverArtHigh/XL" },
      { title: "Quick History of Politics", author: "Clive Gifford", genre: "Humanities", pageCount: 132, readingUrl: "https://drive.google.com/file/d/1TGjh0bScGjK73Gqe5e0jsZMQ85yx-omW/view?usp=sharing", coverImageUrl: "https://cloud.firebrandtech.com/api/v2/image/111/9780711263369/CoverArtHigh/XL" },
      { title: "Big Ideas for Curious Minds", author: "The School of Life", genre: "Philosophy", pageCount: 295, readingUrl: "https://drive.google.com/file/d/1bTTScuffI80SueyU3JvJSDc63cO5LByw/view?usp=drive_link", coverImageUrl: "https://shop.theschooloflife.com/cdn/shop/files/Big-Ideas-for-Curious-Minds_01.jpg" },
      { title: "Totto-Chan", author: "Tetsuko Kuroyanagi", genre: "Biography", pageCount: 244, readingUrl: "https://drive.google.com/file/d/1VAk_QReoWf1XGIyQKxv3d3r5DivhBTf9/view?usp=drive_link", coverImageUrl: "https://covers.openlibrary.org/b/id/1043590-L.jpg" },
      { title: "The Magic of Reality", author: "Richard Dawkins", genre: "Science", pageCount: 205, readingUrl: "https://drive.google.com/file/d/1WQiLQ8MPgaQs49nuHhvXlEou3vd4Tw2c/view?usp=sharing", coverImageUrl: "https://covers.openlibrary.org/b/id/6954864-L.jpg" },
      { title: "Sapiens Graphic Novel V1", author: "Yuval Noah Harari", genre: "History", pageCount: 248, readingUrl: "https://drive.google.com/file/d/1PQRZf6FwTQyEY8HaOBTArHX3xh-OuZyZ/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9781787332812/9781787332812-jacket-large.jpg" },
      { title: "Kay's Marvellous Medicine", author: "Adam Kay", genre: "Biology", pageCount: 509, readingUrl: "https://drive.google.com/file/d/13U2bcpPgUlH6bQZo9Sjk_etwRiaHtJHP/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241508541/9780241508541-jacket-large.jpg" },
      { title: "Sapiens Graphic Novel V2", author: "Yuval Noah Harari", genre: "History", pageCount: 259, readingUrl: "https://drive.google.com/file/d/1Mx0MpBGXpepiS_n0iuQ-1imwYh-64wPG/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9781787333765/9781787333765-jacket-large.jpg" },
      { title: "Unstoppable Us V2", author: "Yuval Noah Harari", genre: "History", pageCount: 205, readingUrl: "https://drive.google.com/file/d/1wpvnVHMcBfU8f_qZH55y8rTTB8Q5cFzo/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241667897/9780241667897-jacket-large.jpg" },
      { title: "Wonder", author: "R.J. Palacio", genre: "Fiction", pageCount: 364, readingUrl: "https://drive.google.com/file/d/1TKKHiccmiRnLuNVckYQhyG1zsGB0GlcP/view?usp=sharing", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241777510/9780241777510-jacket-large.jpg" },
      { title: "Personal Finance Handbook", author: "National Finance Olympiad", genre: "Finance", pageCount: 65, coverImageUrl: "https://m.media-amazon.com/images/I/71+YyOy6hxL._AC_UF350,350_QL80_.jpg" },
      { title: "House by the Cerulean Sea", author: "TJ Klune", genre: "Fiction", pageCount: 400, readingUrl: "https://drive.google.com/file/d/1wfY-v2Gt1O3JPJfO46BHZpq__TDy3bGD/view?usp=sharing", coverImageUrl: "https://images.squarespace-cdn.com/content/v1/623ba108a16d7768676dfb64/fb68cc2d-e58c-464b-9672-ae7b115616ed/The+House+in+the+Cerulean+Sea.jpg" },
      { title: "Immune", author: "Philipp Dettmer", genre: "Biology", readingUrl: "https://drive.google.com/file/d/1trAWhY5b34kOkFUgd-3T6G5YyBuq6o4T/view?usp=sharing", coverImageUrl: "https://images4.penguinrandomhouse.com/cover/9780593241318" },
      { title: "White Bird", author: "R.J. Palacio", genre: "Historical Fiction", pageCount: 224, readingUrl: "https://drive.google.com/file/d/1CAXPz9gmjVdbbhEvK5RO7_3p3-M_KTp1/view?usp=drive_link", coverImageUrl: "https://images.penguinrandomhouse.com/cover/9780593487785" },
      { title: "Rotten Romans", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1xWZ9lLlPy1X4_0RCmR8cLkPaS-1hGCHa/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1174616793i/423935.jpg" },
      { title: "Holes", author: "Louis Sachar", genre: "Fiction", pageCount: 272, readingUrl: "https://drive.google.com/file/d/1Z2eXwK-9N4VvS8g7j-Y5LQKpM3FnRaVo/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1618269830i/38709.jpg" },
      { title: "The Woeful Second World War", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1kPq2NjE8TxL4_GVh3FsRwmS5oXyI7jZn/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1311454502i/120829.jpg" },
      { title: "The Groovy Greeks", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1qRmS8xVw2T5_Y9nK7hL3pJfE6oWzI4Xa/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1358874813i/423941.jpg" },
      { title: "The Frightful First World War", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1mNpL7jK5oSx2_W8vR3fQ9tYcE4uIgHbZ/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1311454556i/120814.jpg" },
      { title: "The Boy, the Mole, the Fox and the Horse", author: "Charlie Mackesy", genre: "Philosophy", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1yTxS5kL8nMw3_Z2vQ6jR7pJfE9oWuI4H/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1579017235i/43708884.jpg" },
    ];

    for (const book of books) {
      await ctx.db.insert("books", {
        title: book.title,
        author: book.author,
        genre: book.genre,
        pageCount: book.pageCount,
        readingUrl: book.readingUrl,
        coverImageUrl: book.coverImageUrl,
        isPrePopulated: true,
        createdAt: Date.now(),
      });
    }

    const characterSeedSummary = await ensureCharacterSeedData(ctx);
    return {
      success: true,
      message: "Seeded emotions, domains, books, character badges, and tarot cards",
      ...characterSeedSummary,
    };
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


/**
 * Create a single test student user
 * Username and password will both be the provided value
 */
export const createTestStudent = mutation({
  args: {},
  handler: async (ctx) => {
    const username = "student";
    const password = "student";
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existing) {
      return { success: false, message: "User 'student' already exists" };
    }

    const passwordHash = await hashPassword(password);
    const userId = await ctx.db.insert("users", {
      username,
      passwordHash,
      displayName: "Test Student",
      role: "student",
      batch: "test",
      createdAt: Date.now(),
    });

    return { success: true, userId, message: "Created test student (username: student, password: student)" };
  },
});

/**
 * Reseed books - delete all existing books and add the new curriculum books
 * Use this to replace old mock data with real books
 */
export const reseedBooks = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all studentBooks entries first (foreign key constraint)
    const allStudentBooks = await ctx.db.query("studentBooks").collect();
    for (const sb of allStudentBooks) {
      await ctx.db.delete(sb._id);
    }

    // Delete all existing books
    const allBooks = await ctx.db.query("books").collect();
    for (const book of allBooks) {
      await ctx.db.delete(book._id);
    }

    // Add the new books (DW reading curriculum)
    const books = [
      { title: "Unstoppable Us V1", author: "Yuval Noah Harari", genre: "History", pageCount: 174, readingUrl: "https://drive.google.com/file/d/1Bqwfs9YzANepld1deANl6F4EwC4MqqtO/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241659786/9780241659786-jacket-large.jpg" },
      { title: "Quick History of Money", author: "Clive Gifford", genre: "Finance", pageCount: 132, readingUrl: "https://drive.google.com/file/d/1-iZNWyZ4KzzKH0qwnuOzMktOmBw-y35E/view?usp=drive_link", coverImageUrl: "https://cloud.firebrandtech.com/api/v2/image/111/9780711262751/CoverArtHigh/XL" },
      { title: "Kay's Anatomy", author: "Adam Kay", genre: "Biology", pageCount: 386, readingUrl: "https://drive.google.com/file/d/1sZBaOsUgXEhszZzTm0k_ybpaKQOVUXiS/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241452929/9780241452929-jacket-large.jpg" },
      { title: "Astrophysics for Young People", author: "Neil deGrasse Tyson", genre: "Science", pageCount: 180, readingUrl: "https://drive.google.com/file/d/1QPAUZBDNo-C7-5f7oNtXJm72NC_zee0I/view?usp=drive_link", coverImageUrl: "https://shop.amnh.org/media/catalog/product/cache/be723dbbb91060da563c2c1837185150/a/s/astrophysics.jpg" },
      { title: "Quick History of Maths", author: "Clive Gifford", genre: "Math", pageCount: 130, readingUrl: "https://drive.google.com/file/d/110-4vpgTWq_YxJPK2eZj25jXFd10dtBj/view?usp=sharing", coverImageUrl: "https://cloud.firebrandtech.com/api/v2/image/111/9780711263352/CoverArtHigh/XL" },
      { title: "Quick History of Politics", author: "Clive Gifford", genre: "Humanities", pageCount: 132, readingUrl: "https://drive.google.com/file/d/1TGjh0bScGjK73Gqe5e0jsZMQ85yx-omW/view?usp=sharing", coverImageUrl: "https://cloud.firebrandtech.com/api/v2/image/111/9780711263369/CoverArtHigh/XL" },
      { title: "Big Ideas for Curious Minds", author: "The School of Life", genre: "Philosophy", pageCount: 295, readingUrl: "https://drive.google.com/file/d/1bTTScuffI80SueyU3JvJSDc63cO5LByw/view?usp=drive_link", coverImageUrl: "https://shop.theschooloflife.com/cdn/shop/files/Big-Ideas-for-Curious-Minds_01.jpg" },
      { title: "Totto-Chan", author: "Tetsuko Kuroyanagi", genre: "Biography", pageCount: 244, readingUrl: "https://drive.google.com/file/d/1VAk_QReoWf1XGIyQKxv3d3r5DivhBTf9/view?usp=drive_link", coverImageUrl: "https://covers.openlibrary.org/b/id/1043590-L.jpg" },
      { title: "The Magic of Reality", author: "Richard Dawkins", genre: "Science", pageCount: 205, readingUrl: "https://drive.google.com/file/d/1WQiLQ8MPgaQs49nuHhvXlEou3vd4Tw2c/view?usp=sharing", coverImageUrl: "https://covers.openlibrary.org/b/id/6954864-L.jpg" },
      { title: "Sapiens Graphic Novel V1", author: "Yuval Noah Harari", genre: "History", pageCount: 248, readingUrl: "https://drive.google.com/file/d/1PQRZf6FwTQyEY8HaOBTArHX3xh-OuZyZ/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9781787332812/9781787332812-jacket-large.jpg" },
      { title: "Kay's Marvellous Medicine", author: "Adam Kay", genre: "Biology", pageCount: 509, readingUrl: "https://drive.google.com/file/d/13U2bcpPgUlH6bQZo9Sjk_etwRiaHtJHP/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241508541/9780241508541-jacket-large.jpg" },
      { title: "Sapiens Graphic Novel V2", author: "Yuval Noah Harari", genre: "History", pageCount: 259, readingUrl: "https://drive.google.com/file/d/1Mx0MpBGXpepiS_n0iuQ-1imwYh-64wPG/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9781787333765/9781787333765-jacket-large.jpg" },
      { title: "Unstoppable Us V2", author: "Yuval Noah Harari", genre: "History", pageCount: 205, readingUrl: "https://drive.google.com/file/d/1wpvnVHMcBfU8f_qZH55y8rTTB8Q5cFzo/view?usp=drive_link", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241667897/9780241667897-jacket-large.jpg" },
      { title: "Wonder", author: "R.J. Palacio", genre: "Fiction", pageCount: 364, readingUrl: "https://drive.google.com/file/d/1TKKHiccmiRnLuNVckYQhyG1zsGB0GlcP/view?usp=sharing", coverImageUrl: "https://cdn.penguin.co.uk/dam-assets/books/9780241777510/9780241777510-jacket-large.jpg" },
      { title: "Personal Finance Handbook", author: "National Finance Olympiad", genre: "Finance", pageCount: 65, coverImageUrl: "https://m.media-amazon.com/images/I/71+YyOy6hxL._AC_UF350,350_QL80_.jpg" },
      { title: "House by the Cerulean Sea", author: "TJ Klune", genre: "Fiction", pageCount: 400, readingUrl: "https://drive.google.com/file/d/1wfY-v2Gt1O3JPJfO46BHZpq__TDy3bGD/view?usp=sharing", coverImageUrl: "https://images.squarespace-cdn.com/content/v1/623ba108a16d7768676dfb64/fb68cc2d-e58c-464b-9672-ae7b115616ed/The+House+in+the+Cerulean+Sea.jpg" },
      { title: "Immune", author: "Philipp Dettmer", genre: "Biology", readingUrl: "https://drive.google.com/file/d/1trAWhY5b34kOkFUgd-3T6G5YyBuq6o4T/view?usp=sharing", coverImageUrl: "https://images4.penguinrandomhouse.com/cover/9780593241318" },
      { title: "White Bird", author: "R.J. Palacio", genre: "Historical Fiction", pageCount: 224, readingUrl: "https://drive.google.com/file/d/1CAXPz9gmjVdbbhEvK5RO7_3p3-M_KTp1/view?usp=drive_link", coverImageUrl: "https://images.penguinrandomhouse.com/cover/9780593487785" },
      { title: "Rotten Romans", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1xWZ9lLlPy1X4_0RCmR8cLkPaS-1hGCHa/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1174616793i/423935.jpg" },
      { title: "Holes", author: "Louis Sachar", genre: "Fiction", pageCount: 272, readingUrl: "https://drive.google.com/file/d/1Z2eXwK-9N4VvS8g7j-Y5LQKpM3FnRaVo/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1618269830i/38709.jpg" },
      { title: "The Woeful Second World War", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1kPq2NjE8TxL4_GVh3FsRwmS5oXyI7jZn/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1311454502i/120829.jpg" },
      { title: "The Groovy Greeks", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1qRmS8xVw2T5_Y9nK7hL3pJfE6oWzI4Xa/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1358874813i/423941.jpg" },
      { title: "The Frightful First World War", author: "Terry Deary", genre: "History", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1mNpL7jK5oSx2_W8vR3fQ9tYcE4uIgHbZ/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1311454556i/120814.jpg" },
      { title: "The Boy, the Mole, the Fox and the Horse", author: "Charlie Mackesy", genre: "Philosophy", pageCount: 128, readingUrl: "https://drive.google.com/file/d/1yTxS5kL8nMw3_Z2vQ6jR7pJfE9oWuI4H/view?usp=drive_link", coverImageUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1579017235i/43708884.jpg" },
    ];

    for (const book of books) {
      await ctx.db.insert("books", {
        title: book.title,
        author: book.author,
        genre: book.genre,
        pageCount: book.pageCount,
        readingUrl: book.readingUrl,
        coverImageUrl: book.coverImageUrl,
        isPrePopulated: true,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      message: `Deleted ${allBooks.length} old books and ${allStudentBooks.length} student book records. Added ${books.length} new books.`,
    };
  },
});


// Seed 10 test objectives for each domain (for UI testing)
export const seedTestObjectives = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all domains
    const domains = await ctx.db.query("domains").collect();
    if (domains.length === 0) {
      return { success: false, message: "No domains found. Run seedAll first." };
    }

    // Get an admin user to set as createdBy
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    if (!admin) {
      return { success: false, message: "No admin user found." };
    }

    // Test objectives for each domain
    const objectivesByDomain: Record<string, Array<{ title: string; description: string; difficulty: "beginner" | "intermediate" | "advanced"; estimatedHours: number }>> = {
      Math: [
        { title: "Addition & Subtraction Mastery", description: "Master single and double-digit addition and subtraction", difficulty: "beginner", estimatedHours: 2 },
        { title: "Multiplication Tables 1-12", description: "Memorize and apply multiplication tables fluently", difficulty: "beginner", estimatedHours: 4 },
        { title: "Division Fundamentals", description: "Understand division as grouping and sharing", difficulty: "beginner", estimatedHours: 3 },
        { title: "Fractions Introduction", description: "Understand parts of a whole and basic fraction operations", difficulty: "intermediate", estimatedHours: 5 },
        { title: "Decimals and Percentages", description: "Convert between fractions, decimals, and percentages", difficulty: "intermediate", estimatedHours: 4 },
        { title: "Area and Perimeter", description: "Calculate area and perimeter of common shapes", difficulty: "intermediate", estimatedHours: 3 },
        { title: "Word Problem Strategies", description: "Learn to translate word problems into equations", difficulty: "intermediate", estimatedHours: 6 },
        { title: "Basic Algebra Concepts", description: "Solve for unknown variables in simple equations", difficulty: "advanced", estimatedHours: 8 },
        { title: "Data and Graphs", description: "Create and interpret bar graphs, line graphs, and pie charts", difficulty: "intermediate", estimatedHours: 4 },
        { title: "Geometry Foundations", description: "Identify and classify 2D and 3D shapes and their properties", difficulty: "advanced", estimatedHours: 6 },
      ],
      Reading: [
        { title: "Phonics Review", description: "Review and master all phonetic patterns", difficulty: "beginner", estimatedHours: 3 },
        { title: "Sight Words 100", description: "Recognize and read the first 100 high-frequency words", difficulty: "beginner", estimatedHours: 2 },
        { title: "Reading Fluency Practice", description: "Build speed and accuracy in oral reading", difficulty: "beginner", estimatedHours: 4 },
        { title: "Main Idea & Details", description: "Identify main ideas and supporting details in texts", difficulty: "intermediate", estimatedHours: 5 },
        { title: "Making Inferences", description: "Draw conclusions from text clues and prior knowledge", difficulty: "intermediate", estimatedHours: 6 },
        { title: "Character Analysis", description: "Analyze character traits, motivations, and development", difficulty: "intermediate", estimatedHours: 5 },
        { title: "Compare and Contrast", description: "Identify similarities and differences across texts", difficulty: "intermediate", estimatedHours: 4 },
        { title: "Author's Purpose", description: "Determine why an author wrote a text", difficulty: "advanced", estimatedHours: 5 },
        { title: "Vocabulary in Context", description: "Use context clues to determine word meanings", difficulty: "intermediate", estimatedHours: 4 },
        { title: "Critical Reading", description: "Evaluate arguments, bias, and credibility in texts", difficulty: "advanced", estimatedHours: 8 },
      ],
      Coding: [
        { title: "Scratch Basics", description: "Create simple animations and games in Scratch", difficulty: "beginner", estimatedHours: 4 },
        { title: "Sequencing & Loops", description: "Understand sequential instructions and loop concepts", difficulty: "beginner", estimatedHours: 3 },
        { title: "Variables & Data", description: "Store and manipulate data using variables", difficulty: "beginner", estimatedHours: 4 },
        { title: "Conditionals", description: "Make decisions in code with if/else statements", difficulty: "intermediate", estimatedHours: 5 },
        { title: "Functions & Reusability", description: "Create reusable code blocks with functions", difficulty: "intermediate", estimatedHours: 6 },
        { title: "Debugging Strategies", description: "Find and fix errors in code systematically", difficulty: "intermediate", estimatedHours: 4 },
        { title: "HTML & CSS Intro", description: "Build basic web pages with structure and styling", difficulty: "intermediate", estimatedHours: 8 },
        { title: "JavaScript Fundamentals", description: "Add interactivity to web pages with JavaScript", difficulty: "advanced", estimatedHours: 10 },
        { title: "Algorithm Design", description: "Design step-by-step solutions to problems", difficulty: "advanced", estimatedHours: 8 },
        { title: "Project: Build a Game", description: "Create a complete game from concept to completion", difficulty: "advanced", estimatedHours: 12 },
      ],
      Writing: [
        { title: "Sentence Building", description: "Construct complete sentences with subjects and predicates", difficulty: "beginner", estimatedHours: 2 },
        { title: "Capitalization & Punctuation", description: "Apply rules for capitals, periods, and commas", difficulty: "beginner", estimatedHours: 2 },
        { title: "Paragraph Structure", description: "Write paragraphs with topic sentences and supporting details", difficulty: "beginner", estimatedHours: 4 },
        { title: "Narrative Writing", description: "Tell stories with beginning, middle, and end", difficulty: "intermediate", estimatedHours: 6 },
        { title: "Descriptive Writing", description: "Use sensory details to paint vivid pictures", difficulty: "intermediate", estimatedHours: 5 },
        { title: "Opinion Writing", description: "State and support opinions with reasons and evidence", difficulty: "intermediate", estimatedHours: 6 },
        { title: "Informative Writing", description: "Explain topics clearly with facts and examples", difficulty: "intermediate", estimatedHours: 6 },
        { title: "Revision & Editing", description: "Improve drafts through revision and proofreading", difficulty: "intermediate", estimatedHours: 4 },
        { title: "Research Skills", description: "Find, evaluate, and cite sources for writing", difficulty: "advanced", estimatedHours: 8 },
        { title: "Persuasive Essay", description: "Write convincing arguments with rhetorical techniques", difficulty: "advanced", estimatedHours: 10 },
      ],
    };

    let count = 0;
    for (const domain of domains) {
      const objectives = objectivesByDomain[domain.name];
      if (!objectives) continue;

      for (const obj of objectives) {
        const majorId = await ctx.db.insert("majorObjectives", {
          domainId: domain._id,
          title: obj.title,
          description: obj.description,
          difficulty: obj.difficulty,
          estimatedHours: obj.estimatedHours,
          createdBy: admin._id,
          createdAt: Date.now(),
        });

        await ctx.db.insert("learningObjectives", {
          domainId: domain._id,
          majorObjectiveId: majorId,
          title: obj.title,
          description: obj.description,
          difficulty: obj.difficulty,
          estimatedHours: obj.estimatedHours,
          createdBy: admin._id,
          createdAt: Date.now(),
        });
        count++;
      }
    }

    return { success: true, message: `Created ${count} test objectives across ${domains.length} domains` };
  },
});


// Assign all objectives to a student (for UI testing)
export const assignAllObjectivesToStudent = mutation({
  args: {
    studentUsername: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the student
    const student = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.studentUsername))
      .first();
    if (!student) {
      return { success: false, message: `Student "${args.studentUsername}" not found` };
    }

    // Get an admin user for assignedBy
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    if (!admin) {
      return { success: false, message: "No admin user found" };
    }

    // Get all objectives
    const objectives = await ctx.db.query("learningObjectives").collect();

    // Get existing assignments for this student
    const existingAssignments = await ctx.db
      .query("studentObjectives")
      .filter((q) => q.eq(q.field("userId"), student._id))
      .collect();
    const assignedIds = new Set(existingAssignments.map((a) => a.objectiveId));

    // Assign objectives that aren't already assigned
    let count = 0;
    for (const obj of objectives) {
      if (!assignedIds.has(obj._id)) {
        const majorObjId = obj.majorObjectiveId;
        if (majorObjId) {
          const existingMajor = await ctx.db
            .query("studentMajorObjectives")
            .withIndex("by_user_major", (q) =>
              q.eq("userId", student._id).eq("majorObjectiveId", majorObjId)
            )
            .first();

          if (!existingMajor) {
            await ctx.db.insert("studentMajorObjectives", {
              userId: student._id,
              majorObjectiveId: majorObjId,
              assignedBy: admin._id,
              status: "assigned",
              assignedAt: Date.now(),
            });
          }
        }

        await ctx.db.insert("studentObjectives", {
          userId: student._id,
          objectiveId: obj._id,
          majorObjectiveId: obj.majorObjectiveId,
          assignedBy: admin._id,
          status: "assigned",
          assignedAt: Date.now(),
        });
        count++;
      }
    }

    return {
      success: true,
      message: `Assigned ${count} objectives to ${student.displayName} (${objectives.length - count} already assigned)`,
    };
  },
});


/**
 * Replace Reading objectives with 4 proper major objectives, each with 4 sub-objectives
 */
export const seedReadingObjectives = mutation({
  args: {},
  handler: async (ctx) => {
    // Find Reading domain
    const readingDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Reading"))
      .first();
    
    if (!readingDomain) {
      return { success: false, message: "Reading domain not found" };
    }

    // Get an admin user
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!admin) {
      return { success: false, message: "No admin user found" };
    }

    // Delete all existing Reading objectives
    // First get all major objectives for Reading
    const existingMajors = await ctx.db
      .query("majorObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", readingDomain._id))
      .collect();

    // Delete sub-objectives first (they reference major objectives)
    for (const major of existingMajors) {
      const subs = await ctx.db
        .query("learningObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", major._id))
        .collect();
      
      for (const sub of subs) {
        // Delete student assignments
        const assignments = await ctx.db
          .query("studentObjectives")
          .withIndex("by_objective", (q) => q.eq("objectiveId", sub._id))
          .collect();
        for (const a of assignments) {
          await ctx.db.delete(a._id);
        }
        
        // Delete activities
        const activities = await ctx.db
          .query("activities")
          .withIndex("by_objective", (q) => q.eq("objectiveId", sub._id))
          .collect();
        for (const act of activities) {
          await ctx.db.delete(act._id);
        }
        
        await ctx.db.delete(sub._id);
      }
      
      // Delete student major assignments
      const majorAssignments = await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", major._id))
        .collect();
      for (const ma of majorAssignments) {
        await ctx.db.delete(ma._id);
      }
      
      await ctx.db.delete(major._id);
    }

    // Also delete any orphaned learning objectives in Reading domain
    const orphanedSubs = await ctx.db
      .query("learningObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", readingDomain._id))
      .collect();
    
    for (const sub of orphanedSubs) {
      const assignments = await ctx.db
        .query("studentObjectives")
        .withIndex("by_objective", (q) => q.eq("objectiveId", sub._id))
        .collect();
      for (const a of assignments) {
        await ctx.db.delete(a._id);
      }
      await ctx.db.delete(sub._id);
    }

    // New Reading objectives: 4 major with 4 sub each
    const readingObjectives = [
      {
        title: "Reading Comprehension",
        description: "Understand and analyze texts at a deeper level",
        difficulty: "intermediate" as const,
        estimatedHours: 20,
        subs: [
          { title: "Main Idea & Theme", description: "Identify central messages and themes in fiction and non-fiction", difficulty: "beginner" as const, estimatedHours: 4 },
          { title: "Making Inferences", description: "Draw conclusions from text clues and prior knowledge", difficulty: "intermediate" as const, estimatedHours: 5 },
          { title: "Author's Purpose", description: "Determine why an author wrote a text and identify perspective", difficulty: "intermediate" as const, estimatedHours: 5 },
          { title: "Text Structure", description: "Recognize how texts are organized (cause/effect, compare/contrast, sequence)", difficulty: "intermediate" as const, estimatedHours: 6 },
        ],
      },
      {
        title: "Literary Analysis",
        description: "Analyze literary elements and appreciate storytelling craft",
        difficulty: "advanced" as const,
        estimatedHours: 24,
        subs: [
          { title: "Character Analysis", description: "Analyze character traits, motivations, and development arcs", difficulty: "intermediate" as const, estimatedHours: 6 },
          { title: "Plot & Conflict", description: "Identify story elements: exposition, rising action, climax, resolution", difficulty: "intermediate" as const, estimatedHours: 5 },
          { title: "Setting & Mood", description: "Understand how setting creates atmosphere and influences events", difficulty: "intermediate" as const, estimatedHours: 5 },
          { title: "Figurative Language", description: "Recognize and interpret metaphors, similes, and symbolism", difficulty: "advanced" as const, estimatedHours: 8 },
        ],
      },
      {
        title: "Vocabulary & Word Study",
        description: "Build vocabulary and word analysis skills",
        difficulty: "beginner" as const,
        estimatedHours: 16,
        subs: [
          { title: "Context Clues", description: "Use surrounding text to determine word meanings", difficulty: "beginner" as const, estimatedHours: 4 },
          { title: "Word Roots & Affixes", description: "Understand prefixes, suffixes, and root words to decode new vocabulary", difficulty: "intermediate" as const, estimatedHours: 4 },
          { title: "Multiple Meaning Words", description: "Identify correct meaning based on context", difficulty: "beginner" as const, estimatedHours: 3 },
          { title: "Domain-Specific Vocabulary", description: "Learn and apply academic vocabulary across subjects", difficulty: "intermediate" as const, estimatedHours: 5 },
        ],
      },
      {
        title: "Critical Reading",
        description: "Evaluate texts critically and form evidence-based opinions",
        difficulty: "advanced" as const,
        estimatedHours: 20,
        subs: [
          { title: "Fact vs Opinion", description: "Distinguish between factual statements and opinions", difficulty: "beginner" as const, estimatedHours: 4 },
          { title: "Evaluating Arguments", description: "Assess the strength of claims and supporting evidence", difficulty: "advanced" as const, estimatedHours: 6 },
          { title: "Comparing Texts", description: "Analyze how different authors treat similar themes or events", difficulty: "intermediate" as const, estimatedHours: 5 },
          { title: "Synthesizing Information", description: "Combine information from multiple sources to form conclusions", difficulty: "advanced" as const, estimatedHours: 5 },
        ],
      },
    ];

    // Create the new objectives
    let majorCount = 0;
    let subCount = 0;

    for (const obj of readingObjectives) {
      const majorId = await ctx.db.insert("majorObjectives", {
        domainId: readingDomain._id,
        title: obj.title,
        description: obj.description,
        difficulty: obj.difficulty,
        estimatedHours: obj.estimatedHours,
        createdBy: admin._id,
        createdAt: Date.now(),
      });
      majorCount++;

      for (const sub of obj.subs) {
        await ctx.db.insert("learningObjectives", {
          domainId: readingDomain._id,
          majorObjectiveId: majorId,
          title: sub.title,
          description: sub.description,
          difficulty: sub.difficulty,
          estimatedHours: sub.estimatedHours,
          createdBy: admin._id,
          createdAt: Date.now(),
        });
        subCount++;
      }
    }

    return {
      success: true,
      message: `Deleted ${existingMajors.length} old majors. Created ${majorCount} major objectives with ${subCount} sub-objectives for Reading.`,
    };
  },
});


/**
 * Assign all Reading objectives to all students
 */
export const assignReadingToAllStudents = mutation({
  args: {},
  handler: async (ctx) => {
    // Find Reading domain
    const readingDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Reading"))
      .first();
    
    if (!readingDomain) {
      return { success: false, message: "Reading domain not found" };
    }

    // Get admin for assignedBy
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    if (!admin) {
      return { success: false, message: "No admin user found" };
    }

    // Get all students
    const students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    // Get all Reading objectives
    const majorObjectives = await ctx.db
      .query("majorObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", readingDomain._id))
      .collect();

    const subObjectives = await ctx.db
      .query("learningObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", readingDomain._id))
      .collect();

    let assignmentCount = 0;

    for (const student of students) {
      // Assign major objectives
      for (const major of majorObjectives) {
        const existingMajor = await ctx.db
          .query("studentMajorObjectives")
          .withIndex("by_user_major", (q) =>
            q.eq("userId", student._id).eq("majorObjectiveId", major._id)
          )
          .first();

        if (!existingMajor) {
          await ctx.db.insert("studentMajorObjectives", {
            userId: student._id,
            majorObjectiveId: major._id,
            assignedBy: admin._id,
            status: "assigned",
            assignedAt: Date.now(),
          });
        }
      }

      // Assign sub objectives
      for (const sub of subObjectives) {
        const existing = await ctx.db
          .query("studentObjectives")
          .withIndex("by_user_objective", (q) =>
            q.eq("userId", student._id).eq("objectiveId", sub._id)
          )
          .first();

        if (!existing) {
          await ctx.db.insert("studentObjectives", {
            userId: student._id,
            objectiveId: sub._id,
            majorObjectiveId: sub.majorObjectiveId,
            assignedBy: admin._id,
            status: "assigned",
            assignedAt: Date.now(),
          });
          assignmentCount++;
        }
      }
    }

    return {
      success: true,
      message: `Assigned Reading objectives to ${students.length} students (${assignmentCount} new assignments)`,
    };
  },
});


/**
 * Seed test activities with varying link counts (1, 2, 3, 4) for panel auto-sizing test
 * Adds activities to Reading sub-objectives
 */
export const seedTestActivities = mutation({
  args: {},
  handler: async (ctx) => {
    // Get Reading domain
    const readingDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Reading"))
      .first();

    if (!readingDomain) {
      return { success: false, message: "Reading domain not found" };
    }

    // Get Reading sub-objectives
    const subObjectives = await ctx.db
      .query("learningObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", readingDomain._id))
      .collect();

    if (subObjectives.length < 4) {
      return { success: false, message: "Need at least 4 sub-objectives. Run seedReadingObjectives first." };
    }

    // Delete existing activities for these objectives
    for (const sub of subObjectives) {
      const existing = await ctx.db
        .query("activities")
        .withIndex("by_objective", (q) => q.eq("objectiveId", sub._id))
        .collect();
      for (const act of existing) {
        // Delete progress first
        const progress = await ctx.db
          .query("activityProgress")
          .withIndex("by_activity", (q) => q.eq("activityId", act._id))
          .collect();
        for (const p of progress) {
          await ctx.db.delete(p._id);
        }
        await ctx.db.delete(act._id);
      }
    }

    // Sample activity data
    const activityTemplates: Array<{ type: "video" | "reading" | "exercise" | "project"; prefix: string }> = [
      { type: "video", prefix: "Watch:" },
      { type: "reading", prefix: "Read:" },
      { type: "exercise", prefix: "Practice:" },
      { type: "project", prefix: "Project:" },
    ];

    // Add varying number of activities to ALL sub-objectives (cycling 1, 2, 3, 4)
    const linkCounts = [1, 2, 3, 4];
    let totalCreated = 0;

    for (let i = 0; i < subObjectives.length; i++) {
      const sub = subObjectives[i];
      // Cycle through 1, 2, 3, 4 links
      const numLinks = linkCounts[i % linkCounts.length];

      for (let j = 0; j < numLinks; j++) {
        const template = activityTemplates[j % activityTemplates.length];
        await ctx.db.insert("activities", {
          objectiveId: sub._id,
          title: `${template.prefix} ${sub.title} Part ${j + 1}`,
          url: `https://example.com/activity/${sub._id}/${j + 1}`,
          type: template.type,
          order: j,
        });
        totalCreated++;
      }
    }

    return {
      success: true,
      message: `Created ${totalCreated} activities across ${subObjectives.length} sub-objectives (cycling 1, 2, 3, 4 links)`,
    };
  },
});


/**
 * Migrate curriculum: Delete all test data and populate with new structure
 * - Deletes all curriculum data (cascade order)
 * - Renames "Writing" domain to "English"
 * - Inserts new curriculum with sequential timestamps for ordering
 */
export const migrateCurriculum = mutation({
  args: {},
  handler: async (ctx) => {
    // Get admin user for createdBy
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!admin) {
      return { success: false, message: "No admin user found" };
    }

    // ========== STEP 1: CASCADE DELETE (child → parent) ==========

    // 1. Delete activityProgress
    const allProgress = await ctx.db.query("activityProgress").collect();
    for (const p of allProgress) {
      await ctx.db.delete(p._id);
    }

    // 2. Delete activities
    const allActivities = await ctx.db.query("activities").collect();
    for (const a of allActivities) {
      await ctx.db.delete(a._id);
    }

    // 3. Delete studentObjectives
    const allStudentObj = await ctx.db.query("studentObjectives").collect();
    for (const so of allStudentObj) {
      await ctx.db.delete(so._id);
    }

    // 4. Delete studentMajorObjectives
    const allStudentMajor = await ctx.db.query("studentMajorObjectives").collect();
    for (const sm of allStudentMajor) {
      await ctx.db.delete(sm._id);
    }

    // 5. Delete learningObjectives
    const allLearning = await ctx.db.query("learningObjectives").collect();
    for (const lo of allLearning) {
      await ctx.db.delete(lo._id);
    }

    // 6. Delete majorObjectives
    const allMajor = await ctx.db.query("majorObjectives").collect();
    for (const mo of allMajor) {
      await ctx.db.delete(mo._id);
    }

    // ========== STEP 2: RENAME "Writing" TO "English" ==========
    const writingDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Writing"))
      .first();

    if (writingDomain) {
      await ctx.db.patch(writingDomain._id, { name: "English" });
    }

    // ========== STEP 3: GET DOMAIN IDs ==========
    const mathDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Math"))
      .first();

    const englishDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "English"))
      .first();

    const codingDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Coding"))
      .first();

    if (!mathDomain || !englishDomain || !codingDomain) {
      return {
        success: false,
        message: `Missing domains: Math=${!!mathDomain}, English=${!!englishDomain}, Coding=${!!codingDomain}`,
      };
    }

    // ========== STEP 4: INSERT NEW CURRICULUM ==========
    // Use incrementing timestamp to preserve order
    let timestamp = Date.now();

    // Helper to insert a major objective with its sub-objectives
    const insertMajorWithSubs = async (
      domainId: typeof mathDomain._id,
      title: string,
      subs: string[]
    ) => {
      const majorId = await ctx.db.insert("majorObjectives", {
        domainId,
        title,
        description: title,
        createdBy: admin._id,
        createdAt: timestamp++,
      });

      for (const subTitle of subs) {
        await ctx.db.insert("learningObjectives", {
          domainId,
          majorObjectiveId: majorId,
          title: subTitle,
          description: subTitle,
          difficulty: "intermediate",
          createdBy: admin._id,
          createdAt: timestamp++,
        });
      }

      return majorId;
    };

    // ========== MATHEMATICS (14 major objectives) ==========

    // 1. Arithmetic Foundation
    await insertMajorWithSubs(mathDomain._id, "Arithmetic Foundation", [
      "Multi digit multiplication and division",
    ]);

    // 2. Fractions Foundation
    await insertMajorWithSubs(mathDomain._id, "Fractions Foundation", [
      "I can add and subtract mixed fractions",
      "I can multiply a fraction with another fraction",
      "I can divide a fraction with a whole number",
      "I can solve word problems involving addition, subtraction, multiplication, Division of fractions using equations and visual models",
    ]);

    // 3. Decimals Foundation
    await insertMajorWithSubs(mathDomain._id, "Decimals Foundation", [
      "I can add decimals upto hundreths place value",
      "I can subtract decimals upto hundreths place value",
    ]);

    // 4. Arithmetic MYP 1
    await insertMajorWithSubs(mathDomain._id, "Arithmetic MYP 1", [
      "SWBAT multiply multi-digit numbers using the standard algorithm",
      "SWBAT divide multi-digit numbers using the long division algorithm",
      "SWBAT solve multi-step word problems involving all four operations",
      "SWBAT use estimation to verify reasonableness of answers",
      "SWBAT round numbers to specified place values",
      "SWBAT understand and represent negative numbers on a number line",
      "SWBAT add and subtract negative numbers",
      "SWBAT multiply and divide negative numbers",
    ]);

    // 5. Factors and Multiples
    await insertMajorWithSubs(mathDomain._id, "Factors and Multiples", [
      "SWBAT find all factor pairs of a number",
      "SWBAT list multiples of a number",
      "SWBAT apply divisibility rules for 2, 3, 4, 5, 6, 9, and 10",
      "SWBAT identify prime and composite numbers",
      "SWBAT find LCM of two or more numbers",
      "SWBAT find HCF/GCD of two or more numbers",
    ]);

    // 6. Fractions
    await insertMajorWithSubs(mathDomain._id, "Fractions", [
      "SWBAT add and subtract fractions with unlike denominators",
      "SWBAT add and subtract mixed fractions",
      "SWBAT multiply fractions and mixed numbers",
      "SWBAT divide fractions by whole numbers",
      "SWBAT divide fractions by fractions",
      "SWBAT solve word problems involving fraction operations",
    ]);

    // 7. Decimals
    await insertMajorWithSubs(mathDomain._id, "Decimals", [
      "SWBAT add and subtract decimals to thousandths",
      "SWBAT multiply decimals by whole numbers",
      "SWBAT multiply decimals by decimals",
      "SWBAT divide decimals by whole numbers",
      "SWBAT divide decimals by decimals",
      "SWBAT multiply and divide by powers of 10",
      "SWBAT solve word problems involving decimal operations",
    ]);

    // 8. Geometry
    await insertMajorWithSubs(mathDomain._id, "Geometry", [
      "SWBAT plot and identify points on the coordinate plane",
      "SWBAT understand the relationship between 2D and 3D shapes",
      "SWBAT classify triangles by sides and angles",
      "SWBAT classify and measure properties of quadrilaterals",
    ]);

    // 9. Measurement and Areas
    await insertMajorWithSubs(mathDomain._id, "Measurement and Areas", [
      "SWBAT apply area formulas for rectangles and squares",
      "SWBAT calculate area of triangles, parallelograms, and trapezoids",
    ]);

    // 10. Algebra Foundations
    await insertMajorWithSubs(mathDomain._id, "Algebra Foundations", [
      "SWBAT understand and evaluate expressions with exponents",
      "SWBAT evaluate algebraic expressions with substitution",
      "SWBAT identify and extend numerical patterns",
      "SWBAT apply order of operations (PEMDAS/BODMAS)",
    ]);

    // 11. Algebra
    await insertMajorWithSubs(mathDomain._id, "Algebra", [
      "SWBAT use variables to represent unknown quantities",
      "SWBAT write expressions from word phrases",
      "SWBAT distinguish between constants, coefficients, and variables",
      "SWBAT apply properties of operations (commutative, associative, distributive)",
      "SWBAT solve one-step and two-step equations",
      "SWBAT solve word problems using algebraic equations",
      "SWBAT graph relationships on the coordinate plane",
    ]);

    // 12. Rates
    await insertMajorWithSubs(mathDomain._id, "Rates", [
      "SWBAT calculate and interpret unit rates",
      "SWBAT solve word problems involving rates",
    ]);

    // 13. Percentage
    await insertMajorWithSubs(mathDomain._id, "Percentage", [
      "SWBAT understand percent as a rate per 100",
      "SWBAT convert between fractions, decimals, and percents",
      "SWBAT find a percent of a number",
      "SWBAT find what percent one number is of another",
      "SWBAT calculate percent increase, decrease, and discount",
    ]);

    // 14. Data
    await insertMajorWithSubs(mathDomain._id, "Data", [
      "SWBAT read and interpret line graphs",
      "SWBAT create line graphs from data",
    ]);

    // ========== ENGLISH (1 major objective) ==========
    await insertMajorWithSubs(englishDomain._id, "Reading", [
      "SWBAT cite evidence from informational text (explicit)",
      "SWBAT find and cite implicit evidence to draw logical inferences",
    ]);

    // ========== CODING (1 major objective) ==========
    await insertMajorWithSubs(codingDomain._id, "Programming Fundamentals", [
      "I can spot bigger repeating patterns made of smaller ones and write programs using nested loops",
      "I can understand when to use \"if\" and \"if-else\" in my programs and use them correctly",
      "I can create variables, save information in them, and use random numbers in my programs",
    ]);

    // ========== SUMMARY ==========
    const newMajors = await ctx.db.query("majorObjectives").collect();
    const newSubs = await ctx.db.query("learningObjectives").collect();

    return {
      success: true,
      message: `Migration complete! Deleted ${allMajor.length} old majors, ${allLearning.length} old subs, ${allStudentMajor.length} student major assignments, ${allStudentObj.length} student sub assignments, ${allActivities.length} activities, ${allProgress.length} progress records. Created ${newMajors.length} majors and ${newSubs.length} sub-objectives.`,
    };
  },
});


/**
 * Seed MYP Y1 Math curriculum (7 modules, 18 LOs, 23 KA activities).
 * Based on Curriculum_Map_Links.html — CCSS Grades 4-7 aligned.
 * Cascade-deletes ALL existing Math majors first.
 *
 * Run: npx convex run seed:seedMathFromPlaylist
 */
export const seedMathFromPlaylist = mutation({
  args: {},
  handler: async (ctx) => {
    // Get admin user
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!admin) {
      return { success: false, message: "No admin user found" };
    }

    // Find Math domain
    let mathDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Mathematics"))
      .first();

    if (!mathDomain) {
      mathDomain = await ctx.db
        .query("domains")
        .filter((q) => q.eq(q.field("name"), "Math"))
        .first();
    }

    if (!mathDomain) {
      return { success: false, message: "Math/Mathematics domain not found" };
    }

    // ========== STEP 1: CASCADE DELETE existing Math objectives ==========

    const existingMajors = await ctx.db
      .query("majorObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", mathDomain._id))
      .collect();

    let deletedProgress = 0;
    let deletedActivities = 0;
    let deletedStudentObj = 0;
    let deletedStudentMajor = 0;
    let deletedLearning = 0;
    let deletedMajors = 0;

    for (const major of existingMajors) {
      const learningObjs = await ctx.db
        .query("learningObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", major._id))
        .collect();

      for (const lo of learningObjs) {
        const activities = await ctx.db
          .query("activities")
          .withIndex("by_objective", (q) => q.eq("objectiveId", lo._id))
          .collect();

        for (const act of activities) {
          const progress = await ctx.db
            .query("activityProgress")
            .withIndex("by_activity", (q) => q.eq("activityId", act._id))
            .collect();
          for (const p of progress) {
            await ctx.db.delete(p._id);
            deletedProgress++;
          }
          await ctx.db.delete(act._id);
          deletedActivities++;
        }

        const studentObjs = await ctx.db
          .query("studentObjectives")
          .withIndex("by_objective", (q) => q.eq("objectiveId", lo._id))
          .collect();
        for (const so of studentObjs) {
          await ctx.db.delete(so._id);
          deletedStudentObj++;
        }

        await ctx.db.delete(lo._id);
        deletedLearning++;
      }

      const studentMajors = await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", major._id))
        .collect();
      for (const sm of studentMajors) {
        await ctx.db.delete(sm._id);
        deletedStudentMajor++;
      }

      await ctx.db.delete(major._id);
      deletedMajors++;
    }

    // Clean up orphaned LOs in Math domain
    const orphanedLOs = await ctx.db
      .query("learningObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", mathDomain._id))
      .collect();

    for (const lo of orphanedLOs) {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_objective", (q) => q.eq("objectiveId", lo._id))
        .collect();
      for (const act of activities) {
        const progress = await ctx.db
          .query("activityProgress")
          .withIndex("by_activity", (q) => q.eq("activityId", act._id))
          .collect();
        for (const p of progress) {
          await ctx.db.delete(p._id);
          deletedProgress++;
        }
        await ctx.db.delete(act._id);
        deletedActivities++;
      }
      const studentObjs = await ctx.db
        .query("studentObjectives")
        .withIndex("by_objective", (q) => q.eq("objectiveId", lo._id))
        .collect();
      for (const so of studentObjs) {
        await ctx.db.delete(so._id);
        deletedStudentObj++;
      }
      await ctx.db.delete(lo._id);
      deletedLearning++;
    }

    // ========== STEP 2: INSERT MYP Y1 CURRICULUM (7 modules, 18 LOs) ==========

    let timestamp = Date.now();
    let createdMajors = 0;
    let createdLearning = 0;
    let createdActivities = 0;

    const insertMajor = async (
      majorTitle: string,
      curriculum: string,
      subs: Array<{
        title: string;
        description: string;
        activities: Array<{
          title: string;
          type: "video" | "exercise" | "reading" | "project" | "game";
          platform: string;
          url: string;
        }>;
      }>
    ) => {
      const majorId = await ctx.db.insert("majorObjectives", {
        domainId: mathDomain._id,
        title: majorTitle,
        description: majorTitle,
        curriculum,
        createdBy: admin._id,
        createdAt: timestamp++,
      });
      createdMajors++;

      for (const sub of subs) {
        const loId = await ctx.db.insert("learningObjectives", {
          domainId: mathDomain._id,
          majorObjectiveId: majorId,
          title: sub.title,
          description: sub.description,
          difficulty: "intermediate",
          createdBy: admin._id,
          createdAt: timestamp++,
        });
        createdLearning++;

        for (let i = 0; i < sub.activities.length; i++) {
          const act = sub.activities[i];
          await ctx.db.insert("activities", {
            objectiveId: loId,
            title: act.title,
            type: act.type,
            platform: act.platform,
            url: act.url,
            order: i,
          });
          createdActivities++;
        }
      }
    };

    const insertMajorWithSubsAndActivities = async (
      majorTitle: string,
      subs: Array<{
        title: string;
        description: string;
        activities: Array<{
          title: string;
          type: "video" | "exercise" | "reading" | "project" | "game";
          platform: string;
          url: string;
        }>;
      }>
    ) => insertMajor(majorTitle, "MYP_Y1", subs);

    const insertPypMajor = async (
      majorTitle: string,
      subs: Array<{
        title: string;
        description: string;
        activities: Array<{
          title: string;
          type: "video" | "exercise" | "reading" | "project" | "game";
          platform: string;
          url: string;
        }>;
      }>
    ) => insertMajor(majorTitle, "PYP_Y2", subs);

    // BEGIN GENERATED SEED (MYP Y1) - DO NOT EDIT BY HAND
    // CCSS G6: Ratios & Proportional Relationships (6.RP)
    await insertMajorWithSubsAndActivities("CCSS G6: Ratios & Proportional Relationships (6.RP)", [
      {
        title: "Understand a unit rate a/b as a ratio a:b and use correct “per” language in context.",
        description: "SWBAT understand a unit rate a/b as a ratio a:b and use correct “per” language in context.\neg. “3 cups flour for 4 cups sugar” → unit rate is  3/4th cup flour per 1 cup sugar; \nA car travels 150 miles in 3 hours. What is the unit rate in miles per hour?",
        activities: [
        { title: "Rates and percentages", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
        { title: "Proportional Relationships: new-ratio", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/new-ratio/" },
        { title: "Proportional Relationships: ratio-scale-factor", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/ratio-scale-factor/" },
        { title: "Proportional Relationships: ratio-scale-up-down", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/ratio-scale-up-down/" },
        { title: "Proportional Relationships: unit-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/unit-rates/" },
        { title: "Proportional Relationships: two-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/two-rates/" },
        { title: "Proportional Relationships: compare-mixtures", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/compare-mixtures/" }
        ],
      },
      {
        title: "Solve word problems involving unit rates (eg. unit pricing, constant speed, work done per hr)",
        description: "SWBAT solve word problems involving unit rates (eg. unit pricing, constant speed, work done per hr)\nUnit pricing: $18 for 3 pounds apples → $6 per pound; which is better, $6/lb or $25 for 5 lb?\nSpeed: 240 km in 3 hours → 80 km per hour; at that rate, distance in 5 hours = 80×5=400km",
        activities: [
        { title: "Proportional Relationships: unit-rate-invoices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/unit-rate-invoices/" },
        { title: "Proportional Relationships: divide-to-find-unit-rate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/divide-to-find-unit-rate/" },
        { title: "Proportional Relationships: plotting-unit-rate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/plotting-unit-rate/" },
        { title: "Variables & Expressions: unit-prices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/unit-prices/" },
        { title: "Variables & Expressions: using-unit-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates/" },
        { title: "Variables & Expressions: using-unit-rates-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates-2/" }
        ],
      },
      {
        title: "Understand a percent as a rate per 100 and as a fraction and decimal.",
        description: "SWBAT understand a percent as a rate per 100 and as a fraction and decimal.\neg. 25% means 25 out of 100, so 25%=25/100=1/4=0.25",
        activities: [
        { title: "Arithmetic Thinking: Intro to Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/intro-to-percentages/" },
        { title: "Arithmetic Thinking: Working out Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/calculating-percentages/" },
        { title: "Arithmetic Thinking: Percentages and Batteries", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/battery-percentages/" },
        { title: "Arithmetic Thinking: Percentages as Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/fraction-equivalence-blanks/" }
        ],
      },
      {
        title: "Convert a number from fraction to percent and decimal, and vice versa.",
        description: "SWBAT convert a number from fraction to percent and decimal, and vice versa.\neg. 3/5=0.6=60%\n0.08=8%",
        activities: [
        { title: "Arithmetic Thinking: Percentages as Tenths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/tenths-equivalence/" },
        { title: "Arithmetic Thinking: Percentages as Hundredths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/hundredths-equivalence/" },
        { title: "Arithmetic Thinking: Finding the Percentage", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/finding-the-percentage/" },
        { title: "Arithmetic Thinking: Percentages as Decimals", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/converting-to-decimals/" },
        { title: "Arithmetic Thinking: Calculating the Percentage", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/calculating-the-percentage/" }
        ],
      },
      {
        title: "Find a given percent of a number, using models or equations.",
        description: "SWBAT Find a given percent of a number, using models or equations.\neg. Find  30% of 50\nA class of 40 students: 25% are absent, how many are absent",
        activities: [
        { title: "Percentages", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/pre-algebra/xb4832e56:percentages" },
        { title: "Percent problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages/cc-6th-percent-problems" }
        ],
      },
      {
        title: "Given two quantities, find what percent one is of the other.",
        description: "SWBAT given two quantities, find what percent one is of the other.\neg. What percent of 80 is 20?\n20/80=0.25=25%\nA student scores 18 out of 24. How much % did he score?\n18/24=0.75=75%",
        activities: [
        { title: "Variables & Expressions: working-with-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages/" },
        { title: "Variables & Expressions: percent-discount", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/percent-discount/" },
        { title: "Variables & Expressions: working-with-percentages-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages-2/" }
        ],
      },
      {
        title: "Solve real-world problems involving percent increase, decrease, discounts, tips, and taxes.",
        description: "SWBAT solve real-world problems involving percent increase, decrease, discounts, tips, and taxes.\neg. Discount: A shirt costs $200 with 20% off. How much is the final cost?\nIncrease: A population grows from 1,000 to 1,200. How much % has it grown?",
        activities: [
        { title: "Arithmetic Thinking: Percent Increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/percent-increase/" },
        { title: "Arithmetic Thinking: Price Increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/price-increase/" },
        { title: "Arithmetic Thinking: Calculating Percent Increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/percent-increase-blanks/" },
        { title: "Arithmetic Thinking: Percent Decrease", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percent-decrease/" },
        { title: "Arithmetic Thinking: Calculating Percent Decrease", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percentage-decrease-blanks/" },
        { title: "Arithmetic Thinking: Reversing Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/reversing-percentages/" }
        ],
      }
    ]);

    // CCSS G6: The Number System (6.NS)
    await insertMajorWithSubsAndActivities("CCSS G6: The Number System (6.NS)", [
      {
        title: "Intuition of fraction",
        description: "Fraction Fundamentals: Intuition of fraction",
        activities: [
        { title: "Understand fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-fractions" }
        ],
      },
      {
        title: "LCM and Comparing fractions",
        description: "Fraction Fundamentals: LCM and Comparing fractions",
        activities: [
        { title: "Equivalent fractions and comparing fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" },
        { title: "Arithmetic Thinking: Comparing Numerators", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/comparing-numerators/" },
        { title: "Arithmetic Thinking: Comparing Denominators", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/same-numerator/" },
        { title: "Arithmetic Thinking: Comparing Equivalents", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/den-multiples/" },
        { title: "Arithmetic Thinking: Comparing More Equivalents", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/not-multiples/" },
        { title: "Arithmetic Thinking: Identifying the Greatest", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/greatest-fraction/" }
        ],
      },
      {
        title: "GCF and Simplifying fractions",
        description: "Fraction Fundamentals: GCF and Simplifying fractions",
        activities: [
        { title: "Equivalent fractions and comparing fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" }
        ],
      },
      {
        title: "Add, Subtract fractions & Multiply fractions",
        description: "Fraction Fundamentals: Add, Subtract fractions & Multiply fractions",
        activities: [
        { title: "Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2" },
        { title: "Multiply fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions" }
        ],
      },
      {
        title: "Multiply multi-digit whole numbers using the standard algorithm (e.g., 3-digit × 2-digit).",
        description: "SWBAT multiply multi-digit whole numbers using the standard algorithm (e.g., 3-digit × 2-digit).",
        activities: [
        { title: "Multi-digit multiplication and division (standard algorithm)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        { title: "Multiplication & division (word problems + multi-digit practice)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2" }
        ],
      },
      {
        title: "Divide multi-digit whole numbers using standard algorithms and reasoning (e.g., up to 4-digit ÷ 2-digit).",
        description: "SWBAT divide multi-digit whole numbers using standard algorithms and reasoning (e.g., up to 4-digit ÷ 2-digit).",
        activities: [
        { title: "Division (multi-digit, quotients and remainders)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/division" }
        ],
      },
      {
        title: "Solve simple word problems using addition, subtraction, multiplication, and division",
        description: "SWBAT solve simple word problems using addition, subtraction, multiplication, and division",
        activities: [
        { title: "Add & subtract", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-addition-and-subtraction-2" },
        { title: "Multiplication & division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2" }
        ],
      },
      {
        title: "Solve multi-step word problems using addition, subtraction, multiplication, and division.",
        description: "SWBAT solve multi-step word problems using addition, subtraction, multiplication, and division.",
        activities: [
        { title: "Multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2" },
        { title: "Add & subtract", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-addition-and-subtraction-2" }
        ],
      },
      {
        title: "Mentally estimate results of operations on multi-digit numbers using rounding strategies.",
        description: "SWBAT mentally estimate results of operations on multi-digit numbers using rounding strategies.\nExample: 43 × 13 should be roughly 500 since (43×10)= 430",
        activities: [
        { title: "Addition, subtraction, and estimation", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-addition-and-subtraction" }
        ],
      },
      {
        title: "Use rounding strategies and inverse operations to verify and cross-check answers to word problems",
        description: "SWBAT use rounding strategies and inverse operations to verify and cross-check answers to word problems",
        activities: [
        { title: "More with multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-multiplication-and-division" },
        { title: "Place value & rounding", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" }
        ],
      },
      {
        title: "Basics of negative numbers",
        description: "Deepwork: Basics of negative numbers",
        activities: [
        { title: "Arithmetic Thinking: Ordering Integers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-1/" },
        { title: "Arithmetic Thinking: Ordering Negatives", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-2/" },
        { title: "Arithmetic Thinking: Absolute Value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-4/" },
        { title: "Arithmetic Thinking: Adding and Absolute Value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-5/" },
        { title: "Arithmetic Thinking: Absolute Value Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-and-magnitude-6/" },
        { title: "Arithmetic Thinking: Reasoning with Absolute Value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-and-magnitude-7/" }
        ],
      },
      {
        title: "Operations with negative numbers",
        description: "Deepwork: Operations with negative numbers",
        activities: [
        { title: "Negative numbers", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-number-topic" },
        { title: "Arithmetic Thinking: Increasing Value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-5/" },
        { title: "Arithmetic Thinking: Zero", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-7/" },
        { title: "Arithmetic Thinking: Opposites", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-8/" },
        { title: "Arithmetic Thinking: Adding The Opposite", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expression-17/" },
        { title: "Arithmetic Thinking: Subtracting Using Addition", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expressions-18/" },
        { title: "Arithmetic Thinking: Order in Subtraction", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expressions-19/" }
        ],
      },
      {
        title: "Factors and Multiples",
        description: "Deep Work: Factors and Multiples",
        activities: [
        { title: "Number Theory: prime-factor-trees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factor-trees/" },
        { title: "Number Theory: prime-factorization", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factorization/" },
        { title: "Number Theory: factoring-factorials", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/factoring-factorials/" },
        { title: "Number Theory: counting-divisors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/counting-divisors/" }
        ],
      },
      {
        title: "Understand that every whole number is a multiple of its factors. Eg. 12 is a multiple of its factors: 1, 2, 3, 4, 6, and 12.",
        description: "SWBAT understand that every whole number is a multiple of its factors. Eg. 12 is a multiple of its factors: 1, 2, 3, 4, 6, and 12.",
        activities: [
        { title: "Number Theory: 100-doors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/100-doors/" },
        { title: "Number Theory: how-many-prime-numbers-are-there", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/how-many-prime-numbers-are-there/" }
        ],
      },
      {
        title: "Divisibility rules",
        description: "Deepwork: Divisibility rules",
        activities: [
        { title: "Divisibility tests", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" },
        { title: "Number Theory: divisibility", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/divisibility/" },
        { title: "Number Theory: last-digits-part-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/last-digits-part-i/" },
        { title: "Number Theory: last-digits-part-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/last-digits-part-ii/" },
        { title: "Number Theory: cryptograms-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/cryptograms-3/" },
        { title: "Number Theory: more-cryptograms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/more-cryptograms/" },
        { title: "Number Theory: even-more-cryptograms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/even-more-cryptograms/" }
        ],
      },
      {
        title: "Prime and Composite",
        description: "Deepwork: Prime and Composite",
        activities: [
        { title: "Factors, multiples and patterns", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" }
        ],
      },
      {
        title: "Least Common Multiple",
        description: "Deep Work: Least Common Multiple",
        activities: [
        { title: "Factors and multiples", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/pre-algebra/pre-algebra-factors-multiples" },
        { title: "Number Theory: the-lcm", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-lcm/" },
        { title: "Number Theory: billiard-tables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables/" },
        { title: "Number Theory: number-jumping-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-i/" },
        { title: "Number Theory: number-jumping-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-ii/" },
        { title: "Number Theory: billiard-tables-revisited-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-i/" }
        ],
      },
      {
        title: "Highest Common Factor",
        description: "Deep Work: Highest Common Factor",
        activities: [
        { title: "Number Theory: 100-doors-revisited", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/100-doors-revisited/" },
        { title: "Number Theory: the-gcd", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-gcd/" },
        { title: "Number Theory: dots-on-the-diagonal", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/dots-on-the-diagonal/" },
        { title: "Number Theory: number-jumping-iii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-iii/" },
        { title: "Number Theory: relating-gcd-and-lcm", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/relating-gcd-and-lcm/" },
        { title: "Number Theory: billiard-tables-revisited-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-ii/" }
        ],
      },
      {
        title: "Add and subtract fractions with unlike denominators",
        description: "SWBAT add and subtract fractions with unlike denominators",
        activities: [
        { title: "Add and subtract fractions (unlike denominators)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" }
        ],
      },
      {
        title: "Add and subtract mixed fractions",
        description: "SWBAT add and subtract mixed fractions",
        activities: [
        { title: "Add and subtract mixed numbers", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions/add-sub-mixed-numbers" }
        ],
      },
      {
        title: "Multiply a fraction with whole number and another fraction",
        description: "SWBAT multiply a fraction with whole number and another fraction",
        activities: [
        { title: "Arithmetic Thinking: Multiples of Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/fraction-by-integer/" },
        { title: "Arithmetic Thinking: Expressing Multiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/expressing-multiples/" },
        { title: "Arithmetic Thinking: Multiplying Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/multiplying-fractions/" }
        ],
      },
      {
        title: "Divide a fraction with a whole number",
        description: "SWBAT divide a fraction with a whole number",
        activities: [
        { title: "Divide fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-fractions" }
        ],
      },
      {
        title: "Divide a fraction with another fraction",
        description: "SWBAT divide a fraction with another fraction ",
        activities: [
        { title: "Fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions" }
        ],
      },
      {
        title: "Solve word problems involving addition, subtraction, multiplicaiton, division of Fractions using equations and visual models.",
        description: "SWBAT solve word problems involving addition, subtraction, multiplicaiton, division of Fractions using equations and visual models.",
        activities: [
        { title: "Add and subtract fractions (different denominators)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic/x18ca194a:add-and-subtract-fractions-different-denominators" },
        { title: "Multiplying fractions word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions/imp-multiplying-fractions-word-problems" },
        { title: "Dividing fractions & whole numbers word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-fractions/imp-dividing-fractions-and-whole-numbers-word-problems" }
        ],
      },
      {
        title: "Add and Sub decimals upto thousandth place value",
        description: "SWBAT add and Sub decimals upto thousandth place value",
        activities: [
        { title: "Add decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-addition-and-subtraction-3" },
        { title: "Subtract decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/subtract-decimals" }
        ],
      },
      {
        title: "Decimal Multiplication by whole numbers",
        description: "Deep Work: Decimal Multiplication by whole numbers",
        activities: [
        { title: "Multiply decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-multiplication-and-division-3" }
        ],
      },
      {
        title: "Decimal Multiplication",
        description: "Deep Work: Decimal Multiplication",
        activities: [
        { title: "Arithmetic decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic/arith-decimals" }
        ],
      },
      {
        title: "Dividing Decimals by Whole Numbers Part-1",
        description: "Deep Work: Dividing Decimals by Whole Numbers Part-1\nDeep Work: Dividing Decimals by Whole Numbers Part-2\nDeep Work: Dividing Decimals by Whole Numbers Part-3",
        activities: [
        { title: "Divide decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-decimals" }
        ],
      },
      {
        title: "Dividing Decimals by Decimals",
        description: "Deep Work: Dividing Decimals by Decimals",
        activities: [
        { title: "Decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic-home/arith-review-decimals" }
        ],
      },
      {
        title: "Explain patterns in the number of zeros when multiplying by powers of 10 and in the placement of the decimal point when multiplying or dividing by powers of 10,",
        description: "SWBAT explain patterns in the number of zeros when multiplying by powers of 10 and in the placement of the decimal point when multiplying or dividing by powers of 10,\n(using whole-number exponents to denote powers of 10).\"",
        activities: [
        { title: "Exponents & Radicals: exponents-number-line-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-1/" },
        { title: "Exponents & Radicals: exponents-number-line-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-2/" },
        { title: "Exponents & Radicals: exponents-number-line-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-3/" },
        { title: "Exponents & Radicals: exponents-number-line-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-4/" },
        { title: "Exponents & Radicals: exponents-number-line-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-5/" },
        { title: "Exponents & Radicals: exponents-number-line-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-6/" }
        ],
      },
      {
        title: "Solve word problems involving addition, subtraction, multiplication, division of Decimals using equations and visual models.",
        description: "SWBAT solve word problems involving addition, subtraction, multiplication, division of Decimals using equations and visual models.",
        activities: [
        { title: "Adding decimals word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" },
        { title: "Subtracting decimals word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" },
        { title: "Multiplying decimals word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/grade-4-math-snc-aligned/x6f85f380d87b3bb6:decimals/x6f85f380d87b3bb6:word-problems-of-decimal-numbers/v/multiplying-decimals-word-problems" }
        ],
      }
    ]);

    // CCSS G6: Expressions & Equations (6.EE)
    await insertMajorWithSubsAndActivities("CCSS G6: Expressions & Equations (6.EE)", [
      {
        title: "Read and write simple powers with small exponents and explain them as repeated multiplication.",
        description: "SWBAT read and write simple powers with small exponents and explain them as repeated multiplication.\neg. 3² → “three squared = 3 × 3.” 2³ → “two cubed = 2 × 2 × 2.” 10²= “ten squared= 10 x 10 = 100”",
        activities: [
        { title: "Powers of ten", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/powers-of-ten" },
        { title: "Exponents & Radicals: exponent-basics-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-1/" },
        { title: "Exponents & Radicals: exponent-basics-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-2/" },
        { title: "Exponents & Radicals: exponent-basics-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-3/" },
        { title: "Exponents & Radicals: exponent-basics-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-4/" },
        { title: "Exponents & Radicals: exponent-basics-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-5/" }
        ],
      },
      {
        title: "Write and evaluate numerical expressions involving whole-number exponents.",
        description: "SWBAT write and evaluate numerical expressions involving whole-number exponents.\neg. Evaluate: 2³ + 5²",
        activities: [
        { title: "Exponents & Radicals: squares-and-roots-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-1/" },
        { title: "Exponents & Radicals: squares-and-roots-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-2/" },
        { title: "Exponents & Radicals: squares-and-roots-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-3/" },
        { title: "Exponents & Radicals: squares-and-roots-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-4/" },
        { title: "Exponents & Radicals: squares-and-roots-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-5/" },
        { title: "Exponents & Radicals: squares-and-roots-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-6/" }
        ],
      },
      {
        title: "Identify the rule governing number/shape patterns and find the unknowns based on it.",
        description: "SWBAT identify the rule governing number/shape patterns and find the unknowns based on it.\neg. 1, 4, 9, 16, 25 , X",
        activities: [
        { title: "Visual Algebra: patterns-intro", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-intro/" },
        { title: "Visual Algebra: patterns-intro-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-intro-2/" },
        { title: "Visual Algebra: flower", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/flower/" },
        { title: "Visual Algebra: patterns-sketching", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-sketching/" },
        { title: "Visual Algebra: quadratic-patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-patterns/" },
        { title: "Visual Algebra: quadratic-with-a-constant", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-with-a-constant/" }
        ],
      },
      {
        title: "Use the order of operations to correctly evaluate numerical expressions with parentheses, brackets, and braces.",
        description: "SWBAT use the order of operations to correctly evaluate numerical expressions with parentheses, brackets, and braces.\nExpression: 3 × (4 + 2)\n“First add 4 + 2 = 6, then 3 × 6 = 18.”",
        activities: [
        { title: "Exponents intro and order of operations", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/pre-algebra/xb4832e56:exponents-intro-and-order-of-operations" },
        { title: "Algebraic thinking (5th grade) — order of operations practice", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking" }
        ],
      },
      {
        title: "Represent an unknown number using a letter/symbol.",
        description: "SWBAT represent an unknown number using a letter/symbol.\neg. I am thinking of a number that, when added to 19 gives 40. Can you write an equation?\n19 + x = 40. ",
        activities: [
        { title: "Solving Equations: understanding-variables-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2/" },
        { title: "Solving Equations: using-variables-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp/" },
        { title: "Solving Equations: understanding-expressions-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp/" },
        { title: "Solving Equations: understanding-equations-1-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2/" }
        ],
      },
      {
        title: "Write expressions using letters to stand for unknowns from simple word phrases.",
        description: "SWBAT write expressions using letters to stand for unknowns from simple word phrases.\neg. Subtract 3 from a number y, then triple the result” → 3(y – 3).",
        activities: [
        { title: "Variables & Expressions: using-variables-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-variables-3/" },
        { title: "Variables & Expressions: variables-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/variables-9/" },
        { title: "Variables & Expressions: using-formulas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-formulas/" },
        { title: "Variables & Expressions: equivalent-expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/equivalent-expressions/" },
        { title: "Variables & Expressions: more-than-one-variable", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/more-than-one-variable/" }
        ],
      },
      {
        title: "Distinguish variables and constants in an expression/equation.",
        description: "SWBAT distinguish variables and constants in an expression/equation. \nIdentify the constant and variable in each:\na. 4x + 7\nb. X is the number of tickets bought. Cost of each ticket is 50 Rs. I pay a total cost according to the number of tickets bought.  T = 50X ",
        activities: [
        { title: "Variables & expressions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-expressions-and-variables" },
        { title: "Expressions & equations", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-expressions-and-variables" }
        ],
      },
      {
        title: "Use properties of operations (distributive, commutative, associative) to rewrite expressions in equivalent forms.",
        description: "SWBAT use properties of operations (distributive, commutative, associative) to rewrite expressions in equivalent forms.",
        activities: [
        { title: "Solving Equations: factoring-1a", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a/" },
        { title: "Visual Algebra: equiv-expr-linear-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-linear-2/" },
        { title: "Visual Algebra: equiv-expr-quad", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-quad/" },
        { title: "Visual Algebra: equiv-expr-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-exp/" },
        { title: "Visual Algebra: va-finale-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/va-finale-2/" },
        { title: "Visual Algebra: va-finale-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/va-finale-1/" }
        ],
      },
      {
        title: "Solve an equation to find an unknown (methods: substitution, adding/subtracting on both sides, multiplying/dividing on both sides, etc)",
        description: "SWBAT solve an equation to find an unknown (methods: substitution, adding/subtracting on both sides, multiplying/dividing on both sides, etc)\n1. 3x = 12\nTry x = 4 → 3×4 = 12 (true).\nTry x = 5 → 3×5 = 15 (not true).\nSo x = 4 is a solution\n2. 2x + 7 = 10\n2x= 3 (subtracting 7 from both sides)\nx= 3/2  (dividing by 2 on both sides)",
        activities: [
        { title: "Solving Equations: solving-equations-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2/" },
        { title: "Solving Equations: solving-multiple-equations-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp/" },
        { title: "Solving Equations: working-backwards-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp/" },
        { title: "Solving Equations: working-backwards-with-unknowns-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp/" },
        { title: "Solving Equations: equation-solving-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp/" },
        { title: "Solving Equations: substitution-8-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2/" }
        ],
      },
      {
        title: "Solve word problems and solving equations of the form x + p = q and px = q (with non-negative rational numbers).",
        description: "SWBAT solve word problems and solving equations of the form x + p = q and px = q (with non-negative rational numbers).\neg. A pen and a notebook together cost ₹120. The pen costs ₹45. How much is the notebook?”\nEquation: 45 + n = 120 → n = 120 – 45 = 75.",
        activities: [
        { title: "One-step add/subtract equations", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities" },
        { title: "One-step multiply/divide equations", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities" }
        ],
      },
      {
        title: "Represent two changing quantities with variables, write an equation connecting them, and analyze the relationship using tables and graphs.",
        description: "SWBAT represent two changing quantities with variables, write an equation connecting them, and analyze the relationship using tables and graphs.\neg. A taxi charges a fixed ₹50 + ₹20 per km. Can you plot fare vs distance?\nVariables: d = distance (km), C = total cost (₹).\nEquation: C = 20d + 50.",
        activities: [
        { title: "Plotting & Linear Graphs: change-for-one", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/change-for-one/" },
        { title: "Plotting & Linear Graphs: decreasing-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/decreasing-functions/" },
        { title: "Plotting & Linear Graphs: nonlinear-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/nonlinear-functions/" },
        { title: "Plotting & Linear Graphs: using-two-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/using-two-points/" },
        { title: "Plotting & Linear Graphs: computing-slopes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/computing-slopes/" },
        { title: "Plotting & Linear Graphs: writing-linear-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/writing-linear-functions/" }
        ],
      }
    ]);

    // CCSS G6: Geometry (6.G)
    await insertMajorWithSubsAndActivities("CCSS G6: Geometry (6.G)", [
      {
        title: "Plot points, lines, and shapes on the coordinate plane (Quadrant 1 --> All Quadrants)",
        description: "SWBAT plot points, lines, and shapes on the coordinate plane (Quadrant 1 --> All Quadrants)",
        activities: [
        { title: "Coordinate plane", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-geometry-3" },
        { title: "Transformations: coordinate-translation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/coordinate-translation/" },
        { title: "Transformations: translating-shapes-x-y", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/translating-shapes-x-y/" },
        { title: "Transformations: translate-into-region", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/translate-into-region/" },
        { title: "Transformations: rotating-180", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-180/" },
        { title: "Transformations: rotated-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotated-coordinates/" },
        { title: "Transformations: rotating-270-b", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-270-b/" }
        ],
      },
      {
        title: "Understand the relationship between two-dimensional figures and three-dimensional objects.",
        description: "SWBAT understand the relationship between two-dimensional figures and three-dimensional objects.",
        activities: [
        { title: "Nets of 3D figures", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic/cc-6th-surface-area" }
        ],
      },
      {
        title: "Identify and classify different categories of triangles and their properties",
        description: "SWBAT identify and classify different categories of triangles and their properties",
        activities: [
        { title: "Classifying triangles", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/plane-figures/imp-classifying-triangles" },
        { title: "Beautiful Geometry: the-triangle-inequality", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/the-triangle-inequality/" },
        { title: "Beautiful Geometry: congruent-and-similar-triangles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/congruent-and-similar-triangles/" },
        { title: "Beautiful Geometry: bass-fishing", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/bass-fishing/" },
        { title: "Beautiful Geometry: currys-paradox", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/currys-paradox/" }
        ],
      },
      {
        title: "Classify quadrilaterals based on properties such as angles, sides, parallel, and perpendicular",
        description: "SWBAT classify quadrilaterals based on properties such as angles, sides, parallel, and perpendicular",
        activities: [
        { title: "Properties of shapes (classify quadrilaterals by sides/angles/parallel/perpendicular)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes" }
        ],
      },
      {
        title: "Apply area and perimeter formulas for rectangles and squares to solve real-world and mathematical problems (e.g., finding an unknown width from area).",
        description: "SWBAT apply area and perimeter formulas for rectangles and squares to solve real-world and mathematical problems (e.g., finding an unknown width from area).",
        activities: [
        { title: "Geometry Fundamentals: polygon-areas-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/polygon-areas-2/" },
        { title: "Geometry Fundamentals: circles-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/circles-11/" },
        { title: "Geometry Fundamentals: scaling-areas-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/scaling-areas-1/" }
        ],
      },
      {
        title: "Solve real-world problems involving the area of other two-dimensional figures (Triangles, Parallelograms, composite shapes) (exception Circles)",
        description: "SWBAT solve real-world problems involving the area of other two-dimensional figures (Triangles, Parallelograms, composite shapes)  (exception Circles)",
        activities: [
        { title: "Geometry (area of parallelograms, triangles, composite figures)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic" },
        { title: "Area of composite figures", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic" },
        { title: "Beautiful Geometry: composite-geometry-warmups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/composite-geometry-warmups/" },
        { title: "Beautiful Geometry: adding-lines-and-grids", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/adding-lines-and-grids/" },
        { title: "Beautiful Geometry: complementary-areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/complementary-areas/" },
        { title: "Beautiful Geometry: inclusion-and-exclusion", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/inclusion-and-exclusion/" },
        { title: "Beautiful Geometry: invariant-areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/invariant-areas/" }
        ],
      }
    ]);

    // CCSS G6: Statistics & Probability (6.SP)
    await insertMajorWithSubsAndActivities("CCSS G6: Statistics & Probability (6.SP)", [
      {
        title: "Read and interpret a line graph",
        description: "SWBAT read and interpret a line graph",
        activities: [
        { title: "Represent and interpret data", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/kmap/measurement-and-data-d/represent-interpret-data" }
        ],
      },
      {
        title: "Plot a line graph",
        description: "SWBAT plot a line graph",
        activities: [
        { title: "Line plots", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/line-plots" },
        { title: "Coordinate plane (5th grade) — plot points & interpret graphs", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:coordinate-plane" }
        ],
      }
    ]);
    // END GENERATED SEED (MYP Y1) - DO NOT EDIT BY HAND

    // BEGIN GENERATED SEED (PYP Y2) - DO NOT EDIT BY HAND
// ========== PYP Y2 SEED BLOCK (insertPypMajor) ==========

    // Angle Detectives
    await insertPypMajor("Angle Detectives", [
      {
        title: "SWBAT Identify common angles like 30, 45, 60, 90,  right, acute, and obtuse.",
        description: "SWBAT Identify common angles like 30, 45, 60, 90,  right, acute, and obtuse.",
        activities: [
        { title: "Measuring angles", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2" },
        { title: "Geometry Fundamentals: angle-facts-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles/angle-facts-3/" },
        { title: "Geometry Fundamentals: parallel-lines-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles/parallel-lines-2/" },
        { title: "Geometry Fundamentals: triangle-sides-and-angles-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles/triangle-sides-and-angles-2/" }
        ],
      },
      {
        title: "SWBAT measure and sketch angles with protractor",
        description: "SWBAT measure and sketch angles with protractor",
        activities: [
        { title: "Measuring angles", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2/imp-measuring-angles" }
        ],
      },
      {
        title: "SWBAT calculate complementary and supplementary angles.",
        description: "SWBAT calculate complementary and supplementary angles.",
        activities: [
        { title: "Angle relationships (7th grade) — complementary/supplementary", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-seventh-grade-math/cc-7th-geometry/cc-7th-angles" }
        ],
      },
      {
        title: "SWBAT solve word problems involving angles",
        description: "SWBAT solve word problems involving angles",
        activities: [
        { title: "Angle addition (word problems)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2" }
        ],
      }
    ]);

    // Shape Safari
    await insertPypMajor("Shape Safari", [
      {
        title: "SWBAT identify and classify triangles (Right, isoceles, equilateral)",
        description: "SWBAT identify and classify triangles (Right, isoceles, equilateral)",
        activities: [
        { title: "Classifying triangles", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/plane-figures/imp-classifying-triangles" }
        ],
      },
      {
        title: "SWBAT identify and differentiate common 2D figures by angles, side-lengths, parallel lines.",
        description: "SWBAT identify and differentiate common 2D figures by angles, side-lengths, parallel lines.",
        activities: [
        { title: "Beautiful Geometry: angles-of-regular-polygons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/angles-of-regular-polygons/" },
        { title: "Beautiful Geometry: defining-regular-polygons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/defining-regular-polygons/" },
        { title: "Beautiful Geometry: polygon-areas-and-lengths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/polygon-areas-and-lengths/" },
        { title: "Beautiful Geometry: matchstick-polygons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/matchstick-polygons/" },
        { title: "Beautiful Geometry: stellations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/stellations/" },
        { title: "Beautiful Geometry: dissections", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/dissections/" }
        ],
      },
      {
        title: "SWBAT recognize lines of symmetry in 2D figures.",
        description: "SWBAT recognize lines of symmetry in 2D figures.",
        activities: [
        { title: "Plane figures (4th grade) — includes symmetry lessons", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/plane-figures" },
        { title: "Transformations: manual-reflection", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/manual-reflection/" },
        { title: "Transformations: manual-reflection-more-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/manual-reflection-more-lines/" },
        { title: "Transformations: the-line-of-reflection", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/the-line-of-reflection/" },
        { title: "Transformations: reflecting-shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/reflecting-shapes/" },
        { title: "Transformations: reflectional-symmetry", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/reflectional-symmetry/" },
        { title: "Transformations: identifying-symmetry", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/identifying-symmetry/" }
        ],
      }
    ]);

    // Number Crunching
    await insertPypMajor("Number Crunching", [
      {
        title: "SWBAT read and write multi-digit numbers in standard, word, and expanded form.",
        description: "SWBAT read and write multi-digit numbers in standard, word, and expanded form.",
        activities: [
        { title: "Place value", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" }
        ],
      },
      {
        title: "SWBAT explain that each digit is 10× the value of the digit to its right and 1/10 of the digit to its left.",
        description: "SWBAT explain that each digit is 10× the value of the digit to its right and 1/10 of the digit to its left.",
        activities: [
        { title: "Place value and rounding", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" }
        ],
      },
      {
        title: "SWBAT Add and Subtract multi-digit numbers using algo",
        description: "SWBAT Add and Subtract multi-digit numbers using algo",
        activities: [
        { title: "Place value, rounding, and algorithms", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/4th-engage-ny/engage-4th-module-1" },
        { title: "Add and subtract multi-digit numbers", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-addition-and-subtraction-2" }
        ],
      },
      {
        title: "SWBAT do efficient Add & Sub by using properties like: commutative, associative, breaking nos, multiples of 10, Counting up/down etc.",
        description: "SWBAT do efficient Add & Sub by using properties like: commutative, associative, breaking nos, multiples of 10, Counting up/down etc.",
        activities: [
        { title: "Addition, subtraction, and estimation", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-addition-and-subtraction" }
        ],
      },
      {
        title: "SWBAT multiply multi-digit whole numbers by 1-digit using algorithms and area models (e.g., 4-digit × 1-digit).",
        description: "SWBAT multiply multi-digit whole numbers by 1-digit using algorithms and area models (e.g., 4-digit × 1-digit).",
        activities: [
        { title: "Multiplication and division (algorithms + area models)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2" }
        ],
      },
      {
        title: "SWBAT to do efficient multiplication by using properties like: doubling, skip counting, associative, distributive",
        description: "SWBAT to do efficient multiplication by using properties like: doubling, skip counting, associative, distributive",
        activities: [
        { title: "1-digit multiplication", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/3rd-basic-multiplication" }
        ],
      },
      {
        title: "SWBAT divide multi-digit whole numbers by 1-digit (quotients and remainders) using place value strategies (e.g., up to 4-digit ÷ 1-digit).",
        description: "SWBAT divide multi-digit whole numbers by 1-digit (quotients and remainders) using place value strategies (e.g., up to 4-digit ÷ 1-digit).",
        activities: [
        { title: "Division (multi-digit, quotients and remainders)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/division" }
        ],
      },
      {
        title: "SWBAT Multi-step word problem of add/sub/mul/div, using equations with Unknowns.",
        description: "SWBAT Multi-step word problem of add/sub/mul/div, using equations with Unknowns.",
        activities: [
        { title: "Multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2" },
        { title: "Add & subtract", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-addition-and-subtraction-2" }
        ],
      },
      {
        title: "SWBAT multiply two multi-digit whole numbers using place value and algorithms (e.g., 2-digit × 2-digit).",
        description: "SWBAT multiply two multi-digit whole numbers using place value and algorithms (e.g., 2-digit × 2-digit).",
        activities: [
        { title: "Multiply by 2-digit numbers (place value + algorithms)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2" }
        ],
      },
      {
        title: "SWBAT use BODMAS/PEDMAS to do order of operations.",
        description: "SWBAT use BODMAS/PEDMAS to do order of operations.",
        activities: [
        { title: "Order of operations (PEMDAS/BODMAS practice)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking" }
        ],
      },
      {
        title: "SWBAT verify calculations using inverse operations (mul ↔ div; add ↔ sub) ",
        description: "SWBAT verify calculations using inverse operations (mul ↔ div; add ↔ sub) ",
        activities: [
        { title: "More with multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-multiplication-and-division" },
        { title: "Add & subtract", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-addition-and-subtraction-2" }
        ],
      },
      {
        title: "SWBAT Verify calculation using estimation and rounding.",
        description: "SWBAT Verify calculation using estimation and rounding.",
        activities: [
        { title: "Place value and rounding", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" }
        ],
      }
    ]);

    // Fraction Adventures
    await insertPypMajor("Fraction Adventures", [
      {
        title: "SWBAT relate fractions to real objects: (x/y means y “equal” pieces and then take x out of it.)",
        description: "SWBAT relate fractions to real objects: (x/y means y “equal” pieces and then take x out of it.)",
        activities: [
        { title: "Arithmetic Thinking: Finding Half", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/find-half/" },
        { title: "Arithmetic Thinking: Combining Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/combining-parts/" },
        { title: "Arithmetic Thinking: Splitting Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/take-more-than-one/" },
        { title: "Arithmetic Thinking: Splitting and Combining", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/shade-this-much/" },
        { title: "Arithmetic Thinking: Equal Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/equal-nths/" }
        ],
      },
      {
        title: "SWBAT mark fractions on a number line.",
        description: "SWBAT mark fractions on a number line.",
        activities: [
        { title: "Fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2" }
        ],
      },
      {
        title: "SWBAT compare fractions using models and the number line.",
        description: "SWBAT compare fractions using models and the number line.",
        activities: [
        { title: "Fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2" }
        ],
      },
      {
        title: "SWBAT find equivalent fraction of a given fraction.",
        description: "SWBAT find equivalent fraction of a given fraction.",
        activities: [
        { title: "Arithmetic Thinking: Sixths and Twelfths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/equal-fractions/" },
        { title: "Arithmetic Thinking: Eighths and Sixteenths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/equal-fractions-2/" },
        { title: "Arithmetic Thinking: Making Equivalent Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/making-equivalent/" },
        { title: "Arithmetic Thinking: Equivalent Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/equivalent-fractions-3/" },
        { title: "Arithmetic Thinking: Identifying Equivalents", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/wodb-equivalents/" }
        ],
      },
      {
        title: "SWBAT Add and Subtract like fractions.",
        description: "SWBAT Add and Subtract like fractions.",
        activities: [
        { title: "Arithmetic Thinking: Adding Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-fractions/" },
        { title: "Arithmetic Thinking: Adding Same-Sized Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/add-unit-fractions/" }
        ],
      },
      {
        title: "SWBAT Multiply a fraction by a whole number and another fraction.",
        description: "SWBAT Multiply a fraction by a whole number and another fraction.",
        activities: [
        { title: "Multiply fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions" }
        ],
      },
      {
        title: "SWBAT Simplify a given fraction.",
        description: "SWBAT Simplify a given fraction.",
        activities: [
        { title: "Simplifying fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" },
        { title: "Arithmetic Thinking: Simplifying Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/simplifying-fractions/" }
        ],
      },
      {
        title: "SWBAT Convert mixed to improper fraction",
        description: "SWBAT Convert mixed to improper fraction",
        activities: [
        { title: "Mixed numbers and improper fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions/mixed-number" },
        { title: "Mixed numbers", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2/imp-mixed-numbers" }
        ],
      },
      {
        title: "SWBAT Convert improper to mixed fraction.",
        description: "SWBAT Convert improper to mixed fraction.",
        activities: [
        { title: "Mixed numbers and improper fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions/mixed-number" }
        ],
      },
      {
        title: "SWBAT Compare unlike fractions",
        description: "SWBAT Compare unlike fractions",
        activities: [
        { title: "Fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2" },
        { title: "Equivalent fractions and comparing fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" }
        ],
      },
      {
        title: "SWBAT express a fraction (a/b, where a > 1) as a sum of unit fractions (1/b).",
        description: "SWBAT express a fraction (a/b, where a > 1) as a sum of unit fractions (1/b).",
        activities: [
        { title: "Compose & decompose fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2" }
        ],
      },
      {
        title: "SWBAT Add and Sub unlike fractions",
        description: "SWBAT Add and Sub unlike fractions",
        activities: [
        { title: "Arithmetic Thinking: Adding Unlike Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-different/" },
        { title: "Arithmetic Thinking: Adding Unit Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-nonmultiples/" },
        { title: "Arithmetic Thinking: Adding Any Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-unlike/" }
        ],
      },
      {
        title: "SWBAT Add and Sub mixed fractions",
        description: "SWBAT Add and Sub mixed fractions",
        activities: [
        { title: "Add and subtract mixed numbers", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions/add-sub-mixed-numbers" }
        ],
      },
      {
        title: "SWBAT solve word problems involving add and sub of fractions (Unlike and mixed)",
        description: "SWBAT solve word problems involving add and sub of fractions (Unlike and mixed)",
        activities: [
        { title: "Add and subtract fractions (different denominators)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic/x18ca194a:add-and-subtract-fractions-different-denominators" },
        { title: "Adding/subtracting fractions word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3/imp-adding-and-subtracting-fractions-with-unlike-denominators-word-problems" }
        ],
      }
    ]);

    // Measuring the World
    await insertPypMajor("Measuring the World", [
      {
        title: "SWBAT convert common units (km–m–cm; kg–g; l–ml; hr–min–sec)",
        description: "SWBAT convert common units (km–m–cm; kg–g; l–ml; hr–min–sec)",
        activities: [
        { title: "Converting units of measure", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-measurement-and-data-3" },
        { title: "Converting units", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/6th-grade-illustrative-math/unit-3-unit-rates-and-percentages/x6d0461550282bed1:converting-units/a/converting-units" }
        ],
      },
      {
        title: "SWBAT solve real-world problems about distance, time, volume, mass, and money.",
        description: "SWBAT solve real-world problems about distance, time, volume, mass, and money.",
        activities: [
        { title: "Units of measurement (distance/time/volume/mass/money)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-measurement-and-data-2" }
        ],
      },
      {
        title: "SWBAT calculate area for rectangles and composite rectangles",
        description: "SWBAT calculate area for rectangles and composite rectangles",
        activities: [
        { title: "Area of rectangles (4th grade) — includes composite figures", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-measurement-and-data-2" },
        { title: "Geometry Fundamentals: calculating-area-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/calculating-area-6/" }
        ],
      },
      {
        title: "SWBAT calculate perimeter for triangles, rectangles, and composite shapes",
        description: "SWBAT calculate perimeter for triangles, rectangles, and composite shapes",
        activities: [
        { title: "Perimeter (triangles, rectangles, composite shapes)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/3rd-perimeter/imp-perimeter" }
        ],
      },
      {
        title: "SWBAT solve word problesm involving area and perimeter of rectangles.",
        description: "SWBAT solve word problesm involving area and perimeter of rectangles.",
        activities: [
        { title: "Area and perimeter", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/area-perimeter" },
        { title: "Area & perimeter word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/3rd-perimeter/imp-comparing-area-and-perimeter/e/area-perimeter-word-problems" }
        ],
      },
      {
        title: "SWBAT understand and calculate volume of cube and rectangular prism.",
        description: "SWBAT understand and calculate volume of cube and rectangular prism.",
        activities: [
        { title: "Volume", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-volume" }
        ],
      },
      {
        title: "SWBAT compute the surface area of rectangular prism/composite figures",
        description: "SWBAT compute the surface area of rectangular prism/composite figures",
        activities: [
        { title: "Area, surface area, and volume (6th Engage NY)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/6th-engage-ny/engage-6th-module-5" },
        { title: "Surface area", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic/cc-6th-surface-area" }
        ],
      },
      {
        title: "SWBAT solve word problems of surface area and volume.",
        description: "SWBAT solve word problems of surface area and volume.",
        activities: [
        { title: "Unit 1: Area and Surface Area (6th Illustrative Math)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/6th-grade-illustrative-math/unit-1-area-and-surface-area" },
        { title: "Volume word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-volume" }
        ],
      }
    ]);

    // Map Makers
    await insertPypMajor("Map Makers", [
      {
        title: "SWBAT plot points, Lines, and shapes on the coordinate plane.",
        description: "SWBAT plot points, Lines, and shapes on the coordinate plane.",
        activities: [
        { title: "Coordinate Plane: coordinates-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/coordinates-2/" },
        { title: "Coordinate Plane: coordinate-pairs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/coordinate-pairs/" },
        { title: "Coordinate Plane: axes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/axes/" },
        { title: "Coordinate Plane: x-and-y-coords", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/x-and-y-coords/" },
        { title: "Coordinate Plane: plotting-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/plotting-points/" },
        { title: "Coordinate Plane: points-to-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/points-to-lines/" }
        ],
      },
      {
        title: "SWBAT solve problems, like distances between 2 points their midpoints.",
        description: "SWBAT solve problems, like distances between 2 points their midpoints.",
        activities: [
        { title: "Coordinate plane", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:coordinate-plane" },
        { title: "Number line (6th grade) — finding midpoints", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-number-topic" }
        ],
      }
    ]);

    // Data Detectives
    await insertPypMajor("Data Detectives", [
      {
        title: "SWBAT interpret and plot data in various graphs.",
        description: "SWBAT interpret and plot data in various graphs.",
        activities: [
        { title: "Everyday Statistics: ds-quartiles-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-3/" },
        { title: "Everyday Statistics: ds-quartiles-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-4/" },
        { title: "Everyday Statistics: ds-median-lists-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-median-lists-2/" },
        { title: "Everyday Statistics: ds-quartiles-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-6/" },
        { title: "Everyday Statistics: adding-whiskers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/adding-whiskers/" },
        { title: "Everyday Statistics: matching-boxplots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/matching-boxplots/" }
        ],
      }
    ]);

    // Decimal Explorers
    await insertPypMajor("Decimal Explorers", [
      {
        title: "SWBAT show decimals up to hundredth place on a number line.",
        description: "SWBAT show decimals up to hundredth place on a number line.",
        activities: [
        { title: "Decimal place value", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" }
        ],
      },
      {
        title: "SWBAT compare and order decimals upto hundredths place",
        description: "SWBAT compare and order decimals upto hundredths place",
        activities: [
        { title: "Place value and decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" }
        ],
      },
      {
        title: "SWBAT convert fractions with denominator 100 to decimals and vice versa",
        description: "SWBAT convert fractions with denominator 100 to decimals and vice versa",
        activities: [
        { title: "Place value and decimal fractions (5th Engage NY)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/5th-engage-ny/engage-5th-module-1" }
        ],
      },
      {
        title: "SWBAT convert fractions to decimal notation.",
        description: "SWBAT convert fractions to decimal notation.",
        activities: [
        { title: "Decimal fractions (4th Engage NY)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/4th-engage-ny/engage-4th-module-6" }
        ],
      },
      {
        title: "SWBAT add a decimal with whole no. and another decimal.",
        description: "SWBAT add a decimal with whole no. and another decimal.",
        activities: [
        { title: "Get ready for adding and subtracting decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/get-ready-for-5th-grade/x01d8909412c13b9d:get-ready-for-adding-subtracting-decimals" }
        ],
      },
      {
        title: "SWBAT sub a decimal with whole no. and another decimal.",
        description: "SWBAT sub a decimal with whole no. and another decimal.",
        activities: [
        { title: "Subtract decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/subtract-decimals" }
        ],
      },
      {
        title: "SWBAT multiply a decimal with whole no.",
        description: "SWBAT multiply a decimal with whole no.",
        activities: [
        { title: "Multiply decimals (5th grade FL)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/grade-5-math-fl-best/x7a7f452d9f51baa9:multiply-decimals" }
        ],
      },
      {
        title: "SWBAT divide 2 whole numbers to get a decimal quotient.",
        description: "SWBAT divide 2 whole numbers to get a decimal quotient.",
        activities: [
        { title: "Divide decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-decimals" }
        ],
      },
      {
        title: "SWBAT solve multi-digit computation problems that too word problems involving decimals.",
        description: "SWBAT solve multi-digit computation problems that too word problems involving decimals.",
        activities: [
        { title: "Arithmetic decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/arithmetic/arith-decimals" },
        { title: "Decimals word problems", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-multiplication-and-division-3" }
        ],
      }
    ]);
    // END GENERATED SEED (PYP Y2) - DO NOT EDIT BY HAND

    return {
      success: true,
      message: `Deleted ${deletedMajors} majors, ${deletedLearning} learning objectives, ${deletedActivities} activities, ${deletedProgress} progress, ${deletedStudentObj} student objectives, ${deletedStudentMajor} student major objectives. Created ${createdMajors} majors, ${createdLearning} learning objectives, ${createdActivities} activities.`,
    };
  },
});


/**
 * Seed Brilliant interactive curriculum split into MYP + PYP sections.
 * Deletes any existing Brilliant / Brilliant MYP / Brilliant PYP data first.
 *
 * Run: npx convex run seed:seedBrilliantCurriculum
 */
export const seedBrilliantCurriculum = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (!admin) {
      return { success: false, message: "No admin user found" };
    }

    let mathDomain = await ctx.db
      .query("domains")
      .filter((q) => q.eq(q.field("name"), "Mathematics"))
      .first();

    if (!mathDomain) {
      mathDomain = await ctx.db
        .query("domains")
        .filter((q) => q.eq(q.field("name"), "Math"))
        .first();
    }

    if (!mathDomain) {
      return { success: false, message: "Math/Mathematics domain not found" };
    }

    // ========== STEP 1: DELETE PYP Y2 + Brilliant curriculum ==========

    const existingMajors = await ctx.db
      .query("majorObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", mathDomain._id))
      .collect();

    // Delete majors tagged as any Brilliant variant
    const toDelete = existingMajors.filter(
      (m: any) => m.curriculum === "Brilliant" || m.curriculum === "Brilliant MYP" || m.curriculum === "Brilliant PYP"
    );

    let deletedProgress = 0;
    let deletedActivities = 0;
    let deletedStudentObj = 0;
    let deletedStudentMajor = 0;
    let deletedLearning = 0;
    let deletedMajors = 0;

    for (const major of toDelete) {
      const learningObjs = await ctx.db
        .query("learningObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", major._id))
        .collect();

      for (const lo of learningObjs) {
        const activities = await ctx.db
          .query("activities")
          .withIndex("by_objective", (q) => q.eq("objectiveId", lo._id))
          .collect();

        for (const act of activities) {
          const progress = await ctx.db
            .query("activityProgress")
            .withIndex("by_activity", (q) => q.eq("activityId", act._id))
            .collect();
          for (const p of progress) {
            await ctx.db.delete(p._id);
            deletedProgress++;
          }
          await ctx.db.delete(act._id);
          deletedActivities++;
        }

        const studentObjs = await ctx.db
          .query("studentObjectives")
          .withIndex("by_objective", (q) => q.eq("objectiveId", lo._id))
          .collect();
        for (const so of studentObjs) {
          await ctx.db.delete(so._id);
          deletedStudentObj++;
        }

        await ctx.db.delete(lo._id);
        deletedLearning++;
      }

      const studentMajors = await ctx.db
        .query("studentMajorObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", major._id))
        .collect();
      for (const sm of studentMajors) {
        await ctx.db.delete(sm._id);
        deletedStudentMajor++;
      }

      await ctx.db.delete(major._id);
      deletedMajors++;
    }

    // ========== STEP 2: INSERT BRILLIANT CURRICULUM (3 modules, 7 LOs) ==========

    let timestamp = Date.now();
    let createdMajors = 0;
    let createdLearning = 0;
    let createdActivities = 0;

    const insertBrilliantMajor = async (
      majorTitle: string,
      curriculum: string,
      subs: Array<{
        title: string;
        description: string;
        activities: Array<{
          title: string;
          type: "video" | "exercise" | "reading" | "project" | "game";
          platform: string;
          url: string;
        }>;
      }>
    ) => {
      const majorId = await ctx.db.insert("majorObjectives", {
        domainId: mathDomain._id,
        title: majorTitle,
        description: majorTitle,
        curriculum,
        createdBy: admin._id,
        createdAt: timestamp++,
      });
      createdMajors++;

      for (const sub of subs) {
        const loId = await ctx.db.insert("learningObjectives", {
          domainId: mathDomain._id,
          majorObjectiveId: majorId,
          title: sub.title,
          description: sub.description,
          difficulty: "intermediate",
          createdBy: admin._id,
          createdAt: timestamp++,
        });
        createdLearning++;

        for (let i = 0; i < sub.activities.length; i++) {
          const act = sub.activities[i];
          await ctx.db.insert("activities", {
            objectiveId: loId,
            title: act.title,
            type: act.type,
            platform: act.platform,
            url: act.url,
            order: i,
          });
          createdActivities++;
        }
      }
    };

    // BEGIN GENERATED SEED (Brilliant) - DO NOT EDIT BY HAND

    // ===== BRILLIANT MYP =====
    // Supports MYP Module 5 (Ratios & Rates) and Module 4 (Integers)

    // Brilliant MYP Module 1: Percentages (Interactive Practice)
    await insertBrilliantMajor("Percentages", "Brilliant MYP", [
      {
        title: "Percentages & Fractions",
        description: "Interactive exercises: intro to percentages, tenths, hundredths, decimals.",
        activities: [
        // Ch 6: Percentages and Fractions
        { title: "Intro to Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/intro-to-percentages/" },
        { title: "Working out Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/calculating-percentages/" },
        { title: "Percentages and Batteries", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/battery-percentages/" },
        { title: "Percentages as Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/fraction-equivalence-blanks/" },
        // Ch 8: Tenths, Hundredths and Decimals
        { title: "Percentages as Tenths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/tenths-equivalence/" },
        { title: "Percentages as Hundredths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/hundredths-equivalence/" },
        { title: "Finding the Percentage", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/finding-the-percentage/" },
        { title: "Percentages as Decimals", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/converting-to-decimals/" },
        ],
      },
      {
        title: "Percent Change",
        description: "Interactive exercises: percent increase, decrease, compound changes.",
        activities: [
        // Ch 7: Percent Increase
        { title: "Percent Increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/percent-increase/" },
        { title: "Price Increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/price-increase/" },
        { title: "Calculating Percent Increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/percent-increase-blanks/" },
        // Ch 9: Percent Decrease
        { title: "Percent Decrease", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percent-decrease/" },
        { title: "Calculating Percent Decrease", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percentage-decrease-blanks/" },
        { title: "Finding the Original Price", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/finding-the-original-price/" },
        { title: "Reversing Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/reversing-percentages/" },
        // Ch 10: Compound Changes
        { title: "Compound Changes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-compound-changes/compound-changes-receipts/" },
        ],
      },
    ]);

    // Brilliant MYP Module 2: Integers (Interactive Practice)
    await insertBrilliantMajor("Integers", "Brilliant MYP", [
      {
        title: "Introducing Negatives",
        description: "Interactive exercises: positive/negative numbers, number line, ordering, absolute value.",
        activities: [
        // Ch 11: Introducing Negatives
        { title: "Positives and Negatives", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-1/" },
        { title: "Negative Numbers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-3/" },
        { title: "Making Integers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-2/" },
        { title: "Addition", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-4/" },
        // Ch 15: The Number Line
        { title: "The Number Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-205/" },
        { title: "Addition on the Number Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-21/" },
        { title: "Adding Large Integers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-25/" },
        { title: "Subtraction on the Number Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-22/" },
        ],
      },
      {
        title: "Integer Operations",
        description: "Interactive exercises: adding, subtracting, opposites, distance on number line.",
        activities: [
        // Ch 12: Addition, Opposites, and Zero
        { title: "Increasing Value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-5/" },
        { title: "Opposites", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-8/" },
        { title: "Adding Negatives", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-9/" },
        { title: "Adding Negatives and Positives", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-10/" },
        // Ch 13: Subtracting Integers
        { title: "Subtracting Positives", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-12/" },
        { title: "Subtracting Negatives", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-13/" },
        // Ch 14: Subtraction and Addition
        { title: "Adding The Opposite", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expression-17/" },
        { title: "Subtracting Using Addition", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expressions-18/" },
        ],
      },
    ]);

    // Brilliant MYP Module 3: Ratios & Unit Rates (Interactive Practice)
    // Supports MYP Module 5: Ratios & Rates
    await insertBrilliantMajor("Ratios & Unit Rates", "Brilliant MYP", [
      {
        title: "Setting Up Ratios",
        description: "Interactive exercises: setting up ratios, scaling up/down, equivalent ratios, batches, scale factors.",
        activities: [
        // Ch 1: Setting Up Ratios
        { title: "Setting Up Ratios", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/new-color-1" },
        { title: "Scaling Up", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/scale-up-color" },
        { title: "Scaling Down", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/make-smaller-color" },
        { title: "Making a New Mixture", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/new-ratio" },
        // Ch 2: Equivalent Ratios
        { title: "Scaling Up Recipes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/scale-up-recipe" },
        { title: "Making Batches", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/making-batches" },
        { title: "Finding Batches", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/finding-batches" },
        { title: "Scale Factor", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/ratio-scale-factor" },
        ],
      },
      {
        title: "Scaling & Unit Rates",
        description: "Interactive exercises: scaling ratios, finding totals/parts, unit rates, comparing mixtures.",
        activities: [
        // Ch 3: Scaling Ratios
        { title: "Scaling Down to Scale Up", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/ratio-scale-up-down" },
        { title: "Scaling in One Move", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/scale-down-scale-up-2" },
        { title: "Finding the Total", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/finding-total" },
        { title: "Finding the Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/finding-parts" },
        // Ch 4: Unit Rates
        { title: "How Much for One", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/how-much-for-one" },
        { title: "Computing Unit Rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/unit-rates" },
        { title: "Two Unit Rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/two-rates" },
        { title: "Scaling Down to Scale Up (Rates)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/scale-downup-unitrates" },
        { title: "Using Unit Rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/compare-mixtures" },
        ],
      },
    ]);

    // Brilliant MYP Module 4: Proportional Relationships (Interactive Practice)
    // Supports MYP Module 5: Ratios & Rates + Module 6: Algebra
    await insertBrilliantMajor("Proportional Relationships", "Brilliant MYP", [
      {
        title: "Rates & Comparisons",
        description: "Interactive exercises: unit cost, finding unit rate, comparing rates.",
        activities: [
        // Ch 5: Proportional Relationships
        { title: "Using Unit Rates to Find Cost", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/unit-rate-invoices" },
        { title: "Finding Unit Cost", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/divide-to-find-unit-rate" },
        { title: "Comparing Rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/comparing-rates-3" },
        ],
      },
      {
        title: "Graphing Proportional Relationships",
        description: "Interactive exercises: plotting points, equivalent ratios on graphs, unit rate on graphs.",
        activities: [
        // Ch 6: Graphing PRs
        { title: "Plotting Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/graph-points-in-proportion" },
        { title: "Plotting Equivalent Ratios", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/proportions-and-lines" },
        { title: "Using Graphs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/using-proportion-graphs" },
        { title: "Plotting Unit Rate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/plotting-unit-rate" },
        { title: "Graphing Relationships", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/graphing-relationships-2" },
        { title: "Constant of Proportionality", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/unitrate-to-graph" },
        ],
      },
      {
        title: "Proportional Equations",
        description: "Interactive exercises: writing equations, graphing from equations, comparing proportional relationships.",
        activities: [
        // Ch 7: PR Equations
        { title: "Writing Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/write-equation" },
        { title: "Equation from a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/equation-unknown-c" },
        { title: "Graphing from an Equation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/graphing-equations-3" },
        { title: "Graphing Comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/graphing-comparisons" },
        ],
      },
    ]);

    // Brilliant MYP Module 5: Coordinate Plane (Interactive Practice)
    // Supports MYP Module 7: Geometry
    await insertBrilliantMajor("Coordinate Plane", "Brilliant MYP", [
      {
        title: "Points & Quadrants",
        description: "Interactive exercises: coordinates, plotting points, all four quadrants, negative coordinates.",
        activities: [
        // Ch 1: Points
        { title: "Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/coordinates-2" },
        { title: "Coordinate Pairs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/coordinate-pairs" },
        { title: "Axes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/axes" },
        { title: "x and y Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/x-and-y-coords" },
        { title: "Plotting Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/plotting-points" },
        { title: "Identifying Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/identifying-points" },
        { title: "Applied Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/applied-coordinates" },
        // Ch 2: The Four Quadrants
        { title: "Negative Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/negative-coordinates" },
        { title: "Selecting Quadrants", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/identifying-quadrants" },
        { title: "Points in Quadrants", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/point-in-quadrant" },
        { title: "Plotting Negative Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/plotting-negative-coords" },
        { title: "Identifying More Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/identifying-negative-coords" },
        { title: "City Temperatures", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/temperature-coordinates" },
        ],
      },
      {
        title: "Lines & Inequalities",
        description: "Interactive exercises: horizontal/vertical lines, interpreting lines, graphing inequalities, regions.",
        activities: [
        // Ch 3: Lines
        { title: "From Points to Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/points-to-lines" },
        { title: "Horizontal Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/horizontal-lines" },
        { title: "Vertical Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/vertical-lines" },
        { title: "Horizontal and Vertical Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/horiz-and-vert-lines" },
        { title: "Interpreting Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/interpreting-lines" },
        // Ch 4: Inequalities
        { title: "y Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/y-inequalities" },
        { title: "x Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/x-inequalities" },
        { title: "Identifying Regions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/identifying-regions" },
        { title: "Or Equal To", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/or-equal-to-plane" },
        { title: "Marking Boundaries", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/marking-boundaries" },
        { title: "Accounting Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/accounting-inequalities" },
        ],
      },
      {
        title: "Distance on the Coordinate Plane",
        description: "Interactive exercises: distance from axes, between points, absolute value and distance.",
        activities: [
        // Ch 5: Gridline Distance
        { title: "Distance From Axes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/distance-between-points" },
        { title: "Distance Between Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/vertical-separation" },
        { title: "Absolute Value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/distance-absolute-value" },
        { title: "Selecting for Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/selecting-for-distance" },
        { title: "Giving Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/giving-coordinates" },
        { title: "Temperature Differences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/temperature-differences" },
        ],
      },
    ]);

    // Brilliant MYP Module 6: Coordinate Geometry (Interactive Practice)
    // Supports MYP Module 7: Geometry
    await insertBrilliantMajor("Coordinate Geometry", "Brilliant MYP", [
      {
        title: "Distance & Separation",
        description: "Interactive exercises: separation between points, comparing distance, distance ranges, estimation.",
        activities: [
        // Ch 1: Separating Points
        { title: "Separation Between Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/separating-points/placing-points" },
        { title: "Combining Separations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/separating-points/combining-separation" },
        { title: "The Closest Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/separating-points/closest-point" },
        { title: "Comparing Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/separating-points/comparing-distance" },
        // Ch 2: Estimating Distance
        { title: "Within a Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/estimating-distance/close-to-multiple-points" },
        { title: "Distance Ranges", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/estimating-distance/distance-ranges" },
        { title: "Equal Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/estimating-distance/same-distance" },
        { title: "Estimating Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/estimating-distance/estimating-distance" },
        ],
      },
      {
        title: "Area on the Coordinate Plane",
        description: "Interactive exercises: rectangle area, triangle area, absolute values, combining shapes, polygon area.",
        activities: [
        // Ch 3: Measuring Area
        { title: "Rectangle Area", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/measuring-area/measuring-area" },
        { title: "Calculating Side Lengths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/measuring-area/rectangle-area-with-negatives" },
        { title: "Absolute Values", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/measuring-area/absolute-values" },
        { title: "Triangle Area", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/measuring-area/triangle-area" },
        { title: "Combining Rectangles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/measuring-area/combining-rectangles" },
        { title: "Polygon Area", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/measuring-area/polygon-area" },
        ],
      },
      {
        title: "Variables & Shape Expressions",
        description: "Interactive exercises: distance with variables, area expressions, selecting shapes, compound shapes.",
        activities: [
        // Ch 4: Unknown Values
        { title: "Distances with Variables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/unknown-values/distance-expressions" },
        { title: "Rectangle Area Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/unknown-values/areas-with-variables" },
        { title: "Triangle Area Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/unknown-values/triangle-area-expressions" },
        { title: "Variable Side Lengths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/unknown-values/leaving-the-plane" },
        // Ch 5: Selecting Shapes
        { title: "Selecting Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/selecting-shapes/selecting-shapes" },
        { title: "Area Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/selecting-shapes/selecting-multiple-shapes" },
        { title: "Compound Shape Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/selecting-shapes/area-expressions" },
        { title: "Equating Areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/selecting-shapes/compound-shape-expressions" },
        ],
      },
      {
        title: "Pythagoras' Theorem",
        description: "Interactive exercises: Pythagorean theorem, diagonal distance, proving Pythagoras, finding unknown sides.",
        activities: [
        // Ch 6: Pythagoras
        { title: "Pythagoras' Theorem", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/pythagoras/pythagoras-theorem" },
        { title: "Direct Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/pythagoras/diagonal-distance" },
        { title: "Squares and Sides", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/pythagoras/squares" },
        { title: "Demonstrating Pythagoras", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/pythagoras/demonstrating-pythagoras" },
        { title: "Proving Pythagoras", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/pythagoras/proving-pythagoras" },
        // Ch 7: Using Pythagoras
        { title: "The Unknown Side", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/using-pythagoras/side-lengths" },
        { title: "Distance from the Origin", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/using-pythagoras/distance-from-origin" },
        { title: "Distance from the Grid", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/using-pythagoras/grid-diagonals" },
        { title: "Distance from Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/using-pythagoras/distance-from-coordinates" },
        ],
      },
      {
        title: "Circles on the Coordinate Plane",
        description: "Interactive exercises: radial distance, circle equations, plotting circles, shifted circles.",
        activities: [
        // Ch 8: Radial Distance
        { title: "Exact Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/radial-distance/exact-distance" },
        { title: "Minimum Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/radial-distance/minimum-distance" },
        { title: "Minimum and Maximum Distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/radial-distance/minimum-maximum-distance" },
        { title: "Points on a Circle", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/radial-distance/points-on-a-circle" },
        // Ch 9: Circles
        { title: "Circle Radius", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/circles/circle-radius" },
        { title: "The Equation of a Circle", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/circles/circle-equation" },
        { title: "The Missing Coordinate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/circles/missing-circle-coordinate" },
        { title: "Naming Circles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/circles/naming-circles" },
        { title: "Plotting Circles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/circles/plotting-circles" },
        // Ch 10: Shifted Circles
        { title: "Leaving the Origin", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/shifted-circles/leaving-the-origin" },
        { title: "Radius from Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/shifted-circles/radius-from-coordinates" },
        { title: "General Circle Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/shifted-circles/general-circle-equations" },
        { title: "Plotting from the Equation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-geometry/shifted-circles/plotting-from-the-equation" },
        ],
      },
    ]);

    // Brilliant MYP Module 7: Solving Equations (Interactive Practice)
    // Supports MYP Module 6: Algebra
    await insertBrilliantMajor("Solving Equations", "Brilliant MYP", [
      {
        title: "Variables & Substitution",
        description: "Interactive exercises: finding unknowns, building expressions, solving by substitution.",
        activities: [
        // Ch 1: Variables
        { title: "Finding Unknowns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2" },
        { title: "Equations with Unknowns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp" },
        { title: "Building Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp" },
        { title: "Working with Unknowns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2" },
        // Ch 2: Solving by Substitution
        { title: "Finding Solutions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2" },
        { title: "Solving Multiple Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp" },
        { title: "Rewriting Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp" },
        { title: "Isolating Unknowns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp" },
        { title: "Solving an Equation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp" },
        { title: "Substitution", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2" },
        ],
      },
      {
        title: "Groups, Distributing & Factoring",
        description: "Interactive exercises: groups in equations, distributing, factoring, strategic moves.",
        activities: [
        // Ch 3: Solving Equations
        { title: "Groups in Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/groups-in-equations" },
        { title: "Working with Groups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/isolating-groups-2-ss-exp" },
        { title: "Solving with Groups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/solving-with-groups-ss-exp" },
        { title: "Unpacking Boxes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-3-ss-exp" },
        { title: "Distributing", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-2-ss-exp" },
        // Ch 4: Factoring
        { title: "Packing Boxes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a" },
        { title: "Factoring", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-4-ss-exp" },
        { title: "Strategic Moves", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/strategic-moves-ss-exp" },
        ],
      },
      {
        title: "Combining, Rearranging & Inequalities",
        description: "Interactive exercises: like terms, rearranging, inequalities, graphing solutions.",
        activities: [
        // Ch 5: Combining and Rearranging
        { title: "Combining Like Terms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-1" },
        { title: "Combining in Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-2" },
        { title: "Rearranging Terms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-new" },
        { title: "Rearranging Terms in Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-in-equations" },
        { title: "Combining and Solving", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together-2" },
        { title: "Grouping to Solve", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together" },
        // Ch 6: Inequalities
        { title: "Unbalanced Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/unbalanced-scales" },
        { title: "Inequalities Both Ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/inequalities-both-ways" },
        { title: "Balancing Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/balancing-scales-3" },
        { title: "Solutions to Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/solutions-to-inequalities" },
        { title: "Graphing Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-inequalities-3" },
        { title: "Graphing Solutions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-solutions-2" },
        ],
      },
      {
        title: "Solving Inequalities & Systems",
        description: "Interactive exercises: solving inequalities, writing inequalities, systems of equations, elimination.",
        activities: [
        // Ch 7: Solving Inequalities
        { title: "Finding the Boundary", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-5" },
        { title: "Solving Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-6" },
        { title: "Including the Boundary", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/or-equal-to" },
        { title: "Writing Inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-2" },
        { title: "Negations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-3" },
        { title: "Putting It All Together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-4" },
        // Ch 8: Systems of Equations
        { title: "Systems with Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems" },
        { title: "Balancing with Substitution", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-2" },
        { title: "Writing Systems of Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-3" },
        { title: "Substituting Groups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-4" },
        { title: "Isolating and Substituting", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-6" },
        { title: "Substitution Strategy", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-9" },
        // Ch 9: Eliminating Systems
        { title: "Subtracting Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-5" },
        { title: "Elimination", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-7" },
        { title: "Multiplying to Eliminate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-8" },
        ],
      },
      {
        title: "Reasoning by Balancing",
        description: "Interactive exercises: balancing with variables/constants, tilted scales, reasoning about weights.",
        activities: [
        // Ch 10: Reasoning by Balancing
        { title: "Balancing with Variables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-1" },
        { title: "Balancing with Constants", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-3" },
        { title: "Balancing with Two Variables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-2" },
        { title: "Balancing with Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-7" },
        { title: "Balancing with Unknown Weights", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-5" },
        { title: "Building Tilted Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-10" },
        // Ch 11: Reasoning about Equations
        { title: "Reasoning about Weights", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences" },
        { title: "More Reasoning about Weights", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-5" },
        { title: "Strategic Comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/strategic-comparisons" },
        { title: "Reasoning about Two Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-3" },
        { title: "Reasoning with Equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-4" },
        ],
      },
      {
        title: "Reasoning about Variables",
        description: "Interactive exercises: reasoning about groups, packing/unpacking, constraints, scale systems.",
        activities: [
        // Ch 12: Reasoning about Groups of Variables
        { title: "Unpacking Boxes (Reasoning)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-6" },
        { title: "Packing Boxes (Reasoning)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-8" },
        { title: "Reasoning about Unpacking", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-9" },
        { title: "Reasoning about Packing Boxes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning" },
        { title: "Reasoning about Multiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning-2" },
        // Ch 13: Reasoning about Variables
        { title: "Constraints", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-14" },
        { title: "More Constraints", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-15" },
        { title: "Reasoning with Balanced Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-12" },
        { title: "Reasoning with Weighted Scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-11" },
        { title: "Reasoning with Scale Systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-13" },
        { title: "Constraints in Scale Systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/constraints-in-inequalities" },
        { title: "Reasoning with an Inequality", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-16" },
        ],
      },
    ]);

    // Brilliant MYP Module 8: Geometry & Measurement (Interactive Practice)
    // Supports MYP Module 7: Geometry
    await insertBrilliantMajor("Geometry & Measurement", "Brilliant MYP", [
      {
        title: "Angles & Perimeter",
        description: "Interactive exercises: polygon angles, parallel lines, triangle sides, perimeters, circumference, arc length.",
        activities: [
        // Ch 1: Introduction (Polygon Angles)
        { title: "Angles in Polygons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/introduction-73/polygons-angles-3" },
        { title: "Exterior and Interior Angles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/introduction-73/external-angles" },
        { title: "Polygon Angle Relationships", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/introduction-73/polygon-angle-relationships" },
        // Ch 2: Angles
        { title: "Angles Made by Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles/angle-facts-3" },
        { title: "Parallel Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles/parallel-lines-2" },
        { title: "Triangle Sides and Angles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles/triangle-sides-and-angles-2" },
        // Ch 3: Angles and Lengths
        { title: "Perimeters", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles-and-lengths/perimeters-2" },
        { title: "Circumference", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles-and-lengths/circles-9" },
        { title: "Arc Length", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/angles-and-lengths/circles-10" },
        ],
      },
      {
        title: "Scaling & Area",
        description: "Interactive exercises: scaling shapes/lengths, reasoning about area, polygon and circle areas.",
        activities: [
        // Ch 4: Scaling
        { title: "Scaling Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling/scaled-copies" },
        { title: "Scaling Lengths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling/similarity-2" },
        // Ch 5: Areas
        { title: "Reasoning About Area", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/calculating-area-6" },
        { title: "Polygon Areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/polygon-areas-2" },
        { title: "Circle Areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/circles-11" },
        { title: "Scaling Areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/scaling-areas-1" },
        ],
      },
      {
        title: "Pythagorean Theorem",
        description: "Interactive exercises: Pythagorean theorem, triples, square roots, special right triangles, applications.",
        activities: [
        // Ch 6: Pythagoras
        { title: "The Pythagorean Theorem", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/pythagorean-theorem-diagrammar-2" },
        { title: "Pythagorean Triples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/using-the-pythagorean-theorem" },
        { title: "Squares and Roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/square-roots" },
        { title: "Special Right Triangles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/special-right-triangles-3" },
        { title: "Applications", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/applying-the-pythagorean-theorem-3" },
        ],
      },
      {
        title: "Surface Area & Volume",
        description: "Interactive exercises: surface area, pyramids, cones, volume.",
        activities: [
        // Ch 7: Surface Area
        { title: "Surface Area", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/surface-area-2" },
        { title: "Surface Area Shortcut", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/surface-area-shortcut" },
        { title: "Pyramids and Cones (Surface)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/pyramids-cones-2" },
        // Ch 8: Scaling and Volume
        { title: "Volume", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling-and-volume/volume-3" },
        { title: "Pyramids and Cones (Volume)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling-and-volume/pyramids-cones-volume-2" },
        ],
      },
    ]);

    // Brilliant MYP Module 9: Trigonometry (Interactive Practice)
    // Stretch content beyond core MYP
    await insertBrilliantMajor("Trigonometry", "Brilliant MYP", [
      {
        title: "Trigonometric Ratios",
        description: "Interactive exercises: defining angles, sine/cosine, unit circle, solving right triangles, law of cosines/sines.",
        activities: [
        // Ch 9: Trigonometry
        { title: "Defining Angles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/trigonometry/degrees-and-radians-2" },
        { title: "Trigonometric Ratios", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/trigonometry/sine-and-cosine-4" },
        { title: "The Unit Circle", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/trigonometry/the-unit-circle-3" },
        // Ch 10: Measuring
        { title: "Solving Right Triangles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/measuring/solving-right-triangles-3" },
        { title: "Solving for Angles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/measuring/solving-for-angles-2" },
        { title: "Law of Cosines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/measuring/law-of-cosines-2" },
        { title: "Law of Sines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/measuring/law-of-sines-2" },
        { title: "Ambiguous Cases", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/measuring/ambiguous-cases" },
        ],
      },
      {
        title: "Trigonometric Graphs",
        description: "Interactive exercises: trig graphs, symmetry, inverse trig, polar coordinates, roses and cardioids.",
        activities: [
        // Ch 11: Cartesian Graphing
        { title: "Trigonometry Graphs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/cartesian-graphing/trigonometry-graphs" },
        { title: "Other Trigonometric Graphs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/cartesian-graphing/other-trigonometry-function-graphs" },
        { title: "Trigonometric Graph Problem Solving", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/cartesian-graphing/trigonometry-graphs-problem-solving" },
        { title: "Trigonometric Graph Symmetry", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/cartesian-graphing/even-odd-and-co-function-identities" },
        { title: "Inverse Trigonometry", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/cartesian-graphing/inverse-trigonometry-3" },
        // Ch 12: Polar Graphing
        { title: "Polar Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/polar-graphing/polar-coordinates" },
        { title: "Roses, Cardioids and Limacon", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/polar-graphing/roses-cardioids-and-limacons" },
        { title: "Function Transformations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/polar-graphing/transformations-and-problem-solving" },
        ],
      },
      {
        title: "Trigonometric Identities",
        description: "Interactive exercises: reciprocal/quotient identities, triangle identities, sum/difference, double/half angle.",
        activities: [
        // Ch 13: Identities
        { title: "Reciprocal and Quotient Identities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/identities/reciprocal-and-quotient-identities" },
        { title: "Triangle Identities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/identities/co-function-identities-4" },
        { title: "Sum and Difference Identities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/identities/sum-and-difference-identities-2" },
        { title: "Double- and Half-Angle Identities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/identities/double-and-half-angle-identities" },
        ],
      },
    ]);

    // Brilliant MYP Module 10: Visual Algebra (Interactive Practice)
    // Supports MYP Module 6: Algebra
    await insertBrilliantMajor("Visual Algebra", "Brilliant MYP", [
      {
        title: "Linear Expressions & Patterns",
        description: "Interactive exercises: describing patterns, building expressions, constant terms, linear expressions.",
        activities: [
        // Ch 1: Linear Expressions
        { title: "Describing Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/pattern-expression" },
        { title: "Building Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/pattern-expression-2" },
        { title: "Constant Terms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant" },
        { title: "Linear Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant-2" },
        { title: "More Linear Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant-5" },
        // Ch 2: Building Linear
        { title: "Describing Linear Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/patterns-constant-6" },
        { title: "Building Linear Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/patterns-constant-3" },
        { title: "Linear Pattern Gallery", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/pattern-mix" },
        ],
      },
      {
        title: "Combining & Comparing Expressions",
        description: "Interactive exercises: two-shape patterns, combining/comparing expressions, tables, rates.",
        activities: [
        // Ch 3: Combining Linear Expressions
        { title: "Two-Shape Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes" },
        { title: "Combining Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-2" },
        { title: "Comparing Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-4" },
        { title: "Removing a Shape", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/taking-a-bite" },
        { title: "Combining Linear Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-3" },
        // Ch 4: Comparing Linear Expressions
        { title: "Comparing Linear Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/two-comp-2" },
        { title: "Comparing Constants", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/two-comp" },
        { title: "Using a Table", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/navigating-a-table" },
        { title: "Comparing Rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-rates" },
        { title: "Comparing More Rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-rates-2" },
        { title: "Comparing Expressions (Advanced)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-expressions-2" },
        ],
      },
      {
        title: "Quadratic Patterns & Expressions",
        description: "Interactive exercises: quadratic patterns, rectangle patterns, equivalent expressions, frames.",
        activities: [
        // Ch 5: Quadratic Patterns
        { title: "Quadratic Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-patterns" },
        { title: "Quadratics with a Constant", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-with-a-constant" },
        { title: "Quadratics with a Linear Term", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-and-linear" },
        { title: "Patterns with a Punch", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/pattern-punch" },
        { title: "Rectangle Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/rectangle-patterns" },
        { title: "Using Rectangle Area", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/rectangle-patterns-2" },
        // Ch 6: Quadratic Expressions
        { title: "A Complicated Area", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/linear-and-constant" },
        { title: "Equivalent Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/linear-and-constant-2" },
        { title: "Shifting the Steps", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/shift-steps" },
        { title: "Taking a Bite", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/take-a-bite" },
        { title: "The Frame", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/the-frame" },
        { title: "The Monster Jaw", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/monster-jaw" },
        ],
      },
      {
        title: "Growth Types: Quadratic & Exponential",
        description: "Interactive exercises: quadratic vs linear growth, exponential patterns, growth factors.",
        activities: [
        // Ch 7: Quadratic Growth
        { title: "A Different Kind of Growth", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/different-growth" },
        { title: "Quadratic Growth", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/different-growth-2" },
        { title: "A Triangular Pattern", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/triangular-numbers" },
        { title: "Describing Quadratic Growth", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/different-growth-3" },
        { title: "Linear or Quadratic", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/linear-or-quadratic" },
        { title: "Comparing Kinds of Growth", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/linear-or-quadratic-2" },
        { title: "Quadratic Versus Linear", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/quadratic-vs-linear" },
        // Ch 8: Linear or Exponential
        { title: "Exponential Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/exponential-patterns-2" },
        { title: "Growth Factors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/growth-factors-2" },
        { title: "Building Exponential Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/building-exponential" },
        { title: "Building Linear Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/building-linear" },
        { title: "ID'ing the Type of Pattern", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/kinds-of-growth" },
        // Ch 9: Exponential Patterns
        { title: "Building Exponential Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/exponential-patterns/building-exponential-2" },
        { title: "To the Zero Power", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/exponential-patterns/zero-power" },
        { title: "Writing Exponential Expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/exponential-patterns/writing-exponential" },
        ],
      },
      {
        title: "Periodic & Alternating Patterns",
        description: "Interactive exercises: periodic patterns, remainders, alternating patterns, equivalent expressions.",
        activities: [
        // Ch 10: Periodic Patterns
        { title: "Periodic Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-patterns/periodic-patterns-3" },
        { title: "Extending Periodic Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-patterns/shifted-pattern" },
        { title: "Periodic Pattern Remainders", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-patterns/periodic-pattern-2" },
        { title: "Expressing Remainders", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-patterns/periodic-pattern-3" },
        // Ch 11: Periodic Expressions
        { title: "Period of Two", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-expressions/period-of-two" },
        { title: "A Different Period", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-expressions/period-of-four" },
        { title: "Periodic Pattern Gallery", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-expressions/periodic-challenge" },
        { title: "Periodic Pattern Gallery 2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/periodic-expressions/periodic-challenge-2" },
        // Ch 12: Alternating Patterns
        { title: "Alternating Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/alternating-patterns/alternating-patterns-5" },
        { title: "Even and Odd Steps", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/alternating-patterns/even-and-odd" },
        { title: "Adding Two Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/alternating-patterns/sum-two-shapes" },
        // Ch 13: Equivalent Expressions
        { title: "Describing Linear Patterns (Review)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-linear-2" },
        { title: "Describing Quadratic Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-quad" },
        { title: "Describing Exponential Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-exp" },
        { title: "Two Ways to See", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/va-finale-2" },
        { title: "Other Ways to See", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/va-finale-1" },
        ],
      },
    ]);

    // ===== BRILLIANT PYP =====
    // Supports PYP Module 3 (Fractions)

    // Brilliant PYP Module 1: Fractions (Interactive Practice)
    await insertBrilliantMajor("Fractions", "Brilliant PYP", [
      {
        title: "Visualize & Simplify Fractions",
        description: "Interactive exercises: visualizing fractions, equivalent fractions, simplifying.",
        activities: [
        // Ch 1: Visualize Fractions
        { title: "Finding Half", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/find-half/" },
        { title: "Combining Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/combining-parts/" },
        { title: "Splitting Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/take-more-than-one/" },
        { title: "Splitting and Combining", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/shade-this-much/" },
        { title: "Equal Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/mt-fractions-intro/equal-nths/" },
        // Ch 2: Equivalent Fractions
        { title: "Sixths and Twelfths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/equal-fractions/" },
        { title: "Making Equivalent Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/making-equivalent/" },
        { title: "Simplifying Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/equivalent-fractions/simplifying-fractions/" },
        ],
      },
      {
        title: "Compare & Add Fractions",
        description: "Interactive exercises: comparing fractions, adding fractions with unlike denominators.",
        activities: [
        // Ch 3: Comparing Fractions
        { title: "Comparing Numerators", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/comparing-numerators/" },
        { title: "Comparing Denominators", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/same-numerator/" },
        { title: "Comparing Equivalents", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/den-multiples/" },
        { title: "Identifying the Greatest", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/greatest-fraction/" },
        // Ch 4: Adding Fractions
        { title: "Adding Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-fractions/" },
        { title: "Adding Unlike Parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-different/" },
        { title: "Adding Unit Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-nonmultiples/" },
        { title: "Adding Any Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-unlike/" },
        ],
      },
      {
        title: "Multiply Fractions",
        description: "Interactive exercises: multiplying whole numbers by fractions, fractions by fractions.",
        activities: [
        // Ch 5: Multiplying Fractions
        { title: "Multiples of Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/fraction-by-integer/" },
        { title: "Expressing Multiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/expressing-multiples/" },
        { title: "Fractions of Unit Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/fractions-of-fractions/" },
        { title: "Products of Unit Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/expressing-fouf/" },
        { title: "Fraction of Any Fraction", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/fractions-of-fractions-2/" },
        { title: "Multiplying Fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/multiplying-fractions/" },
        ],
      },
    ]);

    // === Everyday Statistics (Brilliant MYP) ===
    await insertBrilliantMajor("Everyday Statistics", "Brilliant MYP", [
      {
        title: "Calculate and interpret the mean",
        description: "Interactive exercises: mean as average, balance point, symmetric distributions, finding totals.",
        activities: [
          { title: "Means", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-mean-0" },
          { title: "Balancing", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/edv-mean-7" },
          { title: "Distributions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-distributions" },
          { title: "Mean Values", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/edv-mean-groups-7" },
          { title: "Finding Totals", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-balance-5" },
          { title: "Predicting Means", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/ds-balance-4" },
          { title: "Rebalancing", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/edv-mean-6" },
          { title: "Asymmetric Distributions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/ds-balance-3" },
          { title: "Means of Lists", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/edv-mean-groups-8" },
          { title: "Splitting", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups-9" },
          { title: "Finding Means", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups" },
          { title: "Adding a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups-3" },
          { title: "Updating Means", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/ds-adding-lists" },
        ],
      },
      {
        title: "Find and compare the median",
        description: "Interactive exercises: median vs mean, splitting data, comparing central tendencies.",
        activities: [
          { title: "Comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-1" },
          { title: "Median", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-2" },
          { title: "Finding Medians", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-3" },
          { title: "Splitting", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-4" },
          { title: "Medians of Lists", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-lists" },
          { title: "Adding a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-median-5" },
          { title: "Comparing Median and Mean", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-median-6" },
          { title: "Modes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-mode" },
          { title: "Middle 50%", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-quartiles-1" },
          { title: "Segmenting Data", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-quartiles-2" },
        ],
      },
      {
        title: "Calculate quartiles and IQR",
        description: "Interactive exercises: quartiles, interquartile range, data segmentation.",
        activities: [
          { title: "Quartiles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-3" },
          { title: "Interquartile Range", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-4" },
          { title: "Quartiles of Lists", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-median-lists-2" },
          { title: "Boxplots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-6" },
        ],
      },
      {
        title: "Read and create boxplots",
        description: "Interactive exercises: box and whisker plots, range, comparing distributions.",
        activities: [
          { title: "Adding Whiskers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/adding-whiskers" },
          { title: "Matching the Boxplot", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/matching-boxplots" },
          { title: "The Range", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/the-range" },
          { title: "Comparing Distributions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/comparing-distribution" },
        ],
      },
      {
        title: "Identify and analyze outliers",
        description: "Interactive exercises: outlier detection, IQR rule, effect on mean and median.",
        activities: [
          { title: "Outliers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/outliers-balance" },
          { title: "Skewing the Mean", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/skewing-the-mean" },
          { title: "Defining Outliers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/defining-outliers" },
          { title: "Identifying Outliers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/identifying-outliers" },
          { title: "Outside the Whiskers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/outside-the-whiskers" },
        ],
      },
    ]);

    // === Exponents and Radicals (Brilliant MYP) ===
    await insertBrilliantMajor("Exponents and Radicals", "Brilliant MYP", [
      {
        title: "Understand bases and exponents",
        description: "Interactive exercises: multiplication patterns, bases, powers of 2/3/10, number lines.",
        activities: [
          { title: "Multiplication Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-1" },
          { title: "Exponents", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-2" },
          { title: "Bases", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-3" },
          { title: "Special Bases and Exponents", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-4" },
          { title: "Base 10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-5" },
          { title: "Powers of 2 on the Number Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-1" },
          { title: "Reasoning with Powers of 2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-2" },
          { title: "Powers of 3 on the Number Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-3" },
          { title: "Powers of 10 on Number Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-4" },
          { title: "Estimating with Powers of 10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-5" },
          { title: "Millionaires and Billionaires", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponent-number-line-7" },
          { title: "Power Problems on Number Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-6" },
        ],
      },
      {
        title: "Calculate squares and square roots",
        description: "Interactive exercises: squaring, square roots, inverse operations, negatives.",
        activities: [
          { title: "Squaring", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-1" },
          { title: "Squares on the Number Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-2" },
          { title: "Square Roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-3" },
          { title: "Square Roots of Non-Squares", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-4" },
          { title: "The Inverse of Squaring", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-5" },
          { title: "Square Roots and Negatives", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-6" },
        ],
      },
      {
        title: "Work with cubes and higher-order roots",
        description: "Interactive exercises: cubes, cube roots, higher-order roots, inverse operations.",
        activities: [
          { title: "Cubes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-1" },
          { title: "Reasoning with Cubes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-3c" },
          { title: "Cubes on The Number Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-2" },
          { title: "Cube Roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-6" },
          { title: "Cube Roots as Inverse", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-8" },
          { title: "Higher Order Roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-7" },
        ],
      },
    ]);

    // === Number Theory (Brilliant MYP) ===
    await insertBrilliantMajor("Number Theory", "Brilliant MYP", [
      {
        title: "Apply divisibility rules and prime factorization",
        description: "Interactive exercises: last digits, divisibility shortcuts, factor trees, primes, counting divisors.",
        activities: [
          { title: "Last Digits", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/introduction-86/last-digits" },
          { title: "Secret Messages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/introduction-86/secret-messages" },
          { title: "Rainbow Cycles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/introduction-86/rainbow-cycles" },
          { title: "Divisibility Shortcuts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-i" },
          { title: "More Divisibility Shortcuts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-ii" },
          { title: "Divisibility by 9 and 3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-by-9-and" },
          { title: "Last Digits", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/last-digits-2" },
          { title: "Arithmetic with Remainders", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/arithmetic-with-remainders" },
          { title: "Digital Roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/digital-roots" },
          { title: "Factor Trees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factor-trees" },
          { title: "Prime Factorization", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factorization" },
          { title: "Factoring Factorials", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/factoring-factorials" },
          { title: "Counting Divisors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/counting-divisors" },
          { title: "100 Doors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/100-doors" },
          { title: "How Many Prime Numbers Are There?", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/how-many-prime-numbers-are-there" },
        ],
      },
      {
        title: "Find GCD and LCM",
        description: "Interactive exercises: greatest common divisor, least common multiple, billiard tables, number jumping.",
        activities: [
          { title: "100 Doors Revisited", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/100-doors-revisited" },
          { title: "The LCM", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-lcm" },
          { title: "Billiard Tables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables" },
          { title: "The GCD", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-gcd" },
          { title: "Dots on the Diagonal", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/dots-on-the-diagonal" },
          { title: "Number Jumping (I)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-i" },
          { title: "Number Jumping (II)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-ii" },
          { title: "Number Jumping (III)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-iii" },
          { title: "Relating LCM and GCD", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/relating-gcd-and-lcm" },
          { title: "Billiard Tables Revisited (I)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-i" },
          { title: "Billiard Tables Revisited (II)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-ii" },
        ],
      },
      {
        title: "Use modular arithmetic",
        description: "Interactive exercises: modular congruence, star drawing, Fermat's theorem, totients.",
        activities: [
          { title: "Times and Dates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/times-and-dates" },
          { title: "Modular Congruence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/modular-congruence" },
          { title: "Modular Arithmetic", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/modular-arithmetic" },
          { title: "Divisibility by 11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/divisibility-by" },
          { title: "Star Drawing (I)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/star-drawing-i" },
          { title: "Star Drawing (II)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/star-drawing-ii" },
          { title: "Star Drawing (III)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/star-drawing-iii" },
          { title: "Die-Hard Decanting (I)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/die-hard-decanting-i" },
          { title: "Die-Hard Decanting (II)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/die-hard-decanting-ii" },
          { title: "Additive Cycles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/additive-cycles" },
          { title: "Modular Multiplicative Inverses", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/modular-multiplicative-inverses" },
          { title: "Multiplicative Cycles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/multiplicative-cycles-and-eulers-theorem" },
          { title: "Fermat's Little Theorem", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/fermats-little-theorem" },
          { title: "Totients", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/totients" },
          { title: "Last Digits Revisited", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/last-digits-revisited" },
          { title: "Perfect Shuffling", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/perfect-shuffling" },
        ],
      },
      {
        title: "Explore infinity concepts",
        description: "Interactive exercises: counting to infinity, Hilbert's Hotel, multiple infinities.",
        activities: [
          { title: "Counting to Infinity", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/exploring-infinity-2/counting-to-infinity" },
          { title: "Multiple Infinities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/exploring-infinity-2/multiple-infinities" },
          { title: "Hilbert's Hotel", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/exploring-infinity-2/hilberts-hotel" },
          { title: "Infinitely Large", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/exploring-infinity-2/infinitely-large" },
        ],
      },
      {
        title: "Work with number bases and binary",
        description: "Interactive exercises: binary, hexadecimal, exploding dots, base conversions.",
        activities: [
          { title: "The Invention of Number Bases", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/number-bases/invention-number-bases" },
          { title: "Introducing Binary", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/number-bases/how-binary-works" },
          { title: "Binary on Computers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/number-bases/binary-computers" },
          { title: "Exploding Dots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/binary-and-other-bases/exploding-dots" },
          { title: "Binary", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/binary-and-other-bases/binary" },
          { title: "Binary Operations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/binary-and-other-bases/binary-operations" },
          { title: "Perfect Shuffles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/binary-and-other-bases/perfect-shuffles" },
          { title: "Hexadecimal", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/binary-and-other-bases/hexadecimal" },
          { title: "Hexadecimal Operations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/binary-and-other-bases/hexadecimal-operations" },
          { title: "An Unusual Computer Base", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/binary-and-other-bases/unusual-base" },
        ],
      },
      {
        title: "Solve digit and divisibility problems",
        description: "Interactive exercises: cryptograms, digital roots, repeating decimals, divisibility in other bases.",
        activities: [
          { title: "Divisibility", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/divisibility" },
          { title: "Last Digits Rules", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/last-digits-part-i" },
          { title: "More Divisibility Rules", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/last-digits-part-ii" },
          { title: "Cryptograms Solved by Divisibility", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/cryptograms-3" },
          { title: "Cryptogram Addition Puzzles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/more-cryptograms" },
          { title: "Cryptogram Variety Pack", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/even-more-cryptograms" },
          { title: "Factorial Refresher", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/decimal-expansions-in-base-10/factorial-refresher2" },
          { title: "Calculation Tricks", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/decimal-expansions-in-base-10/calculation-tricks" },
          { title: "Digital Roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/decimal-expansions-in-base-10/digital-roots-2" },
          { title: "Terminating Decimals", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/decimal-expansions-in-base-10/terminating-decimals" },
          { title: "Repeating Decimals", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/decimal-expansions-in-base-10/repeating-decimals" },
          { title: "Repeating Patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/decimal-expansions-in-base-10/repeating-patterns" },
          { title: "Problem Solving", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/decimal-expansions-in-base-10/problem-solving-8" },
          { title: "Hexadecimal Divisibility Shortcuts (I)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-divisibility-shortcuts-i" },
          { title: "Hexadecimal Divisibility Shortcuts (II)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-divisibility-shortcuts-ii" },
          { title: "Hexadecimal Divisibility Shortcuts (III)", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-divisibility-shortcuts-iii" },
          { title: "Divisibility Shortcuts in Other Bases", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/divisibility-shortcuts-in-other-bases" },
          { title: "Hexadecimal Last Digits", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-last-digits" },
          { title: "Last Digits in Other Bases", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/last-digits-in-other-bases" },
        ],
      },
    ]);

    // === Linear Relationships (Brilliant MYP) ===
    await insertBrilliantMajor("Linear Relationships", "Brilliant MYP", [
      {
        title: "Identify linear vs nonlinear relationships",
        description: "Interactive exercises: points on a line, constant change, decreasing rates, nonlinear detection.",
        activities: [
          { title: "Points on a Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/points-on-a-line" },
          { title: "Increasing by One", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/change-for-one" },
          { title: "Removing Objects", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/removing-objects" },
          { title: "Decreasing Rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/decreasing-functions" },
          { title: "Nonlinear Relationships", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/nonlinear-functions" },
        ],
      },
      {
        title: "Find and use rates of change",
        description: "Interactive exercises: rates from points, slope computation, initial conditions.",
        activities: [
          { title: "Finding Rates of Change", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/finding-rates-of-change" },
          { title: "Rates from Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/rates-from-points" },
          { title: "Initial Conditions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/finding-initial-condition" },
          { title: "Using Two Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/using-two-points" },
          { title: "Change per One", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/vertical-change" },
          { title: "Identifying Slopes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/fractional-slopes" },
          { title: "Graph a Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/graph-a-line" },
          { title: "Computing Slopes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/computing-slopes" },
          { title: "Coordinates to Slope", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/coordinates-to-slope" },
          { title: "Putting it all together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/slope-complete-computation" },
        ],
      },
      {
        title: "Write and graph linear equations",
        description: "Interactive exercises: slope-intercept form, point-slope form, graphing, interpreting functions.",
        activities: [
          { title: "Proportional Relationships", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/writing-linear-functions" },
          { title: "Base Fees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/base-fees" },
          { title: "Graphing Linear Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/graphing-linear-functions-2" },
          { title: "Finding the Constant Term", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/find-constant-term" },
          { title: "Finding the Linear Term", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/find-linear-term-4" },
          { title: "Interpreting a Function", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/interpret-linear-function" },
          { title: "Writing the Whole Expression", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/find-both-terms" },
          { title: "Shifting a Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/find-b" },
          { title: "Slope of a Line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/find-mx" },
          { title: "Through a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/through-a-point" },
          { title: "Through Two Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/through-2-points" },
          { title: "Point-Slope Form", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/point-slope-form" },
          { title: "Using Point-Slope Form", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/using-point-slope-form" },
          { title: "Equations in Point-Slope Form", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/equations-in-point-slope-form" },
        ],
      },
    ]);

    // === Coordinate Transformations (Brilliant MYP) ===
    await insertBrilliantMajor("Coordinate Transformations", "Brilliant MYP", [
      {
        title: "Perform translations on the coordinate plane",
        description: "Interactive exercises: translating points and shapes, combining and undoing translations.",
        activities: [
          { title: "Translating Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/translations/translating-points-2" },
          { title: "Negative Translations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/translations/translating-left-down" },
          { title: "Translating Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/translations/translating-shapes" },
          { title: "Combining Translations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/translations/combining-translations" },
          { title: "Undoing Translations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/translations/undoing-translations" },
          { title: "Coordinate-wise Translation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/coordinate-translation" },
          { title: "Translating Shapes in x and y", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/translating-shapes-x-y" },
          { title: "Fitting within a Region", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/translate-into-region" },
        ],
      },
      {
        title: "Rotate shapes around points",
        description: "Interactive exercises: rotation by 90/180/270 degrees, composing rotations, rotation around non-origin points.",
        activities: [
          { title: "Rotation Around the Origin", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/rotation/rotation-around-the-origin" },
          { title: "Rotating Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/rotation/rotating-shapes-2" },
          { title: "Rotating Both Ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/rotation/rotating-both-ways" },
          { title: "Composing Rotations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/rotation/composing-rotations" },
          { title: "Rotating by 180 degrees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-180" },
          { title: "Rotating by 90 degrees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotated-coordinates" },
          { title: "Rotating by 270 degrees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-270-b" },
          { title: "Rotating by Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-by-coordinates" },
          { title: "Rotating before Translating", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/non-origin-rotation/chaining-transformations" },
          { title: "Rotating Around a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/non-origin-rotation/rotating-around-point" },
          { title: "Rotating to Move", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/non-origin-rotation/rotation-center-outside-shape" },
          { title: "Translating before Rotating", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/non-origin-rotation/translating-before-rotating" },
          { title: "Translation by Rotation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/equivalent-transformations/translation-by-rotation" },
          { title: "Gridline Translations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/equivalent-transformations/distance-of-rotations" },
          { title: "Diagonal Translations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/equivalent-transformations/axes-of-rotation" },
          { title: "Selecting Angles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/equivalent-transformations/choosing-angles" },
          { title: "Limits of Rotation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/equivalent-transformations/limits-of-rotation" },
        ],
      },
      {
        title: "Reflect shapes across lines",
        description: "Interactive exercises: reflection across axes and lines, coordinate reflections, combining reflections.",
        activities: [
          { title: "Reflecting Across Axes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/manual-reflection" },
          { title: "Reflecting Across Lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/manual-reflection-more-lines" },
          { title: "The Line of Reflection", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/the-line-of-reflection" },
          { title: "Reflecting Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/reflecting-shapes" },
          { title: "Reflection to a Region", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/reflection-regions" },
          { title: "Reversing Reflection", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections/reversing-reflection" },
          { title: "Reflecting Coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-coordinates" },
          { title: "Reflecting Vertices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-vertices" },
          { title: "Reflecting Across y=x", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-y-x" },
          { title: "Reflecting Across y=-x", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-y-minus-x" },
          { title: "Choosing the Coordinate Reflection", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/choosing-coordinate-reflection" },
          { title: "Reflecting to Translate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/combining-reflections/reflecting-to-translate" },
          { title: "Reflecting to Rotate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/combining-reflections/reflecting-through-180" },
          { title: "Reflecting to Rotate by 90 degrees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/combining-reflections/reflecting-through-90" },
          { title: "Rotation Around a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/combining-reflections/reflecting-around-points" },
          { title: "90 degree Rotation Around a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/combining-reflections/reflecting-90-around-points" },
        ],
      },
      {
        title: "Understand congruence and symmetry",
        description: "Interactive exercises: congruence proofs, reflectional and rotational symmetry.",
        activities: [
          { title: "Congruence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/direct-congruence" },
          { title: "Proving Congruence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/proving-congruence" },
          { title: "Reflectional Symmetry", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/reflectional-symmetry" },
          { title: "Rotational Symmetry", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/rotational-symmetry" },
          { title: "Identifying Symmetry", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/identifying-symmetry" },
          { title: "Symmetry and Congruence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/congruence-and-symmetry/symmetry-and-congruence" },
        ],
      },
      {
        title: "Apply dilations and similarity",
        description: "Interactive exercises: dilating points and shapes, similarity, stretching in one/two directions.",
        activities: [
          { title: "Dilating Points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/dilation/dilation-points" },
          { title: "Dilating Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/dilation/dilation-shapes" },
          { title: "Dilating and Translating", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/dilation/dilating-and-translating" },
          { title: "Dilating Around a Point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/dilating-to-move/dilating-around-point" },
          { title: "Dilating Points to Targets", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/dilating-to-move/dilating-points-to-targets" },
          { title: "Translating By Dilating", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/dilating-to-move/dilating-move-shapes" },
          { title: "Dilations and Congruence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/similarity/similarity-introduction" },
          { title: "Similarity", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/similarity/proving-similarity" },
          { title: "Identifying Similarity", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/similarity/identifying-similarity" },
          { title: "Stretching in One Direction", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/stretching/stretch-1-direction" },
          { title: "Stretching in Two Directions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/stretching/stretch-2-directions" },
          { title: "Stretching Shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/stretching/stretching-shapes" },
          { title: "Transforming Points Into Targets", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/stretching/stretching-move-points-to-target" },
        ],
      },
    ]);

    // === Introduction to Functions (Brilliant MYP) ===
    await insertBrilliantMajor("Introduction to Functions", "Brilliant MYP", [
      {
        title: "Identify and describe function rules",
        description: "Interactive exercises: finding rules, word functions, numeric rules, conditional rules.",
        activities: [
          { title: "Finding the Rule", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/introducing-functions/finding-the-rule" },
          { title: "Word Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/introducing-functions/string-functions" },
          { title: "Time Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/introducing-functions/time-functions" },
          { title: "Repeating Outputs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/introducing-functions/true-and-false" },
          { title: "Deducing the Rule", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/introducing-functions/deduce-the-rule" },
          { title: "Numeric Rules", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/function-rules/numeric-rules" },
          { title: "Writing Rules", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/function-rules/writing-rules" },
          { title: "Conditional Rules", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/function-rules/conditional-rules" },
          { title: "Deducing Numeric Rules", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/function-rules/deducing-numeric-rules" },
        ],
      },
      {
        title: "Graph and interpret functions",
        description: "Interactive exercises: graphing linear/squared/absolute value, interpreting real-world functions.",
        activities: [
          { title: "Graphing Linear Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-linear-functions" },
          { title: "Graphing Squared Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-squared-functions" },
          { title: "Graphing Absolute Value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-absolute-value" },
          { title: "Graphing Without an Equation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-without-equations" },
          { title: "Interpreting Graphed Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/interpreting-graphed-functions" },
          { title: "Discrete Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/annual-profit" },
          { title: "Depreciation Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/car-depreciation" },
          { title: "Multi-Part Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/tax-rates" },
          { title: "Periodic Functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/tide-depth" },
        ],
      },
    ]);

    // === Real-World Algebra (Brilliant MYP) ===
    await insertBrilliantMajor("Real-World Algebra", "Brilliant MYP", [
      {
        title: "Write and use algebraic formulas",
        description: "Interactive exercises: using variables, adjusting formulas, equivalent expressions.",
        activities: [
          { title: "Using Formulas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-variables-3" },
          { title: "Using Variables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/variables-9" },
          { title: "Adjusting Formulas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-formulas" },
          { title: "Equivalent Formulas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/equivalent-expressions" },
          { title: "More Than One Variable", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/more-than-one-variable" },
        ],
      },
      {
        title: "Solve rate, proportion, and percentage problems",
        description: "Interactive exercises: unit prices, comparing offers, percent discounts, cost control.",
        activities: [
          { title: "Comparing Offers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/equivalent-ratios" },
          { title: "Unit Prices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/unit-prices" },
          { title: "Using Unit Prices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates" },
          { title: "Controlling Costs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates-2" },
          { title: "Calculating Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages" },
          { title: "Percent Discount", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/percent-discount" },
          { title: "Working with Percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages-2" },
        ],
      },
    ]);

    // END GENERATED SEED (Brilliant) - DO NOT EDIT BY HAND

    return {
      success: true,
      message: `Brilliant: Deleted ${deletedMajors} majors (old Brilliant), ${deletedLearning} LOs, ${deletedActivities} activities. Created ${createdMajors} majors (Brilliant MYP + PYP), ${createdLearning} LOs, ${createdActivities} activities.`,
    };
  },
});
