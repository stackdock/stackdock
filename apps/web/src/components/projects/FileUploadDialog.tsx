/**
 * File Upload Dialog Component
 * 
 * Allows users to upload configuration files, backups, or attachments to a project.
 * Uses Convex file storage for secure, efficient file management.
 */

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import type { Id } from "convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface FileUploadDialogProps {
  projectId?: Id<"projects">
  dockId?: Id<"docks">
  trigger?: React.ReactNode
}

export function FileUploadDialog({ projectId, dockId, trigger }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<"config" | "backup" | "attachment">("config")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateUploadUrl = useMutation(api.storage.mutations.generateUploadUrl)
  const uploadFile = useMutation(api.storage.mutations.uploadFile)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl()

      // Step 2: Upload file to storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const { storageId } = await response.json()

      // Step 3: Create file metadata record
      await uploadFile({
        storageId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        category,
        ...(projectId ? { projectId } : {}),
        ...(dockId ? { dockId } : {}),
      })

      toast.success("File uploaded successfully")
      setOpen(false)
      setFile(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload file"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a configuration file, backup, or attachment.
            Maximum file size: 10MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(value: any) => setCategory(value)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="config">Configuration File</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
                <SelectItem value="attachment">Attachment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
