# StackDock Documentation

This is the documentation site for StackDock, built with [Fumadocs](https://fumadocs.dev/) and deployed on [Netlify](https://www.netlify.com/).

## Features

- 📚 **Fumadocs**: Modern documentation framework built on Next.js
- ⚡ **Netlify Functions**: Serverless API endpoints
- 🌐 **Edge Functions**: Global edge-side logic
- 🚀 **Auto-deployment**: Continuous deployment via Netlify

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

## Project Structure

```
apps/docs/
├── app/              # Next.js app directory
├── content/          # MDX documentation content
├── netlify/
│   ├── functions/    # Netlify serverless functions
│   └── edge-functions/ # Netlify edge functions
├── lib/              # Shared utilities
├── netlify.toml      # Netlify configuration
└── package.json
```

## Netlify Integration

### Functions

The docs app includes example Netlify Functions:

- **hello** (`/.netlify/functions/hello`) - Basic hello world function
- **api-status** (`/.netlify/functions/api-status`) - Health check endpoint

### Edge Functions

Edge Functions run at the edge for improved performance:

- **add-header** - Adds custom headers to all responses
- **geo-location** (`/api/geo`) - Returns geographic information

## Deployment

### Subdomain Approach (Recommended)

Deploy the docs on a separate subdomain (e.g., `docs.stackdock.com`):

1. Create a new Netlify site
2. Point to this repository with base directory `apps/docs`
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Configure custom domain: `docs.stackdock.com`

### Subfolder Approach

To deploy at `/docs` path on the marketing site, you would need to:

1. Configure rewrites in the marketing site's `netlify.toml`
2. Use Netlify's proxy redirects
3. Or merge the builds (more complex)

The subdomain approach is simpler and more maintainable.

## Writing Documentation

Documentation files are stored in the `content/` directory as MDX files.

### Fumadocs Resources

- In the project:
  - `lib/source.ts`: Code for content source adapter
  - `lib/layout.shared.tsx`: Shared options for layouts

- Routes:
  - `app/(home)` - Landing page and other pages
  - `app/docs` - Documentation layout and pages
  - `app/api/search/route.ts` - Search API endpoint

### Learn More

- [Fumadocs Documentation](https://fumadocs.dev)
- [Fumadocs MDX Introduction](https://fumadocs.dev/docs/mdx)
- [Next.js Documentation](https://nextjs.org/docs)
