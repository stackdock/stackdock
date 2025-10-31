"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Building2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Organization name is required.",
  }).min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
})

export function CreateOrganizationDialog() {
  const [opened, setOpened] = useState(false)
  const createOrganization = useMutation(api.organizations.create)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createOrganization({ name: values.name })
      form.reset()
      setOpened(false)
      // Query will automatically refetch when data changes
    } catch (error) {
      console.error("Failed to create organization:", error)
      form.setError("root", {
        message: error instanceof Error ? error.message : "Failed to create organization",
      })
    }
  }

  return (
    <Dialog
      open={opened}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
        }
        setOpened(open)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Organization
          </DialogTitle>
          <DialogDescription>
            Create a new organization to manage your infrastructure and team.
            You'll be set as the organization owner.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="create-org-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Inc."
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              form.reset()
              setOpened(false)
            }}
          >
            Cancel
          </Button>
          <Button
            form="create-org-form"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Organization"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
