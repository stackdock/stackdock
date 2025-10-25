"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Bell, CheckCircle, Clock, Database, Globe, HardDrive, Monitor, Plus, Server, Settings, TrendingDown, TrendingUp, Users, Zap } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function UIPlaygroundPage() {
  const [_progress] = useState(75)
  const [sliderValue, setSliderValue] = useState([50])

  // Sample data for dashboard widgets
  const servers = [
    { name: "prod-web-01", status: "online", cpu: 45, memory: 67, uptime: "99.9%" },
    { name: "prod-db-01", status: "online", cpu: 23, memory: 89, uptime: "99.8%" },
    { name: "staging-web-01", status: "maintenance", cpu: 0, memory: 15, uptime: "95.2%" },
    { name: "dev-api-01", status: "offline", cpu: 0, memory: 0, uptime: "87.3%" }
  ]

  const sites = [
    { domain: "example.com", status: "active", visitors: "12.4k", ssl: true },
    { domain: "demo.app", status: "active", visitors: "8.7k", ssl: true },
    { domain: "test.dev", status: "inactive", visitors: "0", ssl: false }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "active":
        return "bg-green-500"
      case "maintenance":
        return "bg-yellow-500"
      case "offline":
      case "inactive":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">UI Playground</h1>
        <p className="text-muted-foreground">
          Testing all dashboard components and color palette variations
        </p>
      </div>

      {/* Color Palette Display */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Current theme color variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-background border rounded"></div>
              <p className="text-xs">background</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-foreground rounded"></div>
              <p className="text-xs">foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-primary rounded"></div>
              <p className="text-xs">primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-primary-foreground rounded"></div>
              <p className="text-xs">primary-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-secondary rounded"></div>
              <p className="text-xs">secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-secondary-foreground rounded"></div>
              <p className="text-xs">secondary-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded"></div>
              <p className="text-xs">muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-muted-foreground rounded"></div>
              <p className="text-xs">muted-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent rounded"></div>
              <p className="text-xs">accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent-foreground rounded"></div>
              <p className="text-xs">accent-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-destructive rounded"></div>
              <p className="text-xs">destructive</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-destructive-foreground rounded"></div>
              <p className="text-xs">destructive-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-border border rounded"></div>
              <p className="text-xs">border</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-input border rounded"></div>
              <p className="text-xs">input</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-ring rounded border"></div>
              <p className="text-xs">ring</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-card border rounded"></div>
              <p className="text-xs">card</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-card-foreground rounded"></div>
              <p className="text-xs">card-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-popover border rounded"></div>
              <p className="text-xs">popover</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-popover-foreground rounded"></div>
              <p className="text-xs">popover-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar border rounded"></div>
              <p className="text-xs">sidebar</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar-foreground rounded"></div>
              <p className="text-xs">sidebar-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar-primary rounded"></div>
              <p className="text-xs">sidebar-primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar-primary-foreground rounded"></div>
              <p className="text-xs">sidebar-primary-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar-accent border rounded"></div>
              <p className="text-xs">sidebar-accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar-accent-foreground rounded"></div>
              <p className="text-xs">sidebar-accent-foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar-border border rounded"></div>
              <p className="text-xs">sidebar-border</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-sidebar-ring border rounded"></div>
              <p className="text-xs">sidebar-ring</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-chart-1 rounded"></div>
              <p className="text-xs">chart-1</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-chart-2 rounded"></div>
              <p className="text-xs">chart-2</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-chart-3 rounded"></div>
              <p className="text-xs">chart-3</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-chart-4 rounded"></div>
              <p className="text-xs">chart-4</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-chart-5 rounded"></div>
              <p className="text-xs">chart-5</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <Progress value={67} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Server List */}
      <Card>
        <CardHeader>
          <CardTitle>Server Status</CardTitle>
          <CardDescription>Real-time server monitoring and health status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Server</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map((server) => (
                <TableRow key={server.name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`}></div>
                      <span>{server.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={server.status === "online" ? "default" : server.status === "maintenance" ? "secondary" : "destructive"}>
                      {server.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{server.cpu}%</TableCell>
                  <TableCell>{server.memory}%</TableCell>
                  <TableCell>{server.uptime}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>Various input and form elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="user@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter description..." />
            </div>

            <div className="space-y-2">
              <Label>Server Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select server type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web Server</SelectItem>
                  <SelectItem value="db">Database</SelectItem>
                  <SelectItem value="api">API Server</SelectItem>
                  <SelectItem value="cdn">CDN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resource Allocation</Label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">{sliderValue[0]}% allocated</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="notifications" />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>

            <div className="space-y-3">
              <Label>Monitoring Level</Label>
              <RadioGroup defaultValue="standard">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic">Basic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced">Advanced</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="ssl" />
              <Label htmlFor="ssl">Enable SSL/TLS encryption</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>All available button styles and states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Primary Buttons</h4>
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">With Icons</h4>
              <div className="flex flex-wrap gap-2">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Server
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
                <Button variant="destructive">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sizes</h4>
              <div className="flex items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">States</h4>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>Outline Disabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs and Progress Indicators</CardTitle>
          <CardDescription>Navigation tabs with progress tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Server Health</span>
                    <span className="text-sm">85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Disk Usage</span>
                    <span className="text-sm">67%</span>
                  </div>
                  <Progress value={67} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Network Load</span>
                    <span className="text-sm">42%</span>
                  </div>
                  <Progress value={42} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sites.map((site) => (
                  <div key={site.domain} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(site.status)}`}></div>
                      <div>
                        <p className="font-medium">{site.domain}</p>
                        <p className="text-sm text-muted-foreground">{site.visitors} visitors</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {site.ssl && <Badge variant="secondary">SSL</Badge>}
                      <Badge variant={site.status === "active" ? "default" : "destructive"}>
                        {site.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="reports">
              <p className="text-muted-foreground">Reports and analytics data would go here.</p>
            </TabsContent>
            
            <TabsContent value="notifications">
              <p className="text-muted-foreground">Notification settings and history would be displayed here.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Alerts and Status Messages */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alerts and Messages</h3>
        
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Server deployment completed successfully. All services are running normally.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            High memory usage detected on prod-web-01. Consider scaling resources.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Database connection failed. Please check your connection settings and try again.
          </AlertDescription>
        </Alert>
      </div>

      {/* User Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Current team access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "John Doe", email: "john@example.com", role: "Admin", avatar: "JD" },
              { name: "Jane Smith", email: "jane@example.com", role: "Developer", avatar: "JS" },
              { name: "Mike Johnson", email: "mike@example.com", role: "DevOps", avatar: "MJ" }
            ].map((user) => (
              <div key={user.email} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{user.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{user.role}</Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <Progress value={45} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Zap className="inline h-3 w-3 mr-1" />
              Normal load
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <Progress value={78} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <HardDrive className="inline h-3 w-3 mr-1" />
              High usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34%</div>
            <Progress value={34} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Database className="inline h-3 w-3 mr-1" />
              Available space
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <Progress value={99.9} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="inline h-3 w-3 mr-1" />
              30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>This playground showcases all UI components and theme variations for Stackdock development.</p>
      </div>
    </div>
  )
}
