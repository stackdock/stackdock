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
import type * as docks_adapters_cloudflare_adapter from "../docks/adapters/cloudflare/adapter.js";
import type * as docks_adapters_cloudflare_api from "../docks/adapters/cloudflare/api.js";
import type * as docks_adapters_cloudflare_index from "../docks/adapters/cloudflare/index.js";
import type * as docks_adapters_cloudflare_types from "../docks/adapters/cloudflare/types.js";
import type * as docks_adapters_convex_adapter from "../docks/adapters/convex/adapter.js";
import type * as docks_adapters_convex_api from "../docks/adapters/convex/api.js";
import type * as docks_adapters_convex_index from "../docks/adapters/convex/index.js";
import type * as docks_adapters_convex_types from "../docks/adapters/convex/types.js";
import type * as docks_adapters_digitalocean_adapter from "../docks/adapters/digitalocean/adapter.js";
import type * as docks_adapters_digitalocean_api from "../docks/adapters/digitalocean/api.js";
import type * as docks_adapters_digitalocean_index from "../docks/adapters/digitalocean/index.js";
import type * as docks_adapters_digitalocean_types from "../docks/adapters/digitalocean/types.js";
import type * as docks_adapters_github_adapter from "../docks/adapters/github/adapter.js";
import type * as docks_adapters_github_api from "../docks/adapters/github/api.js";
import type * as docks_adapters_github_index from "../docks/adapters/github/index.js";
import type * as docks_adapters_github_types from "../docks/adapters/github/types.js";
import type * as docks_adapters_gridpane_adapter from "../docks/adapters/gridpane/adapter.js";
import type * as docks_adapters_gridpane_api from "../docks/adapters/gridpane/api.js";
import type * as docks_adapters_gridpane_index from "../docks/adapters/gridpane/index.js";
import type * as docks_adapters_gridpane_types from "../docks/adapters/gridpane/types.js";
import type * as docks_adapters_hetzner_adapter from "../docks/adapters/hetzner/adapter.js";
import type * as docks_adapters_hetzner_api from "../docks/adapters/hetzner/api.js";
import type * as docks_adapters_hetzner_index from "../docks/adapters/hetzner/index.js";
import type * as docks_adapters_hetzner_types from "../docks/adapters/hetzner/types.js";
import type * as docks_adapters_linode_adapter from "../docks/adapters/linode/adapter.js";
import type * as docks_adapters_linode_api from "../docks/adapters/linode/api.js";
import type * as docks_adapters_linode_index from "../docks/adapters/linode/index.js";
import type * as docks_adapters_linode_types from "../docks/adapters/linode/types.js";
import type * as docks_adapters_neon_adapter from "../docks/adapters/neon/adapter.js";
import type * as docks_adapters_neon_api from "../docks/adapters/neon/api.js";
import type * as docks_adapters_neon_index from "../docks/adapters/neon/index.js";
import type * as docks_adapters_neon_types from "../docks/adapters/neon/types.js";
import type * as docks_adapters_netlify_adapter from "../docks/adapters/netlify/adapter.js";
import type * as docks_adapters_netlify_api from "../docks/adapters/netlify/api.js";
import type * as docks_adapters_netlify_index from "../docks/adapters/netlify/index.js";
import type * as docks_adapters_netlify_types from "../docks/adapters/netlify/types.js";
import type * as docks_adapters_planetscale_adapter from "../docks/adapters/planetscale/adapter.js";
import type * as docks_adapters_planetscale_api from "../docks/adapters/planetscale/api.js";
import type * as docks_adapters_planetscale_index from "../docks/adapters/planetscale/index.js";
import type * as docks_adapters_planetscale_types from "../docks/adapters/planetscale/types.js";
import type * as docks_adapters_turso_adapter from "../docks/adapters/turso/adapter.js";
import type * as docks_adapters_turso_api from "../docks/adapters/turso/api.js";
import type * as docks_adapters_turso_index from "../docks/adapters/turso/index.js";
import type * as docks_adapters_turso_types from "../docks/adapters/turso/types.js";
import type * as docks_adapters_vercel_adapter from "../docks/adapters/vercel/adapter.js";
import type * as docks_adapters_vercel_api from "../docks/adapters/vercel/api.js";
import type * as docks_adapters_vercel_index from "../docks/adapters/vercel/index.js";
import type * as docks_adapters_vercel_types from "../docks/adapters/vercel/types.js";
import type * as docks_adapters_vultr_adapter from "../docks/adapters/vultr/adapter.js";
import type * as docks_adapters_vultr_api from "../docks/adapters/vultr/api.js";
import type * as docks_adapters_vultr_index from "../docks/adapters/vultr/index.js";
import type * as docks_adapters_vultr_types from "../docks/adapters/vultr/types.js";
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
  "docks/adapters/cloudflare/adapter": typeof docks_adapters_cloudflare_adapter;
  "docks/adapters/cloudflare/api": typeof docks_adapters_cloudflare_api;
  "docks/adapters/cloudflare/index": typeof docks_adapters_cloudflare_index;
  "docks/adapters/cloudflare/types": typeof docks_adapters_cloudflare_types;
  "docks/adapters/convex/adapter": typeof docks_adapters_convex_adapter;
  "docks/adapters/convex/api": typeof docks_adapters_convex_api;
  "docks/adapters/convex/index": typeof docks_adapters_convex_index;
  "docks/adapters/convex/types": typeof docks_adapters_convex_types;
  "docks/adapters/digitalocean/adapter": typeof docks_adapters_digitalocean_adapter;
  "docks/adapters/digitalocean/api": typeof docks_adapters_digitalocean_api;
  "docks/adapters/digitalocean/index": typeof docks_adapters_digitalocean_index;
  "docks/adapters/digitalocean/types": typeof docks_adapters_digitalocean_types;
  "docks/adapters/github/adapter": typeof docks_adapters_github_adapter;
  "docks/adapters/github/api": typeof docks_adapters_github_api;
  "docks/adapters/github/index": typeof docks_adapters_github_index;
  "docks/adapters/github/types": typeof docks_adapters_github_types;
  "docks/adapters/gridpane/adapter": typeof docks_adapters_gridpane_adapter;
  "docks/adapters/gridpane/api": typeof docks_adapters_gridpane_api;
  "docks/adapters/gridpane/index": typeof docks_adapters_gridpane_index;
  "docks/adapters/gridpane/types": typeof docks_adapters_gridpane_types;
  "docks/adapters/hetzner/adapter": typeof docks_adapters_hetzner_adapter;
  "docks/adapters/hetzner/api": typeof docks_adapters_hetzner_api;
  "docks/adapters/hetzner/index": typeof docks_adapters_hetzner_index;
  "docks/adapters/hetzner/types": typeof docks_adapters_hetzner_types;
  "docks/adapters/linode/adapter": typeof docks_adapters_linode_adapter;
  "docks/adapters/linode/api": typeof docks_adapters_linode_api;
  "docks/adapters/linode/index": typeof docks_adapters_linode_index;
  "docks/adapters/linode/types": typeof docks_adapters_linode_types;
  "docks/adapters/neon/adapter": typeof docks_adapters_neon_adapter;
  "docks/adapters/neon/api": typeof docks_adapters_neon_api;
  "docks/adapters/neon/index": typeof docks_adapters_neon_index;
  "docks/adapters/neon/types": typeof docks_adapters_neon_types;
  "docks/adapters/netlify/adapter": typeof docks_adapters_netlify_adapter;
  "docks/adapters/netlify/api": typeof docks_adapters_netlify_api;
  "docks/adapters/netlify/index": typeof docks_adapters_netlify_index;
  "docks/adapters/netlify/types": typeof docks_adapters_netlify_types;
  "docks/adapters/planetscale/adapter": typeof docks_adapters_planetscale_adapter;
  "docks/adapters/planetscale/api": typeof docks_adapters_planetscale_api;
  "docks/adapters/planetscale/index": typeof docks_adapters_planetscale_index;
  "docks/adapters/planetscale/types": typeof docks_adapters_planetscale_types;
  "docks/adapters/turso/adapter": typeof docks_adapters_turso_adapter;
  "docks/adapters/turso/api": typeof docks_adapters_turso_api;
  "docks/adapters/turso/index": typeof docks_adapters_turso_index;
  "docks/adapters/turso/types": typeof docks_adapters_turso_types;
  "docks/adapters/vercel/adapter": typeof docks_adapters_vercel_adapter;
  "docks/adapters/vercel/api": typeof docks_adapters_vercel_api;
  "docks/adapters/vercel/index": typeof docks_adapters_vercel_index;
  "docks/adapters/vercel/types": typeof docks_adapters_vercel_types;
  "docks/adapters/vultr/adapter": typeof docks_adapters_vultr_adapter;
  "docks/adapters/vultr/api": typeof docks_adapters_vultr_api;
  "docks/adapters/vultr/index": typeof docks_adapters_vultr_index;
  "docks/adapters/vultr/types": typeof docks_adapters_vultr_types;
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
