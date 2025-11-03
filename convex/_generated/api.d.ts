/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as docks__types from "../docks/_types.js";
import type * as docks_actions from "../docks/actions.js";
import type * as docks_adapters_gridpane_adapter from "../docks/adapters/gridpane/adapter.js";
import type * as docks_adapters_gridpane_api from "../docks/adapters/gridpane/api.js";
import type * as docks_adapters_gridpane_index from "../docks/adapters/gridpane/index.js";
import type * as docks_adapters_gridpane_types from "../docks/adapters/gridpane/types.js";
import type * as docks_mutations from "../docks/mutations.js";
import type * as docks_queries from "../docks/queries.js";
import type * as docks_registry from "../docks/registry.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as organizations from "../organizations.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as provisioning_queries from "../provisioning/queries.js";
import type * as resources_queries from "../resources/queries.js";
import type * as test from "../test.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "docks/_types": typeof docks__types;
  "docks/actions": typeof docks_actions;
  "docks/adapters/gridpane/adapter": typeof docks_adapters_gridpane_adapter;
  "docks/adapters/gridpane/api": typeof docks_adapters_gridpane_api;
  "docks/adapters/gridpane/index": typeof docks_adapters_gridpane_index;
  "docks/adapters/gridpane/types": typeof docks_adapters_gridpane_types;
  "docks/mutations": typeof docks_mutations;
  "docks/queries": typeof docks_queries;
  "docks/registry": typeof docks_registry;
  "lib/audit": typeof lib_audit;
  "lib/encryption": typeof lib_encryption;
  "lib/rbac": typeof lib_rbac;
  organizations: typeof organizations;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  "provisioning/queries": typeof provisioning_queries;
  "resources/queries": typeof resources_queries;
  test: typeof test;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
