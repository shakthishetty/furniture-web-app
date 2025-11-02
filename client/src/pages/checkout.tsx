import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Tag, Loader2 } from "lucide-react";
import AddressForm from "@/components/AddressForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [showAddressForm, setShowAddressForm] = useState(false);

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
  });

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const taxAmount = (subtotal - discountAmount) * 0.085;
  const shippingAmount = subtotal >= 500 ? 0 : 50;
  const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

  const applyDiscountMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/discounts/validate", {
        discountCode: code,
        subtotal
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

  const createCheckoutMutation = useMutation({
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
        paymentMethod: "stripe",
      };

      const orderResponse = await apiRequest("POST", "/api/orders", orderData);
      const orderResult = await orderResponse.json();
      
      // Build line items to match exact order total
      const lineItems = [];
      
      // Calculate exact amounts in cents
      const subtotalCents = Math.round(subtotal * 100);
      const discountCents = Math.round(discountAmount * 100);
      const taxCents = Math.round(((subtotal - discountAmount) * 0.085) * 100);
      const shippingCents = subtotal >= 500 ? 0 : 5000; // $50
      const expectedTotalCents = subtotalCents - discountCents + taxCents + shippingCents;
      
      // Add product line items with proportional discount
      let accumulatedProductCents = 0;
      items.forEach((item, index) => {
        const isLastItem = index === items.length - 1;
        const itemSubtotalCents = Math.round(item.totalPrice * 100);
        
        let discountedItemCents;
        if (isLastItem) {
          // Last item gets the remainder to ensure exact total
          discountedItemCents = (subtotalCents - discountCents) - accumulatedProductCents;
        } else {
          // Apply proportional discount and round
          const discountFactor = discountAmount > 0 ? (subtotal - discountAmount) / subtotal : 1;
          discountedItemCents = Math.round(itemSubtotalCents * discountFactor);
          accumulatedProductCents += discountedItemCents;
        }
        
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: discountAmount > 0 
                ? `${item.productName} (${appliedDiscount?.discount?.code} applied)`
                : item.productName,
              images: item.imageUrl ? [item.imageUrl] : [],
            },
            unit_amount: Math.round(discountedItemCents / item.quantity),
          },
          quantity: item.quantity,
        });
      });
      
      // Add tax line item
      if (taxCents > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tax (8.5%)',
            },
            unit_amount: taxCents,
          },
          quantity: 1,
        });
      }
      
      // Add shipping line item
      if (shippingCents > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping',
            },
            unit_amount: shippingCents,
          },
          quantity: 1,
        });
      }

      const sessionResponse = await apiRequest("POST", "/api/create-checkout-session", {
        orderId: orderResult.order.id,
        lineItems: lineItems
      });
      
      return sessionResponse.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Could not create checkout session",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout failed",
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

  const handleCheckout = () => {
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a shipping address.",
        variant: "destructive",
      });
      return;
    }
    createCheckoutMutation.mutate();
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
          <div className="space-y-6">
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
                        <Button data-testid="button-add-address">
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
                          <RadioGroupItem 
                            value={address.id} 
                            id={address.id} 
                            className="mt-1" 
                            data-testid={`radio-address-${address.id}`}
                          />
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
                        <Button variant="outline" className="w-full" data-testid="button-add-new-address">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Discount Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedDiscount ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-900">
                            {appliedDiscount.discount.code}
                          </p>
                          <p className="text-sm text-green-700">
                            Saved ${appliedDiscount.discountAmount.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveDiscount}
                          data-testid="button-remove-discount"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter discount code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                      data-testid="input-discount-code"
                    />
                    <Button
                      onClick={handleApplyDiscount}
                      disabled={!discountCode.trim() || applyDiscountMutation.isPending}
                      variant="outline"
                      data-testid="button-apply-discount"
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3" data-testid={`order-item-${index}`}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span data-testid="text-discount">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span data-testid="text-tax">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span data-testid="text-shipping">
                      {shippingAmount === 0 ? "FREE" : `$${shippingAmount.toFixed(2)}`}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span data-testid="text-total">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={createCheckoutMutation.isPending || !selectedAddress}
                  data-testid="button-proceed-to-payment"
                >
                  {createCheckoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to payment...
                    </>
                  ) : (
                    `Proceed to Payment - $${totalAmount.toFixed(2)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const [location, setLocation] = useLocation();
  const { cart, clearCart } = useCart();

  const checkoutItems: CheckoutItem[] = (cart || []).map(item => ({
    productId: item.product.id,
    configurationId: item.configurationId,
    customConfiguration: item.customization,
    quantity: item.quantity,
    productName: item.product.name,
    unitPrice: item.customPrice || parseFloat(item.product.price),
    totalPrice: (item.customPrice || parseFloat(item.product.price)) * item.quantity,
    imageUrl: item.product.imageUrl || undefined,
  }));

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Your cart is empty</p>
            <Button onClick={() => setLocation("/products")}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSuccess = () => {
    clearCart();
    setLocation("/orders");
  };

  return <CheckoutForm items={checkoutItems} onSuccess={handleSuccess} />;
}
