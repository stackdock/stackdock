## Vultr API Routes

**Base URL**: `https://api.vultr.com/v2`

**Authentication**: API key in `Authorization` header
- Format: `Authorization: Bearer <API_KEY>`
- Single API key per account
- Full account access (no scoping)

**How to get your API key:**
1. Log in to Vultr Dashboard
2. Navigate to Settings → API
3. Enable API if not already active
4. Copy your API key (or regenerate if needed)

### Instances (Servers)

## List instances
- URL: `GET /instances`
- Returns: Array of instances (servers)
- **Core endpoint** - Maps to universal `servers` table

## Get instance (wait for dynamic routes)
- URL: `GET /instances/{instance-id}`
- Returns: Single instance details

### Account

## Get account info
- URL: `GET /account`
- Returns: Account information
- **Used for**: Credential validation

### Regions (Future - for filtering)

## List regions
- URL: `GET /regions`
- Returns: Available regions

### Plans (Future - for cost estimation)

## List plans
- URL: `GET /plans`
- Returns: Available instance plans

### Endpoints

## Validate credentials
- URL: `GET /account` (lightweight endpoint to validate token)
- Returns: Account info (401 if invalid token)
