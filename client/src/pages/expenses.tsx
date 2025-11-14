import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Edit, Trash2, Receipt, FileSpreadsheet, CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Expense schema - must match backend enum values
const expenseSchema = z.object({
  category: z.enum(["purchase", "salary", "rent", "utilities", "transport", "marketing", "other"], {
    required_error: "Category is required"
  }),
  amount: z.string().min(1, "Amount is required"),
  gstAmount: z.string().optional(),
  expenseDate: z.date({ required_error: "Date is required" }),
  vendorId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "upi", "netbanking", "razorpay", "other"], {
    required_error: "Payment method is required"
  }),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Expense {
  id: number;
  category: string;
  amount: string;
  gstAmount?: string | null;
  expenseDate: string;
  vendorId?: number | null;
  vendorName?: string | null;
  description: string;
  notes?: string | null;
  paymentMethod?: string | null;
  createdAt: string;
}

interface ExpenseSummary {
  totalExpenses: number;
  thisMonth: number;
  lastMonth: number;
  byCategory: Record<string, number>;
}

const EXPENSE_CATEGORIES = [
  { value: "purchase", label: "Purchase" },
  { value: "salary", label: "Salary" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "transport", label: "Transport" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "netbanking", label: "Net Banking" },
  { value: "razorpay", label: "Razorpay" },
  { value: "other", label: "Other" },
];

export default function Expenses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    enabled: isAuthenticated,
  });

  const { data: summary } = useQuery<ExpenseSummary>({
    queryKey: ["/api/expenses/summary"],
    enabled: isAuthenticated,
  });

  const { data: vendors } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/vendors"],
    enabled: isAuthenticated,
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "other",
      amount: "",
      gstAmount: "0",
      expenseDate: new Date(),
      vendorId: undefined,
      description: "",
      notes: "",
      paymentMethod: "cash",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const payload = {
        ...data,
        expenseDate: data.expenseDate.toISOString(),
        vendorId: data.vendorId || null,
        gstAmount: data.gstAmount || "0",
      };
      const response = await apiRequest("POST", "/api/expenses", payload);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Expense recorded successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData & { id: number }) => {
      const { id, ...expenseData } = data;
      const payload = {
        ...expenseData,
        expenseDate: expenseData.expenseDate.toISOString(),
        vendorId: expenseData.vendorId || null,
        gstAmount: expenseData.gstAmount || "0",
      };
      const response = await apiRequest("PATCH", `/api/expenses/${id}`, payload);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
      setIsAddDialogOpen(false);
      setEditingExpense(null);
      form.reset();
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/expenses/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/summary"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    if (editingExpense) {
      updateExpenseMutation.mutate({ ...data, id: editingExpense.id });
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      category: expense.category as any,
      amount: expense.amount,
      gstAmount: expense.gstAmount || "0",
      expenseDate: new Date(expense.expenseDate),
      vendorId: expense.vendorId?.toString() || undefined,
      description: expense.description,
      notes: expense.notes || "",
      paymentMethod: (expense.paymentMethod as any) || "cash",
    });
    setIsAddDialogOpen(true);
  };

  const filteredExpenses = expenses?.filter((expense) =>
    expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.vendorName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const monthChange = summary ? ((summary.thisMonth - summary.lastMonth) / (summary.lastMonth || 1)) * 100 : 0;

  if (authLoading) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage business expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open('/api/exports/excel/expenses', '_blank')}
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button
            onClick={() => {
              setEditingExpense(null);
              form.reset();
              setIsAddDialogOpen(true);
            }}
            data-testid="button-add-expense"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.totalExpenses) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.thisMonth) : formatCurrency(0)}
            </div>
            <p className={cn(
              "text-xs mt-1",
              monthChange > 0 ? "text-red-500" : "text-green-500"
            )}>
              {monthChange > 0 ? "+" : ""}{monthChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? formatCurrency(summary.lastMonth) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Previous period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses by category, description, or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-expenses"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Get started by recording your first expense"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    setEditingExpense(null);
                    form.reset();
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.expenseDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{expense.description}</div>
                      </TableCell>
                      <TableCell>
                        {expense.vendorName || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {expense.paymentMethod ? (
                          <span className="capitalize">{expense.paymentMethod.replace('_', ' ')}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                            data-testid={`button-edit-expense-${expense.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                            data-testid={`button-delete-expense-${expense.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update expense information" : "Enter expense details to record"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-expense-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-expense-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expense Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {vendors?.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the expense" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingExpense(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                  data-testid="button-submit-expense"
                >
                  {editingExpense ? "Update Expense" : "Add Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
