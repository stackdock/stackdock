## DigitalOcean API Routes

**Base URL**: `https://api.digitalocean.com/v2`

**Authentication**: API token in `Authorization` header
- Format: `Authorization: Bearer <API_TOKEN>`
- Single API token per account
- Full account access (no scoping)

**How to get your API token:**
1. Log in to DigitalOcean Dashboard
2. Navigate to API → Tokens/Keys
3. Generate New Token
4. Copy your token (only shown once - save it securely)

### Droplets (Servers)

## List droplets
- URL: `GET /droplets`
- Returns: Array of droplets (servers)
- **Core endpoint** - Maps to universal `servers` table
- Response format: `{ droplets: [...], links: {}, meta: { total: number } }`

## Get droplet (wait for dynamic routes)
- URL: `GET /droplets/{droplet-id}`
- Returns: Single droplet details

### Account

## Get account info
- URL: `GET /account`
- Returns: Account information
- **Used for**: Credential validation

### Regions (Future - for filtering)

## List regions
- URL: `GET /regions`
- Returns: Available regions

### Sizes (Future - for cost estimation)

## List sizes
- URL: `GET /sizes`
- Returns: Available droplet sizes

### Endpoints

## Validate credentials
- URL: `GET /account` (lightweight endpoint to validate token)
- Returns: Account info (401 if invalid token)
