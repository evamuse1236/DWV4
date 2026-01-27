import { mutation } from "./_generated/server";
import { v } from "convex/values";
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
 * Replace all Math objectives with real MYP Y1 curriculum data from playlist_mapping.json
 * Creates 12 major objectives, 57 learning objectives, and ~1100 activities
 * with Khan Academy and Brilliant.org links.
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

    // Find Math domain (could be "Mathematics" or "Math")
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
      // Get learning objectives for this major
      const learningObjs = await ctx.db
        .query("learningObjectives")
        .withIndex("by_major_objective", (q) => q.eq("majorObjectiveId", major._id))
        .collect();

      for (const lo of learningObjs) {
        // Delete activity progress and activities
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

        // Delete student objectives
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

      // Delete student major objectives
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

    // Also clean up any orphaned learning objectives in Math domain
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

    // ========== STEP 2: INSERT NEW CURRICULUM ==========

    let timestamp = Date.now();
    let createdMajors = 0;
    let createdLearning = 0;
    let createdActivities = 0;

    // Helper to insert a major objective with sub-objectives and activities
    const insertMajorWithSubsAndActivities = async (
      majorTitle: string,
      subs: Array<{
        title: string;
        description: string;
        activities: Array<{
          title: string;
          type: "video" | "exercise";
          platform: string;
          url: string;
        }>;
      }>
    ) => {
      const majorId = await ctx.db.insert("majorObjectives", {
        domainId: mathDomain._id,
        title: majorTitle,
        description: majorTitle,
        curriculum: "MYP Y1",
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

    // Fractions Foundation
    await insertMajorWithSubsAndActivities("Fractions Foundation", [
      {
        title: "What is a fraction?",
        description: "Fraction Fundamentals: Intuition of fraction",
        activities: [
          { title: "3rd Grade - Understand fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-fractions" },
        ],
      },
      {
        title: "Compare fractions using LCM",
        description: "Fraction Fundamentals: LCM and Comparing fractions",
        activities: [
          { title: "4th Grade - Equivalent fractions and comparing fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" },
          { title: "Arithmetic Thinking: comparing-numerators", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/comparing-numerators/" },
          { title: "Arithmetic Thinking: same-numerator", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/same-numerator/" },
          { title: "Arithmetic Thinking: den-multiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/den-multiples/" },
          { title: "Arithmetic Thinking: not-multiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/not-multiples/" },
          { title: "Arithmetic Thinking: greatest-fraction", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/comparing-fractions/greatest-fraction/" },
        ],
      },
      {
        title: "Simplify fractions using GCF",
        description: "Fraction Fundamentals: GCF and Simplifying fractions",
        activities: [
          { title: "4th Grade - Factors, multiples and patterns", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" },
        ],
      },
      {
        title: "Add, subtract & multiply fractions",
        description: "Fraction Fundamentals: Add, Subtract fractions & Multiply fractions",
        activities: [
          { title: "4th Grade - Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2" },
        ],
      },
    ]);

    // Arithmetic MYP 1
    await insertMajorWithSubsAndActivities("Arithmetic MYP 1", [
      {
        title: "Multiply big numbers (3-digit × 2-digit)",
        description: "SWBAT do multi-digit multiplication problems using algorithm (3-digit by 2-digit)",
        activities: [
          { title: "Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "Divide big numbers (4-digit ÷ 2-digit)",
        description: "SWBAT do multi-digit division problems using algorithm (4-digit by 2 digit)",
        activities: [
          { title: "Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "Simple word problems (+, −, ×, ÷)",
        description: "SWBAT solve simple word problems using addition, subtraction, multiplication, and division",
        activities: [
          { title: "Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "Multi-step word problems",
        description: "SWBAT solve multi-step word problems using addition, subtraction, multiplication, and division.",
        activities: [
          { title: "Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "Estimate answers by rounding",
        description: "SWBAT mentally estimate results of operations on multi-digit numbers using rounding strategies.\nExample: 43 × 13 should be roughly 500 since (43×10)= 430",
        activities: [
          { title: "Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "Check answers using rounding",
        description: "SWBAT use rounding strategies and inverse operations to verify and cross-check answers to word problems",
        activities: [
          { title: "Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "Understand negative numbers",
        description: "SWBAT compare and order positive and negative numbers to determine which is greater or less.",
        activities: [
          { title: "6th Grade - Negative numbers", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-number-topic" },
          { title: "Arithmetic Thinking: numeric-expressions-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-1/" },
          { title: "Arithmetic Thinking: numeric-expressions-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-3/" },
          { title: "Arithmetic Thinking: numeric-expressions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-2/" },
          { title: "Arithmetic Thinking: numeric-expressions-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-intro-to-negatives/numeric-expressions-4/" },
          { title: "Arithmetic Thinking: numeric-expressions-205", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-205/" },
          { title: "Arithmetic Thinking: numeric-expressions-21", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-21/" },
          { title: "Arithmetic Thinking: numeric-expressions-25", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-25/" },
          { title: "Arithmetic Thinking: numeric-expressions-26", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-26/" },
          { title: "Arithmetic Thinking: number-line-subtraction-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/number-line-subtraction-1/" },
          { title: "Arithmetic Thinking: numeric-expressions-22", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-integers-number-line/numeric-expressions-22/" },
          { title: "Arithmetic Thinking: numeric-order-magnitude-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-1/" },
          { title: "Arithmetic Thinking: numeric-order-magnitude-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-2/" },
          { title: "Arithmetic Thinking: numeric-order-magnitude-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-4/" },
          { title: "Arithmetic Thinking: numeric-order-magnitude-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-magnitude-5/" },
          { title: "Arithmetic Thinking: numeric-order-and-magnitude-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-and-magnitude-6/" },
          { title: "Arithmetic Thinking: numeric-order-and-magnitude-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-order-and-magnitude/numeric-order-and-magnitude-7/" },
          { title: "Arithmetic Thinking: distance-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-distance-on-number-line/distance-1/" },
          { title: "Arithmetic Thinking: distance-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-distance-on-number-line/distance-2/" },
          { title: "Arithmetic Thinking: distance-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-distance-on-number-line/distance-3/" },
          { title: "Arithmetic Thinking: distance-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-distance-on-number-line/distance-4/" },
          { title: "Arithmetic Thinking: distance-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-distance-on-number-line/distance-6/" },
        ],
      },
      {
        title: "Add and subtract negative numbers",
        description: "SWBAT perform simple addition and subtraction problems with negative numbers",
        activities: [
          { title: "6th Grade - Negative numbers", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-number-topic" },
          { title: "Arithmetic Thinking: numeric-expressions-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-5/" },
          { title: "Arithmetic Thinking: numeric-expressions-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-6/" },
          { title: "Arithmetic Thinking: numeric-expressions-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-7/" },
          { title: "Arithmetic Thinking: numeric-expressions-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-8/" },
          { title: "Arithmetic Thinking: numeric-expressions-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-9/" },
          { title: "Arithmetic Thinking: numeric-expressions-10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-number-addition/numeric-expressions-10/" },
          { title: "Arithmetic Thinking: numeric-expressions-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-11/" },
          { title: "Arithmetic Thinking: numeric-expressions-12", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-12/" },
          { title: "Arithmetic Thinking: numeric-expressions-13", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-13/" },
          { title: "Arithmetic Thinking: numeric-expressions-16b", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-16b/" },
          { title: "Arithmetic Thinking: numeric-expressions-15", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-15/" },
          { title: "Arithmetic Thinking: numeric-expressions-16", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-subtracting-integers/numeric-expressions-16/" },
          { title: "Arithmetic Thinking: numeric-expression-17", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expression-17/" },
          { title: "Arithmetic Thinking: numeric-expressions-18", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expressions-18/" },
          { title: "Arithmetic Thinking: numeric-expressions-18b", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expressions-18b/" },
          { title: "Arithmetic Thinking: numeric-expressions-19", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expressions-19/" },
          { title: "Arithmetic Thinking: numeric-expressions-20", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/negative-numbers-negative-subtraction/numeric-expressions-20/" },
        ],
      },
    ]);

    // Factors and Multiples
    await insertMajorWithSubsAndActivities("Factors and Multiples", [
      {
        title: "Find factor pairs",
        description: "SWBAT find every factor pair for numbers 1–100. Eg. For 12, the factor pairs are:\n1 × 12 = 12, 2 × 6 = 12, 3 × 4 = 12. \n",
        activities: [
          { title: "4th Grade - Factors, multiples and patterns", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" },
          { title: "Number Theory: divisibility-shortcuts-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-i/" },
          { title: "Number Theory: divisibility-shortcuts-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-ii/" },
          { title: "Number Theory: divisibility-by-9-and", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-by-9-and/" },
          { title: "Number Theory: last-digits-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/last-digits-2/" },
          { title: "Number Theory: arithmetic-with-remainders", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/arithmetic-with-remainders/" },
          { title: "Number Theory: digital-roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/digital-roots/" },
          { title: "Number Theory: prime-factor-trees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factor-trees/" },
          { title: "Number Theory: prime-factorization", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factorization/" },
          { title: "Number Theory: factoring-factorials", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/factoring-factorials/" },
          { title: "Number Theory: counting-divisors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/counting-divisors/" },
          { title: "Number Theory: 100-doors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/100-doors/" },
          { title: "Number Theory: how-many-prime-numbers-are-there", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/how-many-prime-numbers-are-there/" },
        ],
      },
      {
        title: "Understand multiples",
        description: "SWBAT understand that every whole number is a multiple of its factors. Eg. 12 is a multiple of its factors: 1, 2, 3, 4, 6, and 12.",
        activities: [
          { title: "4th Grade - Factors, multiples and patterns", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" },
          { title: "Number Theory: divisibility-shortcuts-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-i/" },
          { title: "Number Theory: divisibility-shortcuts-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-ii/" },
          { title: "Number Theory: divisibility-by-9-and", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-by-9-and/" },
          { title: "Number Theory: last-digits-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/last-digits-2/" },
          { title: "Number Theory: arithmetic-with-remainders", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/arithmetic-with-remainders/" },
          { title: "Number Theory: digital-roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/digital-roots/" },
          { title: "Number Theory: prime-factor-trees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factor-trees/" },
          { title: "Number Theory: prime-factorization", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factorization/" },
          { title: "Number Theory: factoring-factorials", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/factoring-factorials/" },
          { title: "Number Theory: counting-divisors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/counting-divisors/" },
          { title: "Number Theory: 100-doors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/100-doors/" },
          { title: "Number Theory: how-many-prime-numbers-are-there", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/how-many-prime-numbers-are-there/" },
        ],
      },
      {
        title: "Divisibility rules",
        description: "SWBAT determine if a whole number is a multiple of a given one-digit number (Divisibility rules)\n",
        activities: [
          { title: "4th Grade - Factors, multiples and patterns", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" },
          { title: "Number Theory: divisibility-shortcuts-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-i/" },
          { title: "Number Theory: divisibility-shortcuts-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-ii/" },
          { title: "Number Theory: divisibility-by-9-and", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-by-9-and/" },
          { title: "Number Theory: last-digits-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/last-digits-2/" },
          { title: "Number Theory: arithmetic-with-remainders", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/arithmetic-with-remainders/" },
          { title: "Number Theory: digital-roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/digital-roots/" },
          { title: "Number Theory: prime-factor-trees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factor-trees/" },
          { title: "Number Theory: prime-factorization", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factorization/" },
          { title: "Number Theory: factoring-factorials", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/factoring-factorials/" },
          { title: "Number Theory: counting-divisors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/counting-divisors/" },
          { title: "Number Theory: 100-doors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/100-doors/" },
          { title: "Number Theory: how-many-prime-numbers-are-there", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/how-many-prime-numbers-are-there/" },
          { title: "Number Theory: times-and-dates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/times-and-dates/" },
          { title: "Number Theory: modular-congruence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/modular-congruence/" },
          { title: "Number Theory: modular-arithmetic", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/modular-arithmetic/" },
          { title: "Number Theory: divisibility-by", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/divisibility-by/" },
          { title: "Number Theory: star-drawing-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/star-drawing-i/" },
          { title: "Number Theory: star-drawing-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/star-drawing-ii/" },
          { title: "Number Theory: star-drawing-iii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/star-drawing-iii/" },
          { title: "Number Theory: die-hard-decanting-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/die-hard-decanting-i/" },
          { title: "Number Theory: die-hard-decanting-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-i/die-hard-decanting-ii/" },
          { title: "Number Theory: additive-cycles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/additive-cycles/" },
          { title: "Number Theory: modular-multiplicative-inverses", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/modular-multiplicative-inverses/" },
          { title: "Number Theory: multiplicative-cycles-and-eulers-theorem", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/multiplicative-cycles-and-eulers-theorem/" },
          { title: "Number Theory: fermats-little-theorem", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/fermats-little-theorem/" },
          { title: "Number Theory: totients", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/totients/" },
          { title: "Number Theory: last-digits-revisited", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/last-digits-revisited/" },
          { title: "Number Theory: perfect-shuffling", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/modular-arithmetic-ii/perfect-shuffling/" },
          { title: "Number Theory: divisibility", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/divisibility/" },
          { title: "Number Theory: last-digits-part-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/last-digits-part-i/" },
          { title: "Number Theory: last-digits-part-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/last-digits-part-ii/" },
          { title: "Number Theory: cryptograms-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/cryptograms-3/" },
          { title: "Number Theory: more-cryptograms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/more-cryptograms/" },
          { title: "Number Theory: even-more-cryptograms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/digits-and-divisibility/even-more-cryptograms/" },
          { title: "Number Theory: hexadecimal-divisibility-shortcuts-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-divisibility-shortcuts-i/" },
          { title: "Number Theory: hexadecimal-divisibility-shortcuts-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-divisibility-shortcuts-ii/" },
          { title: "Number Theory: hexadecimal-divisibility-shortcuts-iii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-divisibility-shortcuts-iii/" },
          { title: "Number Theory: divisibility-shortcuts-in-other-bases", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/divisibility-shortcuts-in-other-bases/" },
          { title: "Number Theory: hexadecimal-last-digits", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/hexadecimal-last-digits/" },
          { title: "Number Theory: last-digits-in-other-bases", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/divisibility-in-other-bases/last-digits-in-other-bases/" },
        ],
      },
      {
        title: "Prime and composite numbers",
        description: "SWBAT classify a whole number (1–100) as prime or composite.",
        activities: [
          { title: "4th Grade - Factors, multiples and patterns", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" },
          { title: "Number Theory: divisibility-shortcuts-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-i/" },
          { title: "Number Theory: divisibility-shortcuts-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-shortcuts-ii/" },
          { title: "Number Theory: divisibility-by-9-and", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/divisibility-by-9-and/" },
          { title: "Number Theory: last-digits-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/last-digits-2/" },
          { title: "Number Theory: arithmetic-with-remainders", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/arithmetic-with-remainders/" },
          { title: "Number Theory: digital-roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/digital-roots/" },
          { title: "Number Theory: prime-factor-trees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factor-trees/" },
          { title: "Number Theory: prime-factorization", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/prime-factorization/" },
          { title: "Number Theory: factoring-factorials", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/factoring-factorials/" },
          { title: "Number Theory: counting-divisors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/counting-divisors/" },
          { title: "Number Theory: 100-doors", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/100-doors/" },
          { title: "Number Theory: how-many-prime-numbers-are-there", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/factorization/how-many-prime-numbers-are-there/" },
        ],
      },
      {
        title: "Find the LCM",
        description: "SWBAT find LCM of any 2 numbers",
        activities: [
          { title: "Pre-Algebra - Factors and multiples", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/pre-algebra/pre-algebra-factors-multiples" },
          { title: "Number Theory: 100-doors-revisited", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/100-doors-revisited/" },
          { title: "Number Theory: the-lcm", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-lcm/" },
          { title: "Number Theory: billiard-tables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables/" },
          { title: "Number Theory: the-gcd", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-gcd/" },
          { title: "Number Theory: dots-on-the-diagonal", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/dots-on-the-diagonal/" },
          { title: "Number Theory: number-jumping-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-i/" },
          { title: "Number Theory: number-jumping-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-ii/" },
          { title: "Number Theory: number-jumping-iii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-iii/" },
          { title: "Number Theory: relating-gcd-and-lcm", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/relating-gcd-and-lcm/" },
          { title: "Number Theory: billiard-tables-revisited-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-i/" },
          { title: "Number Theory: billiard-tables-revisited-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-ii/" },
        ],
      },
      {
        title: "Find the HCF",
        description: "SWBAT find HCF of any 2 numbers",
        activities: [
          { title: "Pre-Algebra - Factors and multiples", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/pre-algebra/pre-algebra-factors-multiples" },
          { title: "Number Theory: 100-doors-revisited", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/100-doors-revisited/" },
          { title: "Number Theory: the-lcm", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-lcm/" },
          { title: "Number Theory: billiard-tables", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables/" },
          { title: "Number Theory: the-gcd", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/the-gcd/" },
          { title: "Number Theory: dots-on-the-diagonal", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/dots-on-the-diagonal/" },
          { title: "Number Theory: number-jumping-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-i/" },
          { title: "Number Theory: number-jumping-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-ii/" },
          { title: "Number Theory: number-jumping-iii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/number-jumping-iii/" },
          { title: "Number Theory: relating-gcd-and-lcm", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/relating-gcd-and-lcm/" },
          { title: "Number Theory: billiard-tables-revisited-i", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-i/" },
          { title: "Number Theory: billiard-tables-revisited-ii", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-number-theory/gcd-and-lcm-2/billiard-tables-revisited-ii/" },
        ],
      },
    ]);

    // Fractions
    await insertMajorWithSubsAndActivities("Fractions", [
      {
        title: "Add and subtract fractions (different denominators)",
        description: "SWBAT add and subtract fractions with unlike denominators",
        activities: [
          { title: "Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
          { title: "Arithmetic Thinking: adding-fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-fractions/" },
          { title: "Arithmetic Thinking: add-unit-fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/add-unit-fractions/" },
          { title: "Arithmetic Thinking: adding-different", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-different/" },
          { title: "Arithmetic Thinking: adding-nonmultiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-nonmultiples/" },
          { title: "Arithmetic Thinking: adding-unlike", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-unlike/" },
        ],
      },
      {
        title: "Add and subtract mixed numbers",
        description: "SWBAT add and subtract mixed fractions",
        activities: [
          { title: "Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
          { title: "Arithmetic Thinking: adding-fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-fractions/" },
          { title: "Arithmetic Thinking: add-unit-fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/add-unit-fractions/" },
          { title: "Arithmetic Thinking: adding-different", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-different/" },
          { title: "Arithmetic Thinking: adding-nonmultiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-nonmultiples/" },
          { title: "Arithmetic Thinking: adding-unlike", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/adding-fractions/adding-unlike/" },
        ],
      },
      {
        title: "Multiply fractions",
        description: "SWBAT multiply a fraction with whole number and another fraction",
        activities: [
          { title: "Multiply fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions" },
          { title: "Arithmetic Thinking: fraction-by-integer", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/fraction-by-integer/" },
          { title: "Arithmetic Thinking: expressing-multiples", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/expressing-multiples/" },
          { title: "Arithmetic Thinking: fractions-of-fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/fractions-of-fractions/" },
          { title: "Arithmetic Thinking: expressing-fouf", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/expressing-fouf/" },
          { title: "Arithmetic Thinking: fractions-of-fractions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/fractions-of-fractions-2/" },
          { title: "Arithmetic Thinking: multiplying-fractions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/multiplying-fractions/multiplying-fractions/" },
        ],
      },
      {
        title: "Divide fractions by whole numbers",
        description: "SWBAT divide a fraction with a whole number",
        activities: [
          { title: "Divide fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-fractions" },
        ],
      },
      {
        title: "Divide fractions by fractions",
        description: "SWBAT divide a fraction with another fraction ",
        activities: [
          { title: "Divide fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-fractions" },
        ],
      },
      {
        title: "Fraction word problems",
        description: "SWBAT solve word problems involving addition, subtraction, multiplicaiton, division of Fractions using equations and visual models.",
        activities: [
          { title: "Divide fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-fractions" },
        ],
      },
    ]);

    // Decimals
    await insertMajorWithSubsAndActivities("Decimals", [
      {
        title: "Add and subtract decimals",
        description: "SWBAT add and Sub decimals upto thousandth place value",
        activities: [
          { title: "Add decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-addition-and-subtraction-3" },
          { title: "Subtract decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/subtract-decimals" },
        ],
      },
      {
        title: "Multiply decimals by whole numbers",
        description: "SWBAT multiply decimal numbers with whole numbers ",
        activities: [
          { title: "Multiply decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-multiplication-and-division-3" },
        ],
      },
      {
        title: "Multiply decimals by decimals",
        description: "SWBAT multiply 2 decimal numbers ",
        activities: [
          { title: "Multiply decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-multiplication-and-division-3" },
        ],
      },
      {
        title: "Divide decimals by whole numbers",
        description: "SWBAT divide a decimal with a whole number",
        activities: [
          { title: "Divide decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-decimals" },
        ],
      },
      {
        title: "Divide decimals by decimals",
        description: "SWBAT divide a decimal with another decimal",
        activities: [
          { title: "Divide decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-decimals" },
        ],
      },
      {
        title: "Multiply and divide by powers of 10",
        description: "SWBAT explain patterns in the number of zeros when multiplying by powers of 10 and in the placement of the decimal point when multiplying or dividing by powers of 10,\n(using whole-number exponents to denote powers of 10).\"",
        activities: [
          { title: "Powers of ten", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/powers-of-ten" },
          { title: "Exponents & Radicals: exponent-basics-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-1/" },
          { title: "Exponents & Radicals: exponent-basics-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-2/" },
          { title: "Exponents & Radicals: exponent-basics-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-3/" },
          { title: "Exponents & Radicals: exponent-basics-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-4/" },
          { title: "Exponents & Radicals: exponent-basics-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-5/" },
          { title: "Exponents & Radicals: exponents-number-line-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-1/" },
          { title: "Exponents & Radicals: exponents-number-line-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-2/" },
          { title: "Exponents & Radicals: exponents-number-line-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-3/" },
          { title: "Exponents & Radicals: exponents-number-line-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-4/" },
          { title: "Exponents & Radicals: exponents-number-line-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-5/" },
          { title: "Exponents & Radicals: exponent-number-line-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponent-number-line-7/" },
          { title: "Exponents & Radicals: exponents-number-line-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-6/" },
          { title: "Exponents & Radicals: squares-and-roots-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-1/" },
          { title: "Exponents & Radicals: squares-and-roots-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-2/" },
          { title: "Exponents & Radicals: squares-and-roots-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-3/" },
          { title: "Exponents & Radicals: squares-and-roots-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-4/" },
          { title: "Exponents & Radicals: squares-and-roots-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-5/" },
          { title: "Exponents & Radicals: squares-and-roots-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-6/" },
          { title: "Exponents & Radicals: higher-powers-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-1/" },
          { title: "Exponents & Radicals: higher-powers-3c", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-3c/" },
          { title: "Exponents & Radicals: higher-powers-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-2/" },
          { title: "Exponents & Radicals: higher-powers-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-6/" },
          { title: "Exponents & Radicals: higher-powers-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-8/" },
          { title: "Exponents & Radicals: higher-powers-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-7/" },
        ],
      },
      {
        title: "Decimal word problems",
        description: "SWBAT solve word problems involving addition, subtraction, multiplication, division of Decimals using equations and visual models.",
        activities: [
          { title: "5th Grade - Spread across Add/Sub/Mul/Div decimals units (U2, U3, U8, U9)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-addition-and-subtraction-3" },
        ],
      },
    ]);

    // Geometry
    await insertMajorWithSubsAndActivities("Geometry", [
      {
        title: "Plot on the coordinate plane",
        description: "SWBAT plot points, lines, and shapes on the coordinate plane (Quadrant 1 --> All Quadrants)",
        activities: [
          { title: "Coordinate plane", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-geometry-3" },
          { title: "Coordinate Plane: coordinates-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/coordinates-2/" },
          { title: "Coordinate Plane: coordinate-pairs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/coordinate-pairs/" },
          { title: "Coordinate Plane: axes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/axes/" },
          { title: "Coordinate Plane: x-and-y-coords", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/x-and-y-coords/" },
          { title: "Coordinate Plane: plotting-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/plotting-points/" },
          { title: "Coordinate Plane: identifying-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/identifying-points/" },
          { title: "Coordinate Plane: applied-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/points/applied-coordinates/" },
          { title: "Coordinate Plane: negative-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/negative-coordinates/" },
          { title: "Coordinate Plane: identifying-quadrants", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/identifying-quadrants/" },
          { title: "Coordinate Plane: point-in-quadrant", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/point-in-quadrant/" },
          { title: "Coordinate Plane: plotting-negative-coords", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/plotting-negative-coords/" },
          { title: "Coordinate Plane: identifying-negative-coords", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/identifying-negative-coords/" },
          { title: "Coordinate Plane: temperature-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/the-four-quadrants/temperature-coordinates/" },
          { title: "Coordinate Plane: points-to-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/points-to-lines/" },
          { title: "Coordinate Plane: horizontal-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/horizontal-lines/" },
          { title: "Coordinate Plane: vertical-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/vertical-lines/" },
          { title: "Coordinate Plane: horiz-and-vert-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/horiz-and-vert-lines/" },
          { title: "Coordinate Plane: interpreting-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/lines/interpreting-lines/" },
          { title: "Coordinate Plane: y-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/y-inequalities/" },
          { title: "Coordinate Plane: x-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/x-inequalities/" },
          { title: "Coordinate Plane: identifying-regions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/identifying-regions/" },
          { title: "Coordinate Plane: or-equal-to-plane", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/or-equal-to-plane/" },
          { title: "Coordinate Plane: marking-boundaries", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/marking-boundaries/" },
          { title: "Coordinate Plane: accounting-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/inequalities/accounting-inequalities/" },
          { title: "Coordinate Plane: distance-between-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/distance-between-points/" },
          { title: "Coordinate Plane: vertical-separation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/vertical-separation/" },
          { title: "Coordinate Plane: distance-absolute-value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/distance-absolute-value/" },
          { title: "Coordinate Plane: selecting-for-distance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/selecting-for-distance/" },
          { title: "Coordinate Plane: giving-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/giving-coordinates/" },
          { title: "Coordinate Plane: temperature-differences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/coordinate-plane/gridline-distance/temperature-differences/" },
          { title: "Transformations: coordinate-translation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/coordinate-translation/" },
          { title: "Transformations: translating-shapes-x-y", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/translating-shapes-x-y/" },
          { title: "Transformations: translate-into-region", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-translation/translate-into-region/" },
          { title: "Transformations: rotating-180", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-180/" },
          { title: "Transformations: rotated-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotated-coordinates/" },
          { title: "Transformations: rotating-270-b", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-270-b/" },
          { title: "Transformations: rotating-by-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/coordinate-wise-rotation/rotating-by-coordinates/" },
          { title: "Transformations: reflecting-coordinates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-coordinates/" },
          { title: "Transformations: reflecting-vertices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-vertices/" },
          { title: "Transformations: reflecting-y-x", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-y-x/" },
          { title: "Transformations: reflecting-y-minus-x", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/reflecting-y-minus-x/" },
          { title: "Transformations: choosing-coordinate-reflection", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/reflections-in-coordinates/choosing-coordinate-reflection/" },
        ],
      },
      {
        title: "2D shapes and 3D objects",
        description: "\nSWBAT understand the relationship between two-dimensional figures and three-dimensional objects.",
        activities: [
          { title: "Properties of shapes", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes" },
          { title: "Geometry Fundamentals: scaled-copies", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling/scaled-copies/" },
          { title: "Geometry Fundamentals: similarity-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling/similarity-2/" },
          { title: "Geometry Fundamentals: volume-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling-and-volume/volume-3/" },
          { title: "Geometry Fundamentals: pyramids-cones-volume-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/scaling-and-volume/pyramids-cones-volume-2/" },
          { title: "Transformations: similarity-introduction", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/similarity/similarity-introduction/" },
          { title: "Transformations: proving-similarity", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/similarity/proving-similarity/" },
          { title: "Transformations: identifying-similarity", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/transformations/similarity/identifying-similarity/" },
        ],
      },
      {
        title: "Types of triangles",
        description: "SWBAT identify and classify different categories of triangles and their properties",
        activities: [
          { title: "Properties of shapes", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes" },
          { title: "Geometry Fundamentals: pythagorean-theorem-diagrammar-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/pythagorean-theorem-diagrammar-2/" },
          { title: "Geometry Fundamentals: using-the-pythagorean-theorem", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/using-the-pythagorean-theorem/" },
          { title: "Geometry Fundamentals: square-roots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/square-roots/" },
          { title: "Geometry Fundamentals: special-right-triangles-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/special-right-triangles-3/" },
          { title: "Geometry Fundamentals: applying-the-pythagorean-theorem-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/pythagoras-geometry-3/applying-the-pythagorean-theorem-3/" },
          { title: "Beautiful Geometry: the-triangle-inequality", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/the-triangle-inequality/" },
          { title: "Beautiful Geometry: congruent-and-similar-triangles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/congruent-and-similar-triangles/" },
          { title: "Beautiful Geometry: bass-fishing", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/bass-fishing/" },
          { title: "Beautiful Geometry: currys-paradox", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangles-5/currys-paradox/" },
          { title: "Beautiful Geometry: right-triangles", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/mastering-triangles/right-triangles/" },
          { title: "Beautiful Geometry: thales-pythagoras", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/mastering-triangles/thales-pythagoras/" },
          { title: "Beautiful Geometry: cevians", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/mastering-triangles/cevians/" },
          { title: "Beautiful Geometry: pegboard-triangles-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/mastering-triangles/pegboard-triangles-2/" },
          { title: "Beautiful Geometry: three-different-centers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangle-centers/three-different-centers/" },
          { title: "Beautiful Geometry: the-crircumcenter", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangle-centers/the-crircumcenter/" },
          { title: "Beautiful Geometry: eulers-line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangle-centers/eulers-line/" },
          { title: "Beautiful Geometry: anatomy-of-a-triangle", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/triangle-centers/anatomy-of-a-triangle/" },
        ],
      },
      {
        title: "Types of quadrilaterals",
        description: "SWBAT classify quadrilaterals based on properties such as angles, sides, parallel, and perpendicular",
        activities: [
          { title: "Properties of shapes", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes" },
          { title: "Beautiful Geometry: angles-of-regular-polygons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/angles-of-regular-polygons/" },
          { title: "Beautiful Geometry: defining-regular-polygons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/defining-regular-polygons/" },
          { title: "Beautiful Geometry: polygon-areas-and-lengths", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/polygon-areas-and-lengths/" },
          { title: "Beautiful Geometry: matchstick-polygons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/matchstick-polygons/" },
          { title: "Beautiful Geometry: stellations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/stellations/" },
          { title: "Beautiful Geometry: dissections", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/regular-polygons-4/dissections/" },
        ],
      },
    ]);

    // Measurement and Areas
    await insertMajorWithSubsAndActivities("Measurement and Areas", [
      {
        title: "Area and perimeter of rectangles and squares",
        description: "SWBAT apply area and perimeter formulas for rectangles and squares to solve real-world and mathematical problems (e.g., finding an unknown width from area).",
        activities: [
          { title: "4th Grade - Area and perimeter", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/area-perimeter" },
          { title: "Geometry Fundamentals: calculating-area-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/calculating-area-6/" },
          { title: "Geometry Fundamentals: polygon-areas-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/polygon-areas-2/" },
          { title: "Geometry Fundamentals: circles-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/circles-11/" },
          { title: "Geometry Fundamentals: scaling-areas-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/scaling-areas-1/" },
          { title: "Geometry Fundamentals: surface-area-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/surface-area-2/" },
          { title: "Geometry Fundamentals: surface-area-shortcut", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/surface-area-shortcut/" },
          { title: "Geometry Fundamentals: pyramids-cones-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/pyramids-cones-2/" },
          { title: "Beautiful Geometry: composite-geometry-warmups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/composite-geometry-warmups/" },
          { title: "Beautiful Geometry: adding-lines-and-grids", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/adding-lines-and-grids/" },
          { title: "Beautiful Geometry: complementary-areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/complementary-areas/" },
          { title: "Beautiful Geometry: inclusion-and-exclusion", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/inclusion-and-exclusion/" },
          { title: "Beautiful Geometry: invariant-areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/invariant-areas/" },
        ],
      },
      {
        title: "Area of triangles, parallelograms, and composite shapes",
        description: "SWBAT solve real-world problems involving the area of other two-dimensional figures (Triangles, Parallelograms, composite shapes)  (exception Circles)",
        activities: [
          { title: "6th Grade - Geometry (area of parallelograms, triangles, composite figures)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic" },
          { title: "Geometry Fundamentals: calculating-area-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/calculating-area-6/" },
          { title: "Geometry Fundamentals: polygon-areas-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/polygon-areas-2/" },
          { title: "Geometry Fundamentals: circles-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/circles-11/" },
          { title: "Geometry Fundamentals: scaling-areas-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/areas/scaling-areas-1/" },
          { title: "Geometry Fundamentals: surface-area-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/surface-area-2/" },
          { title: "Geometry Fundamentals: surface-area-shortcut", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/surface-area-shortcut/" },
          { title: "Geometry Fundamentals: pyramids-cones-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/geometry-fundamentals/surface-area/pyramids-cones-2/" },
          { title: "Beautiful Geometry: composite-geometry-warmups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/composite-geometry-warmups/" },
          { title: "Beautiful Geometry: adding-lines-and-grids", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/adding-lines-and-grids/" },
          { title: "Beautiful Geometry: complementary-areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/complementary-areas/" },
          { title: "Beautiful Geometry: inclusion-and-exclusion", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/inclusion-and-exclusion/" },
          { title: "Beautiful Geometry: invariant-areas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-2d-geometry/composite-polygons-2/invariant-areas/" },
        ],
      },
    ]);

    // Algebra Foundations
    await insertMajorWithSubsAndActivities("Algebra Foundations", [
      {
        title: "Understand exponents (powers)",
        description: "SWBAT read and write simple powers with small exponents and explain them as repeated multiplication.\neg. 3² → “three squared = 3 × 3.” 2³ → “two cubed = 2 × 2 × 2.” 10²= “ten squared= 10 x 10 = 100”",
        activities: [
          { title: "Powers of ten", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/powers-of-ten" },
          { title: "Exponents & Radicals: exponent-basics-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-1/" },
          { title: "Exponents & Radicals: exponent-basics-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-2/" },
          { title: "Exponents & Radicals: exponent-basics-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-3/" },
          { title: "Exponents & Radicals: exponent-basics-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-4/" },
          { title: "Exponents & Radicals: exponent-basics-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-5/" },
          { title: "Exponents & Radicals: exponents-number-line-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-1/" },
          { title: "Exponents & Radicals: exponents-number-line-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-2/" },
          { title: "Exponents & Radicals: exponents-number-line-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-3/" },
          { title: "Exponents & Radicals: exponents-number-line-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-4/" },
          { title: "Exponents & Radicals: exponents-number-line-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-5/" },
          { title: "Exponents & Radicals: exponent-number-line-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponent-number-line-7/" },
          { title: "Exponents & Radicals: exponents-number-line-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-6/" },
          { title: "Exponents & Radicals: squares-and-roots-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-1/" },
          { title: "Exponents & Radicals: squares-and-roots-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-2/" },
          { title: "Exponents & Radicals: squares-and-roots-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-3/" },
          { title: "Exponents & Radicals: squares-and-roots-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-4/" },
          { title: "Exponents & Radicals: squares-and-roots-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-5/" },
          { title: "Exponents & Radicals: squares-and-roots-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-6/" },
          { title: "Exponents & Radicals: higher-powers-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-1/" },
          { title: "Exponents & Radicals: higher-powers-3c", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-3c/" },
          { title: "Exponents & Radicals: higher-powers-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-2/" },
          { title: "Exponents & Radicals: higher-powers-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-6/" },
          { title: "Exponents & Radicals: higher-powers-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-8/" },
          { title: "Exponents & Radicals: higher-powers-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-7/" },
        ],
      },
      {
        title: "Evaluate expressions with exponents",
        description: "SWBAT write and evaluate numerical expressions involving whole-number exponents.\neg. Evaluate: 2³ + 5²",
        activities: [
          { title: "Algebraic thinking", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking" },
          { title: "Exponents & Radicals: exponent-basics-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-1/" },
          { title: "Exponents & Radicals: exponent-basics-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-2/" },
          { title: "Exponents & Radicals: exponent-basics-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-3/" },
          { title: "Exponents & Radicals: exponent-basics-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-4/" },
          { title: "Exponents & Radicals: exponent-basics-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponent-basics/exponent-basics-5/" },
          { title: "Exponents & Radicals: exponents-number-line-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-1/" },
          { title: "Exponents & Radicals: exponents-number-line-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-2/" },
          { title: "Exponents & Radicals: exponents-number-line-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-3/" },
          { title: "Exponents & Radicals: exponents-number-line-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-4/" },
          { title: "Exponents & Radicals: exponents-number-line-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-5/" },
          { title: "Exponents & Radicals: exponent-number-line-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponent-number-line-7/" },
          { title: "Exponents & Radicals: exponents-number-line-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/exponents-and-number-line/exponents-number-line-6/" },
          { title: "Exponents & Radicals: squares-and-roots-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-1/" },
          { title: "Exponents & Radicals: squares-and-roots-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-2/" },
          { title: "Exponents & Radicals: squares-and-roots-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-3/" },
          { title: "Exponents & Radicals: squares-and-roots-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-4/" },
          { title: "Exponents & Radicals: squares-and-roots-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-5/" },
          { title: "Exponents & Radicals: squares-and-roots-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/squares-and-roots/squares-and-roots-6/" },
          { title: "Exponents & Radicals: higher-powers-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-1/" },
          { title: "Exponents & Radicals: higher-powers-3c", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-3c/" },
          { title: "Exponents & Radicals: higher-powers-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-2/" },
          { title: "Exponents & Radicals: higher-powers-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-6/" },
          { title: "Exponents & Radicals: higher-powers-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-8/" },
          { title: "Exponents & Radicals: higher-powers-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/exponents-and-radicals/higher-powers-and-roots/higher-powers-7/" },
        ],
      },
      {
        title: "Find patterns in numbers and shapes",
        description: "SWBAT identify the rule governing number/shape patterns and find the unknowns based on it.\neg. 1, 4, 9, 16, 25 , X",
        activities: [
          { title: "Algebraic thinking", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking" },
          { title: "Visual Algebra: patterns-intro", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-intro/" },
          { title: "Visual Algebra: patterns-intro-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-intro-2/" },
          { title: "Visual Algebra: flower", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/flower/" },
          { title: "Visual Algebra: patterns-sketching", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-sketching/" },
          { title: "Visual Algebra: pattern-expression", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/pattern-expression/" },
          { title: "Visual Algebra: pattern-expression-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/pattern-expression-2/" },
          { title: "Visual Algebra: patterns-constant", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant/" },
          { title: "Visual Algebra: patterns-constant-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant-2/" },
          { title: "Visual Algebra: patterns-constant-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant-5/" },
          { title: "Visual Algebra: patterns-constant-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/patterns-constant-6/" },
          { title: "Visual Algebra: patterns-constant-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/patterns-constant-3/" },
          { title: "Visual Algebra: pattern-mix", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/pattern-mix/" },
          { title: "Visual Algebra: quadratic-patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-patterns/" },
          { title: "Visual Algebra: quadratic-with-a-constant", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-with-a-constant/" },
          { title: "Visual Algebra: quadratic-and-linear", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/quadratic-and-linear/" },
          { title: "Visual Algebra: pattern-punch", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/pattern-punch/" },
          { title: "Visual Algebra: rectangle-patterns", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/rectangle-patterns/" },
          { title: "Visual Algebra: rectangle-patterns-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-patterns/rectangle-patterns-2/" },
          { title: "Visual Algebra: linear-and-constant", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/linear-and-constant/" },
          { title: "Visual Algebra: linear-and-constant-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/linear-and-constant-2/" },
          { title: "Visual Algebra: shift-steps", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/shift-steps/" },
          { title: "Visual Algebra: take-a-bite", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/take-a-bite/" },
          { title: "Visual Algebra: the-frame", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/the-frame/" },
          { title: "Visual Algebra: monster-jaw", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-expressions/monster-jaw/" },
          { title: "Visual Algebra: different-growth", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/different-growth/" },
          { title: "Visual Algebra: different-growth-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/different-growth-2/" },
          { title: "Visual Algebra: triangular-numbers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/triangular-numbers/" },
          { title: "Visual Algebra: different-growth-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/different-growth-3/" },
          { title: "Visual Algebra: linear-or-quadratic", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/linear-or-quadratic/" },
          { title: "Visual Algebra: linear-or-quadratic-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/linear-or-quadratic-2/" },
          { title: "Visual Algebra: quadratic-vs-linear", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/quadratic-growth/quadratic-vs-linear/" },
          { title: "Visual Algebra: building-exponential-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/exponential-patterns/building-exponential-2/" },
          { title: "Visual Algebra: zero-power", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/exponential-patterns/zero-power/" },
          { title: "Visual Algebra: writing-exponential", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/exponential-patterns/writing-exponential/" },
          { title: "Visual Algebra: exponential-patterns-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/exponential-patterns-2/" },
          { title: "Visual Algebra: growth-factors-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/growth-factors-2/" },
          { title: "Visual Algebra: building-exponential", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/building-exponential/" },
          { title: "Visual Algebra: building-linear", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/building-linear/" },
          { title: "Visual Algebra: kinds-of-growth", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-or-exponential/kinds-of-growth/" },
        ],
      },
      {
        title: "Order of operations (BODMAS)",
        description: "SWBAT use the order of operations to correctly evaluate numerical expressions with parentheses, brackets, and braces.\nExpression: 3 × (4 + 2)\n“First add 4 + 2 = 6, then 3 × 6 = 18.”",
        activities: [
          { title: "Algebraic thinking", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking" },
        ],
      },
    ]);

    // Algebra
    await insertMajorWithSubsAndActivities("Algebra", [
      {
        title: "Use variables to represent unknowns",
        description: "SWBAT represent an unknown number using a letter/symbol.\neg. I am thinking of a number that, when added to 19 gives 40. Can you write an equation?\n19 + x = 40. ",
        activities: [
          { title: "6th Grade - Variables & expressions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-expressions-and-variables" },
          { title: "Solving Equations: understanding-variables-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2/" },
          { title: "Solving Equations: using-variables-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp/" },
          { title: "Solving Equations: understanding-expressions-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp/" },
          { title: "Solving Equations: understanding-equations-1-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2/" },
          { title: "Solving Equations: solving-equations-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2/" },
          { title: "Solving Equations: solving-multiple-equations-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp/" },
          { title: "Solving Equations: working-backwards-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp/" },
          { title: "Solving Equations: working-backwards-with-unknowns-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp/" },
          { title: "Solving Equations: equation-solving-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp/" },
          { title: "Solving Equations: substitution-8-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2/" },
          { title: "Solving Equations: groups-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/groups-in-equations/" },
          { title: "Solving Equations: isolating-groups-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/isolating-groups-2-ss-exp/" },
          { title: "Solving Equations: solving-with-groups-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/solving-with-groups-ss-exp/" },
          { title: "Solving Equations: distributing-3-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-3-ss-exp/" },
          { title: "Solving Equations: distributing-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-2-ss-exp/" },
          { title: "Solving Equations: factoring-1a", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a/" },
          { title: "Solving Equations: factoring-4-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-4-ss-exp/" },
          { title: "Solving Equations: strategic-moves-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/strategic-moves-ss-exp/" },
          { title: "Solving Equations: combining-like-terms-new-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-1/" },
          { title: "Solving Equations: combining-like-terms-new-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-2/" },
          { title: "Solving Equations: shifting-terms-new", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-new/" },
          { title: "Solving Equations: shifting-terms-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-in-equations/" },
          { title: "Solving Equations: bringing-it-together-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together-2/" },
          { title: "Solving Equations: bringing-it-together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together/" },
          { title: "Solving Equations: unbalanced-scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/unbalanced-scales/" },
          { title: "Solving Equations: inequalities-both-ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/inequalities-both-ways/" },
          { title: "Solving Equations: balancing-scales-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/balancing-scales-3/" },
          { title: "Solving Equations: solutions-to-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/solutions-to-inequalities/" },
          { title: "Solving Equations: graphing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-inequalities-3/" },
          { title: "Solving Equations: graphing-solutions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-solutions-2/" },
          { title: "Solving Equations: solving-inequalities-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-5/" },
          { title: "Solving Equations: solving-inequalities-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-6/" },
          { title: "Solving Equations: or-equal-to", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/or-equal-to/" },
          { title: "Solving Equations: writing-inequalities-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-2/" },
          { title: "Solving Equations: writing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-3/" },
          { title: "Solving Equations: solving-inequalities-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-4/" },
          { title: "Solving Equations: simple-systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems/" },
          { title: "Solving Equations: simple-systems-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-2/" },
          { title: "Solving Equations: simple-systems-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-3/" },
          { title: "Solving Equations: simple-systems-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-4/" },
          { title: "Solving Equations: simple-systems-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-6/" },
          { title: "Solving Equations: simple-systems-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-9/" },
          { title: "Solving Equations: simple-systems-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-5/" },
          { title: "Solving Equations: simple-systems-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-7/" },
          { title: "Solving Equations: simple-systems-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-8/" },
          { title: "Solving Equations: reasoning-building-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-1/" },
          { title: "Solving Equations: reasoning-building-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-3/" },
          { title: "Solving Equations: reasoning-building-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-2/" },
          { title: "Solving Equations: reasoning-building-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-7/" },
          { title: "Solving Equations: reasoning-building-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-5/" },
          { title: "Solving Equations: reasoning-building-10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-10/" },
          { title: "Solving Equations: consequences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences/" },
          { title: "Solving Equations: consequences-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-5/" },
          { title: "Solving Equations: strategic-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/strategic-comparisons/" },
          { title: "Solving Equations: consequences-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-3/" },
          { title: "Solving Equations: consequences-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-4/" },
          { title: "Solving Equations: consequences-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-6/" },
          { title: "Solving Equations: consequences-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-8/" },
          { title: "Solving Equations: consequences-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-9/" },
          { title: "Solving Equations: packing-reasoning", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning/" },
          { title: "Solving Equations: packing-reasoning-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning-2/" },
          { title: "Solving Equations: consequences-14", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-14/" },
          { title: "Solving Equations: consequences-15", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-15/" },
          { title: "Solving Equations: consequences-12", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-12/" },
          { title: "Solving Equations: consequences-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-11/" },
          { title: "Solving Equations: consequences-13", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-13/" },
          { title: "Solving Equations: constraints-in-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/constraints-in-inequalities/" },
          { title: "Solving Equations: consequences-16", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-16/" },
          { title: "Variables & Expressions: using-variables-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-variables-3/" },
          { title: "Variables & Expressions: variables-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/variables-9/" },
          { title: "Variables & Expressions: using-formulas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-formulas/" },
          { title: "Variables & Expressions: equivalent-expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/equivalent-expressions/" },
          { title: "Variables & Expressions: more-than-one-variable", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/more-than-one-variable/" },
          { title: "Visual Algebra: two-comp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/two-comp-2/" },
          { title: "Visual Algebra: two-comp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/two-comp/" },
          { title: "Visual Algebra: navigating-a-table", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/navigating-a-table/" },
          { title: "Visual Algebra: comparing-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-rates/" },
          { title: "Visual Algebra: comparing-rates-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-rates-2/" },
          { title: "Visual Algebra: comparing-expressions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-expressions-2/" },
          { title: "Visual Algebra: two-shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes/" },
          { title: "Visual Algebra: two-shapes-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-2/" },
          { title: "Visual Algebra: two-shapes-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-4/" },
          { title: "Visual Algebra: taking-a-bite", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/taking-a-bite/" },
          { title: "Visual Algebra: two-shapes-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-3/" },
        ],
      },
      {
        title: "Write expressions from word phrases",
        description: "SWBAT write expressions using letters to stand for unknowns from simple word phrases.\neg. Subtract 3 from a number y, then triple the result” → 3(y – 3).",
        activities: [
          { title: "6th Grade - Variables & expressions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-expressions-and-variables" },
          { title: "Solving Equations: understanding-variables-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2/" },
          { title: "Solving Equations: using-variables-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp/" },
          { title: "Solving Equations: understanding-expressions-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp/" },
          { title: "Solving Equations: understanding-equations-1-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2/" },
          { title: "Solving Equations: solving-equations-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2/" },
          { title: "Solving Equations: solving-multiple-equations-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp/" },
          { title: "Solving Equations: working-backwards-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp/" },
          { title: "Solving Equations: working-backwards-with-unknowns-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp/" },
          { title: "Solving Equations: equation-solving-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp/" },
          { title: "Solving Equations: substitution-8-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2/" },
          { title: "Solving Equations: groups-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/groups-in-equations/" },
          { title: "Solving Equations: isolating-groups-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/isolating-groups-2-ss-exp/" },
          { title: "Solving Equations: solving-with-groups-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/solving-with-groups-ss-exp/" },
          { title: "Solving Equations: distributing-3-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-3-ss-exp/" },
          { title: "Solving Equations: distributing-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-2-ss-exp/" },
          { title: "Solving Equations: factoring-1a", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a/" },
          { title: "Solving Equations: factoring-4-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-4-ss-exp/" },
          { title: "Solving Equations: strategic-moves-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/strategic-moves-ss-exp/" },
          { title: "Solving Equations: combining-like-terms-new-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-1/" },
          { title: "Solving Equations: combining-like-terms-new-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-2/" },
          { title: "Solving Equations: shifting-terms-new", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-new/" },
          { title: "Solving Equations: shifting-terms-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-in-equations/" },
          { title: "Solving Equations: bringing-it-together-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together-2/" },
          { title: "Solving Equations: bringing-it-together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together/" },
          { title: "Solving Equations: unbalanced-scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/unbalanced-scales/" },
          { title: "Solving Equations: inequalities-both-ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/inequalities-both-ways/" },
          { title: "Solving Equations: balancing-scales-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/balancing-scales-3/" },
          { title: "Solving Equations: solutions-to-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/solutions-to-inequalities/" },
          { title: "Solving Equations: graphing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-inequalities-3/" },
          { title: "Solving Equations: graphing-solutions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-solutions-2/" },
          { title: "Solving Equations: solving-inequalities-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-5/" },
          { title: "Solving Equations: solving-inequalities-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-6/" },
          { title: "Solving Equations: or-equal-to", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/or-equal-to/" },
          { title: "Solving Equations: writing-inequalities-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-2/" },
          { title: "Solving Equations: writing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-3/" },
          { title: "Solving Equations: solving-inequalities-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-4/" },
          { title: "Solving Equations: simple-systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems/" },
          { title: "Solving Equations: simple-systems-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-2/" },
          { title: "Solving Equations: simple-systems-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-3/" },
          { title: "Solving Equations: simple-systems-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-4/" },
          { title: "Solving Equations: simple-systems-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-6/" },
          { title: "Solving Equations: simple-systems-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-9/" },
          { title: "Solving Equations: simple-systems-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-5/" },
          { title: "Solving Equations: simple-systems-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-7/" },
          { title: "Solving Equations: simple-systems-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-8/" },
          { title: "Solving Equations: reasoning-building-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-1/" },
          { title: "Solving Equations: reasoning-building-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-3/" },
          { title: "Solving Equations: reasoning-building-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-2/" },
          { title: "Solving Equations: reasoning-building-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-7/" },
          { title: "Solving Equations: reasoning-building-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-5/" },
          { title: "Solving Equations: reasoning-building-10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-10/" },
          { title: "Solving Equations: consequences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences/" },
          { title: "Solving Equations: consequences-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-5/" },
          { title: "Solving Equations: strategic-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/strategic-comparisons/" },
          { title: "Solving Equations: consequences-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-3/" },
          { title: "Solving Equations: consequences-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-4/" },
          { title: "Solving Equations: consequences-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-6/" },
          { title: "Solving Equations: consequences-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-8/" },
          { title: "Solving Equations: consequences-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-9/" },
          { title: "Solving Equations: packing-reasoning", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning/" },
          { title: "Solving Equations: packing-reasoning-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning-2/" },
          { title: "Solving Equations: consequences-14", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-14/" },
          { title: "Solving Equations: consequences-15", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-15/" },
          { title: "Solving Equations: consequences-12", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-12/" },
          { title: "Solving Equations: consequences-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-11/" },
          { title: "Solving Equations: consequences-13", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-13/" },
          { title: "Solving Equations: constraints-in-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/constraints-in-inequalities/" },
          { title: "Solving Equations: consequences-16", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-16/" },
          { title: "Variables & Expressions: using-variables-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-variables-3/" },
          { title: "Variables & Expressions: variables-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/variables-9/" },
          { title: "Variables & Expressions: using-formulas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-formulas/" },
          { title: "Variables & Expressions: equivalent-expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/equivalent-expressions/" },
          { title: "Variables & Expressions: more-than-one-variable", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/more-than-one-variable/" },
          { title: "Visual Algebra: two-comp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/two-comp-2/" },
          { title: "Visual Algebra: two-comp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/two-comp/" },
          { title: "Visual Algebra: navigating-a-table", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/navigating-a-table/" },
          { title: "Visual Algebra: comparing-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-rates/" },
          { title: "Visual Algebra: comparing-rates-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-rates-2/" },
          { title: "Visual Algebra: comparing-expressions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/comparing-linear-expressions/comparing-expressions-2/" },
          { title: "Visual Algebra: two-shapes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes/" },
          { title: "Visual Algebra: two-shapes-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-2/" },
          { title: "Visual Algebra: two-shapes-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-4/" },
          { title: "Visual Algebra: taking-a-bite", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/taking-a-bite/" },
          { title: "Visual Algebra: two-shapes-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/combining-linear-expressions/two-shapes-3/" },
        ],
      },
      {
        title: "Variables, constants, and coefficients",
        description: "SWBAT distinguish variables and constants in an expression/equation. \nIdentify the constant and variable in each:\na. 4x + 7\nb. X is the number of tickets bought. Cost of each ticket is 50 Rs. I pay a total cost according to the number of tickets bought.  T = 50X ",
        activities: [
          { title: "6th Grade - Variables & expressions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-expressions-and-variables" },
          { title: "Solving Equations: understanding-variables-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2/" },
          { title: "Solving Equations: using-variables-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp/" },
          { title: "Solving Equations: understanding-expressions-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp/" },
          { title: "Solving Equations: understanding-equations-1-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2/" },
          { title: "Solving Equations: solving-equations-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2/" },
          { title: "Solving Equations: solving-multiple-equations-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp/" },
          { title: "Solving Equations: working-backwards-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp/" },
          { title: "Solving Equations: working-backwards-with-unknowns-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp/" },
          { title: "Solving Equations: equation-solving-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp/" },
          { title: "Solving Equations: substitution-8-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2/" },
          { title: "Solving Equations: groups-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/groups-in-equations/" },
          { title: "Solving Equations: isolating-groups-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/isolating-groups-2-ss-exp/" },
          { title: "Solving Equations: solving-with-groups-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/solving-with-groups-ss-exp/" },
          { title: "Solving Equations: distributing-3-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-3-ss-exp/" },
          { title: "Solving Equations: distributing-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-2-ss-exp/" },
          { title: "Solving Equations: factoring-1a", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a/" },
          { title: "Solving Equations: factoring-4-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-4-ss-exp/" },
          { title: "Solving Equations: strategic-moves-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/strategic-moves-ss-exp/" },
          { title: "Solving Equations: combining-like-terms-new-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-1/" },
          { title: "Solving Equations: combining-like-terms-new-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-2/" },
          { title: "Solving Equations: shifting-terms-new", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-new/" },
          { title: "Solving Equations: shifting-terms-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-in-equations/" },
          { title: "Solving Equations: bringing-it-together-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together-2/" },
          { title: "Solving Equations: bringing-it-together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together/" },
          { title: "Solving Equations: unbalanced-scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/unbalanced-scales/" },
          { title: "Solving Equations: inequalities-both-ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/inequalities-both-ways/" },
          { title: "Solving Equations: balancing-scales-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/balancing-scales-3/" },
          { title: "Solving Equations: solutions-to-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/solutions-to-inequalities/" },
          { title: "Solving Equations: graphing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-inequalities-3/" },
          { title: "Solving Equations: graphing-solutions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-solutions-2/" },
          { title: "Solving Equations: solving-inequalities-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-5/" },
          { title: "Solving Equations: solving-inequalities-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-6/" },
          { title: "Solving Equations: or-equal-to", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/or-equal-to/" },
          { title: "Solving Equations: writing-inequalities-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-2/" },
          { title: "Solving Equations: writing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-3/" },
          { title: "Solving Equations: solving-inequalities-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-4/" },
          { title: "Solving Equations: simple-systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems/" },
          { title: "Solving Equations: simple-systems-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-2/" },
          { title: "Solving Equations: simple-systems-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-3/" },
          { title: "Solving Equations: simple-systems-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-4/" },
          { title: "Solving Equations: simple-systems-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-6/" },
          { title: "Solving Equations: simple-systems-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-9/" },
          { title: "Solving Equations: simple-systems-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-5/" },
          { title: "Solving Equations: simple-systems-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-7/" },
          { title: "Solving Equations: simple-systems-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-8/" },
          { title: "Solving Equations: reasoning-building-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-1/" },
          { title: "Solving Equations: reasoning-building-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-3/" },
          { title: "Solving Equations: reasoning-building-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-2/" },
          { title: "Solving Equations: reasoning-building-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-7/" },
          { title: "Solving Equations: reasoning-building-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-5/" },
          { title: "Solving Equations: reasoning-building-10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-10/" },
          { title: "Solving Equations: consequences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences/" },
          { title: "Solving Equations: consequences-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-5/" },
          { title: "Solving Equations: strategic-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/strategic-comparisons/" },
          { title: "Solving Equations: consequences-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-3/" },
          { title: "Solving Equations: consequences-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-4/" },
          { title: "Solving Equations: consequences-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-6/" },
          { title: "Solving Equations: consequences-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-8/" },
          { title: "Solving Equations: consequences-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-9/" },
          { title: "Solving Equations: packing-reasoning", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning/" },
          { title: "Solving Equations: packing-reasoning-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning-2/" },
          { title: "Solving Equations: consequences-14", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-14/" },
          { title: "Solving Equations: consequences-15", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-15/" },
          { title: "Solving Equations: consequences-12", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-12/" },
          { title: "Solving Equations: consequences-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-11/" },
          { title: "Solving Equations: consequences-13", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-13/" },
          { title: "Solving Equations: constraints-in-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/constraints-in-inequalities/" },
          { title: "Solving Equations: consequences-16", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-16/" },
          { title: "Variables & Expressions: using-variables-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-variables-3/" },
          { title: "Variables & Expressions: variables-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/variables-9/" },
          { title: "Variables & Expressions: using-formulas", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/using-formulas/" },
          { title: "Variables & Expressions: equivalent-expressions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/equivalent-expressions/" },
          { title: "Variables & Expressions: more-than-one-variable", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/writing-formulas/more-than-one-variable/" },
        ],
      },
      {
        title: "Properties of operations",
        description: "SWBAT use properties of operations (distributive, commutative, associative) to rewrite expressions in equivalent forms.",
        activities: [
          { title: "6th Grade - Variables & expressions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-expressions-and-variables" },
          { title: "Solving Equations: understanding-variables-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2/" },
          { title: "Solving Equations: using-variables-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp/" },
          { title: "Solving Equations: understanding-expressions-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp/" },
          { title: "Solving Equations: understanding-equations-1-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2/" },
          { title: "Solving Equations: solving-equations-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2/" },
          { title: "Solving Equations: solving-multiple-equations-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp/" },
          { title: "Solving Equations: working-backwards-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp/" },
          { title: "Solving Equations: working-backwards-with-unknowns-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp/" },
          { title: "Solving Equations: equation-solving-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp/" },
          { title: "Solving Equations: substitution-8-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2/" },
          { title: "Solving Equations: groups-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/groups-in-equations/" },
          { title: "Solving Equations: isolating-groups-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/isolating-groups-2-ss-exp/" },
          { title: "Solving Equations: solving-with-groups-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/solving-with-groups-ss-exp/" },
          { title: "Solving Equations: distributing-3-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-3-ss-exp/" },
          { title: "Solving Equations: distributing-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-2-ss-exp/" },
          { title: "Solving Equations: factoring-1a", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a/" },
          { title: "Solving Equations: factoring-4-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-4-ss-exp/" },
          { title: "Solving Equations: strategic-moves-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/strategic-moves-ss-exp/" },
          { title: "Solving Equations: combining-like-terms-new-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-1/" },
          { title: "Solving Equations: combining-like-terms-new-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-2/" },
          { title: "Solving Equations: shifting-terms-new", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-new/" },
          { title: "Solving Equations: shifting-terms-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-in-equations/" },
          { title: "Solving Equations: bringing-it-together-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together-2/" },
          { title: "Solving Equations: bringing-it-together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together/" },
          { title: "Solving Equations: unbalanced-scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/unbalanced-scales/" },
          { title: "Solving Equations: inequalities-both-ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/inequalities-both-ways/" },
          { title: "Solving Equations: balancing-scales-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/balancing-scales-3/" },
          { title: "Solving Equations: solutions-to-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/solutions-to-inequalities/" },
          { title: "Solving Equations: graphing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-inequalities-3/" },
          { title: "Solving Equations: graphing-solutions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-solutions-2/" },
          { title: "Solving Equations: solving-inequalities-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-5/" },
          { title: "Solving Equations: solving-inequalities-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-6/" },
          { title: "Solving Equations: or-equal-to", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/or-equal-to/" },
          { title: "Solving Equations: writing-inequalities-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-2/" },
          { title: "Solving Equations: writing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-3/" },
          { title: "Solving Equations: solving-inequalities-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-4/" },
          { title: "Solving Equations: simple-systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems/" },
          { title: "Solving Equations: simple-systems-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-2/" },
          { title: "Solving Equations: simple-systems-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-3/" },
          { title: "Solving Equations: simple-systems-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-4/" },
          { title: "Solving Equations: simple-systems-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-6/" },
          { title: "Solving Equations: simple-systems-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-9/" },
          { title: "Solving Equations: simple-systems-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-5/" },
          { title: "Solving Equations: simple-systems-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-7/" },
          { title: "Solving Equations: simple-systems-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-8/" },
          { title: "Solving Equations: reasoning-building-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-1/" },
          { title: "Solving Equations: reasoning-building-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-3/" },
          { title: "Solving Equations: reasoning-building-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-2/" },
          { title: "Solving Equations: reasoning-building-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-7/" },
          { title: "Solving Equations: reasoning-building-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-5/" },
          { title: "Solving Equations: reasoning-building-10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-10/" },
          { title: "Solving Equations: consequences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences/" },
          { title: "Solving Equations: consequences-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-5/" },
          { title: "Solving Equations: strategic-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/strategic-comparisons/" },
          { title: "Solving Equations: consequences-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-3/" },
          { title: "Solving Equations: consequences-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-4/" },
          { title: "Solving Equations: consequences-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-6/" },
          { title: "Solving Equations: consequences-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-8/" },
          { title: "Solving Equations: consequences-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-9/" },
          { title: "Solving Equations: packing-reasoning", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning/" },
          { title: "Solving Equations: packing-reasoning-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning-2/" },
          { title: "Solving Equations: consequences-14", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-14/" },
          { title: "Solving Equations: consequences-15", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-15/" },
          { title: "Solving Equations: consequences-12", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-12/" },
          { title: "Solving Equations: consequences-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-11/" },
          { title: "Solving Equations: consequences-13", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-13/" },
          { title: "Solving Equations: constraints-in-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/constraints-in-inequalities/" },
          { title: "Solving Equations: consequences-16", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-16/" },
          { title: "Visual Algebra: equiv-expr-linear-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-linear-2/" },
          { title: "Visual Algebra: equiv-expr-quad", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-quad/" },
          { title: "Visual Algebra: equiv-expr-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/equiv-expr-exp/" },
          { title: "Visual Algebra: va-finale-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/va-finale-2/" },
          { title: "Visual Algebra: va-finale-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/equivalent-expressions/va-finale-1/" },
        ],
      },
      {
        title: "Solve equations",
        description: "SWBAT solve an equation to find an unknown (methods: substitution, adding/subtracting on both sides, multiplying/dividing on both sides, etc)\n1. 3x = 12\nTry x = 4 → 3×4 = 12 (true).\nTry x = 5 → 3×5 = 15 (not true).\nSo x = 4 is a solution\n2. 2x + 7 = 10\n2x= 3 (subtracting 7 from both sides)\nx= 3/2  (dividing by 2 on both sides)\n",
        activities: [
          { title: "6th Grade - Equations & inequalities", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities" },
          { title: "Solving Equations: understanding-variables-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2/" },
          { title: "Solving Equations: using-variables-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp/" },
          { title: "Solving Equations: understanding-expressions-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp/" },
          { title: "Solving Equations: understanding-equations-1-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2/" },
          { title: "Solving Equations: solving-equations-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2/" },
          { title: "Solving Equations: solving-multiple-equations-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp/" },
          { title: "Solving Equations: working-backwards-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp/" },
          { title: "Solving Equations: working-backwards-with-unknowns-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp/" },
          { title: "Solving Equations: equation-solving-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp/" },
          { title: "Solving Equations: substitution-8-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2/" },
          { title: "Solving Equations: groups-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/groups-in-equations/" },
          { title: "Solving Equations: isolating-groups-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/isolating-groups-2-ss-exp/" },
          { title: "Solving Equations: solving-with-groups-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/solving-with-groups-ss-exp/" },
          { title: "Solving Equations: distributing-3-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-3-ss-exp/" },
          { title: "Solving Equations: distributing-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-2-ss-exp/" },
          { title: "Solving Equations: factoring-1a", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a/" },
          { title: "Solving Equations: factoring-4-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-4-ss-exp/" },
          { title: "Solving Equations: strategic-moves-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/strategic-moves-ss-exp/" },
          { title: "Solving Equations: combining-like-terms-new-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-1/" },
          { title: "Solving Equations: combining-like-terms-new-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-2/" },
          { title: "Solving Equations: shifting-terms-new", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-new/" },
          { title: "Solving Equations: shifting-terms-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-in-equations/" },
          { title: "Solving Equations: bringing-it-together-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together-2/" },
          { title: "Solving Equations: bringing-it-together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together/" },
          { title: "Solving Equations: unbalanced-scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/unbalanced-scales/" },
          { title: "Solving Equations: inequalities-both-ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/inequalities-both-ways/" },
          { title: "Solving Equations: balancing-scales-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/balancing-scales-3/" },
          { title: "Solving Equations: solutions-to-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/solutions-to-inequalities/" },
          { title: "Solving Equations: graphing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-inequalities-3/" },
          { title: "Solving Equations: graphing-solutions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-solutions-2/" },
          { title: "Solving Equations: solving-inequalities-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-5/" },
          { title: "Solving Equations: solving-inequalities-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-6/" },
          { title: "Solving Equations: or-equal-to", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/or-equal-to/" },
          { title: "Solving Equations: writing-inequalities-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-2/" },
          { title: "Solving Equations: writing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-3/" },
          { title: "Solving Equations: solving-inequalities-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-4/" },
          { title: "Solving Equations: simple-systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems/" },
          { title: "Solving Equations: simple-systems-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-2/" },
          { title: "Solving Equations: simple-systems-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-3/" },
          { title: "Solving Equations: simple-systems-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-4/" },
          { title: "Solving Equations: simple-systems-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-6/" },
          { title: "Solving Equations: simple-systems-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-9/" },
          { title: "Solving Equations: simple-systems-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-5/" },
          { title: "Solving Equations: simple-systems-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-7/" },
          { title: "Solving Equations: simple-systems-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-8/" },
          { title: "Solving Equations: reasoning-building-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-1/" },
          { title: "Solving Equations: reasoning-building-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-3/" },
          { title: "Solving Equations: reasoning-building-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-2/" },
          { title: "Solving Equations: reasoning-building-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-7/" },
          { title: "Solving Equations: reasoning-building-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-5/" },
          { title: "Solving Equations: reasoning-building-10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-10/" },
          { title: "Solving Equations: consequences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences/" },
          { title: "Solving Equations: consequences-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-5/" },
          { title: "Solving Equations: strategic-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/strategic-comparisons/" },
          { title: "Solving Equations: consequences-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-3/" },
          { title: "Solving Equations: consequences-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-4/" },
          { title: "Solving Equations: consequences-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-6/" },
          { title: "Solving Equations: consequences-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-8/" },
          { title: "Solving Equations: consequences-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-9/" },
          { title: "Solving Equations: packing-reasoning", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning/" },
          { title: "Solving Equations: packing-reasoning-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning-2/" },
          { title: "Solving Equations: consequences-14", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-14/" },
          { title: "Solving Equations: consequences-15", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-15/" },
          { title: "Solving Equations: consequences-12", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-12/" },
          { title: "Solving Equations: consequences-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-11/" },
          { title: "Solving Equations: consequences-13", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-13/" },
          { title: "Solving Equations: constraints-in-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/constraints-in-inequalities/" },
          { title: "Solving Equations: consequences-16", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-16/" },
        ],
      },
      {
        title: "Equation word problems",
        description: "SWBAT solve word problems and solving equations of the form x + p = q and px = q (with non-negative rational numbers).\neg. A pen and a notebook together cost ₹120. The pen costs ₹45. How much is the notebook?”\nEquation: 45 + n = 120 → n = 120 – 45 = 75.",
        activities: [
          { title: "6th Grade - Equations & inequalities", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities" },
          { title: "Solving Equations: understanding-variables-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-variables-2/" },
          { title: "Solving Equations: using-variables-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/using-variables-2-ss-exp/" },
          { title: "Solving Equations: understanding-expressions-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-expressions-2-ss-exp/" },
          { title: "Solving Equations: understanding-equations-1-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/variables/understanding-equations-1-ss-exp-2/" },
          { title: "Solving Equations: solving-equations-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-equations-2/" },
          { title: "Solving Equations: solving-multiple-equations-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/solving-multiple-equations-ss-exp/" },
          { title: "Solving Equations: working-backwards-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-ss-exp/" },
          { title: "Solving Equations: working-backwards-with-unknowns-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/working-backwards-with-unknowns-ss-exp/" },
          { title: "Solving Equations: equation-solving-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/equation-solving-ss-exp/" },
          { title: "Solving Equations: substitution-8-ss-exp-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-by-substitution/substitution-8-ss-exp-2/" },
          { title: "Solving Equations: groups-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/groups-in-equations/" },
          { title: "Solving Equations: isolating-groups-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/isolating-groups-2-ss-exp/" },
          { title: "Solving Equations: solving-with-groups-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/solving-with-groups-ss-exp/" },
          { title: "Solving Equations: distributing-3-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-3-ss-exp/" },
          { title: "Solving Equations: distributing-2-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-equations/distributing-2-ss-exp/" },
          { title: "Solving Equations: factoring-1a", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-1a/" },
          { title: "Solving Equations: factoring-4-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/factoring-4-ss-exp/" },
          { title: "Solving Equations: strategic-moves-ss-exp", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/factoring/strategic-moves-ss-exp/" },
          { title: "Solving Equations: combining-like-terms-new-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-1/" },
          { title: "Solving Equations: combining-like-terms-new-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/combining-like-terms-new-2/" },
          { title: "Solving Equations: shifting-terms-new", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-new/" },
          { title: "Solving Equations: shifting-terms-in-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/shifting-terms-in-equations/" },
          { title: "Solving Equations: bringing-it-together-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together-2/" },
          { title: "Solving Equations: bringing-it-together", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/combining-and-rearranging/bringing-it-together/" },
          { title: "Solving Equations: unbalanced-scales", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/unbalanced-scales/" },
          { title: "Solving Equations: inequalities-both-ways", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/inequalities-both-ways/" },
          { title: "Solving Equations: balancing-scales-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/balancing-scales-3/" },
          { title: "Solving Equations: solutions-to-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/solutions-to-inequalities/" },
          { title: "Solving Equations: graphing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-inequalities-3/" },
          { title: "Solving Equations: graphing-solutions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/inequalities/graphing-solutions-2/" },
          { title: "Solving Equations: solving-inequalities-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-5/" },
          { title: "Solving Equations: solving-inequalities-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-6/" },
          { title: "Solving Equations: or-equal-to", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/or-equal-to/" },
          { title: "Solving Equations: writing-inequalities-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-2/" },
          { title: "Solving Equations: writing-inequalities-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/writing-inequalities-3/" },
          { title: "Solving Equations: solving-inequalities-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/solving-inequalities/solving-inequalities-4/" },
          { title: "Solving Equations: simple-systems", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems/" },
          { title: "Solving Equations: simple-systems-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-2/" },
          { title: "Solving Equations: simple-systems-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-3/" },
          { title: "Solving Equations: simple-systems-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-4/" },
          { title: "Solving Equations: simple-systems-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-6/" },
          { title: "Solving Equations: simple-systems-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/systems-of-equations-1/simple-systems-9/" },
          { title: "Solving Equations: simple-systems-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-5/" },
          { title: "Solving Equations: simple-systems-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-7/" },
          { title: "Solving Equations: simple-systems-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/eliminating-systems/simple-systems-8/" },
          { title: "Solving Equations: reasoning-building-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-1/" },
          { title: "Solving Equations: reasoning-building-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-3/" },
          { title: "Solving Equations: reasoning-building-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-2/" },
          { title: "Solving Equations: reasoning-building-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-7/" },
          { title: "Solving Equations: reasoning-building-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-5/" },
          { title: "Solving Equations: reasoning-building-10", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-by-balancing/reasoning-building-10/" },
          { title: "Solving Equations: consequences", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences/" },
          { title: "Solving Equations: consequences-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-5/" },
          { title: "Solving Equations: strategic-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/strategic-comparisons/" },
          { title: "Solving Equations: consequences-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-3/" },
          { title: "Solving Equations: consequences-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-equations/consequences-4/" },
          { title: "Solving Equations: consequences-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-6/" },
          { title: "Solving Equations: consequences-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-8/" },
          { title: "Solving Equations: consequences-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/consequences-9/" },
          { title: "Solving Equations: packing-reasoning", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning/" },
          { title: "Solving Equations: packing-reasoning-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-groups-of-variables/packing-reasoning-2/" },
          { title: "Solving Equations: consequences-14", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-14/" },
          { title: "Solving Equations: consequences-15", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-15/" },
          { title: "Solving Equations: consequences-12", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-12/" },
          { title: "Solving Equations: consequences-11", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-11/" },
          { title: "Solving Equations: consequences-13", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-13/" },
          { title: "Solving Equations: constraints-in-inequalities", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/constraints-in-inequalities/" },
          { title: "Solving Equations: consequences-16", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/pre-algebra/reasoning-about-variables/consequences-16/" },
        ],
      },
      {
        title: "Graph relationships on the coordinate plane",
        description: "SWBAT represent two changing quantities with variables, write an equation connecting them, and analyze the relationship using tables and graphs.\neg. A taxi charges a fixed ₹50 + ₹20 per km. Can you plot fare vs distance?\nVariables: d = distance (km), C = total cost (₹).\nEquation: C = 20d + 50.",
        activities: [
          { title: "6th Grade - Equations & inequalities (dependent/independent variables)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities" },
          { title: "Visual Algebra: patterns-intro", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-intro/" },
          { title: "Visual Algebra: patterns-intro-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-intro-2/" },
          { title: "Visual Algebra: flower", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/flower/" },
          { title: "Visual Algebra: patterns-sketching", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/patterns/patterns-sketching/" },
          { title: "Visual Algebra: pattern-expression", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/pattern-expression/" },
          { title: "Visual Algebra: pattern-expression-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/pattern-expression-2/" },
          { title: "Visual Algebra: patterns-constant", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant/" },
          { title: "Visual Algebra: patterns-constant-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant-2/" },
          { title: "Visual Algebra: patterns-constant-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/linear-expressions/patterns-constant-5/" },
          { title: "Visual Algebra: patterns-constant-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/patterns-constant-6/" },
          { title: "Visual Algebra: patterns-constant-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/patterns-constant-3/" },
          { title: "Visual Algebra: pattern-mix", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/systems-of-equations/building-linear/pattern-mix/" },
          { title: "Functions: graphing-linear-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-linear-functions/" },
          { title: "Functions: graphing-squared-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-squared-functions/" },
          { title: "Functions: graphing-absolute-value", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-absolute-value/" },
          { title: "Functions: graphing-without-equations", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/graphing-without-equations/" },
          { title: "Functions: interpreting-graphed-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/graphing-functions/interpreting-graphed-functions/" },
          { title: "Functions: annual-profit", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/annual-profit/" },
          { title: "Functions: car-depreciation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/car-depreciation/" },
          { title: "Functions: tax-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/tax-rates/" },
          { title: "Functions: tide-depth", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/introduction-to-functions/applied-functions/tide-depth/" },
          { title: "Plotting & Linear Graphs: points-on-a-line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/points-on-a-line/" },
          { title: "Plotting & Linear Graphs: change-for-one", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/change-for-one/" },
          { title: "Plotting & Linear Graphs: removing-objects", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/removing-objects/" },
          { title: "Plotting & Linear Graphs: decreasing-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/decreasing-functions/" },
          { title: "Plotting & Linear Graphs: nonlinear-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/constant-change/nonlinear-functions/" },
          { title: "Plotting & Linear Graphs: finding-rates-of-change", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/finding-rates-of-change/" },
          { title: "Plotting & Linear Graphs: rates-from-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/rates-from-points/" },
          { title: "Plotting & Linear Graphs: finding-initial-condition", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/finding-initial-condition/" },
          { title: "Plotting & Linear Graphs: using-two-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/making-linear-predictions/using-two-points/" },
          { title: "Plotting & Linear Graphs: vertical-change", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/vertical-change/" },
          { title: "Plotting & Linear Graphs: fractional-slopes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/fractional-slopes/" },
          { title: "Plotting & Linear Graphs: graph-a-line", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/graph-a-line/" },
          { title: "Plotting & Linear Graphs: computing-slopes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/computing-slopes/" },
          { title: "Plotting & Linear Graphs: coordinates-to-slope", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/coordinates-to-slope/" },
          { title: "Plotting & Linear Graphs: slope-complete-computation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/computing-slope/slope-complete-computation/" },
          { title: "Plotting & Linear Graphs: writing-linear-functions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/writing-linear-functions/" },
          { title: "Plotting & Linear Graphs: base-fees", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/base-fees/" },
          { title: "Plotting & Linear Graphs: graphing-linear-functions-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/graphing-linear-functions-2/" },
          { title: "Plotting & Linear Graphs: find-constant-term", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/find-constant-term/" },
          { title: "Plotting & Linear Graphs: find-linear-term-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/find-linear-term-4/" },
          { title: "Plotting & Linear Graphs: interpret-linear-function", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/interpret-linear-function/" },
          { title: "Plotting & Linear Graphs: find-both-terms", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/writing-linear-expressions/find-both-terms/" },
          { title: "Plotting & Linear Graphs: find-b", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/find-b/" },
          { title: "Plotting & Linear Graphs: find-mx", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/find-mx/" },
          { title: "Plotting & Linear Graphs: through-a-point", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/through-a-point/" },
          { title: "Plotting & Linear Graphs: through-2-points", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/through-2-points/" },
          { title: "Plotting & Linear Graphs: point-slope-form", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/point-slope-form/" },
          { title: "Plotting & Linear Graphs: using-point-slope-form", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/using-point-slope-form/" },
          { title: "Plotting & Linear Graphs: equations-in-point-slope-form", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/linear-functions/equations-of-lines/equations-in-point-slope-form/" },
        ],
      },
    ]);

    // Rates
    await insertMajorWithSubsAndActivities("Rates", [
      {
        title: "Understand unit rates",
        description: "SWBAT understand a unit rate a/b as a ratio a:b and use correct “per” language in context.\neg. “3 cups flour for 4 cups sugar” → unit rate is  3/4th cup flour per 1 cup sugar; \nA car travels 150 miles in 3 hours. What is the unit rate in miles per hour?\n",
        activities: [
          { title: "6th Grade - Rates and percentages", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
          { title: "Proportional Relationships: new-color-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/new-color-1/" },
          { title: "Proportional Relationships: scale-up-color", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/scale-up-color/" },
          { title: "Proportional Relationships: make-smaller-color", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/make-smaller-color/" },
          { title: "Proportional Relationships: new-ratio", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/new-ratio/" },
          { title: "Proportional Relationships: scale-up-recipe", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/scale-up-recipe/" },
          { title: "Proportional Relationships: making-batches", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/making-batches/" },
          { title: "Proportional Relationships: finding-batches", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/finding-batches/" },
          { title: "Proportional Relationships: ratio-scale-factor", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/ratio-scale-factor/" },
          { title: "Proportional Relationships: ratio-scale-up-down", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/ratio-scale-up-down/" },
          { title: "Proportional Relationships: scale-down-scale-up-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/scale-down-scale-up-2/" },
          { title: "Proportional Relationships: finding-total", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/finding-total/" },
          { title: "Proportional Relationships: finding-parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/finding-parts/" },
          { title: "Proportional Relationships: how-much-for-one", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/how-much-for-one/" },
          { title: "Proportional Relationships: unit-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/unit-rates/" },
          { title: "Proportional Relationships: two-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/two-rates/" },
          { title: "Proportional Relationships: scale-downup-unitrates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/scale-downup-unitrates/" },
          { title: "Proportional Relationships: compare-mixtures", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/compare-mixtures/" },
          { title: "Proportional Relationships: unit-rate-invoices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/unit-rate-invoices/" },
          { title: "Proportional Relationships: divide-to-find-unit-rate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/divide-to-find-unit-rate/" },
          { title: "Proportional Relationships: comparing-rates-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/comparing-rates-3/" },
          { title: "Proportional Relationships: graph-points-in-proportion", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/graph-points-in-proportion/" },
          { title: "Proportional Relationships: proportions-and-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/proportions-and-lines/" },
          { title: "Proportional Relationships: using-proportion-graphs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/using-proportion-graphs/" },
          { title: "Proportional Relationships: plotting-unit-rate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/plotting-unit-rate/" },
          { title: "Proportional Relationships: graphing-relationships-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/graphing-relationships-2/" },
          { title: "Proportional Relationships: unitrate-to-graph", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/unitrate-to-graph/" },
          { title: "Proportional Relationships: write-equation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/write-equation/" },
          { title: "Proportional Relationships: equation-unknown-c", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/equation-unknown-c/" },
          { title: "Proportional Relationships: graphing-equations-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/graphing-equations-3/" },
          { title: "Proportional Relationships: graphing-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/graphing-comparisons/" },
          { title: "Variables & Expressions: equivalent-ratios", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/equivalent-ratios/" },
          { title: "Variables & Expressions: unit-prices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/unit-prices/" },
          { title: "Variables & Expressions: using-unit-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates/" },
          { title: "Variables & Expressions: using-unit-rates-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates-2/" },
        ],
      },
      {
        title: "Rate word problems",
        description: "SWBAT solve word problems involving unit rates (eg. unit pricing, constant speed, work done per hr)\nUnit pricing: $18 for 3 pounds apples → $6 per pound; which is better, $6/lb or $25 for 5 lb?\nSpeed: 240 km in 3 hours → 80 km per hour; at that rate, distance in 5 hours = 80×5=400km",
        activities: [
          { title: "6th Grade - Rates and percentages", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
          { title: "Proportional Relationships: new-color-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/new-color-1/" },
          { title: "Proportional Relationships: scale-up-color", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/scale-up-color/" },
          { title: "Proportional Relationships: make-smaller-color", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/make-smaller-color/" },
          { title: "Proportional Relationships: new-ratio", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/setting-up-ratios/new-ratio/" },
          { title: "Proportional Relationships: scale-up-recipe", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/scale-up-recipe/" },
          { title: "Proportional Relationships: making-batches", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/making-batches/" },
          { title: "Proportional Relationships: finding-batches", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/finding-batches/" },
          { title: "Proportional Relationships: ratio-scale-factor", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/equivalent-ratios/ratio-scale-factor/" },
          { title: "Proportional Relationships: ratio-scale-up-down", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/ratio-scale-up-down/" },
          { title: "Proportional Relationships: scale-down-scale-up-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/scale-down-scale-up-2/" },
          { title: "Proportional Relationships: finding-total", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/finding-total/" },
          { title: "Proportional Relationships: finding-parts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/scaling-ratios/finding-parts/" },
          { title: "Proportional Relationships: how-much-for-one", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/how-much-for-one/" },
          { title: "Proportional Relationships: unit-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/unit-rates/" },
          { title: "Proportional Relationships: two-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/two-rates/" },
          { title: "Proportional Relationships: scale-downup-unitrates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/scale-downup-unitrates/" },
          { title: "Proportional Relationships: compare-mixtures", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/unit-rates/compare-mixtures/" },
          { title: "Proportional Relationships: unit-rate-invoices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/unit-rate-invoices/" },
          { title: "Proportional Relationships: divide-to-find-unit-rate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/divide-to-find-unit-rate/" },
          { title: "Proportional Relationships: comparing-rates-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/proportional-relationships/comparing-rates-3/" },
          { title: "Proportional Relationships: graph-points-in-proportion", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/graph-points-in-proportion/" },
          { title: "Proportional Relationships: proportions-and-lines", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/proportions-and-lines/" },
          { title: "Proportional Relationships: using-proportion-graphs", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/using-proportion-graphs/" },
          { title: "Proportional Relationships: plotting-unit-rate", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/plotting-unit-rate/" },
          { title: "Proportional Relationships: graphing-relationships-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/graphing-relationships-2/" },
          { title: "Proportional Relationships: unitrate-to-graph", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/graphing-prs/unitrate-to-graph/" },
          { title: "Proportional Relationships: write-equation", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/write-equation/" },
          { title: "Proportional Relationships: equation-unknown-c", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/equation-unknown-c/" },
          { title: "Proportional Relationships: graphing-equations-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/graphing-equations-3/" },
          { title: "Proportional Relationships: graphing-comparisons", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/proportional-relationships/pr-equations/graphing-comparisons/" },
          { title: "Variables & Expressions: equivalent-ratios", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/equivalent-ratios/" },
          { title: "Variables & Expressions: unit-prices", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/unit-prices/" },
          { title: "Variables & Expressions: using-unit-rates", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates/" },
          { title: "Variables & Expressions: using-unit-rates-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/pricing-and-proportions/using-unit-rates-2/" },
        ],
      },
    ]);

    // Percentage
    await insertMajorWithSubsAndActivities("Percentage", [
      {
        title: "What is a percentage?",
        description: "SWBAT understand a percent as a rate per 100 and as a fraction and decimal.\neg. 25% means 25 out of 100, so 25%=25/100=1/4=0.25",
        activities: [
          { title: "6th Grade - Rates and percentages (percentages section)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
          { title: "Arithmetic Thinking: intro-to-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/intro-to-percentages/" },
          { title: "Arithmetic Thinking: calculating-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/calculating-percentages/" },
          { title: "Arithmetic Thinking: battery-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/battery-percentages/" },
          { title: "Arithmetic Thinking: fraction-equivalence-blanks", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-using-percentages/fraction-equivalence-blanks/" },
        ],
      },
      {
        title: "Convert between fractions, decimals, and percents",
        description: "SWBAT convert a number from fraction to percent and decimal, and vice versa.\neg. 3/5=0.6=60%\n0.08=8%",
        activities: [
          { title: "6th Grade - Rates and percentages (percentages section)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
          { title: "Arithmetic Thinking: tenths-equivalence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/tenths-equivalence/" },
          { title: "Arithmetic Thinking: hundredths-equivalence", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/hundredths-equivalence/" },
          { title: "Arithmetic Thinking: finding-the-percentage", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/finding-the-percentage/" },
          { title: "Arithmetic Thinking: converting-to-decimals", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/converting-to-decimals/" },
          { title: "Arithmetic Thinking: calculating-the-percentage", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-computing-percentages/calculating-the-percentage/" },
        ],
      },
      {
        title: "Find a percentage of a number",
        description: "SWBAT Find a given percent of a number, using models or equations.\neg. Find  30% of 50\nA class of 40 students: 25% are absent, how many are absent",
        activities: [
          { title: "6th Grade - Rates and percentages (percent problems)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
          { title: "Arithmetic Thinking: percent-decrease", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percent-decrease/" },
          { title: "Arithmetic Thinking: percentage-decrease-blanks", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percentage-decrease-blanks/" },
          { title: "Arithmetic Thinking: finding-the-original-price", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/finding-the-original-price/" },
          { title: "Arithmetic Thinking: reversing-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/reversing-percentages/" },
          { title: "Variables & Expressions: working-with-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages/" },
          { title: "Variables & Expressions: percent-discount", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/percent-discount/" },
          { title: "Variables & Expressions: working-with-percentages-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages-2/" },
        ],
      },
      {
        title: "Find what percent one number is of another",
        description: "SWBAT given two quantities, find what percent one is of the other.\neg. What percent of 80 is 20?\n20/80=0.25=25%\nA student scores 18 out of 24. How much % did he score?\n18/24=0.75=75%",
        activities: [
          { title: "6th Grade - Rates and percentages (percent problems)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
          { title: "Variables & Expressions: working-with-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages/" },
          { title: "Variables & Expressions: percent-discount", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/percent-discount/" },
          { title: "Variables & Expressions: working-with-percentages-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages-2/" },
        ],
      },
      {
        title: "Percent increase, decrease, and discounts",
        description: "SWBAT solve real-world problems involving percent increase, decrease, discounts, tips, and taxes.\neg. Discount: A shirt costs $200 with 20% off. How much is the final cost?\nIncrease: A population grows from 1,000 to 1,200. How much % has it grown?",
        activities: [
          { title: "6th Grade - Rates and percentages (percent word problems)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/x0267d782:cc-6th-rates-and-percentages" },
          { title: "Arithmetic Thinking: percent-increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/percent-increase/" },
          { title: "Arithmetic Thinking: price-increase", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/price-increase/" },
          { title: "Arithmetic Thinking: percent-increase-blanks", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-increase/percent-increase-blanks/" },
          { title: "Arithmetic Thinking: percent-decrease", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percent-decrease/" },
          { title: "Arithmetic Thinking: percentage-decrease-blanks", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/percentage-decrease-blanks/" },
          { title: "Arithmetic Thinking: finding-the-original-price", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/finding-the-original-price/" },
          { title: "Arithmetic Thinking: reversing-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-percent-decrease/reversing-percentages/" },
          { title: "Arithmetic Thinking: compound-changes-receipts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-compound-changes/compound-changes-receipts/" },
          { title: "Arithmetic Thinking: compound-calculations-receipts", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-compound-changes/compound-calculations-receipts/" },
          { title: "Arithmetic Thinking: splitting-percent-changes", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-compound-changes/splitting-percent-changes/" },
          { title: "Arithmetic Thinking: compound-calculations-bars", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-compound-changes/compound-calculations-bars/" },
          { title: "Arithmetic Thinking: exponential-growth-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/math-fundamentals/percentages-compound-changes/exponential-growth-percentages/" },
          { title: "Variables & Expressions: working-with-percentages", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages/" },
          { title: "Variables & Expressions: percent-discount", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/percent-discount/" },
          { title: "Variables & Expressions: working-with-percentages-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/using-variables/discounts-and-percentages/working-with-percentages-2/" },
        ],
      },
    ]);

    // Data
    await insertMajorWithSubsAndActivities("Data", [
      {
        title: "Read and interpret line graphs",
        description: "SWBAT read and interpret a line graph",
        activities: [
          { title: "Line plots", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/line-plots" },
          { title: "Everyday Statistics: ds-mean-0", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-mean-0/" },
          { title: "Everyday Statistics: edv-mean-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/edv-mean-7/" },
          { title: "Everyday Statistics: ds-distributions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-distributions/" },
          { title: "Everyday Statistics: edv-mean-groups-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/edv-mean-groups-7/" },
          { title: "Everyday Statistics: ds-balance-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-balance-5/" },
          { title: "Everyday Statistics: ds-balance-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/ds-balance-4/" },
          { title: "Everyday Statistics: edv-mean-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/edv-mean-6/" },
          { title: "Everyday Statistics: ds-balance-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/ds-balance-3/" },
          { title: "Everyday Statistics: edv-mean-groups-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/edv-mean-groups-8/" },
          { title: "Everyday Statistics: edv-mean-groups-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups-9/" },
          { title: "Everyday Statistics: edv-mean-groups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups/" },
          { title: "Everyday Statistics: edv-mean-groups-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups-3/" },
          { title: "Everyday Statistics: ds-adding-lists", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/ds-adding-lists/" },
          { title: "Everyday Statistics: ds-median-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-1/" },
          { title: "Everyday Statistics: ds-median-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-2/" },
          { title: "Everyday Statistics: ds-median-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-3/" },
          { title: "Everyday Statistics: ds-median-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-4/" },
          { title: "Everyday Statistics: ds-median-lists", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-lists/" },
          { title: "Everyday Statistics: ds-median-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-median-5/" },
          { title: "Everyday Statistics: ds-median-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-median-6/" },
          { title: "Everyday Statistics: ds-mode", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-mode/" },
          { title: "Everyday Statistics: ds-quartiles-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-quartiles-1/" },
          { title: "Everyday Statistics: ds-quartiles-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-quartiles-2/" },
          { title: "Everyday Statistics: ds-quartiles-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-3/" },
          { title: "Everyday Statistics: ds-quartiles-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-4/" },
          { title: "Everyday Statistics: ds-median-lists-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-median-lists-2/" },
          { title: "Everyday Statistics: ds-quartiles-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-6/" },
          { title: "Everyday Statistics: adding-whiskers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/adding-whiskers/" },
          { title: "Everyday Statistics: matching-boxplots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/matching-boxplots/" },
          { title: "Everyday Statistics: the-range", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/the-range/" },
          { title: "Everyday Statistics: comparing-distribution", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/comparing-distribution/" },
          { title: "Everyday Statistics: outliers-balance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/outliers-balance/" },
          { title: "Everyday Statistics: skewing-the-mean", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/skewing-the-mean/" },
          { title: "Everyday Statistics: defining-outliers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/defining-outliers/" },
          { title: "Everyday Statistics: identifying-outliers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/identifying-outliers/" },
          { title: "Everyday Statistics: outside-the-whiskers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/outside-the-whiskers/" },
        ],
      },
      {
        title: "Create line graphs",
        description: "SWBAT plot a line graph",
        activities: [
          { title: "Line plots", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/line-plots" },
          { title: "Everyday Statistics: ds-mean-0", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-mean-0/" },
          { title: "Everyday Statistics: edv-mean-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/edv-mean-7/" },
          { title: "Everyday Statistics: ds-distributions", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-distributions/" },
          { title: "Everyday Statistics: edv-mean-groups-7", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/edv-mean-groups-7/" },
          { title: "Everyday Statistics: ds-balance-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/means/ds-balance-5/" },
          { title: "Everyday Statistics: ds-balance-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/ds-balance-4/" },
          { title: "Everyday Statistics: edv-mean-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/edv-mean-6/" },
          { title: "Everyday Statistics: ds-balance-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/ds-balance-3/" },
          { title: "Everyday Statistics: edv-mean-groups-8", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-means/edv-mean-groups-8/" },
          { title: "Everyday Statistics: edv-mean-groups-9", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups-9/" },
          { title: "Everyday Statistics: edv-mean-groups", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups/" },
          { title: "Everyday Statistics: edv-mean-groups-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/edv-mean-groups-3/" },
          { title: "Everyday Statistics: ds-adding-lists", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/adding-data/ds-adding-lists/" },
          { title: "Everyday Statistics: ds-median-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-1/" },
          { title: "Everyday Statistics: ds-median-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-2/" },
          { title: "Everyday Statistics: ds-median-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-3/" },
          { title: "Everyday Statistics: ds-median-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-4/" },
          { title: "Everyday Statistics: ds-median-lists", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/median/ds-median-lists/" },
          { title: "Everyday Statistics: ds-median-5", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-median-5/" },
          { title: "Everyday Statistics: ds-median-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-median-6/" },
          { title: "Everyday Statistics: ds-mode", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-mode/" },
          { title: "Everyday Statistics: ds-quartiles-1", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-quartiles-1/" },
          { title: "Everyday Statistics: ds-quartiles-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/more-medians/ds-quartiles-2/" },
          { title: "Everyday Statistics: ds-quartiles-3", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-3/" },
          { title: "Everyday Statistics: ds-quartiles-4", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-4/" },
          { title: "Everyday Statistics: ds-median-lists-2", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-median-lists-2/" },
          { title: "Everyday Statistics: ds-quartiles-6", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/quartiles/ds-quartiles-6/" },
          { title: "Everyday Statistics: adding-whiskers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/adding-whiskers/" },
          { title: "Everyday Statistics: matching-boxplots", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/matching-boxplots/" },
          { title: "Everyday Statistics: the-range", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/the-range/" },
          { title: "Everyday Statistics: comparing-distribution", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/whiskers/comparing-distribution/" },
          { title: "Everyday Statistics: outliers-balance", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/outliers-balance/" },
          { title: "Everyday Statistics: skewing-the-mean", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/skewing-the-mean/" },
          { title: "Everyday Statistics: defining-outliers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/defining-outliers/" },
          { title: "Everyday Statistics: identifying-outliers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/identifying-outliers/" },
          { title: "Everyday Statistics: outside-the-whiskers", type: "exercise", platform: "Brilliant", url: "https://brilliant.org/courses/basic-math/outliers/outside-the-whiskers/" },
        ],
      },
    ]);

    return {
      success: true,
      message: `Deleted ${deletedMajors} majors, ${deletedLearning} learning objectives, ${deletedActivities} activities, ${deletedProgress} progress, ${deletedStudentObj} student objectives, ${deletedStudentMajor} student major objectives. Created ${createdMajors} majors, ${createdLearning} learning objectives, ${createdActivities} activities.`,
    };
  },
});

/**
 * Seed PYP Year 2 Math objectives (gap-filling foundational content).
 * Creates 8 major objectives, 53 learning objectives, and activities
 * with Khan Academy links. Only deletes/replaces PYP Y2 curriculum data.
 *
 * Run: npx convex run seed:seedPypMathFromPlaylist
 */
export const seedPypMathFromPlaylist = mutation({
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

    // ========== STEP 1: DELETE ONLY PYP Y2 OBJECTIVES ==========

    const existingMajors = await ctx.db
      .query("majorObjectives")
      .withIndex("by_domain", (q) => q.eq("domainId", mathDomain._id))
      .collect();

    const pypMajors = existingMajors.filter((m: any) => m.curriculum === "PYP Y2");

    let deletedProgress = 0;
    let deletedActivities = 0;
    let deletedStudentObj = 0;
    let deletedStudentMajor = 0;
    let deletedLearning = 0;
    let deletedMajors = 0;

    for (const major of pypMajors) {
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

    // ========== STEP 2: INSERT PYP Y2 CURRICULUM ==========

    let timestamp = Date.now();
    let createdMajors = 0;
    let createdLearning = 0;
    let createdActivities = 0;

    const insertPypMajor = async (
      majorTitle: string,
      subs: Array<{
        title: string;
        description: string;
        activities: Array<{
          title: string;
          type: "video" | "exercise";
          platform: string;
          url: string;
        }>;
      }>
    ) => {
      const majorId = await ctx.db.insert("majorObjectives", {
        domainId: mathDomain._id,
        title: majorTitle,
        description: majorTitle,
        curriculum: "PYP Y2",
        difficulty: "beginner",
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
          difficulty: "beginner",
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

    // Number Crunching (Arithmetic - 12 LOs)
    await insertPypMajor("Number Crunching", [
      {
        title: "SWBAT read and write multi-digit numbers in standard, word, and expanded form.",
        description: "SWBAT read and write multi-digit numbers in standard, word, and expanded form.",
        activities: [
          { title: "Khan Academy: 4th Grade - Place value", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-place-value-and-rounding" },
        ],
      },
      {
        title: "SWBAT explain that each digit is 10\u00d7 the value of the digit to its right and 1/10 of the digit to its left.",
        description: "SWBAT explain that each digit is 10\u00d7 the value of the digit to its right and 1/10 of the digit to its left.",
        activities: [
          { title: "Khan Academy: Powers of ten", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/powers-of-ten" },
        ],
      },
      {
        title: "SWBAT Add and Subtract multi-digit numbers using algo",
        description: "SWBAT Add and Subtract multi-digit numbers using algo",
        activities: [
          { title: "Khan Academy: Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "SWBAT do efficient Add & Sub by using properties like: commutative, associative, breaking nos, multiples of 10, Counting up/down etc.",
        description: "SWBAT do efficient Add & Sub by using properties like: commutative, associative, breaking nos, multiples of 10, Counting up/down etc.",
        activities: [
          { title: "Khan Academy: 4th Grade - Place value and rounding (mental math strategies)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-place-value-and-rounding" },
        ],
      },
      {
        title: "SWBAT multiply up to 4-digit \u00d7 1-digit using algo, area model, etc.",
        description: "SWBAT multiply up to 4-digit \u00d7 1-digit using algo, area model, etc.",
        activities: [
          { title: "Khan Academy: Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "SWBAT to do efficient multiplication by using properties like: doubling, skip counting, associative, distributive",
        description: "SWBAT to do efficient multiplication by using properties like: doubling, skip counting, associative, distributive",
        activities: [
          { title: "Khan Academy: 4th Grade - Factors, multiples and patterns", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns" },
        ],
      },
      {
        title: "SWBAT divide up to 4-digit \u00f7 1-digit, finding quotients and remainders using place value.",
        description: "SWBAT divide up to 4-digit \u00f7 1-digit, finding quotients and remainders using place value.",
        activities: [
          { title: "Khan Academy: Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "SWBAT Multi-step word problem of add/sub/mul/div, using equations with Unknowns.",
        description: "SWBAT Multi-step word problem of add/sub/mul/div, using equations with Unknowns.",
        activities: [
          { title: "Khan Academy: Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "SWBAT multiply two 2-digit numbers using place-value, and algo method.",
        description: "SWBAT multiply two 2-digit numbers using place-value, and algo method.",
        activities: [
          { title: "Khan Academy: Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "SWBAT use BODMAS/PEDMAS to do order of operations.",
        description: "SWBAT use BODMAS/PEDMAS to do order of operations.",
        activities: [
          { title: "Khan Academy: Algebraic thinking", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking" },
        ],
      },
      {
        title: "SWBAT verify calculations using inverse operations (mul \u2194 div; add \u2194 sub)",
        description: "SWBAT verify calculations using inverse operations (mul \u2194 div; add \u2194 sub)",
        activities: [
          { title: "Khan Academy: Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
      {
        title: "SWBAT Verify calculation using estimation and rounding.",
        description: "SWBAT Verify calculation using estimation and rounding.",
        activities: [
          { title: "Khan Academy: Multi-digit multiplication and division", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division" },
        ],
      },
    ]);

    // Fraction Adventures (Fractions - 14 LOs)
    await insertPypMajor("Fraction Adventures", [
      {
        title: "SWBAT relate fractions to real objects: (x/y means y \u201cequal\u201d pieces and then take x out of it.)",
        description: "SWBAT relate fractions to real objects: (x/y means y \u201cequal\u201d pieces and then take x out of it.)",
        activities: [
          { title: "Khan Academy: 3rd Grade - Understand fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-fractions" },
        ],
      },
      {
        title: "SWBAT mark fractions on a number line.",
        description: "SWBAT mark fractions on a number line.",
        activities: [
          { title: "Khan Academy: 3rd Grade - Understand fractions (fractions on the number line)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-fractions" },
        ],
      },
      {
        title: "SWBAT compare fractions using models and the number line.",
        description: "SWBAT compare fractions using models and the number line.",
        activities: [
          { title: "Khan Academy: 4th Grade - Equivalent fractions and comparing fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" },
        ],
      },
      {
        title: "SWBAT find equivalent fraction of a given fraction.",
        description: "SWBAT find equivalent fraction of a given fraction.",
        activities: [
          { title: "Khan Academy: 4th Grade - Equivalent fractions and comparing fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" },
        ],
      },
      {
        title: "SWBAT Add and Subtract like fractions.",
        description: "SWBAT Add and Subtract like fractions.",
        activities: [
          { title: "Khan Academy: Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
        ],
      },
      {
        title: "SWBAT Multiply a fraction by a whole number and another fraction.",
        description: "SWBAT Multiply a fraction by a whole number and another fraction.",
        activities: [
          { title: "Khan Academy: Multiply fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-multiply-fractions" },
        ],
      },
      {
        title: "SWBAT Simplify a given fraction.",
        description: "SWBAT Simplify a given fraction.",
        activities: [
          { title: "Khan Academy: 4th Grade - Equivalent fractions and comparing fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions" },
        ],
      },
      {
        title: "SWBAT Convert mixed to improper fraction",
        description: "SWBAT Convert mixed to improper fraction",
        activities: [
          { title: "Khan Academy: Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
        ],
      },
      {
        title: "SWBAT Convert improper to mixed fraction.",
        description: "SWBAT Convert improper to mixed fraction.",
        activities: [
          { title: "Khan Academy: Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
        ],
      },
      {
        title: "SWBAT Compare unlike fractions",
        description: "SWBAT Compare unlike fractions",
        activities: [
          { title: "Khan Academy: Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
        ],
      },
      {
        title: "SWBAT express a fraction (a/b, where a > 1) as a sum of unit fractions (1/b).",
        description: "SWBAT express a fraction (a/b, where a > 1) as a sum of unit fractions (1/b).",
        activities: [
          { title: "Khan Academy: 4th Grade - Add and subtract fractions (decomposing fractions)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2" },
        ],
      },
      {
        title: "SWBAT Add and Sub unlike fractions",
        description: "SWBAT Add and Sub unlike fractions",
        activities: [
          { title: "Khan Academy: Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
        ],
      },
      {
        title: "SWBAT Add and Sub mixed fractions",
        description: "SWBAT Add and Sub mixed fractions",
        activities: [
          { title: "Khan Academy: Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
        ],
      },
      {
        title: "SWBAT solve word problems involving add and sub of fractions (Unlike and mixed)",
        description: "SWBAT solve word problems involving add and sub of fractions (Unlike and mixed)",
        activities: [
          { title: "Khan Academy: Add and subtract fractions", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3" },
        ],
      },
    ]);

    // Decimal Explorers (Decimal - 9 LOs)
    await insertPypMajor("Decimal Explorers", [
      {
        title: "SWBAT show decimals up to hundredth place on a number line.",
        description: "SWBAT show decimals up to hundredth place on a number line.",
        activities: [
          { title: "Khan Academy: Decimal place value", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" },
        ],
      },
      {
        title: "SWBAT compare and order decimals upto hundredths place",
        description: "SWBAT compare and order decimals upto hundredths place",
        activities: [
          { title: "Khan Academy: Decimal place value", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" },
        ],
      },
      {
        title: "SWBAT convert fractions with denominator 100 to decimals and vice versa",
        description: "SWBAT convert fractions with denominator 100 to decimals and vice versa",
        activities: [
          { title: "Khan Academy: Decimal place value", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" },
        ],
      },
      {
        title: "SWBAT convert fractions to decimal notation.",
        description: "SWBAT convert fractions to decimal notation.",
        activities: [
          { title: "Khan Academy: Decimal place value", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals" },
        ],
      },
      {
        title: "SWBAT add a decimal with whole no. and another decimal.",
        description: "SWBAT add a decimal with whole no. and another decimal.",
        activities: [
          { title: "Khan Academy: Add decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-addition-and-subtraction-3" },
        ],
      },
      {
        title: "SWBAT sub a decimal with whole no. and another decimal.",
        description: "SWBAT sub a decimal with whole no. and another decimal.",
        activities: [
          { title: "Khan Academy: Subtract decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/subtract-decimals" },
        ],
      },
      {
        title: "SWBAT multiply a decimal with whole no.",
        description: "SWBAT multiply a decimal with whole no.",
        activities: [
          { title: "Khan Academy: Multiply decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-multiplication-and-division-3" },
        ],
      },
      {
        title: "SWBAT divide 2 whole numbers to get a decimal quotient.",
        description: "SWBAT divide 2 whole numbers to get a decimal quotient.",
        activities: [
          { title: "Khan Academy: Divide decimals", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/divide-decimals" },
        ],
      },
      {
        title: "SWBAT solve multi-digit computation problems that too word problems involving decimals.",
        description: "SWBAT solve multi-digit computation problems that too word problems involving decimals.",
        activities: [
          { title: "Khan Academy: 5th Grade - Spread across Add/Sub/Mul/Div decimals units (U2, U3, U8, U9)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-addition-and-subtraction-3" },
        ],
      },
    ]);

    // Measuring the World (Measurement - 8 LOs)
    await insertPypMajor("Measuring the World", [
      {
        title: "SWBAT convert common units (km\u2013m\u2013cm; kg\u2013g; l\u2013ml; hr\u2013min\u2013sec)",
        description: "SWBAT convert common units (km\u2013m\u2013cm; kg\u2013g; l\u2013ml; hr\u2013min\u2013sec)",
        activities: [
          { title: "Khan Academy: Converting units of measure", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-measurement-and-data-3" },
        ],
      },
      {
        title: "SWBAT solve real-world problems about distance, time, volume, mass, and money.",
        description: "SWBAT solve real-world problems about distance, time, volume, mass, and money.",
        activities: [
          { title: "Khan Academy: 4th Grade - Units of measurement", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-measurement-and-data-2" },
        ],
      },
      {
        title: "SWBAT calculate area for rectangles and composite rectangles",
        description: "SWBAT calculate area for rectangles and composite rectangles",
        activities: [
          { title: "Khan Academy: 4th Grade - Area and perimeter", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/area-perimeter" },
        ],
      },
      {
        title: "SWBAT calculate perimeter for triangles, rectangles, and composite shapes",
        description: "SWBAT calculate perimeter for triangles, rectangles, and composite shapes",
        activities: [
          { title: "Khan Academy: 4th Grade - Area and perimeter", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/area-perimeter" },
        ],
      },
      {
        title: "SWBAT solve word problems involving area and perimeter of rectangles.",
        description: "SWBAT solve word problems involving area and perimeter of rectangles.",
        activities: [
          { title: "Khan Academy: 4th Grade - Area and perimeter", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/area-perimeter" },
        ],
      },
      {
        title: "SWBAT understand and calculate volume of cube and rectangular prism.",
        description: "SWBAT understand and calculate volume of cube and rectangular prism.",
        activities: [
          { title: "Khan Academy: Volume", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-volume" },
        ],
      },
      {
        title: "SWBAT compute the surface area of rectangular prism/composite figures",
        description: "SWBAT compute the surface area of rectangular prism/composite figures",
        activities: [
          { title: "Khan Academy: 6th Grade - Geometry (surface area section)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic" },
        ],
      },
      {
        title: "SWBAT solve word problems of surface area and volume.",
        description: "SWBAT solve word problems of surface area and volume.",
        activities: [
          { title: "Khan Academy: Volume", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-volume" },
        ],
      },
    ]);

    // Angle Detectives (Geometry Angles - 4 LOs)
    await insertPypMajor("Angle Detectives", [
      {
        title: "SWBAT Identify common angles like 30, 45, 60, 90, right, acute, and obtuse.",
        description: "SWBAT Identify common angles like 30, 45, 60, 90, right, acute, and obtuse.",
        activities: [
          { title: "Khan Academy: 4th Grade - Measuring angles", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2" },
        ],
      },
      {
        title: "SWBAT measure and sketch angles with protractor",
        description: "SWBAT measure and sketch angles with protractor",
        activities: [
          { title: "Khan Academy: 4th Grade - Measuring angles", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2" },
        ],
      },
      {
        title: "SWBAT calculate complementary and supplementary angles.",
        description: "SWBAT calculate complementary and supplementary angles.",
        activities: [
          { title: "Khan Academy: 4th Grade - Measuring angles (angles in circles section)", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2" },
        ],
      },
      {
        title: "SWBAT solve word problems involving angles",
        description: "SWBAT solve word problems involving angles",
        activities: [
          { title: "Khan Academy: 4th Grade - Measuring angles", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2" },
        ],
      },
    ]);

    // Shape Safari (2D Shapes - 3 LOs)
    await insertPypMajor("Shape Safari", [
      {
        title: "SWBAT identify and classify triangles (Right, isosceles, equilateral)",
        description: "SWBAT identify and classify triangles (Right, isosceles, equilateral)",
        activities: [
          { title: "Khan Academy: Properties of shapes", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes" },
        ],
      },
      {
        title: "SWBAT identify and differentiate common 2D figures by angles, side-lengths, parallel lines.",
        description: "SWBAT identify and differentiate common 2D figures by angles, side-lengths, parallel lines.",
        activities: [
          { title: "Khan Academy: Properties of shapes", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes" },
        ],
      },
      {
        title: "SWBAT recognize lines of symmetry in 2D figures.",
        description: "SWBAT recognize lines of symmetry in 2D figures.",
        activities: [
          { title: "Khan Academy: Properties of shapes", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes" },
        ],
      },
    ]);

    // Map Makers (Coordinate Geometry - 2 LOs)
    await insertPypMajor("Map Makers", [
      {
        title: "SWBAT plot points, Lines, and shapes on the coordinate plane.",
        description: "SWBAT plot points, Lines, and shapes on the coordinate plane.",
        activities: [
          { title: "Khan Academy: Coordinate plane", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-geometry-3" },
        ],
      },
      {
        title: "SWBAT solve problems, like distances between 2 points their midpoints.",
        description: "SWBAT solve problems, like distances between 2 points their midpoints.",
        activities: [
          { title: "Khan Academy: Coordinate plane", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-geometry-3" },
        ],
      },
    ]);

    // Data Detectives (Data - 1 LO)
    await insertPypMajor("Data Detectives", [
      {
        title: "SWBAT interpret and plot data in various graphs.",
        description: "SWBAT interpret and plot data in various graphs.",
        activities: [
          { title: "Khan Academy: Line plots", type: "video", platform: "Khan Academy", url: "https://www.khanacademy.org/math/cc-fifth-grade-math/line-plots" },
        ],
      },
    ]);

    return {
      success: true,
      message: `PYP Y2: Deleted ${deletedMajors} majors, ${deletedLearning} LOs, ${deletedActivities} activities. Created ${createdMajors} majors, ${createdLearning} LOs, ${createdActivities} activities.`,
    };
  },
});
