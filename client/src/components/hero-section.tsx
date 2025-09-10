import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="hero-bg min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="hero-title text-5xl md:text-7xl font-bold text-white mb-6">
          Designed to Be Passed Down,
          <br />
          <span className="hero-subtitle text-4xl md:text-6xl">Not Thrown Away</span>
        </h1>
        
        <div className="mt-12">
          <Button 
            className="cta-button bg-white text-primary px-8 py-4 text-lg font-semibold rounded hover:bg-background transition-all duration-300"
            data-testid="button-explore-collection"
          >
            Explore Collection
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Discover More</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
