import { Leaf, Hammer, Shield } from "lucide-react";

export default function BrandValues() {
  const values = [
    {
      icon: Leaf,
      title: "Sustainable Materials",
      description: "FSC-certified teak from responsibly managed forests"
    },
    {
      icon: Hammer,
      title: "Expert Craftsmanship",
      description: "Hand-finished by skilled artisans with decades of experience"
    },
    {
      icon: Shield,
      title: "Lifetime Warranty",
      description: "Confidence in quality with comprehensive coverage"
    }
  ];

  return (
    <section className="py-20 px-6 bg-muted">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-serif text-foreground mb-6">
              Built to Last, Designed to Love
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Every piece in our collection is meticulously crafted from sustainable teak wood, ensuring not only beauty and durability but also environmental responsibility. Our artisans combine traditional techniques with modern innovation to create furniture that tells a story.
            </p>
            
            <div className="space-y-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-start space-x-4"
                    data-testid={`value-${index}`}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1000" 
              alt="Craftsman at work" 
              className="rounded-lg shadow-2xl w-full" 
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-primary/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
