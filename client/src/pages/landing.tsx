import { Button } from "@/components/ui/button";
import { FileText, Package, Users, BarChart3, TrendingUp, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">GST Ease</span>
              <span className="text-xs text-muted-foreground">Billing & Inventory</span>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <section className="py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Smart GST Billing &<br />Inventory Management
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Comprehensive platform to simplify GST-based billing, streamline inventory management,
            and provide smart administrative control for businesses of all sizes.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
        </section>

        <section className="grid gap-8 py-20 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">GST Billing</h3>
            <p className="text-sm text-muted-foreground">
              Generate GST-compliant invoices with automatic CGST, SGST, and IGST calculations.
              Support for B2B and B2C transactions.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Inventory Management</h3>
            <p className="text-sm text-muted-foreground">
              Real-time stock tracking with automatic updates, low-stock alerts, and product categorization.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Customer Management</h3>
            <p className="text-sm text-muted-foreground">
              Maintain comprehensive customer database with GST numbers, transaction history, and contact details.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Smart Analytics</h3>
            <p className="text-sm text-muted-foreground">
              View sales reports, revenue analytics, and tax summaries with powerful data-driven insights.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Business Growth</h3>
            <p className="text-sm text-muted-foreground">
              Make data-driven decisions with comprehensive reports and real-time business metrics.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">Role-Based Access</h3>
            <p className="text-sm text-muted-foreground">
              Secure admin control panel with role management for Admin, Staff, and Accountant users.
            </p>
          </div>
        </section>

        <section className="border-t py-20 text-center">
          <h2 className="text-3xl font-bold">Ready to streamline your business?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join businesses that trust GST Ease for accurate billing, efficient inventory management,
            and GST compliance.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-sign-in-footer"
          >
            Sign In Now
          </Button>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 GST Ease. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
