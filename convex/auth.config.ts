// Convex auth configuration for Clerk integration
// This tells Convex how to validate Clerk JWTs

export default {
  providers: [
    {
      domain: process.env.CLERK_DOMAIN || "clerk.com",
      applicationID: "convex",
    },
  ],
}
