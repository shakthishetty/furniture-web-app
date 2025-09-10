import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Mail, Globe, Shield, Bell, Database, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    // Site Settings
    siteName: "Teak Theory",
    siteDescription: "Premium sustainable furniture crafted from responsibly sourced teak wood",
    siteUrl: "https://teaktheory.com",
    adminEmail: "admin@teaktheory.com",
    supportEmail: "support@teaktheory.com",
    
    // Business Settings
    currency: "USD",
    timezone: "America/New_York",
    taxRate: 8.5,
    shippingFee: 25.00,
    freeShippingThreshold: 500.00,
    
    // Email Settings
    emailNotifications: true,
    orderConfirmationEmails: true,
    lowStockAlerts: true,
    weeklyReports: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 24,
    passwordExpiry: 90,
    loginAttempts: 5,
    
    // Feature Flags
    maintenanceMode: false,
    newRegistrations: true,
    guestCheckout: true,
    productReviews: true,
    wishlist: true,
    
    // Payment Settings
    stripeEnabled: true,
    paypalEnabled: true,
    bankTransferEnabled: false,
    
    // Inventory Settings
    lowStockThreshold: 10,
    autoReorderEnabled: false,
    trackInventory: true,
  });

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings Saved",
      description: "All settings have been updated successfully.",
    });
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      // Reset to default values
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground" data-testid="text-settings-description">
            Manage application configuration and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8 text-muted-foreground" />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset-settings">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} data-testid="button-save-settings">
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
          </div>
        </div>
      </div>

      {/* Site Configuration */}
      <Card data-testid="card-site-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Site Configuration
          </CardTitle>
          <CardDescription>Basic site information and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                data-testid="input-site-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-url">Site URL</Label>
              <Input
                id="site-url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                data-testid="input-site-url"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea
              id="site-description"
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              data-testid="textarea-site-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                data-testid="input-support-email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card data-testid="card-business-settings">
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
          <CardDescription>Configure business rules and regional settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                <SelectTrigger data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                data-testid="input-tax-rate"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-fee">Shipping Fee ($)</Label>
              <Input
                id="shipping-fee"
                type="number"
                step="0.01"
                value={settings.shippingFee}
                onChange={(e) => setSettings({ ...settings, shippingFee: parseFloat(e.target.value) })}
                data-testid="input-shipping-fee"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="free-shipping">Free Shipping Threshold ($)</Label>
              <Input
                id="free-shipping"
                type="number"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) })}
                data-testid="input-free-shipping"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email & Notifications */}
      <Card data-testid="card-email-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email & Notifications
          </CardTitle>
          <CardDescription>Configure email notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Enable general email notifications</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                data-testid="switch-email-notifications"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="order-confirmation">Order Confirmation Emails</Label>
                <p className="text-sm text-muted-foreground">Send confirmation emails for new orders</p>
              </div>
              <Switch
                id="order-confirmation"
                checked={settings.orderConfirmationEmails}
                onCheckedChange={(checked) => setSettings({ ...settings, orderConfirmationEmails: checked })}
                data-testid="switch-order-confirmation"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="low-stock">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
              </div>
              <Switch
                id="low-stock"
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, lowStockAlerts: checked })}
                data-testid="switch-low-stock"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-reports">Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Receive weekly performance summaries</p>
              </div>
              <Switch
                id="weekly-reports"
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
                data-testid="switch-weekly-reports"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card data-testid="card-security-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Configure security and authentication options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
            </div>
            <Switch
              id="two-factor"
              checked={settings.twoFactorAuth}
              onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              data-testid="switch-two-factor"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                data-testid="input-session-timeout"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-expiry">Password Expiry (days)</Label>
              <Input
                id="password-expiry"
                type="number"
                value={settings.passwordExpiry}
                onChange={(e) => setSettings({ ...settings, passwordExpiry: parseInt(e.target.value) })}
                data-testid="input-password-expiry"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-attempts">Max Login Attempts</Label>
              <Input
                id="login-attempts"
                type="number"
                value={settings.loginAttempts}
                onChange={(e) => setSettings({ ...settings, loginAttempts: parseInt(e.target.value) })}
                data-testid="input-login-attempts"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card data-testid="card-feature-flags">
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Enable or disable application features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Put site in maintenance mode</p>
              </div>
              <Switch
                id="maintenance"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                data-testid="switch-maintenance"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="registrations">New Registrations</Label>
                <p className="text-sm text-muted-foreground">Allow new user registrations</p>
              </div>
              <Switch
                id="registrations"
                checked={settings.newRegistrations}
                onCheckedChange={(checked) => setSettings({ ...settings, newRegistrations: checked })}
                data-testid="switch-registrations"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="guest-checkout">Guest Checkout</Label>
                <p className="text-sm text-muted-foreground">Allow checkout without registration</p>
              </div>
              <Switch
                id="guest-checkout"
                checked={settings.guestCheckout}
                onCheckedChange={(checked) => setSettings({ ...settings, guestCheckout: checked })}
                data-testid="switch-guest-checkout"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="product-reviews">Product Reviews</Label>
                <p className="text-sm text-muted-foreground">Enable customer product reviews</p>
              </div>
              <Switch
                id="product-reviews"
                checked={settings.productReviews}
                onCheckedChange={(checked) => setSettings({ ...settings, productReviews: checked })}
                data-testid="switch-product-reviews"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card data-testid="card-payment-methods">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Configure accepted payment options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="stripe">Stripe</Label>
                <Badge variant="default" className="bg-blue-100 text-blue-800">Recommended</Badge>
              </div>
              <Switch
                id="stripe"
                checked={settings.stripeEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
                data-testid="switch-stripe"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="paypal">PayPal</Label>
                <p className="text-sm text-muted-foreground">Accept PayPal payments</p>
              </div>
              <Switch
                id="paypal"
                checked={settings.paypalEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, paypalEnabled: checked })}
                data-testid="switch-paypal"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bank-transfer">Bank Transfer</Label>
                <p className="text-sm text-muted-foreground">Accept direct bank transfers</p>
              </div>
              <Switch
                id="bank-transfer"
                checked={settings.bankTransferEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, bankTransferEnabled: checked })}
                data-testid="switch-bank-transfer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Management */}
      <Card data-testid="card-inventory-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Inventory Management
          </CardTitle>
          <CardDescription>Configure inventory tracking and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
              <Input
                id="low-stock-threshold"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
                data-testid="input-low-stock-threshold"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="track-inventory">Track Inventory</Label>
                <p className="text-sm text-muted-foreground">Enable inventory tracking</p>
              </div>
              <Switch
                id="track-inventory"
                checked={settings.trackInventory}
                onCheckedChange={(checked) => setSettings({ ...settings, trackInventory: checked })}
                data-testid="switch-track-inventory"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-reorder">Auto Reorder</Label>
              <p className="text-sm text-muted-foreground">Automatically reorder low stock items</p>
            </div>
            <Switch
              id="auto-reorder"
              checked={settings.autoReorderEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, autoReorderEnabled: checked })}
              data-testid="switch-auto-reorder"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}