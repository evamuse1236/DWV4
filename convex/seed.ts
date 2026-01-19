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
