import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DemoPayment() {
  const { paymentId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Mock payment data
  const paymentData = {
    invoiceNumber: "INV-000001",
    amount: "10,000.00",
    companyName: "GST Ease Suite",
    description: "Payment for Invoice",
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setPaymentComplete(true);
      setIsProcessing(false);

      toast({
        title: "Payment Successful! 🎉",
        description: "This is a demo payment. No actual charges were made.",
      });

      // Redirect after a delay
      setTimeout(() => {
        setLocation("/invoices");
      }, 3000);
    }, 2000);
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
            <CardDescription>Your payment has been processed successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{paymentData.amount}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Invoice: {paymentData.invoiceNumber}</p>
              <p className="mt-2">A confirmation email has been sent.</p>
            </div>
            <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              <p className="font-semibold">⚠️ Demo Mode</p>
              <p className="text-xs mt-1">This is a demonstration. No actual payment was processed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Payment Checkout</CardTitle>
          <CardDescription>Complete your payment securely</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demo Mode Banner */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm font-semibold text-yellow-800">🎭 Demo Mode</p>
            <p className="text-xs text-yellow-700 mt-1">
              This is a demonstration payment page. Click "Pay Now" to simulate a successful payment.
            </p>
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Number</span>
              <span className="font-medium">{paymentData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant</span>
              <span className="font-medium">{paymentData.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium">{paymentData.description}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₹{paymentData.amount}</span>
            </div>
          </div>

          {/* Mock Payment Methods */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-16">
                <div className="flex flex-col items-center">
                  <CreditCard className="h-6 w-6 mb-1" />
                  <span className="text-xs">Card</span>
                </div>
              </Button>
              <Button variant="outline" className="h-16">
                <div className="flex flex-col items-center">
                  <svg className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12z" />
                  </svg>
                  <span className="text-xs">UPI</span>
                </div>
              </Button>
              <Button variant="outline" className="h-16">
                <div className="flex flex-col items-center">
                  <svg className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <span className="text-xs">Net Banking</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Pay Button */}
          <Button 
            className="w-full h-12 text-lg" 
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Pay ₹{paymentData.amount}
              </>
            )}
          </Button>

          {/* Security Note */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Secured by 256-bit encryption
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
