export interface MaterialPreset {
  name: string;
  description: string;
  priceModifier: string;
  color?: string;
  textureUrl?: string;
}

export const woodTypePresets: MaterialPreset[] = [
  {
    name: "Teak (Sagwan)",
    description: "Premium hardwood with natural water and termite resistance. Highly durable with rich golden-brown tones.",
    priceModifier: "30%",
    color: "#D1A054",
    textureUrl: "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400",
  },
  {
    name: "Sheesham (Indian Rosewood)",
    description: "Rich brown hardwood with beautiful grain patterns. Extremely durable and strong.",
    priceModifier: "25%",
    color: "#5A3A22",
    textureUrl: "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=400",
  },
  {
    name: "Acacia",
    description: "Tough hardwood with smooth texture and distinctive wavy pattern. Sustainable choice.",
    priceModifier: "15%",
    color: "#B1814A",
    textureUrl: "https://images.unsplash.com/photo-1614267117248-4d6c355a2b3f?w=400",
  },
  {
    name: "Mango Wood",
    description: "Eco-friendly, soft hardwood with unique color variations. Sustainable and affordable.",
    priceModifier: "10%",
    color: "#C49E70",
    textureUrl: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400",
  },
  {
    name: "Mahogany",
    description: "Classic reddish-brown tone with high polish capability. Premium quality wood.",
    priceModifier: "20%",
    color: "#8B4A2F",
    textureUrl: "https://images.unsplash.com/photo-1580130732478-1637037153e3?w=400",
  },
  {
    name: "Sal Wood",
    description: "Heavy Indian hardwood commonly used in traditional furniture. Very durable.",
    priceModifier: "5%",
    color: "#A97D5D",
    textureUrl: "https://images.unsplash.com/photo-1565183928294-7d22f2d8ab6d?w=400",
  },
  {
    name: "Oak",
    description: "Strong and durable with prominent grain. Classic choice for furniture.",
    priceModifier: "18%",
    color: "#C8A882",
    textureUrl: "https://images.unsplash.com/photo-1614267118566-7a0b1b9c5b7e?w=400",
  },
  {
    name: "Engineered Wood (MDF)",
    description: "Affordable and smooth surface suitable for laminates or paint. Cost-effective option.",
    priceModifier: "-10%",
    color: "#D6CFC7",
    textureUrl: "https://images.unsplash.com/photo-1542838309-d6c3d0e5f34a?w=400",
  },
];

export const woodStainPresets: MaterialPreset[] = [
  {
    name: "Natural Teak",
    description: "Light golden-brown finish that enhances natural wood grain.",
    priceModifier: "0",
    color: "#D4A574",
  },
  {
    name: "Dark Walnut",
    description: "Rich, deep brown stain with luxurious appearance.",
    priceModifier: "5%",
    color: "#3E2723",
  },
  {
    name: "Rosewood Finish",
    description: "Reddish-brown tone with elegant look.",
    priceModifier: "5%",
    color: "#65000B",
  },
  {
    name: "Honey Oak",
    description: "Warm, golden amber tone that brightens wood.",
    priceModifier: "0",
    color: "#CC8844",
  },
  {
    name: "Ebony Black",
    description: "Deep black stain for modern, dramatic effect.",
    priceModifier: "8%",
    color: "#1C1C1C",
  },
  {
    name: "Mahogany Red",
    description: "Classic reddish-brown with warm undertones.",
    priceModifier: "5%",
    color: "#C04000",
  },
  {
    name: "Espresso",
    description: "Dark brown with slight red undertones.",
    priceModifier: "5%",
    color: "#4A2511",
  },
  {
    name: "Cherry",
    description: "Medium red-brown with smooth finish.",
    priceModifier: "5%",
    color: "#9A463D",
  },
];

export const fabricPresets: MaterialPreset[] = [
  {
    name: "Cotton",
    description: "Natural, breathable fabric. Soft and comfortable for everyday use.",
    priceModifier: "0",
    color: "#F5F5DC",
  },
  {
    name: "Linen",
    description: "Premium natural fiber with textured appearance. Highly durable.",
    priceModifier: "15%",
    color: "#E8E4C9",
  },
  {
    name: "Velvet",
    description: "Luxurious soft fabric with rich texture. Elegant and comfortable.",
    priceModifier: "30%",
    color: "#2C1810",
  },
  {
    name: "Suede",
    description: "Soft, napped finish with sophisticated look.",
    priceModifier: "25%",
    color: "#8B7355",
  },
  {
    name: "Leatherette (Faux Leather)",
    description: "Synthetic leather alternative. Easy to clean and maintain.",
    priceModifier: "20%",
    color: "#3E2723",
  },
  {
    name: "Jute",
    description: "Natural fiber with rustic charm. Eco-friendly option.",
    priceModifier: "5%",
    color: "#C9B082",
  },
  {
    name: "Polyester Blend",
    description: "Durable synthetic blend. Stain-resistant and affordable.",
    priceModifier: "-5%",
    color: "#D3D3D3",
  },
];

export const hardwarePresets: MaterialPreset[] = [
  {
    name: "Brushed Stainless Steel",
    description: "Modern matte finish with corrosion resistance.",
    priceModifier: "10%",
    color: "#C0C0C0",
  },
  {
    name: "Polished Chrome",
    description: "Shiny, reflective finish. Classic and timeless.",
    priceModifier: "8%",
    color: "#E8E8E8",
  },
  {
    name: "Matte Black",
    description: "Contemporary flat black finish. Sleek and modern.",
    priceModifier: "12%",
    color: "#1C1C1C",
  },
  {
    name: "Antique Brass",
    description: "Vintage bronze-gold tone with aged patina effect.",
    priceModifier: "15%",
    color: "#B8860B",
  },
  {
    name: "Polished Brass",
    description: "Shiny golden finish. Traditional and elegant.",
    priceModifier: "15%",
    color: "#D4AF37",
  },
  {
    name: "Copper",
    description: "Warm reddish-brown metal. Distinctive and stylish.",
    priceModifier: "18%",
    color: "#B87333",
  },
  {
    name: "Oil-Rubbed Bronze",
    description: "Dark bronze with hand-rubbed highlights.",
    priceModifier: "15%",
    color: "#4A3728",
  },
  {
    name: "Nickel",
    description: "Silver-white metal with subtle sheen.",
    priceModifier: "10%",
    color: "#B8B8B8",
  },
];

export const surfaceFinishPresets: MaterialPreset[] = [
  {
    name: "Matte Finish",
    description: "Non-reflective surface with smooth texture. Hides imperfections well.",
    priceModifier: "0",
  },
  {
    name: "Glossy Finish",
    description: "High-shine reflective surface. Easy to clean and maintain.",
    priceModifier: "5%",
  },
  {
    name: "Semi-Gloss",
    description: "Balanced sheen between matte and glossy. Versatile choice.",
    priceModifier: "3%",
  },
  {
    name: "PU Coating (Polyurethane)",
    description: "Durable protective layer. Resistant to scratches and moisture.",
    priceModifier: "10%",
  },
  {
    name: "Laminate",
    description: "Protective plastic layer with various patterns. Low maintenance.",
    priceModifier: "8%",
  },
  {
    name: "Veneer",
    description: "Thin layer of premium wood over base material. Natural wood look.",
    priceModifier: "12%",
  },
  {
    name: "Lacquer",
    description: "Hard, glossy finish with excellent durability.",
    priceModifier: "8%",
  },
  {
    name: "Oil Finish",
    description: "Natural oil penetrates wood for protection. Enhances grain.",
    priceModifier: "5%",
  },
  {
    name: "Wax Finish",
    description: "Traditional finish with soft sheen. Requires periodic reapplication.",
    priceModifier: "3%",
  },
];

export const presetsBySubType: Record<string, MaterialPreset[]> = {
  "wood-type": woodTypePresets,
  "wood-stain": woodStainPresets,
  "upholstery": fabricPresets,
  "hardware": hardwarePresets,
  "surface-finish": surfaceFinishPresets,
};
