# Convex Enhancements Guide

This guide documents the enhanced Convex features implemented in StackDock, including file storage, optimistic updates, and pagination.

## File Storage

StackDock now uses Convex file storage for user-uploaded files, configuration files, backups, and attachments.

### Uploading Files

```typescript
import { api } from "convex/_generated/api"
import { useConvex } from "convex/react"

function FileUploadComponent() {
  const convex = useConvex()

  const handleUpload = async (file: File) => {
    // 1. Get upload URL from Convex storage
    const uploadUrl = await convex.mutation(api.storage.mutations.generateUploadUrl, {})
    
    // 2. Upload the file
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    })
    
    const { storageId: fileStorageId } = await result.json()
    
    // 3. Create metadata record
    const fileId = await convex.mutation(api.storage.mutations.uploadFile, {
      storageId: fileStorageId,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      category: "config", // or "backup", "attachment"
      projectId: currentProjectId, // optional
    })
    
    return fileId
  }
}
```

### Downloading Files

```typescript
import { api } from "convex/_generated/api"
import { useQuery } from "convex/react"

function FileDownloadComponent({ fileId }) {
  // Get download URL
  const fileUrl = useQuery(api.storage.queries.getFileUrl, { fileId })
  
  return (
    <a href={fileUrl} download>
      Download File
    </a>
  )
}
```

### Listing Files

```typescript
import { api } from "convex/_generated/api"
import { useQuery } from "convex/react"

function ProjectFilesComponent({ projectId }) {
  // List all files for a project
  const files = useQuery(api.storage.queries.listProjectFiles, { projectId })
  
  return (
    <ul>
      {files?.map((file) => (
        <li key={file._id}>
          {file.filename} ({file.size} bytes)
        </li>
      ))}
    </ul>
  )
}
```

## Optimistic Updates

Optimistic updates provide instant UI feedback before server confirmation, improving perceived performance.

### Using Optimistic Updates

```typescript
import { api } from "convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { createOptimisticProject } from "convex/lib/optimistic"
import { useState } from "react"

function CreateProjectComponent() {
  const createProject = useMutation(api["projects/mutations"].createProject)
  const projects = useQuery(api["projects/queries"].listProjects)
  const [optimisticProjects, setOptimisticProjects] = useState([])
  
  const handleCreate = async (name: string, teamId: Id<"teams">) => {
    // 1. Create optimistic project
    const optimisticProject = createOptimisticProject({
      orgId: currentOrgId,
      teamId,
      name,
    })
    
    // 2. Add to local state immediately
    setOptimisticProjects((prev) => [...prev, optimisticProject])
    
    try {
      // 3. Submit to server
      const realProjectId = await createProject({
        orgId: currentOrgId,
        teamId,
        name,
      })
      
      // 4. Remove optimistic project (real one will come from query)
      setOptimisticProjects((prev) => 
        prev.filter((p) => p._id !== optimisticProject._id)
      )
    } catch (error) {
      // 5. Rollback on error
      setOptimisticProjects((prev) => 
        prev.filter((p) => p._id !== optimisticProject._id)
      )
      console.error("Failed to create project:", error)
    }
  }
  
  // Combine real and optimistic projects
  const allProjects = [...(projects || []), ...optimisticProjects]
  
  return (
    <ul>
      {allProjects.map((project) => (
        <li key={project._id}>
          {project.name}
          {project._optimistic && " (saving...)"}
        </li>
      ))}
    </ul>
  )
}
```

### Optimistic Update Helpers

The `convex/lib/optimistic.ts` file provides utilities:

- `createOptimisticProject()` - Create temporary project object
- `createOptimisticProjectResource()` - Create temporary resource link
- `generateOptimisticId()` - Generate temporary IDs
- `isOptimisticId()` - Check if ID is temporary
- `filterOptimistic()` - Remove optimistic items
- `replaceOptimistic()` - Replace optimistic with real data
- `removeOptimistic()` - Remove failed optimistic updates

## Pagination

For large datasets (>100 items), use paginated queries to improve performance.

### Using Paginated Queries

```typescript
import { api } from "convex/_generated/api"
import { usePaginatedQuery } from "convex/react"

function ServersListComponent() {
  const {
    results: servers,
    status,
    loadMore,
  } = usePaginatedQuery(
    api["resources/queries"].listServersPaginated,
    {},
    { initialNumItems: 50 }
  )
  
  return (
    <div>
      <ul>
        {servers.map((server) => (
          <li key={server._id}>{server.name}</li>
        ))}
      </ul>
      
      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(25)}>
          Load More
        </button>
      )}
      
      {status === "LoadingMore" && <p>Loading...</p>}
    </div>
  )
}
```

### Available Paginated Queries

- `listServersPaginated` - Paginate servers
- `listDomainsPaginated` - Paginate domains
- `listDatabasesPaginated` - Paginate databases
- `listWebServicesPaginated` - Paginate web services
- `listDocksPaginated` - Paginate docks
- `listProjectsPaginated` - Paginate projects

### Pagination Best Practices

1. **Use pagination for lists over 100 items** - Improves initial load time
2. **Set appropriate page size** - 25-50 items per page is typical
3. **Show loading indicators** - Use the `status` property
4. **Implement infinite scroll or "Load More"** - Better UX than traditional pagination

## Architecture Notes

### File Storage

- Files are stored in Convex's built-in file storage system
- Metadata is tracked in the `fileUploads` table
- Download URLs are short-lived for security
- RBAC permissions are enforced on all file operations

### Optimistic Updates

- Optimistic IDs are prefixed with `opt_` to avoid conflicts
- Failed mutations automatically rollback UI changes
- Real data from queries replaces optimistic data when available
- Use sparingly for frequently-failing operations

### Pagination

- Uses Convex's native `.paginate()` API
- Cursor-based pagination for consistent results
- All queries maintain RBAC permissions
- Compatible with real-time subscriptions

## Related Documentation

- [Convex File Storage Docs](https://docs.convex.dev/file-storage)
- [Convex Optimistic Updates Docs](https://docs.convex.dev/client/react/optimistic-updates)
- [Convex Pagination Docs](https://docs.convex.dev/database/pagination)
- [StackDock RBAC Guide](./rbac.md)
