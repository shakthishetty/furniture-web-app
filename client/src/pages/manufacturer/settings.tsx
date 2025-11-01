import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Lock, User, Building, Mail, Phone, MapPin } from "lucide-react";

interface ManufacturerProfile {
  id: string;
  email: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notificationPreferences?: {
    emailNotifications: boolean;
    newOrderAlerts: boolean;
    customerQuestionAlerts: boolean;
    stageDeadlineReminders: boolean;
  };
}

export default function ManufacturerSettings() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch manufacturer profile
  const { data: profileData, isLoading } = useQuery<{ manufacturer: ManufacturerProfile }>({
    queryKey: ["/api/manufacturer/auth/me"],
  });

  const manufacturer = profileData?.manufacturer;

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [customerQuestionAlerts, setCustomerQuestionAlerts] = useState(true);
  const [stageDeadlineReminders, setStageDeadlineReminders] = useState(true);

  // Sync notification preferences when data loads
  useEffect(() => {
    if (manufacturer?.notificationPreferences) {
      setEmailNotifications(manufacturer.notificationPreferences.emailNotifications ?? true);
      setNewOrderAlerts(manufacturer.notificationPreferences.newOrderAlerts ?? true);
      setCustomerQuestionAlerts(manufacturer.notificationPreferences.customerQuestionAlerts ?? true);
      setStageDeadlineReminders(manufacturer.notificationPreferences.stageDeadlineReminders ?? true);
    }
  }, [manufacturer?.notificationPreferences]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ManufacturerProfile>) => {
      const response = await apiRequest("PATCH", "/api/manufacturer/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/auth/me"] });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/manufacturer/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to change password", 
        description: error.message || "Please check your current password",
        variant: "destructive" 
      });
    },
  });

  // Update notification preferences mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await apiRequest("PATCH", "/api/manufacturer/notification-preferences", preferences);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notification preferences updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/auth/me"] });
    },
    onError: () => {
      toast({ title: "Failed to update preferences", variant: "destructive" });
    },
  });

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate({
      emailNotifications,
      newOrderAlerts,
      customerQuestionAlerts,
      stageDeadlineReminders,
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="manufacturer-settings">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="text-settings-title">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card data-testid="card-profile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company Name
              </Label>
              <Input
                id="company-name"
                value={manufacturer?.companyName || ""}
                disabled
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-person" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Person
              </Label>
              <Input
                id="contact-person"
                value={manufacturer?.contactPerson || ""}
                disabled
                data-testid="input-contact-person"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={manufacturer?.email || ""}
                disabled
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                value={manufacturer?.phone || ""}
                disabled
                data-testid="input-phone"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Input
              id="address"
              value={manufacturer?.address || ""}
              disabled
              data-testid="input-address"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={manufacturer?.city || ""}
                disabled
                data-testid="input-city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={manufacturer?.state || ""}
                disabled
                data-testid="input-state"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipcode">Zip Code</Label>
              <Input
                id="zipcode"
                value={manufacturer?.zipCode || ""}
                disabled
                data-testid="input-zipcode"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            To update your profile information, please contact the administrator.
          </p>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card data-testid="card-password">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="input-current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="input-confirm-password"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || updatePasswordMutation.isPending}
            data-testid="button-change-password"
          >
            {updatePasswordMutation.isPending ? "Updating..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card data-testid="card-notifications">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              data-testid="switch-email-notifications"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-order-alerts" className="text-base">New Order Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new orders are assigned to you
              </p>
            </div>
            <Switch
              id="new-order-alerts"
              checked={newOrderAlerts}
              onCheckedChange={setNewOrderAlerts}
              data-testid="switch-new-order-alerts"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="customer-question-alerts" className="text-base">Customer Question Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when customers ask questions
              </p>
            </div>
            <Switch
              id="customer-question-alerts"
              checked={customerQuestionAlerts}
              onCheckedChange={setCustomerQuestionAlerts}
              data-testid="switch-customer-question-alerts"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="stage-deadline-reminders" className="text-base">Stage Deadline Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about upcoming stage deadlines
              </p>
            </div>
            <Switch
              id="stage-deadline-reminders"
              checked={stageDeadlineReminders}
              onCheckedChange={setStageDeadlineReminders}
              data-testid="switch-stage-deadline-reminders"
            />
          </div>

          <Button
            onClick={handleSaveNotifications}
            disabled={updateNotificationsMutation.isPending}
            data-testid="button-save-notifications"
          >
            {updateNotificationsMutation.isPending ? "Saving..." : "Save Notification Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
