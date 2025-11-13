## PlanetScale API Routes

**Base URL**: `https://api.planetscale.com/v1`

**Authentication**: Service tokens are required (recommended for production):

**Service Token Format** (REQUIRED):
- Format: `Authorization: <SERVICE_TOKEN_ID>:<SERVICE_TOKEN>`
- No "Bearer" prefix - just `TOKEN_ID:TOKEN` separated by a colon
- **Both token ID and token are required** - combine them with a colon
- Example: `Authorization: YOUR_TOKEN_ID:pscale_tkn_YOUR_SERVICE_TOKEN_HERE`

**How to get your tokens:**
1. Go to PlanetScale Dashboard → Settings → Service Tokens
2. Create a new service token or view existing ones
3. You'll see:
   - **Token ID**: e.g., `abc123xyz` (short alphanumeric string)
   - **Token**: e.g., `pscale_tkn_YOUR_SERVICE_TOKEN_HERE` (starts with `pscale_tkn_`)
4. **Combine them**: Enter `TOKEN_ID:TOKEN` in the API key field (e.g., `abc123xyz:pscale_tkn_YOUR_SERVICE_TOKEN_HERE`)

**Adapter behavior:**
- If API key contains `:`, uses service token format (sends as `TOKEN_ID:TOKEN`)
- If API key starts with `pscale_` but no colon, tries without Bearer (may fail - use TOKEN_ID:TOKEN format)
- Otherwise, tries Bearer format (may not work for PlanetScale API)

### Organizations

## List organizations
- URL: `GET /organizations`
- Returns: Array of organizations
- **Required**: Must call this first to get organization slug/name for databases endpoint

### Databases

## List databases for an organization
- URL: `GET /organizations/{organization}/databases`
- **Required Parameter**: `organization` (slug or name from organizations list)
- Returns: Array of databases for the organization

## Get database (wait for dynamic routes)
- URL: `GET /organizations/{organization}/databases/{database}`

### Endpoints

## Validate credentials
- URL: `GET /organizations` (lightweight endpoint to validate token)
- Returns: Array of organizations (401 if invalid token)
