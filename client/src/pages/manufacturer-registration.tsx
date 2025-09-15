import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Building2, CheckCircle, AlertCircle } from "lucide-react";
import { manufacturerApplicationSchema, type ManufacturerApplicationRequest } from "@shared/schema";

export default function ManufacturerRegistration() {
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManufacturerApplicationRequest>({
    resolver: zodResolver(manufacturerApplicationSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      companyName: "",
      companyAddress: "",
      phone: "",
      experience: "",
      specialties: [],
      portfolioUrls: [],
      businessLicense: "",
      certifications: [],
      notes: "",
    },
  });

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([""]);
  const [certifications, setCertifications] = useState<string[]>([""]);

  const availableSpecialties = [
    "Teak Furniture",
    "Custom Woodworking", 
    "Fine Furniture",
    "Outdoor Furniture",
    "Modern Design",
    "Traditional Craftsmanship",
    "Restoration",
    "Carving & Detailing",
    "Finishing & Polish",
    "Upholstery Integration"
  ];

  const submitApplication = useMutation({
    mutationFn: async (data: ManufacturerApplicationRequest) => {
      const response = await apiRequest("POST", "/api/auth/manufacturer-application", {
        ...data,
        specialties: specialties,
        portfolioUrls: portfolioUrls.filter(url => url.trim()),
        certifications: certifications.filter(cert => cert.trim()),
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Your manufacturer application has been submitted for review. You will receive an email notification once it's approved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ManufacturerApplicationRequest) => {
    submitApplication.mutate(data);
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setSpecialties(prev => [...prev, specialty]);
    } else {
      setSpecialties(prev => prev.filter(s => s !== specialty));
    }
  };

  const addPortfolioUrl = () => {
    setPortfolioUrls(prev => [...prev, ""]);
  };

  const updatePortfolioUrl = (index: number, value: string) => {
    setPortfolioUrls(prev => prev.map((url, i) => i === index ? value : url));
  };

  const removePortfolioUrl = (index: number) => {
    setPortfolioUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    setCertifications(prev => [...prev, ""]);
  };

  const updateCertification = (index: number, value: string) => {
    setCertifications(prev => prev.map((cert, i) => i === index ? value : cert));
  };

  const removeCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-800 mb-2">Application Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in becoming a Teak Theory manufacturing partner. 
              Your application has been submitted and is under review.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>• You will receive an email confirmation shortly</p>
              <p>• Our team will review your application within 3-5 business days</p>
              <p>• You'll be notified via email once your application is approved or if we need additional information</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/" data-testid="button-go-home">
                  Return Home
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login" data-testid="button-go-login">
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <div className="text-center">
            <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2" data-testid="text-registration-title">
              Become a Manufacturing Partner
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our network of skilled craftsmen and help bring premium teak furniture to customers worldwide. 
              Complete the application below to get started.
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your personal details for account creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    data-testid="input-first-name"
                    className={form.formState.errors.firstName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    data-testid="input-last-name"
                    className={form.formState.errors.lastName ? "border-red-500" : ""}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  data-testid="input-email"
                  className={form.formState.errors.email ? "border-red-500" : ""}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  data-testid="input-password"
                  className={form.formState.errors.password ? "border-red-500" : ""}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Details about your manufacturing business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  data-testid="input-company-name"
                  className={form.formState.errors.companyName ? "border-red-500" : ""}
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="companyAddress">Company Address *</Label>
                <Textarea
                  id="companyAddress"
                  {...form.register("companyAddress")}
                  data-testid="input-company-address"
                  className={form.formState.errors.companyAddress ? "border-red-500" : ""}
                  rows={3}
                />
                {form.formState.errors.companyAddress && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.companyAddress.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  data-testid="input-phone"
                  className={form.formState.errors.phone ? "border-red-500" : ""}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="businessLicense">Business License Number</Label>
                <Input
                  id="businessLicense"
                  {...form.register("businessLicense")}
                  data-testid="input-business-license"
                />
              </div>
            </CardContent>
          </Card>

          {/* Experience and Expertise */}
          <Card>
            <CardHeader>
              <CardTitle>Experience & Expertise</CardTitle>
              <CardDescription>
                Tell us about your manufacturing experience and specializations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="experience">Experience Description *</Label>
                <Textarea
                  id="experience"
                  {...form.register("experience")}
                  data-testid="input-experience"
                  className={form.formState.errors.experience ? "border-red-500" : ""}
                  rows={4}
                  placeholder="Describe your years of experience, types of furniture manufactured, team size, production capacity, etc."
                />
                {form.formState.errors.experience && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.experience.message}</p>
                )}
              </div>
              
              <div>
                <Label>Specialties & Expertise *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableSpecialties.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox
                        id={`specialty-${specialty}`}
                        checked={specialties.includes(specialty)}
                        onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked === true)}
                        data-testid={`checkbox-specialty-${specialty.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <Label 
                        htmlFor={`specialty-${specialty}`} 
                        className="text-sm font-normal"
                      >
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
                {specialties.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">Please select at least one specialty</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Portfolio & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio & Certifications</CardTitle>
              <CardDescription>
                Showcase your work and qualifications (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Portfolio URLs</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPortfolioUrl}>
                    Add URL
                  </Button>
                </div>
                {portfolioUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => updatePortfolioUrl(index, e.target.value)}
                      placeholder="https://your-portfolio.com"
                      data-testid={`input-portfolio-url-${index}`}
                    />
                    {portfolioUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePortfolioUrl(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Certifications</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCertification}>
                    Add Certification
                  </Button>
                </div>
                {certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={cert}
                      onChange={(e) => updateCertification(index, e.target.value)}
                      placeholder="e.g., ISO 9001, FSC Certified, etc."
                      data-testid={`input-certification-${index}`}
                    />
                    {certifications.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCertification(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  data-testid="input-notes"
                  rows={3}
                  placeholder="Any additional information you'd like to share about your capabilities, equipment, or experience..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-6">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Important Information:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• All applications are reviewed by our quality team</li>
                    <li>• Approval typically takes 3-5 business days</li>
                    <li>• You'll receive email notifications about your application status</li>
                    <li>• Only approved manufacturers can access the manufacturing portal</li>
                  </ul>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitApplication.isPending}
                data-testid="button-submit-application"
              >
                {submitApplication.isPending ? "Submitting Application..." : "Submit Application"}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}