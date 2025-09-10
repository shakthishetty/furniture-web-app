import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would implement the actual newsletter subscription API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter",
      });
      
      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-serif text-foreground mb-4">
          Stay Connected
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Be the first to know about new collections, exclusive offers, and design inspiration
        </p>
        
        <form 
          onSubmit={handleSubmit}
          className="max-w-md mx-auto flex gap-4"
          data-testid="newsletter-form"
        >
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            data-testid="input-email"
            disabled={isSubmitting}
          />
          <Button 
            type="submit"
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
            disabled={isSubmitting}
            data-testid="button-subscribe"
          >
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
