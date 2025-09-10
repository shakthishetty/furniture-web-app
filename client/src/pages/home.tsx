import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import FeaturedCategories from "@/components/featured-categories";
import BrandValues from "@/components/brand-values";
import NewsletterSignup from "@/components/newsletter-signup";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <HeroSection />
      <FeaturedCategories />
      <BrandValues />
      <NewsletterSignup />
      <Footer />
    </div>
  );
}
