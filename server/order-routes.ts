import type { Express } from "express";
import { storage } from "./storage";
import { requireAuth } from "./utils/auth";
import {
  createAddressSchema,
  updateAddressSchema,
  createOrderSchema,
  cancelOrderSchema,
  createWishlistItemSchema,
  applyDiscountSchema,
  type CreateAddressRequest,
  type UpdateAddressRequest,
  type CreateOrderRequest,
  type CancelOrderRequest,
  type CreateWishlistItemRequest,
  type ApplyDiscountRequest,
} from "@shared/schema";
import Stripe from "stripe";

// Initialize Stripe (will be conditional based on available secrets)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Utility functions
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TK${timestamp.slice(-6)}${random}`;
}

function calculateDiscount(subtotal: number, discount: any): number {
  if (discount.discountType === "percentage") {
    return (subtotal * parseFloat(discount.discountValue)) / 100;
  } else {
    return parseFloat(discount.discountValue);
  }
}

function calculateTax(subtotal: number): number {
  // Simple 8.5% tax rate - in production this would be based on shipping address
  return subtotal * 0.085;
}

function calculateShipping(subtotal: number): number {
  // Free shipping over $500, otherwise $50
  return subtotal >= 500 ? 0 : 50;
}

export function registerOrderRoutes(app: Express): void {
  // ========== ADDRESS MANAGEMENT ==========
  
  // Get user addresses (demo-friendly)
  app.get("/api/addresses", async (req, res) => {
    try {
      const userId = req.user?.userId || "demo-user";

      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  // Create new address (demo-friendly)
  app.post("/api/addresses", async (req, res) => {
    try {
      const userId = req.user?.userId || "demo-user";

      const validation = createAddressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid address data",
          errors: validation.error.errors 
        });
      }

      const address = await storage.createAddress(userId, validation.data);
      res.status(201).json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  // Update address (demo-friendly)
  app.put("/api/addresses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || "demo-user";

      // For demo purposes, allow updating any address
      const existingAddress = await storage.getAddress(id);
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      const validation = updateAddressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid address data",
          errors: validation.error.errors 
        });
      }

      const address = await storage.updateAddress(id, validation.data);
      res.json(address);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });

  // Delete address (demo-friendly)
  app.delete("/api/addresses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || "demo-user";

      // For demo purposes, allow deleting any address
      const existingAddress = await storage.getAddress(id);
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      await storage.deleteAddress(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  // Set default address (demo-friendly)
  app.put("/api/addresses/:id/default", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || "demo-user";

      // For demo purposes, allow setting any address as default
      const existingAddress = await storage.getAddress(id);
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }

      await storage.setDefaultAddress(userId, id);
      res.json({ message: "Default address updated" });
    } catch (error) {
      console.error("Error setting default address:", error);
      res.status(500).json({ message: "Failed to set default address" });
    }
  });

  // ========== DISCOUNT CODES ==========

  // Apply discount code (demo-friendly)
  app.post("/api/discount/apply", async (req, res) => {
    try {
      const validation = applyDiscountSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid discount data",
          errors: validation.error.errors 
        });
      }

      const { code, subtotal } = validation.data;
      const result = await storage.validateDiscountCode(code, subtotal);
      
      if (!result.valid) {
        return res.status(400).json({ message: result.error });
      }

      const discountAmount = calculateDiscount(subtotal, result.discount);
      
      res.json({
        valid: true,
        discount: result.discount,
        discountAmount,
        newSubtotal: subtotal - discountAmount
      });
    } catch (error) {
      console.error("Error applying discount:", error);
      res.status(500).json({ message: "Failed to apply discount" });
    }
  });

  // ========== ORDER MANAGEMENT ==========

  // Create order and initiate payment
  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validation = createOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid order data",
          errors: validation.error.errors 
        });
      }

      const orderData = validation.data;

      // Calculate pricing
      let subtotal = 0;
      const orderItems = [];

      for (const item of orderData.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }

        // Calculate item price based on configuration
        let itemPrice = parseFloat(product.basePrice);
        // TODO: Apply configuration pricing logic here
        
        const totalPrice = itemPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          productId: item.productId,
          configurationId: item.configurationId || null,
          customConfiguration: item.customConfiguration ? JSON.stringify(item.customConfiguration) : null,
          quantity: item.quantity,
          unitPrice: itemPrice.toString(),
          totalPrice: totalPrice.toString(),
          productName: product.name,
          productImage: product.imageUrl,
        });
      }

      // Apply discount if provided
      let discountAmount = 0;
      if (orderData.discountCode) {
        const discountResult = await storage.validateDiscountCode(orderData.discountCode, subtotal);
        if (discountResult.valid && discountResult.discount) {
          discountAmount = calculateDiscount(subtotal, discountResult.discount);
        }
      }

      const discountedSubtotal = subtotal - discountAmount;
      const taxAmount = calculateTax(discountedSubtotal);
      const shippingAmount = calculateShipping(discountedSubtotal);
      const totalAmount = discountedSubtotal + taxAmount + shippingAmount;

      // Create order in database
      const orderNumber = generateOrderNumber();
      const order = await storage.createOrder({
        ...orderData,
        userId,
        orderNumber,
        subtotal: discountedSubtotal,
        totalAmount,
      });

      let paymentResponse;
      
      if (orderData.paymentMethod === "dummy_payment") {
        // Handle dummy payment for testing
        await storage.updateOrderPayment(order.id, {
          stripePaymentIntentId: `dummy_${Date.now()}`,
          paymentStatus: "paid" // Immediately mark as paid for dummy payments
        });
        
        // Update order status
        await storage.updateOrderStatus(order.id, "paid");
        
        paymentResponse = {
          success: true,
          orderNumber: order.orderNumber,
          paymentMethod: "dummy",
          message: "Demo payment completed successfully"
        };
      } else if (stripe) {
        // Handle real Stripe payment
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            userId,
            orderType: "furniture_order"
          }
        });
        
        await storage.updateOrderPayment(order.id, {
          stripePaymentIntentId: paymentIntent.id,
          paymentStatus: "pending"
        });
        
        paymentResponse = {
          paymentIntent: {
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
          }
        };
      } else {
        return res.status(500).json({ message: "Payment processing not configured" });
      }

      // Create order items
      for (const item of orderItems) {
        await storage.createOrderItem({
          orderId: order.id,
          ...item,
        });
      }

      // Mark discount code as used if applicable
      if (orderData.discountCode) {
        await storage.useDiscountCode(orderData.discountCode);
      }

      res.status(201).json({
        ...paymentResponse,
        order,
        pricing: {
          subtotal,
          discountAmount,
          taxAmount,
          shippingAmount,
          totalAmount,
        }
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Get user orders
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const orders = await storage.getUserOrders(userId);
      
      // Add tracking information to each order
      const ordersWithTracking = await Promise.all(
        orders.map(async (order) => {
          const manufacturingProcess = await storage.getManufacturingProcessByOrderId(order.id);
          return {
            ...order,
            hasTracking: !!manufacturingProcess,
            trackingStatus: manufacturingProcess?.status || null
          };
        })
      );
      
      res.json(ordersWithTracking);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get specific order with items
  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const order = await storage.getOrderWithItems(id);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Add tracking information
      const manufacturingProcess = await storage.getManufacturingProcessByOrderId(order.id);
      const orderWithTracking = {
        ...order,
        hasTracking: !!manufacturingProcess,
        trackingStatus: manufacturingProcess?.status || null
      };

      res.json(orderWithTracking);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Cancel order
  app.post("/api/orders/:id/cancel", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validation = cancelOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid cancellation data",
          errors: validation.error.errors 
        });
      }

      const order = await storage.getOrder(id);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === "canceled") {
        return res.status(400).json({ message: "Order already canceled" });
      }

      if (order.status === "shipped" || order.status === "delivered") {
        return res.status(400).json({ message: "Cannot cancel shipped or delivered orders" });
      }

      // Cancel the order
      const canceledOrder = await storage.cancelOrder(id, validation.data);

      // Process refund if payment was completed
      if (order.paymentStatus === "paid" && order.stripePaymentIntentId && stripe) {
        const refundPercentage = parseFloat(order.refundPercentage || "100");
        const refundAmount = (parseFloat(order.totalAmount) * refundPercentage) / 100;

        try {
          const refund = await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            amount: Math.round(refundAmount * 100), // Convert to cents
          });

          // Record refund in database
          await storage.createRefund({
            orderId: id,
            amount: refundAmount.toString(),
            reason: validation.data.reason,
            status: "processed",
            stripeRefundId: refund.id,
            paypalRefundId: null,
            processedAt: new Date(),
          });

          await storage.updateOrderPayment(id, {
            paymentStatus: "refunded"
          });

        } catch (refundError) {
          console.error("Error processing refund:", refundError);
          // Order is still canceled, but refund failed
          await storage.createRefund({
            orderId: id,
            amount: refundAmount.toString(),
            reason: validation.data.reason,
            status: "failed",
            stripeRefundId: null,
            paypalRefundId: null,
            processedAt: null,
          });
        }
      }

      res.json(canceledOrder);
    } catch (error) {
      console.error("Error canceling order:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // Download invoice
  app.get("/api/orders/:id/invoice", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const order = await storage.getOrder(id);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get order items separately
      const orderItems = await storage.getOrderItems(id);
      
      // Generate invoice data (in production, this would create a proper PDF)
      const invoiceData = {
        orderNumber: order.orderNumber,
        date: order.createdAt,
        customer: {
          name: "Customer", // In production, get from user/address table
          email: "customer@teaktheory.com"
        },
        items: orderItems || [],
        subtotal: order.subtotal,
        discountAmount: order.discountAmount || "0",
        taxAmount: order.taxAmount || "0",
        shippingAmount: order.shippingAmount || "0",
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        status: order.status
      };

      // Create a simple HTML invoice (in production, convert to PDF)
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .company { font-size: 24px; font-weight: bold; color: #254127; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .totals { text-align: right; margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #254127; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">TEAK THEORY</div>
            <p>Premium Sustainable Furniture</p>
          </div>
          
          <div class="invoice-details">
            <div>
              <h3>Invoice #${order.orderNumber}</h3>
              <p>Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
              <p>Status: ${order.status.toUpperCase()}</p>
            </div>
            <div>
              <h3>Bill To:</h3>
              <p>${invoiceData.customer.name}</p>
              <p>${invoiceData.customer.email}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(orderItems || []).map(item => `
                <tr>
                  <td>${item.productName || 'Product'}</td>
                  <td>${item.quantity || 1}</td>
                  <td>$${parseFloat(item.unitPrice || "0").toFixed(2)}</td>
                  <td>$${parseFloat(item.totalPrice || "0").toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${parseFloat(order.subtotal || "0").toFixed(2)}</span>
            </div>
            ${parseFloat(order.discountAmount || "0") > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-$${parseFloat(order.discountAmount || "0").toFixed(2)}</span>
            </div>` : ''}
            ${parseFloat(order.taxAmount || "0") > 0 ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>$${parseFloat(order.taxAmount || "0").toFixed(2)}</span>
            </div>` : ''}
            ${parseFloat(order.shippingAmount || "0") > 0 ? `
            <div class="total-row">
              <span>Shipping:</span>
              <span>$${parseFloat(order.shippingAmount || "0").toFixed(2)}</span>
            </div>` : ''}
            <div class="total-row final-total">
              <span>Total:</span>
              <span>$${parseFloat(order.totalAmount || "0").toFixed(2)}</span>
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            <p>Thank you for your business!</p>
            <p>TEAK THEORY - Sustainable Furniture Crafted with Care</p>
          </div>
        </body>
        </html>
      `;

      // Set headers for HTML download (in production, use PDF)
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.html"`);
      res.send(invoiceHTML);
      
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // Webhook for Stripe payment confirmation
  app.post("/api/orders/stripe-webhook", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    try {
      const event = req.body;

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        
        // Find order by payment intent ID
        const orders = await storage.getUserOrders(paymentIntent.metadata.userId);
        const order = orders.find(o => o.stripePaymentIntentId === paymentIntent.id);

        if (order) {
          await storage.updateOrderPayment(order.id, {
            stripeChargeId: paymentIntent.charges?.data[0]?.id,
            paymentStatus: "paid"
          });

          await storage.updateOrderStatus(order.id, "processing", "Payment confirmed");
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // ========== WISHLIST ==========

  // Get user wishlist
  app.get("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const wishlist = await storage.getUserWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  // Add to wishlist
  app.post("/api/wishlist", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validation = createWishlistItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid wishlist data",
          errors: validation.error.errors 
        });
      }

      // Check if item already in wishlist
      const exists = await storage.isInWishlist(userId, validation.data.productId);
      if (exists) {
        return res.status(400).json({ message: "Item already in wishlist" });
      }

      const wishlistItem = await storage.addToWishlist(userId, validation.data);
      res.status(201).json(wishlistItem);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  // Remove from wishlist
  app.delete("/api/wishlist/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      await storage.removeFromWishlist(userId, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Check if item is in wishlist
  app.get("/api/wishlist/check/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const inWishlist = await storage.isInWishlist(userId, productId);
      res.json({ inWishlist });
    } catch (error) {
      console.error("Error checking wishlist:", error);
      res.status(500).json({ message: "Failed to check wishlist" });
    }
  });
}