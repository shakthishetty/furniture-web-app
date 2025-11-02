import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, CreditCard, Tag, AlertCircle, CheckCircle } from "lucide-react";
import AddressForm from "@/components/AddressForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Address } from "@shared/schema";

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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Create order and get payment intent for Stripe
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
        billingAddressId: selectedAddress,
        discountCode: appliedDiscount?.discount?.code,
        paymentMethod: useRealPayment ? "stripe" : "dummy_payment",
        paymentDetails: useRealPayment ? null : {
          method: paymentMethod,
          cardLast4: cardNumber.slice(-4),
          cardType: "Visa",
        },
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      if (useRealPayment && data.paymentIntent) {
        // For Stripe payments, set client secret for Stripe Elements
        setClientSecret(data.paymentIntent.clientSecret);
        setOrderId(data.order.id);
      } else {
        // For dummy payments, show success immediately
        toast({
          title: "Order placed successfully!",
          description: `Order #${data.order.orderNumber} has been created.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        onSuccess?.();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Order creation failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment successful!",
      description: "Your order has been placed.",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    onSuccess?.();
  };

  const handlePaymentError = (errorMessage: string) => {
    toast({
      title: "Payment failed",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleApplyDiscount = () => {
    if (discountCode.trim()) {
      applyDiscountMutation.mutate(discountCode.trim());
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const handleContinueToPayment = () => {
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a shipping address.",
        variant: "destructive",
      });
      return;
    }
    setShowPaymentForm(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // For demo mode, validate fields
    if (!useRealPayment) {
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        toast({
          title: "Incomplete payment information",
          description: "Please fill in all payment fields.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);
    createOrderMutation.mutate();
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
            {showPaymentForm && !clientSecret && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                  {!useRealPayment && (
                    <p className="text-sm text-orange-600 flex items-center gap-1 mt-2">
                      <AlertCircle className="h-4 w-4" />
                      This is a demo checkout - no real payments will be processed
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Payment Mode Toggle */}
                  {stripePromise && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useRealPayment}
                          onChange={(e) => setUseRealPayment(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">Use real Stripe payment (test mode)</span>
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        {useRealPayment 
                          ? "You will be charged using Stripe test mode. Use test card: 4242 4242 4242 4242"
                          : "Demo mode - order will be created without real payment processing"}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handlePayment} className="space-y-4">
                    {!useRealPayment && (
                      <>
                        <div>
                          <Label htmlFor="payment-method">Payment Method</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="debit_card">Debit Card</SelectItem>
                              <SelectItem value="paypal">PayPal (Demo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {paymentMethod !== "paypal" && (
                          <>
                            <div>
                              <Label htmlFor="cardholder-name">Cardholder Name</Label>
                              <Input
                                id="cardholder-name"
                                placeholder="John Doe"
                                value={cardholderName}
                                onChange={(e) => setCardholderName(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="card-number">Card Number</Label>
                              <Input
                                id="card-number"
                                placeholder="4242 4242 4242 4242"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                maxLength={19}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Input
                                  id="expiry"
                                  placeholder="MM/YY"
                                  value={expiryDate}
                                  onChange={(e) => setExpiryDate(e.target.value)}
                                  maxLength={5}
                                />
                              </div>
                              <div>
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                  id="cvv"
                                  placeholder="123"
                                  value={cvv}
                                  onChange={(e) => setCvv(e.target.value)}
                                  maxLength={4}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2 text-green-700">Demo Payment</h4>
                          <p className="text-sm text-green-600">
                            ✅ This is a demo - all payments will succeed automatically!
                          </p>
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      disabled={isProcessing || createOrderMutation.isPending}
                      className="w-full"
                      size="lg"
                      data-testid="button-complete-order"
                    >
                      {isProcessing || createOrderMutation.isPending ? (
                        "Processing..."
                      ) : useRealPayment ? (
                        `Continue to Payment - $${totalAmount.toFixed(2)}`
                      ) : (
                        `Complete Order - $${totalAmount.toFixed(2)}`
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Stripe Payment Elements */}
            {showPaymentForm && clientSecret && stripePromise && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Complete Payment
                  </CardTitle>
                  <p className="text-sm text-blue-600 flex items-center gap-1 mt-2">
                    <CheckCircle className="h-4 w-4" />
                    Secure payment powered by Stripe
                  </p>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm
                      totalAmount={totalAmount}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </Elements>
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

                {!showPaymentForm && (
                  <Button
                    onClick={handleContinueToPayment}
                    disabled={!selectedAddress}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Payment
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
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { items, clearCart } = useCart();

  // Convert cart items to checkout items format
  const checkoutItems: CheckoutItem[] = items.map(item => ({
    productId: item.productId,
    configurationId: item.configurationId,
    customConfiguration: item.customConfiguration,
    productName: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    totalPrice: item.price * item.quantity,
    imageUrl: item.imageUrl,
  }));

  useEffect(() => {
    // Redirect to cart if no items
    if (items.length === 0) {
      setLocation("/cart");
    }
  }, [items.length, setLocation]);

  // Show loading during auth check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#254127] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Allow checkout without authentication for demo purposes
  if (items.length === 0) {
    return null;
  }

  return (
    <CheckoutForm
      items={checkoutItems}
      onSuccess={() => {
        clearCart();
        setLocation("/orders");
      }}
    />
  );
}