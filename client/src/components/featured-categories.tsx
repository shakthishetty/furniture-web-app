export default function FeaturedCategories() {
  const categories = [
    {
      id: "living-room",
      name: "Living Room",
      itemCount: "24 pieces",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    },
    {
      id: "dining-room",
      name: "Dining Room", 
      itemCount: "18 pieces",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    },
    {
      id: "bedroom",
      name: "Bedroom",
      itemCount: "31 pieces", 
      image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    }
  ];

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif text-foreground mb-4">
            Crafted for Generations
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover timeless furniture pieces that combine traditional craftsmanship with contemporary design
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="group cursor-pointer" 
              data-testid={`category-${category.id}`}
            >
              <div className="relative overflow-hidden rounded-lg bg-card">
                <img 
                  src={category.image} 
                  alt={`${category.name} Furniture`} 
                  className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-serif mb-2">{category.name}</h3>
                  <p className="text-sm opacity-90">{category.itemCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
