import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import type { Customer, Product } from "@shared/schema";

interface InvoiceItem {
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  price: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

interface InvoiceFormData {
  customerId: string;
  invoiceType: 'b2b' | 'b2c';
  gstType: 'cgst_sgst' | 'igst';
  items: InvoiceItem[];
  notes: string;
}

export default function InvoiceNew() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: "",
    invoiceType: "b2c",
    gstType: "cgst_sgst",
    items: [],
    notes: "",
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

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

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    enabled: isAuthenticated,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      await apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setLocation("/invoices");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const product = products?.find(p => p.id === selectedProduct);
    if (!product) return;

    if (product.stockQuantity < quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.stockQuantity} ${product.unit} available`,
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(product.price.toString());
    const gstRate = parseFloat(product.gstRate.toString());
    const itemTotal = price * quantity;
    const gstAmount = (itemTotal * gstRate) / 100;
    const totalAmount = itemTotal + gstAmount;

    const newItem: InvoiceItem = {
      productId: product.id,
      productName: product.name,
      hsnCode: product.hsnCode || "",
      quantity,
      unit: product.unit || "pcs",
      price,
      gstRate,
      gstAmount,
      totalAmount,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedProduct("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalGst = formData.items.reduce((sum, item) => sum + item.gstAmount, 0);
    
    let cgst = 0, sgst = 0, igst = 0;
    
    if (formData.gstType === 'cgst_sgst') {
      cgst = totalGst / 2;
      sgst = totalGst / 2;
    } else {
      igst = totalGst;
    }

    return { subtotal, cgst, sgst, igst, total: subtotal + totalGst };
  };

  const totals = calculateTotals();

  const handleSubmit = () => {
    if (!formData.customerId) {
      toast({
        title: "Missing Customer",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the invoice",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  if (authLoading) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
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
          <h1 className="text-2xl font-semibold">Create New Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Generate a GST-compliant invoice
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => {
                    const customer = customers?.find(c => c.id === value);
                    setFormData(prev => ({
                      ...prev,
                      customerId: value,
                      invoiceType: customer?.customerType || 'b2c',
                    }));
                  }}
                >
                  <SelectTrigger id="customer" data-testid="select-customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.customerType?.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-type">Invoice Type</Label>
                  <Select
                    value={formData.invoiceType}
                    onValueChange={(value: 'b2b' | 'b2c') =>
                      setFormData(prev => ({ ...prev, invoiceType: value }))
                    }
                  >
                    <SelectTrigger id="invoice-type" data-testid="select-invoice-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2b">B2B</SelectItem>
                      <SelectItem value="b2c">B2C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst-type">GST Type</Label>
                  <Select
                    value={formData.gstType}
                    onValueChange={(value: 'cgst_sgst' | 'igst') =>
                      setFormData(prev => ({ ...prev, gstType: value }))
                    }
                  >
                    <SelectTrigger id="gst-type" data-testid="select-gst-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cgst_sgst">CGST/SGST (Intra-state)</SelectItem>
                      <SelectItem value="igst">IGST (Inter-state)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Additional notes or terms..."
                  data-testid="input-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product" data-testid="select-product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(parseFloat(product.price.toString()))} ({product.stockQuantity} {product.unit} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    data-testid="input-quantity"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddItem}
                data-testid="button-add-item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.items.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">GST</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item, index) => (
                          <TableRow key={index}>
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
                            <TableCell className="text-right font-mono">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {item.gstRate}%<br />
                              <span className="text-xs text-muted-foreground">{formatCurrency(item.gstAmount)}</span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {formatCurrency(item.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                data-testid={`button-remove-item-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-mono" data-testid="text-subtotal">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {formData.gstType === 'cgst_sgst' ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CGST</span>
                          <span className="font-mono text-muted-foreground" data-testid="text-cgst">
                            {formatCurrency(totals.cgst)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">SGST</span>
                          <span className="font-mono text-muted-foreground" data-testid="text-sgst">
                            {formatCurrency(totals.sgst)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IGST</span>
                        <span className="font-mono text-muted-foreground" data-testid="text-igst">
                          {formatCurrency(totals.igst)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                      <span>Total Amount</span>
                      <span className="font-mono" data-testid="text-total">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    data-testid="button-create-invoice"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs mt-1">Add products to see invoice preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
