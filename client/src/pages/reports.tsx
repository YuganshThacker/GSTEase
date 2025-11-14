import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, BarChart3 } from "lucide-react";
import type { Invoice } from "@shared/schema";

interface TaxSummary {
  totalSales: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalGST: number;
}

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: isAuthenticated,
  });

  if (authLoading) return null;

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const filteredInvoices = invoices?.filter((invoice) => {
    if (!startDate && !endDate) return true;
    const invoiceDate = new Date(invoice.invoiceDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && invoiceDate < start) return false;
    if (end && invoiceDate > end) return false;
    return true;
  }) || [];

  const calculateTaxSummary = (): TaxSummary => {
    return filteredInvoices.reduce((acc, invoice) => {
      const subtotal = parseFloat(invoice.subtotal.toString());
      const cgst = parseFloat(invoice.cgstAmount?.toString() || '0');
      const sgst = parseFloat(invoice.sgstAmount?.toString() || '0');
      const igst = parseFloat(invoice.igstAmount?.toString() || '0');

      return {
        totalSales: acc.totalSales + subtotal,
        totalCGST: acc.totalCGST + cgst,
        totalSGST: acc.totalSGST + sgst,
        totalIGST: acc.totalIGST + igst,
        totalGST: acc.totalGST + cgst + sgst + igst,
      };
    }, {
      totalSales: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalGST: 0,
    });
  };

  const taxSummary = calculateTaxSummary();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            View sales reports and tax summaries
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList>
          <TabsTrigger value="summary" data-testid="tab-summary">Tax Summary</TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">Sales Report</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales (Excl. GST)</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-mono font-semibold" data-testid="text-total-sales">
                    {formatCurrency(taxSummary.totalSales)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total CGST</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-mono font-semibold" data-testid="text-total-cgst">
                    {formatCurrency(taxSummary.totalCGST)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total SGST</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-mono font-semibold" data-testid="text-total-sgst">
                    {formatCurrency(taxSummary.totalSGST)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total IGST</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-mono font-semibold" data-testid="text-total-igst">
                    {formatCurrency(taxSummary.totalIGST)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total GST</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-mono font-semibold" data-testid="text-total-gst">
                    {formatCurrency(taxSummary.totalGST)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Grand Total (Incl. GST)</CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-mono font-semibold" data-testid="text-grand-total">
                    {formatCurrency(taxSummary.totalSales + taxSummary.totalGST)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Details</CardTitle>
                <Button variant="outline" size="sm" data-testid="button-export-report">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredInvoices.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">GST</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const gstAmount = invoice.gstType === 'cgst_sgst'
                          ? parseFloat(invoice.cgstAmount || '0') + parseFloat(invoice.sgstAmount || '0')
                          : parseFloat(invoice.igstAmount || '0');

                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell>{invoice.invoiceType?.toUpperCase()}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(invoice.subtotal)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(gstAmount)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">No invoices found for the selected date range</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
