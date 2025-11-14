import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Building2, FileSpreadsheet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Vendor schema
const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

interface Vendor {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  notes?: string | null;
  createdAt: string;
}

export default function Vendors() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

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

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: isAuthenticated,
  });

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gstNumber: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      notes: "",
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create vendor",
        variant: "destructive",
      });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData & { id: number }) => {
      const { id, ...vendorData } = data;
      const response = await apiRequest("PUT", `/api/vendors/${id}`, vendorData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsAddDialogOpen(false);
      setEditingVendor(null);
      form.reset();
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/vendors/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VendorFormData) => {
    if (editingVendor) {
      updateVendorMutation.mutate({ ...data, id: editingVendor.id });
    } else {
      createVendorMutation.mutate(data);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.reset({
      name: vendor.name,
      email: vendor.email || "",
      phone: vendor.phone || "",
      gstNumber: vendor.gstNumber || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      pincode: vendor.pincode || "",
      notes: vendor.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const filteredVendors = vendors?.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.phone?.includes(searchQuery) ||
    vendor.gstNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (authLoading) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendor and supplier database
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open('/api/exports/excel/vendors', '_blank')}
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button
            onClick={() => {
              setEditingVendor(null);
              form.reset();
              setIsAddDialogOpen(true);
            }}
            data-testid="button-add-vendor"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, email, phone, or GST number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-vendors"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vendorsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Get started by adding your first vendor"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    setEditingVendor(null);
                    form.reset();
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="font-medium">{vendor.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {vendor.email && (
                            <div className="text-sm">{vendor.email}</div>
                          )}
                          {vendor.phone && (
                            <div className="text-sm text-muted-foreground">{vendor.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vendor.gstNumber ? (
                          <Badge variant="outline" className="font-mono">
                            {vendor.gstNumber}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {vendor.city && vendor.state
                            ? `${vendor.city}, ${vendor.state}`
                            : vendor.city || vendor.state || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(vendor)}
                            data-testid={`button-edit-vendor-${vendor.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteVendorMutation.mutate(vendor.id)}
                            data-testid={`button-delete-vendor-${vendor.id}`}
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

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
            <DialogDescription>
              {editingVendor ? "Update vendor information" : "Enter vendor details to add to your database"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor name" {...field} data-testid="input-vendor-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="vendor@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91-9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gstNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input placeholder="29ABCDE1234F1Z5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="560001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes about the vendor" {...field} />
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
                    setEditingVendor(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createVendorMutation.isPending || updateVendorMutation.isPending}
                  data-testid="button-submit-vendor"
                >
                  {editingVendor ? "Update Vendor" : "Add Vendor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
