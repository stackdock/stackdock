# Firecrawl Health Monitoring Adapter

This adapter uses [Firecrawl](https://firecrawl.dev) to scrape and monitor provider status pages, consolidating health information from all your providers in one place within StackDock.

## Features

- 🔍 **Automated Health Monitoring**: Scrapes provider status pages to detect outages and incidents
- 📊 **Consolidated Dashboard**: View health status of all providers in one place
- 🔄 **Cyclical Checks**: Automatically checks provider health at regular intervals
- 🚨 **Incident Detection**: Identifies and tracks ongoing incidents across providers
- 🏠 **Stay in StackDock**: No need to visit multiple provider status pages

## Supported Providers

The adapter currently monitors status pages for:

- Vercel
- Netlify
- Cloudflare
- GitHub
- DigitalOcean
- Linode
- Vultr
- Hetzner
- Neon
- PlanetScale
- Turso
- Convex
- Sentry
- Better Stack

## Setup

### 1. Get a Firecrawl API Key

1. Sign up for a free account at [firecrawl.dev](https://firecrawl.dev)
2. Get your API key from the dashboard
3. Free tier includes generous limits for status page monitoring

### 2. Configure Environment Variable

Add your Firecrawl API key to your `.env` file:

```bash
FIRECRAWL_API_KEY=fc-your-api-key-here
```

### 3. Add Firecrawl Dock in StackDock

1. Go to StackDock dashboard
2. Navigate to "Docks" section
3. Click "Add New Dock"
4. Select "Firecrawl Health Monitoring" as the provider
5. Enter your Firecrawl API key
6. Save the dock

### 4. View Health Status

Once configured, the adapter will:

1. Automatically scrape all configured provider status pages
2. Store health status in the monitors table
3. Display consolidated health information in your dashboard
4. Run cyclical checks to keep status up-to-date

## How It Works

### Status Detection

The adapter scrapes status pages and uses heuristic-based detection to determine health status:

- **Operational**: "All systems operational", no incidents detected
- **Degraded**: Partial outages, investigating, or minor incidents
- **Down**: Major outages or critical incidents
- **Unknown**: Unable to determine status

### Incident Tracking

The adapter extracts incident information from status pages:

- Incident title and description
- Severity level (critical, degraded)
- Status (ongoing, resolved)
- Affected services (when available)

### Data Storage

All scraped data is stored in the universal `monitors` table with:

- `provider`: "firecrawl"
- `monitorType`: "health-page"
- `status`: Mapped to universal status ("up", "degraded", "down", "unknown")
- `fullApiData`: Complete raw health check data including markdown content

## Use Cases

### 1. Centralized Health Monitoring

Instead of checking multiple provider status pages, view all provider health status in one StackDock dashboard.

### 2. Proactive Incident Detection

Get notified when providers have issues before your users report problems.

### 3. Historical Health Tracking

Track provider reliability over time to make informed decisions about multi-cloud strategy.

### 4. Correlation Analysis

Identify patterns when multiple providers have issues simultaneously.

## Future Enhancements

- **LLM-based Extraction**: Use AI to better understand status page content
- **Custom Status Pages**: Add your own status pages to monitor
- **Alert Notifications**: Send notifications when provider health changes
- **Health Trends**: Visualize provider health over time
- **SLA Tracking**: Monitor provider uptime and SLA compliance
- **Auth Endpoint Monitoring**: Monitor your authentication endpoints
- **Custom Health Checks**: Define custom health checks for your services

## Configuration

### Custom Check Frequency

By default, health checks run every 5 minutes. You can customize this in the adapter code:

```typescript
checkFrequency: 300, // 5 minutes in seconds
```

### Adding More Provider Status Pages

To add more providers, update `PROVIDER_STATUS_PAGES` in `convex/lib/firecrawl.ts`:

```typescript
export const PROVIDER_STATUS_PAGES: Record<string, string> = {
  // ... existing providers
  "your-provider": "https://status.your-provider.com",
}
```

## API Reference

### FirecrawlService

Main service class for Firecrawl integration:

- `scrapeUrl(url: string)`: Scrape a single URL
- `extractHealthStatus(url: string)`: Extract health information from a status page
- `validateCredentials()`: Validate Firecrawl API key

### FirecrawlAPI

Adapter-specific API client:

- `validateCredentials()`: Validate credentials
- `checkHealthStatus(url: string)`: Check health of a single URL
- `checkAllProviderHealthPages(providers: string[])`: Check all configured providers

## Troubleshooting

### "Invalid Firecrawl API key" Error

- Ensure your API key is set in `.env` file
- Verify the API key format starts with `fc-`
- Check that the key is active in your Firecrawl dashboard

### Status Always Shows "Unknown"

- Status page format may not match detection heuristics
- Check `fullApiData.healthCheck.rawContent` to see scraped content
- Consider adding custom detection logic for specific providers

### Rate Limiting

Free tier has limits on number of scrapes per month. To optimize:

- Increase `checkFrequency` to reduce scraping frequency
- Monitor only critical providers
- Upgrade to a paid Firecrawl plan for higher limits

## Contributing

To improve health detection:

1. Review scraped content in `fullApiData.healthCheck.rawContent`
2. Add better pattern matching in `extractHealthStatus()`
3. Consider integrating LLM-based extraction for better accuracy

## Resources

- [Firecrawl Documentation](https://docs.firecrawl.dev/)
- [Firecrawl API Reference](https://docs.firecrawl.dev/api-reference)
- [StackDock Adapter Guide](../../../../docs/guides/DOCK_ADAPTER_GUIDE.md)
