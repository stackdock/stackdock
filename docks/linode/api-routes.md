## Linode API Routes

**Base URL**: `https://api.linode.com/v4`

**Authentication**: API token in `Authorization` header
- Format: `Authorization: Bearer <API_TOKEN>`
- Single API token per account
- Full account access (no scoping)

**How to get your API token:**
1. Log in to Linode Cloud Manager
2. Navigate to Profile → API Tokens
3. Create a Personal Access Token
4. Copy your token (only shown once - save it securely)
5. Set appropriate permissions (read-only recommended)

### Linodes (Instances/Servers)

## List linodes
- URL: `GET /linode/instances`
- Returns: Array of linodes (instances/servers)
- **Core endpoint** - Maps to universal `servers` table
- Response format: `{ data: [...], page: number, pages: number, results: number }`

## Get linode (wait for dynamic routes)
- URL: `GET /linode/instances/{linode-id}`
- Returns: Single linode details

### Account

## Get account info
- URL: `GET /account`
- Returns: Account information
- **Used for**: Credential validation

### Regions (Future - for filtering)

## List regions
- URL: `GET /regions`
- Returns: Available regions

### Types (Future - for cost estimation)

## List linode types
- URL: `GET /linode/types`
- Returns: Available linode instance types

### Endpoints

## Validate credentials
- URL: `GET /account` (lightweight endpoint to validate token)
- Returns: Account info (401 if invalid token)
