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
