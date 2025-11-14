import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, Printer, CreditCard, Mail, Copy, Check, ExternalLink } from "lucide-react";
import type { Invoice, InvoiceItem } from "@shared/schema";

export default function InvoiceDetail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/invoices/:id");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State for payment link dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice & { items: InvoiceItem[] }>({
    queryKey: ["/api/invoices", params?.id],
    enabled: isAuthenticated && !!params?.id,
  });

  // Mutation to create payment link
  const createPaymentLinkMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invoiceId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment link');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPaymentLink(data.paymentLink || data.payment.paymentLink);
      setShowPaymentDialog(true);
      
      const title = data.isDemoMode 
        ? "Demo Payment Link Created 🎭" 
        : "Payment Link Created";
      
      const description = data.isDemoMode
        ? "This is a demo payment link for presentation. Click to see the demo payment page."
        : "Share this link with your customer to receive payment.";
      
      toast({
        title,
        description,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create payment link. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to send invoice via Email
  const sendViaEmail = async () => {
    if (!invoice?.id || !invoice?.customerId) return;
    
    setSendingEmail(true);
    try {
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          invoiceId: invoice.id,
          customerId: invoice.customerId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }
      
      toast({
        title: "Email Sent",
        description: data.email ? `Invoice sent to ${data.email} successfully.` : "Invoice has been sent via email successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email. Please check your email configuration.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Function to download PDF
  const downloadPDF = () => {
    if (!invoice?.id) return;
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
  };

  // Function to copy payment link
  const copyPaymentLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Payment link copied to clipboard.",
      });
    }
  };

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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/invoices")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Invoice Details</h1>
            {invoiceLoading ? (
              <Skeleton className="h-4 w-32 mt-1" />
            ) : (
              <p className="text-sm text-muted-foreground">
                Invoice {invoice?.invoiceNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadPDF}
            disabled={!invoice}
            data-testid="button-download"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.print()}
            data-testid="button-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={sendViaEmail}
            disabled={!invoice || sendingEmail || invoice.status === 'paid'}
            data-testid="button-email"
          >
            <Mail className="h-4 w-4 mr-2" />
            {sendingEmail ? 'Sending...' : 'Email Invoice'}
          </Button>
          <Button 
            size="sm"
            onClick={() => invoice && createPaymentLinkMutation.mutate(invoice.id)}
            disabled={!invoice || invoice.status === 'paid' || createPaymentLinkMutation.isPending}
            data-testid="button-payment"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {createPaymentLinkMutation.isPending ? 'Creating...' : 'Create Payment Link'}
          </Button>
        </div>
      </div>

      {/* Payment Link Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Link Created</DialogTitle>
            <DialogDescription>
              Share this link with your customer to receive payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all">{paymentLink}</code>
              <Button
                size="icon"
                variant="ghost"
                onClick={copyPaymentLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => paymentLink && window.open(paymentLink, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </Button>
              <Button
                className="flex-1"
                onClick={copyPaymentLink}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice Information</CardTitle>
            {invoiceLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : invoice ? (
              <Badge variant={getStatusVariant(invoice.status)} data-testid="badge-status">
                {invoice.status}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {invoiceLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                  <p className="font-mono font-semibold" data-testid="text-invoice-number">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                  <p data-testid="text-invoice-date">
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Invoice Type</p>
                  <p>
                    <Badge variant="outline">{invoice.invoiceType?.toUpperCase()}</Badge>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-4">Items</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">GST Rate</TableHead>
                        <TableHead className="text-right">GST Amount</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.productName}</div>
                            {item.hsnCode && (
                              <div className="text-xs font-mono text-muted-foreground">
                                HSN: {item.hsnCode}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.price)}
                          </TableCell>
                          <TableCell className="text-right font-mono">{item.gstRate}%</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.gstAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(item.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.gstType === 'cgst_sgst' ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CGST</span>
                        <span className="font-mono text-muted-foreground">
                          {formatCurrency(invoice.cgstAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SGST</span>
                        <span className="font-mono text-muted-foreground">
                          {formatCurrency(invoice.sgstAmount || 0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGST</span>
                      <span className="font-mono text-muted-foreground">
                        {formatCurrency(invoice.igstAmount || 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>Total Amount</span>
                    <span className="font-mono" data-testid="text-total-amount">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Invoice not found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
