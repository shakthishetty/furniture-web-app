import { Router } from 'express';
import { storage } from './storage';
import { db } from './db';
import { materials, productMaterials, assets } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { 
  createConfigurationSchema,
  updateConfigurationSchema,
  pricingRequestSchema,
  type CreateConfigurationRequest,
  type UpdateConfigurationRequest,
  type PricingRequest
} from '@shared/schema';
import { calculateProductStatus, calculateCompletionPercentage } from './utils/product-status';

const router = Router();

// Product Catalog endpoints
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    
    let products;
    if (category && typeof category === 'string') {
      products = await storage.getProductsByCategory(category);
    } else {
      products = await storage.getAllProducts();
    }
    
    // Filter to only show products with active status
    const activeProducts = products.filter(product => product.status === 'active');
    
    res.json({ products: activeProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await storage.getProduct(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get published materials for a specific product (for customer configurator)
router.get('/products/:id/materials', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify product exists
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Group materials by category
    const groupedMaterials: Record<string, any[]> = {};
    
    // Helper function to fetch assets by IDs and add to grouped materials
    const fetchAndGroupAssets = async (assetIds: string[] | null, categoryKey: string) => {
      if (!assetIds || assetIds.length === 0) return;
      
      const assetsList = await db
        .select()
        .from(assets)
        .where(inArray(assets.id, assetIds));
      
      if (!groupedMaterials[categoryKey]) {
        groupedMaterials[categoryKey] = [];
      }
      
      assetsList.forEach(asset => {
        groupedMaterials[categoryKey].push({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          category: asset.category,
          color: asset.color,
          imageUrl: asset.imageUrl,
          description: asset.description
        });
      });
    };
    
    // Fetch assets for each category
    await Promise.all([
      fetchAndGroupAssets(product.woodIds, 'wood-type'),
      fetchAndGroupAssets(product.stainIds, 'wood-stain'),
      fetchAndGroupAssets(product.upholsteryIds, 'upholstery'),
      fetchAndGroupAssets(product.hardwareIds, 'hardware-finish'),
      fetchAndGroupAssets(product.finishIds, 'surface-finish')
    ]);
    
    res.json({ materials: groupedMaterials });
  } catch (error) {
    console.error('Error fetching product materials:', error);
    res.status(500).json({ error: 'Failed to fetch product materials' });
  }
});

// Configuration Options endpoints
router.get('/products/:id/options', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify product exists
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const options = await storage.getConfigurationOptions(id);
    res.json({ options });
  } catch (error) {
    console.error('Error fetching configuration options:', error);
    res.status(500).json({ error: 'Failed to fetch configuration options' });
  }
});

// Materials endpoints
router.get('/materials', async (req, res) => {
  try {
    const { type } = req.query;
    
    let materials;
    if (type && typeof type === 'string') {
      materials = await storage.getMaterialsByType(type);
    } else {
      materials = await storage.getAllMaterials();
    }
    
    res.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get a single material by ID (public endpoint for displaying order details)
router.get('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id));

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// Pricing calculation endpoint
router.post('/pricing', async (req, res) => {
  try {
    const validatedData = pricingRequestSchema.parse(req.body) as PricingRequest;
    
    // Get product base price
    const product = await storage.getProduct(validatedData.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Calculate price based on configuration
    const pricing = await calculateDynamicPricing(product, validatedData.configuration);
    
    res.json(pricing);
  } catch (error: any) {
    console.error('Error calculating pricing:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid pricing request', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to calculate pricing' });
  }
});

// Saved Configurations endpoints
router.post('/configurations', async (req, res) => {
  try {
    const validatedData = createConfigurationSchema.parse(req.body) as CreateConfigurationRequest;
    
    // Get user ID from auth token if available, otherwise allow anonymous saves
    const userId = (req as any).user?.userId || null;
    
    // Calculate total price
    const product = await storage.getProduct(validatedData.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const pricing = await calculateDynamicPricing(product, validatedData.configuration);
    const configuration = await storage.saveConfiguration(userId, validatedData);
    
    // Update the configuration with calculated price
    const updatedConfig = await storage.updateConfiguration(configuration.id, {
      configuration: validatedData.configuration,
      name: validatedData.name,
    });
    
    res.status(201).json({ 
      configuration: updatedConfig,
      pricing
    });
  } catch (error: any) {
    console.error('Error saving configuration:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid configuration data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

router.get('/configurations', async (req, res) => {
  try {
    const { public: isPublic } = req.query;
    const userId = (req as any).user?.userId;
    
    let configurations;
    if (isPublic === 'true') {
      configurations = await storage.getPublicConfigurations();
    } else if (userId) {
      configurations = await storage.getUserConfigurations(userId);
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    res.json({ configurations });
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

router.get('/configurations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const configuration = await storage.getConfiguration(id);
    
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    // Check if user has access to this configuration
    const userId = (req as any).user?.userId;
    if (!configuration.isPublic && configuration.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ configuration });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

router.put('/configurations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateConfigurationSchema.parse(req.body) as UpdateConfigurationRequest;
    
    // Check if configuration exists and user has access
    const existingConfig = await storage.getConfiguration(id);
    if (!existingConfig) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    const userId = (req as any).user?.userId;
    if (existingConfig.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedConfig = await storage.updateConfiguration(id, validatedData);
    
    res.json({ configuration: updatedConfig });
  } catch (error: any) {
    console.error('Error updating configuration:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid configuration data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

router.delete('/configurations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if configuration exists and user has access
    const existingConfig = await storage.getConfiguration(id);
    if (!existingConfig) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    const userId = (req as any).user?.userId;
    if (existingConfig.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await storage.deleteConfiguration(id);
    
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

// Dynamic pricing calculation function
async function calculateDynamicPricing(product: any, configuration: any) {
  let basePrice = parseFloat(product.basePrice);
  let totalPrice = basePrice;
  
  const breakdown = {
    basePrice: basePrice,
    adjustments: [] as Array<{ name: string; amount: number; type: 'fixed' | 'percentage' }>,
    materialCosts: [] as Array<{ name: string; multiplier: number; cost: number }>,
    totalPrice: 0,
  };
  
  try {
    // Get configuration options for this product
    const options = await storage.getConfigurationOptions(product.id);
    
    // Calculate price adjustments based on selected options
    for (const option of options) {
      const selectedValue = configuration[option.category];
      if (selectedValue && option.priceImpact) {
        const priceImpact = parseFloat(option.priceImpact);
        if (priceImpact !== 0) {
          totalPrice += priceImpact;
          breakdown.adjustments.push({
            name: `${option.name}: ${selectedValue}`,
            amount: priceImpact,
            type: 'fixed',
          });
        }
      }
    }
    
    // Calculate material costs
    if (configuration.material) {
      const materials = await storage.getAllMaterials();
      const selectedMaterial = materials.find(m => m.id === configuration.material || m.name === configuration.material);
      
      if (selectedMaterial) {
        const multiplier = parseFloat(selectedMaterial.priceMultiplier);
        const materialCost = basePrice * multiplier - basePrice;
        totalPrice += materialCost;
        breakdown.materialCosts.push({
          name: selectedMaterial.name,
          multiplier: multiplier,
          cost: materialCost,
        });
      }
    }
    
    // Apply dimension-based pricing (if custom dimensions are larger/smaller than default)
    if (configuration.dimensions) {
      const dimensionAdjustment = calculateDimensionPricing(product, configuration.dimensions);
      totalPrice += dimensionAdjustment;
      
      if (dimensionAdjustment !== 0) {
        breakdown.adjustments.push({
          name: 'Custom Dimensions',
          amount: dimensionAdjustment,
          type: 'fixed',
        });
      }
    }
    
    breakdown.totalPrice = Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
    
    return {
      totalPrice: breakdown.totalPrice.toString(),
      breakdown,
      currency: 'USD',
    };
  } catch (error) {
    console.error('Error in price calculation:', error);
    return {
      totalPrice: basePrice.toString(),
      breakdown: { ...breakdown, totalPrice: basePrice },
      currency: 'USD',
      error: 'Could not calculate full pricing',
    };
  }
}

function calculateDimensionPricing(product: any, customDimensions: any): number {
  try {
    // Parse default dimensions from product
    const defaultDims = product.dimensions ? JSON.parse(product.dimensions) : null;
    if (!defaultDims || !customDimensions) return 0;
    
    // Calculate volume difference (simplified pricing model)
    const defaultVolume = (defaultDims.width || 1) * (defaultDims.height || 1) * (defaultDims.depth || 1);
    const customVolume = (customDimensions.width || defaultDims.width || 1) * 
                        (customDimensions.height || defaultDims.height || 1) * 
                        (customDimensions.depth || defaultDims.depth || 1);
    
    const volumeRatio = customVolume / defaultVolume;
    
    // Apply pricing: 10% price increase per 10% volume increase
    if (volumeRatio > 1.1) {
      return parseFloat(product.basePrice) * (volumeRatio - 1) * 0.5; // 50% of base price per volume unit
    } else if (volumeRatio < 0.9) {
      return parseFloat(product.basePrice) * (volumeRatio - 1) * 0.3; // 30% discount for smaller sizes
    }
    
    return 0;
  } catch (error) {
    console.error('Error calculating dimension pricing:', error);
    return 0;
  }
}

export default router;