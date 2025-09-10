import { Router } from 'express';
import { storage } from './storage';
import { 
  createConfigurationSchema,
  updateConfigurationSchema,
  pricingRequestSchema,
  type CreateConfigurationRequest,
  type UpdateConfigurationRequest,
  type PricingRequest
} from '@shared/schema';

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
    
    res.json({ products });
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
    }\n    
    // Calculate material costs
    if (configuration.material) {
      const materials = await storage.getAllMaterials();
      const selectedMaterial = materials.find(m => m.id === configuration.material || m.name === configuration.material);
      
      if (selectedMaterial) {
        const multiplier = parseFloat(selectedMaterial.priceMultiplier);
        const materialCost = basePrice * multiplier - basePrice;\n        totalPrice += materialCost;\n        breakdown.materialCosts.push({\n          name: selectedMaterial.name,\n          multiplier: multiplier,\n          cost: materialCost,\n        });\n      }\n    }\n    \n    // Apply dimension-based pricing (if custom dimensions are larger/smaller than default)\n    if (configuration.dimensions) {\n      const dimensionAdjustment = calculateDimensionPricing(product, configuration.dimensions);\n      totalPrice += dimensionAdjustment;\n      \n      if (dimensionAdjustment !== 0) {\n        breakdown.adjustments.push({\n          name: 'Custom Dimensions',\n          amount: dimensionAdjustment,\n          type: 'fixed',\n        });\n      }\n    }\n    \n    breakdown.totalPrice = Math.round(totalPrice * 100) / 100; // Round to 2 decimal places\n    \n    return {\n      totalPrice: breakdown.totalPrice.toString(),\n      breakdown,\n      currency: 'USD',\n    };\n  } catch (error) {\n    console.error('Error in price calculation:', error);\n    return {\n      totalPrice: basePrice.toString(),\n      breakdown: { ...breakdown, totalPrice: basePrice },\n      currency: 'USD',\n      error: 'Could not calculate full pricing',\n    };\n  }\n}\n\nfunction calculateDimensionPricing(product: any, customDimensions: any): number {\n  try {\n    // Parse default dimensions from product\n    const defaultDims = product.dimensions ? JSON.parse(product.dimensions) : null;\n    if (!defaultDims || !customDimensions) return 0;\n    \n    // Calculate volume difference (simplified pricing model)\n    const defaultVolume = (defaultDims.width || 1) * (defaultDims.height || 1) * (defaultDims.depth || 1);\n    const customVolume = (customDimensions.width || defaultDims.width || 1) * \n                        (customDimensions.height || defaultDims.height || 1) * \n                        (customDimensions.depth || defaultDims.depth || 1);\n    \n    const volumeRatio = customVolume / defaultVolume;\n    \n    // Apply pricing: 10% price increase per 10% volume increase\n    if (volumeRatio > 1.1) {\n      return parseFloat(product.basePrice) * (volumeRatio - 1) * 0.5; // 50% of base price per volume unit\n    } else if (volumeRatio < 0.9) {\n      return parseFloat(product.basePrice) * (volumeRatio - 1) * 0.3; // 30% discount for smaller sizes\n    }\n    \n    return 0;\n  } catch (error) {\n    console.error('Error calculating dimension pricing:', error);\n    return 0;\n  }\n}\n\nexport default router;