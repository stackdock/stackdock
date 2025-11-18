/**
 * Project Files Table Component
 * 
 * Displays files associated with a project with download and delete functionality.
 */

import { useMutation, useQuery } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileText, Archive, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface ProjectFilesTableProps {
  projectId: Id<"projects">
}

export function ProjectFilesTable({ projectId }: ProjectFilesTableProps) {
  const files = useQuery(api.lib.storage.listProjectFiles, { projectId })
  const deleteFile = useMutation(api.lib.storage.deleteFile)

  const handleDelete = async (fileId: Id<"fileUploads">, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return
    }

    try {
      await deleteFile({ fileId })
      toast.success("File deleted successfully")
    } catch (error) {
      toast.error("Failed to delete file")
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "config":
        return <FileText className="h-4 w-4" />
      case "backup":
        return <Archive className="h-4 w-4" />
      case "attachment":
        return <Paperclip className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No files uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Type</TableHead>
            <TableHead>Filename</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file._id}>
              <TableCell>
                <div className="flex items-center justify-center">
                  {getCategoryIcon(file.category)}
                </div>
              </TableCell>
              <TableCell className="font-medium">{file.filename}</TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>{formatDate(file.uploadedAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <FileDownloadButton fileId={file._id} filename={file.filename} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file._id, file.filename)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FileDownloadButton({ fileId, filename }: { fileId: Id<"fileUploads">; filename: string }) {
  const fileUrl = useQuery(api.lib.storage.getFileUrl, { fileId })

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      disabled={!fileUrl}
    >
      <a href={fileUrl || "#"} download={filename}>
        <Download className="h-4 w-4" />
      </a>
    </Button>
  )
}
