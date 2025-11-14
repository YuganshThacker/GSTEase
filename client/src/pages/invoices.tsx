import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, FileText, Eye } from "lucide-react";
import { Link } from "wouter";
import type { Invoice } from "@shared/schema";

export default function Invoices() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredInvoices = invoices?.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (authLoading) return null;

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all your GST invoices
          </p>
        </div>
        <Link href="/invoices/new">
          <Button data-testid="button-create-invoice">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices by invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-invoices"
              />
            </div>
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
                    <TableHead>GST Type</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const gstAmount = invoice.gstType === 'cgst_sgst' 
                      ? parseFloat(invoice.cgstAmount || '0') + parseFloat(invoice.sgstAmount || '0')
                      : parseFloat(invoice.igstAmount || '0');
                    
                    return (
                      <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                        <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.invoiceType?.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {invoice.gstType === 'cgst_sgst' ? 'CGST/SGST' : 'IGST'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(invoice.subtotal)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(gstAmount)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon" data-testid={`button-view-${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">No invoices found</p>
              <Link href="/invoices/new">
                <Button variant="outline" size="sm" className="mt-4" data-testid="button-create-first-invoice">
                  Create First Invoice
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
