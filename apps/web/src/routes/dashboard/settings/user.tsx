"use client"

import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { useUser } from "@clerk/clerk-react"
import { api } from "convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield, CheckCircle2 } from "lucide-react"

export const Route = createFileRoute("/dashboard/settings/user")({
  component: UserPage,
})

function UserPage() {
  const { user: clerkUser } = useUser()
  const currentUser = useQuery(api.users.getCurrent)

  if (!clerkUser) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            User Profile
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            View your user profile information
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading user data...</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const fullName = clerkUser.fullName || clerkUser.firstName || "User"
  const firstName = clerkUser.firstName || ""
  const lastName = clerkUser.lastName || ""
  const email = clerkUser.primaryEmailAddress?.emailAddress || ""
  const imageUrl = clerkUser.imageUrl || ""
  const createdAt = clerkUser.createdAt ? new Date(clerkUser.createdAt) : null
  const updatedAt = clerkUser.updatedAt ? new Date(clerkUser.updatedAt) : null
  const emailVerified = clerkUser.emailAddresses?.some(e => e.verification?.status === "verified") || false

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
          User Profile
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          View your user profile information
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imageUrl} alt={fullName} />
                <AvatarFallback className="text-lg">
                  {firstName[0]}{lastName[0] || firstName[1] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{fullName}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {email}
                  {emailVerified && (
                    <Badge variant="outline" className="ml-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your account details and personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <p className="text-sm">{firstName || "—"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <p className="text-sm">{lastName || "—"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm">{fullName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Username</label>
                <p className="text-sm">{clerkUser.username || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Email addresses and phone numbers associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Addresses</label>
                <div className="mt-2 space-y-2">
                  {clerkUser.emailAddresses?.map((emailAddr) => (
                    <div key={emailAddr.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{emailAddr.emailAddress}</span>
                        {emailAddr.id === clerkUser.primaryEmailAddressId && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                        {emailAddr.verification?.status === "verified" && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No email addresses</p>}
                </div>
              </div>
              {clerkUser.phoneNumbers && clerkUser.phoneNumbers.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Numbers</label>
                  <div className="mt-2 space-y-2">
                    {clerkUser.phoneNumbers.map((phone) => (
                      <div key={phone.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{phone.phoneNumber}</span>
                          {phone.id === clerkUser.primaryPhoneNumberId && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
                          )}
                          {phone.verification?.status === "verified" && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Account metadata and security information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm font-mono text-xs break-all">{clerkUser.id}</p>
              </div>
              {currentUser && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Convex User ID</label>
                  <p className="text-sm font-mono text-xs break-all">{currentUser._id}</p>
                </div>
              )}
              {createdAt && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Account Created
                  </label>
                  <p className="text-sm">{createdAt.toLocaleString()}</p>
                </div>
              )}
              {updatedAt && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Updated
                  </label>
                  <p className="text-sm">{updatedAt.toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
