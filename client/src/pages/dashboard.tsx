import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Package,
  Users,
  IndianRupee,
  Plus,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import type { Invoice, Product } from "@shared/schema";

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  totalProducts: number;
  totalCustomers: number;
  pendingInvoices: number;
  lowStockProducts: number;
  todayRevenue: number;
  todayInvoices: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices/recent"],
    enabled: isAuthenticated,
  });

  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/low-stock"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return null;
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-create-invoice">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-mono font-semibold" data-testid="text-total-revenue">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span className="font-mono">+{formatCurrency(stats?.todayRevenue || 0)} today</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-mono font-semibold" data-testid="text-total-invoices">
                {stats?.totalInvoices || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span>
                  <span className="font-mono">{stats?.todayInvoices || 0}</span> today
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-mono font-semibold" data-testid="text-total-products">
                {stats?.totalProducts || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span>
                  <span className="font-mono text-amber-600">{stats?.lowStockProducts || 0}</span> low stock
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-mono font-semibold" data-testid="text-total-customers">
                {stats?.totalCustomers || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span>Active customers</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Invoices</span>
              <Link href="/invoices">
                <Button variant="ghost" size="sm" data-testid="button-view-all-invoices">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : recentInvoices && recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-md border p-4 hover-elevate"
                    data-testid={`invoice-item-${invoice.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {invoice.invoiceNumber}
                        </span>
                        <Badge
                          variant={
                            invoice.status === 'paid'
                              ? 'default'
                              : invoice.status === 'overdue'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="font-mono font-semibold">
                      {formatCurrency(invoice.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No invoices yet</p>
                <Link href="/invoices/new">
                  <Button variant="outline" size="sm" className="mt-4" data-testid="button-create-first-invoice">
                    Create First Invoice
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Low Stock Alerts
              </span>
              <Link href="/products">
                <Button variant="ghost" size="sm" data-testid="button-view-all-products">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
                    data-testid={`low-stock-item-${product.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Category: {product.categoryId || 'Uncategorized'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {product.stockQuantity} {product.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Threshold: {product.lowStockThreshold}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
