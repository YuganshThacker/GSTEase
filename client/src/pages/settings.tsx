import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Shield, Bell, Building } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details and profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              {authLoading ? (
                <Skeleton className="h-16 w-16 rounded-full" />
              ) : (
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.profileImageUrl || undefined} style={{ objectFit: 'cover' }} />
                  <AvatarFallback className="text-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0] || user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col gap-1">
                {authLoading ? (
                  <>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </>
                ) : (
                  <>
                    <div className="font-semibold" data-testid="text-profile-name">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="text-profile-email">
                      {user?.email}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-sm font-medium">User ID</span>
                {authLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="text-sm font-mono text-muted-foreground" data-testid="text-user-id">{user?.id}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Account Created</span>
                {authLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
            <CardDescription>Your access level in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Role</span>
                {authLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <Badge variant="default" className="capitalize" data-testid="badge-user-role">
                    {user?.role || 'Staff'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Permissions:</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Create and manage invoices</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Manage products and inventory</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>View and manage customers</span>
                </div>
                {user?.role === 'admin' && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Access all reports</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Manage user roles</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Your business details for invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Business Name</span>
                <span className="text-sm text-muted-foreground">Your Business Name</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">GST Number</span>
                <span className="text-sm font-mono text-muted-foreground">22AAAAA0000A1Z5</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Address</span>
                <span className="text-sm text-muted-foreground">
                  Your Business Address, City, State - Pincode
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Low Stock Alerts</div>
                  <div className="text-xs text-muted-foreground">Get notified when products are low on stock</div>
                </div>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Invoice Reminders</div>
                  <div className="text-xs text-muted-foreground">Reminders for pending invoices</div>
                </div>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Daily Summary</div>
                  <div className="text-xs text-muted-foreground">Daily business activity summary</div>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
