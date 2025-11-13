## Neon API Routes

**Base URL**: `https://console.neon.tech/api/v2`

**Authentication**: Bearer token in `Authorization` header

### Projects

## List projects
- URL: `GET /projects`
- Returns: Array of projects

## Get project (wait for dynamic routes)
- URL: `GET /projects/{projectId}`

### Branches

## List branches for a project
- URL: `GET /projects/{projectId}/branches`
- Returns: Array of branches for the project

## Get branch (wait for dynamic routes)
- URL: `GET /projects/{projectId}/branches/{branchId}`

### Databases

**Note**: In Neon, databases are created per branch. Each branch has a default database, and additional databases can be created.

## List databases for a branch
- URL: `GET /projects/{projectId}/branches/{branchId}/databases`
- Returns: Array of databases for the branch

## Get database (wait for dynamic routes)
- URL: `GET /projects/{projectId}/branches/{branchId}/databases/{databaseName}`

### Endpoints

## Validate credentials
- URL: `GET /projects` (lightweight endpoint to validate token)
- Returns: Array of projects (empty array if invalid token)

## List snapshots for a project
- URL: `GET /projects/{projectId}/snapshots`
- Returns: Array of snapshots for the project
