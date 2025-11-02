/**
 * Resource Spec Form Component
 * 
 * Provider-specific resource configuration form.
 * Dynamically renders form fields based on provider and resourceType.
 * 
 * Follows shadcn/ui patterns: forwardRef, cn(), design tokens
 */

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ResourceType } from "@/machines/provision-resource.machine"

export type ResourceSpec = Record<string, any>

export interface ResourceSpecFormProps
  extends React.ComponentPropsWithoutRef<"div"> {
  provider: string
  resourceType: ResourceType
  defaultValues?: Partial<ResourceSpec>
  onChange?: (spec: ResourceSpec) => void
  errors?: Record<string, string>
}

// Provider-specific field schemas
const getSchema = (provider: string, resourceType: ResourceType) => {
  if (provider === "aws") {
    if (resourceType === "server") {
      return z.object({
        instanceType: z.string().min(1, "Instance type is required"),
        region: z.string().min(1, "Region is required"),
        ami: z.string().optional(),
        keyPair: z.string().optional(),
        securityGroups: z.array(z.string()).optional(),
      })
    }
    if (resourceType === "webService") {
      return z.object({
        bucketName: z.string().min(1, "Bucket name is required"),
        region: z.string().min(1, "Region is required"),
        publicAccess: z.boolean().optional(),
        versioning: z.boolean().optional(),
      })
    }
    if (resourceType === "database") {
      return z.object({
        engine: z.string().min(1, "Engine is required"),
        instanceClass: z.string().min(1, "Instance class is required"),
        region: z.string().min(1, "Region is required"),
        storage: z.number().optional(),
        multiAz: z.boolean().optional(),
      })
    }
  }

  if (provider === "cloudflare") {
    if (resourceType === "webService") {
      return z.object({
        workerName: z.string().min(1, "Worker name is required"),
        script: z.string().optional(),
        routes: z.array(z.string()).optional(),
      })
    }
    if (resourceType === "domain") {
      return z.object({
        zoneName: z.string().min(1, "Zone name is required"),
        dnsRecords: z.array(z.string()).optional(),
      })
    }
  }

  // Default schema for unknown providers
  return z.object({
    name: z.string().min(1, "Name is required"),
  })
}

const ResourceSpecForm = React.forwardRef<
  HTMLDivElement,
  ResourceSpecFormProps
>(({ className, provider, resourceType, defaultValues, onChange, errors, ...props }, ref) => {
  const schema = getSchema(provider, resourceType)
  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as FormValues,
  })

  // Notify parent of changes
  React.useEffect(() => {
    const subscription = form.watch((values) => {
      onChange?.(values as ResourceSpec)
    })
    return () => subscription.unsubscribe()
  }, [form, onChange])

  // Apply external errors
  React.useEffect(() => {
    if (errors) {
      Object.entries(errors).forEach(([key, message]) => {
        form.setError(key as keyof FormValues, { message })
      })
    }
  }, [errors, form])

  const renderFields = () => {
    if (provider === "aws") {
      if (resourceType === "server") {
        return (
          <>
            <FormField
              control={form.control}
              name="instanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instance Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instance type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="t2.micro">t2.micro</SelectItem>
                      <SelectItem value="t2.small">t2.small</SelectItem>
                      <SelectItem value="t2.medium">t2.medium</SelectItem>
                      <SelectItem value="t3.micro">t3.micro</SelectItem>
                      <SelectItem value="t3.small">t3.small</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the instance type for your server
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ami"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AMI ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ami-xxxxxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )
      }
      if (resourceType === "webService") {
        return (
          <>
            <FormField
              control={form.control}
              name="bucketName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bucket Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-bucket-name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be globally unique and follow S3 naming rules
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )
      }
    }

    if (provider === "cloudflare") {
      if (resourceType === "webService") {
        return (
          <>
            <FormField
              control={form.control}
              name="workerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Worker Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my-worker" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )
      }
    }

    // Default form for unknown providers
    return (
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Resource name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <div ref={ref} className={cn("space-y-4", className)} {...props}>
      <Form {...form}>
        <form className="space-y-4">{renderFields()}</form>
      </Form>
    </div>
  )
})

ResourceSpecForm.displayName = "ResourceSpecForm"

export { ResourceSpecForm }
