// Convex auth configuration for Clerk integration
// This tells Convex how to validate Clerk JWTs
//
// The domain should match your Clerk Frontend API URL (issuer)
// Example: https://capital-meerkat-66.clerk.accounts.dev
// You can find this in Clerk Dashboard → API Keys → Frontend API URL

export default {
  providers: [
    {
      // Domain should match the issuer from your Clerk JWT tokens
      // This is your Clerk Frontend API URL (full URL with https://)
      // Example: https://capital-meerkat-66.clerk.accounts.dev
      // IMPORTANT: If you set CLERK_DOMAIN in Convex dashboard, remove it or set to the correct value
      domain: process.env.CLERK_DOMAIN || "https://capital-meerkat-66.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
}
