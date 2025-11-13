## Convex API Routes

**Base URL**: `https://api.convex.dev/v1`

**Authentication**: Bearer token in `Authorization` header

### Token Details

## Get token details
- URL: `GET /token_details`
- Returns: Token details including `teamId`
- **Required**: Must call this first to get `teamId` for projects endpoint

**Example Response**:
```json
{
  "type": "teamToken",
  "teamId": 55334,
  "name": "sdtest",
  "createTime": 1763005957842
}
```

### Projects

## List projects
- URL: `GET /teams/:team_id/list_projects`
- **Required Parameter**: `team_id` (from token details, in URL path)
- Returns: Array of projects

**Example Response**:
```json
[
  {
    "id": 1248586,
    "name": "stackdock-test-v1",
    "slug": "stackdock-test-v1",
    "teamId": 55334,
    "createTime": 1761812481548
  }
]
```

## Get project (wait for dynamic routes)
- URL: `GET /projects/{projectId}`

### Deployments

**Note**: In Convex, deployments are created per project. Each project can have multiple deployments (dev, prod, preview).

## List deployments for a project
- URL: `GET /projects/:project_id/list_deployments`
- **Required Parameter**: `project_id` (from projects list, in URL path)
- Returns: Array of deployments for the project

**Example Response**:
```json
[
  {
    "name": "warmhearted-ferret-15",
    "createTime": 1761812481548,
    "deploymentType": "dev",
    "projectId": 1248586,
    "previewIdentifier": null
  },
  {
    "name": "watchful-kudu-934",
    "createTime": 1762128547363,
    "deploymentType": "prod",
    "projectId": 1248586,
    "previewIdentifier": null
  }
]
```

## Get deployment (wait for dynamic routes)
- URL: `GET /deployments/{deploymentName}`

### Endpoints

## Validate credentials
- URL: `GET /token_details` (lightweight endpoint to validate token)
- Returns: Token details (401 if invalid token)
