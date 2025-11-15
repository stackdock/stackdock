/**
 * Universal Table Skeleton Component
 * 
 * Provides a consistent loading state for all tables with 10 skeleton rows
 * to prevent layout shift during data loading.
 */

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TableSkeletonProps {
  /**
   * Number of columns to show in the skeleton
   * Should match the number of columns in the actual table
   */
  columnCount: number
  /**
   * Number of skeleton rows to display (default: 10)
   */
  rowCount?: number
  /**
   * Whether to show a checkbox column (for selectable tables)
   */
  showCheckbox?: boolean
}

export function TableSkeleton({ 
  columnCount, 
  rowCount = 10,
  showCheckbox = false 
}: TableSkeletonProps) {
  // Calculate actual column count (add 1 for checkbox if needed)
  const totalColumns = showCheckbox ? columnCount + 1 : columnCount

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {showCheckbox && (
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
            )}
            {Array.from({ length: columnCount }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {showCheckbox && (
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
              )}
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
