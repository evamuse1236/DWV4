/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as books from "../books.js";
import type * as chatLogs from "../chatLogs.js";
import type * as diagnostics from "../diagnostics.js";
import type * as domains from "../domains.js";
import type * as emotions from "../emotions.js";
import type * as goals from "../goals.js";
import type * as habits from "../habits.js";
import type * as migrations from "../migrations.js";
import type * as objectives from "../objectives.js";
import type * as progress from "../progress.js";
import type * as projectLinks from "../projectLinks.js";
import type * as projectReflections from "../projectReflections.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as sprints from "../sprints.js";
import type * as trustJar from "../trustJar.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as visionBoard from "../visionBoard.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  ai: typeof ai;
  auth: typeof auth;
  books: typeof books;
  chatLogs: typeof chatLogs;
  diagnostics: typeof diagnostics;
  domains: typeof domains;
  emotions: typeof emotions;
  goals: typeof goals;
  habits: typeof habits;
  migrations: typeof migrations;
  objectives: typeof objectives;
  progress: typeof progress;
  projectLinks: typeof projectLinks;
  projectReflections: typeof projectReflections;
  projects: typeof projects;
  seed: typeof seed;
  sprints: typeof sprints;
  trustJar: typeof trustJar;
  users: typeof users;
  utils: typeof utils;
  visionBoard: typeof visionBoard;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
