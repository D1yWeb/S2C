/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as affiliates from "../affiliates.js";
import type * as auth from "../auth.js";
import type * as cleanup from "../cleanup.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as folders from "../folders.js";
import type * as http from "../http.js";
import type * as inspiration from "../inspiration.js";
import type * as migrations_migrate_affiliates_to_credits from "../migrations/migrate_affiliates_to_credits.js";
import type * as moodboard from "../moodboard.js";
import type * as projects from "../projects.js";
import type * as subscription from "../subscription.js";
import type * as team from "../team.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  affiliates: typeof affiliates;
  auth: typeof auth;
  cleanup: typeof cleanup;
  credits: typeof credits;
  crons: typeof crons;
  folders: typeof folders;
  http: typeof http;
  inspiration: typeof inspiration;
  "migrations/migrate_affiliates_to_credits": typeof migrations_migrate_affiliates_to_credits;
  moodboard: typeof moodboard;
  projects: typeof projects;
  subscription: typeof subscription;
  team: typeof team;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
