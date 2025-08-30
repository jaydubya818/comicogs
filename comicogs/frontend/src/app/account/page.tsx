"use client";

export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Star, Settings, Book, Search, Bell, Shield } from "lucide-react";

export default function AccountPage() {
  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
              <p className="text-muted-foreground">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="searches">Searches</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your basic profile information and collector details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Display Name</label>
                    <p className="text-sm text-muted-foreground">John Collector</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">john@example.com</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-sm text-muted-foreground">January 2024</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Collector Level</label>
                    <Badge variant="secondary">Enthusiast</Badge>
                  </div>
                </div>
                <Button>Edit Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Collection Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">247</div>
                    <div className="text-sm text-muted-foreground">Total Comics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">$4,850</div>
                    <div className="text-sm text-muted-foreground">Est. Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">18</div>
                    <div className="text-sm text-muted-foreground">Series</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">5</div>
                    <div className="text-sm text-muted-foreground">Key Issues</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="searches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Saved Searches
                </CardTitle>
                <CardDescription>
                  Manage your saved searches and alerts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Spider-Man #1", "Batman First Appearance", "X-Men Vol 1"].map((search, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{search}</span>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Price alerts</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>New listing alerts</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Collection updates</span>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline">Change Password</Button>
                <Button variant="outline">Enable Two-Factor Auth</Button>
                <Button variant="destructive">Delete Account</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}