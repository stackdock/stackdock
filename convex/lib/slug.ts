/**
 * Slug generation utilities
 * 
 * Converts project names to URL-friendly slugs
 */

/**
 * Generate a URL-friendly slug from a name
 * 
 * Examples:
 * - "My Project" → "my-project"
 * - "Client A Website" → "client-a-website"
 * - "Project 123" → "project-123"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
}
