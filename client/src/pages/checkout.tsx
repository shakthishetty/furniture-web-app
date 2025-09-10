import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, CreditCard, Tag } from "lucide-react";
import AddressForm from "@/components/AddressForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Address } from "@shared/schema";

// Load Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null;

interface CheckoutItem {
  productId: string;
  configurationId?: string;
  customConfiguration?: Record<string, any>;
  quantity: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

interface CheckoutProps {
  items: CheckoutItem[];
  onSuccess?: () => void;
}

function CheckoutForm({ items, onSuccess }: CheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Fetch user addresses
  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: true,
  });

  // Calculate totals
  const subtotal = items.reduce((total, item) => total + item.totalPrice, 0);
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const taxAmount = (subtotal - discountAmount) * 0.085; // 8.5% tax
  const shippingAmount = subtotal >= 500 ? 0 : 50; // Free shipping over $500
  const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((addr: any) => addr.isDefault);
      setSelectedAddress(defaultAddr?.id || addresses[0].id);
    }
  }, [addresses, selectedAddress]);

  // Apply discount mutation
  const applyDiscountMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/discount/apply", {
        code,
        subtotal,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAppliedDiscount(data);
      toast({
        title: "Discount applied!",
        description: `You saved $${data.discountAmount.toFixed(2)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid discount code",
        description: error.message || "Please check your discount code and try again.",
        variant: "destructive",
      });
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          configurationId: item.configurationId,
          customConfiguration: item.customConfiguration,
          quantity: item.quantity,
        })),
        shippingAddressId: selectedAddress,
        billingAddressId: selectedAddress, // Using same address for billing
        discountCode: appliedDiscount?.discount?.code,
        paymentMethod: "stripe",
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.paymentIntent.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Order creation failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApplyDiscount = () => {
    if (discountCode.trim()) {
      applyDiscountMutation.mutate(discountCode.trim());
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a shipping address.",
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate();
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    });

    if (error) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment successful!",
        description: "Your order has been placed successfully.",
      });
      onSuccess?.();
    }

    setIsProcessing(false);
  };

  const handleAddressCreated = () => {
    setShowAddressForm(false);
    queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No addresses found</p>
                    <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Address
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Address</DialogTitle>
                        </DialogHeader>
                        <AddressForm onSuccess={handleAddressCreated} />
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                      {addresses.map((address: any) => (
                        <div key={address.id} className="flex items-start space-x-3">
                          <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                          <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                            <div className="p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{address.label}</span>
                                {address.isDefault && (
                                  <Badge variant="secondary">Default</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {address.firstName} {address.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.street}
                                {address.apartment && `, ${address.apartment}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Address
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Address</DialogTitle>
                        </DialogHeader>
                        <AddressForm onSuccess={handleAddressCreated} />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discount Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Discount Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">
                        {appliedDiscount.discount.code}
                      </p>
                      <p className="text-sm text-green-700">
                        You saved ${appliedDiscount.discountAmount.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDiscount}
                      className="text-green-700 hover:text-green-900"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      disabled={applyDiscountMutation.isPending}
                    />
                    <Button
                      onClick={handleApplyDiscount}
                      disabled={!discountCode.trim() || applyDiscountMutation.isPending}
                      variant="outline"
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            {clientSecret && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment}>
                    <PaymentElement />
                    <Button
                      type="submit"
                      disabled={!stripe || isProcessing}
                      className="w-full mt-6"
                      size="lg"
                    >
                      {isProcessing ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shippingAmount === 0 ? "FREE" : `$${shippingAmount.toFixed(2)}`}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {!clientSecret && (
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={!selectedAddress || createOrderMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {createOrderMutation.isPending ? "Creating Order..." : "Continue to Payment"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Example items - in a real app, these would come from props or context
  const checkoutItems: CheckoutItem[] = [
    {
      productId: "1",
      productName: "Custom Teak Dining Table",
      quantity: 1,
      unitPrice: 1299.99,
      totalPrice: 1299.99,
      configurationId: "config-1",
    },
    {
      productId: "2", 
      productName: "Ergonomic Office Chair",
      quantity: 2,
      unitPrice: 599.99,
      totalPrice: 1199.98,
    },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Payment processing is not configured.</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        items={checkoutItems}
        onSuccess={() => setLocation("/orders")}
      />
    </Elements>
  );
}