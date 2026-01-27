/**
 * Mock database utilities for testing Convex functions.
 *
 * These helpers simulate Convex's `ctx.db` methods (get, insert, patch, delete, query)
 * so we can test mutation/query handlers in isolation without hitting a real database.
 */

import type { Id } from "../../../convex/_generated/dataModel";

// Type for our in-memory "database" - a simple record of ID to document
type MockDocument = {
  _id: string;
  _creationTime?: number;
  [key: string]: unknown;
};

type MockStore = Map<string, MockDocument>;

// Helper to generate fake Convex IDs
let idCounter = 0;
export function createMockId<T extends string>(tableName: T): Id<T> {
  idCounter++;
  // Convex IDs look like: "j57...xyz" - we'll use a simple format for testing
  return `mock_${tableName}_${idCounter}` as Id<T>;
}

// Reset the ID counter between tests
export function resetMockIdCounter(): void {
  idCounter = 0;
}

/**
 * Creates a mock query builder that mimics Convex's fluent query API.
 *
 * Example usage in a handler:
 *   ctx.db.query("goals").withIndex("by_user", q => q.eq("userId", "123")).collect()
 */
function createMockQueryBuilder(store: MockStore, tableName: string) {
  // Get all documents for this "table" (IDs starting with mock_tableName_)
  const getTableDocs = () => {
    const docs: MockDocument[] = [];
    for (const [id, doc] of store.entries()) {
      if (id.startsWith(`mock_${tableName}_`)) {
        docs.push(doc);
      }
    }
    return docs;
  };

  let filters: Array<(doc: MockDocument) => boolean> = [];

  const builder = {
    // withIndex just returns the builder - filtering happens via the callback
    withIndex: (
      _indexName: string,
      filterFn?: (q: {
        eq: (field: string, value: unknown) => { eq: (field: string, value: unknown) => void };
      }) => void
    ) => {
      if (filterFn) {
        // Capture the equality checks from the filter function
        const conditions: Array<{ field: string; value: unknown }> = [];
        const q = {
          eq: (field: string, value: unknown) => {
            conditions.push({ field, value });
            return q; // Allow chaining like q.eq("userId", x).eq("sprintId", y)
          },
        };
        filterFn(q);

        // Add a filter for each condition
        for (const cond of conditions) {
          filters.push((doc) => doc[cond.field] === cond.value);
        }
      }
      return builder;
    },

    // Simple filter function
    filter: (filterFn: (q: { eq: (a: { field: (name: string) => unknown }, b: unknown) => boolean; and: (...args: boolean[]) => boolean; field: (name: string) => unknown }) => boolean) => {
      // This is a simplified implementation - we'll evaluate the filter
      const q = {
        field: (name: string) => ({ __fieldName: name }),
        eq: (a: unknown, b: unknown) => {
          // Handle both field(name) comparison and direct value comparison
          if (typeof a === 'object' && a !== null && '__fieldName' in a) {
            return { __eq: true, field: (a as { __fieldName: string }).__fieldName, value: b };
          }
          return a === b;
        },
        and: (...conditions: unknown[]) => {
          return { __and: true, conditions };
        },
      };

      // Store the filter predicate
      filters.push((doc) => {
        const result = filterFn(q as never);
        if (typeof result === 'object' && result !== null) {
          if ('__eq' in result) {
            return doc[(result as { field: string }).field] === (result as { value: unknown }).value;
          }
          if ('__and' in result) {
            const andResult = result as { conditions: unknown[] };
            return andResult.conditions.every((cond) => {
              if (typeof cond === 'object' && cond !== null && '__eq' in cond) {
                return doc[(cond as { field: string }).field] === (cond as { value: unknown }).value;
              }
              return Boolean(cond);
            });
          }
        }
        return Boolean(result);
      });
      return builder;
    },

    // Order the results (simplified - just returns builder)
    order: (_direction: "asc" | "desc") => {
      return builder;
    },

    // Collect all matching documents
    collect: async (): Promise<MockDocument[]> => {
      let docs = getTableDocs();
      for (const filter of filters) {
        docs = docs.filter(filter);
      }
      return docs;
    },

    // Get the first matching document
    first: async (): Promise<MockDocument | null> => {
      const docs = await builder.collect();
      return docs[0] || null;
    },

    // Get exactly one matching document (throws if multiple found)
    unique: async (): Promise<MockDocument | null> => {
      const docs = await builder.collect();
      if (docs.length > 1) {
        throw new Error(`Query returned ${docs.length} documents, expected 0 or 1`);
      }
      return docs[0] || null;
    },
  };

  return builder;
}

/**
 * Creates a mock Convex database context.
 *
 * This simulates ctx.db with:
 *   - get(id): Get a document by ID
 *   - insert(table, doc): Insert a new document
 *   - patch(id, updates): Update a document
 *   - delete(id): Delete a document
 *   - query(table): Start a query builder
 */
export function createMockDb() {
  const store: MockStore = new Map();

  const db = {
    // Get a document by its ID
    get: async (id: string): Promise<MockDocument | null> => {
      return store.get(id) || null;
    },

    // Insert a new document
    insert: async (tableName: string, document: Record<string, unknown>): Promise<string> => {
      const id = createMockId(tableName);
      const doc: MockDocument = {
        _id: id,
        _creationTime: Date.now(),
        ...document,
      };
      store.set(id, doc);
      return id;
    },

    // Update a document (merge updates into existing)
    patch: async (id: string, updates: Record<string, unknown>): Promise<void> => {
      const existing = store.get(id);
      if (existing) {
        store.set(id, { ...existing, ...updates });
      }
    },

    // Delete a document
    delete: async (id: string): Promise<void> => {
      store.delete(id);
    },

    // Start a query
    query: (tableName: string) => {
      return createMockQueryBuilder(store, tableName);
    },

    // Helper: Get all documents in the store (for test assertions)
    _getStore: () => store,

    // Helper: Seed the store with data
    _seed: (id: string, document: Record<string, unknown>) => {
      store.set(id, { _id: id, ...document } as MockDocument);
    },

    // Helper: Clear the store
    _clear: () => {
      store.clear();
    },
  };

  return db;
}

/**
 * Creates a mock Convex context for testing.
 */
export function createMockCtx() {
  const db = createMockDb();
  return { db };
}

export type MockCtx = ReturnType<typeof createMockCtx>;
export type MockDb = ReturnType<typeof createMockDb>;
