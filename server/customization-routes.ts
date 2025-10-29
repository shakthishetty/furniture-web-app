import { Router } from "express";
import { db } from "./db";
import { 
  materials, 
  productMaterials, 
  productActivity,
  createMaterialSchema,
  updateMaterialSchema,
  createProductMaterialSchema,
  updateProductMaterialSchema,
  createProductActivitySchema
} from "@shared/schema";
import { eq, and, sql, inArray, desc } from "drizzle-orm";

const router = Router();

// GET /api/admin/materials - Get all available materials (must be before /:productId)
router.get("/materials/all", async (req, res) => {
  try {
    const { type, subType } = req.query;

    let query = db.select().from(materials);
    
    const conditions = [];
    if (type) conditions.push(eq(materials.type, type as string));
    if (subType) conditions.push(eq(materials.subType, subType as string));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allMaterials = await query;

    res.json({ materials: allMaterials });
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Failed to fetch materials", details: error.message });
  }
});

// POST /api/admin/materials - Create a new material (must be before /:productId)
router.post("/materials", async (req, res) => {
  try {
    const validation = createMaterialSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid material data", 
        details: validation.error.flatten() 
      });
    }

    const [material] = await db
      .insert(materials)
      .values(validation.data)
      .returning();

    res.status(201).json(material);
  } catch (error: any) {
    console.error("Error creating material:", error);
    res.status(500).json({ error: "Failed to create material", details: error.message });
  }
});

// PATCH /api/admin/materials/:id - Update a material (must be before /:productId)
router.patch("/materials/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validation = updateMaterialSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid material data", 
        details: validation.error.flatten() 
      });
    }

    const [updatedMaterial] = await db
      .update(materials)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(materials.id, id))
      .returning();

    if (!updatedMaterial) {
      return res.status(404).json({ error: "Material not found" });
    }

    res.json(updatedMaterial);
  } catch (error: any) {
    console.error("Error updating material:", error);
    res.status(500).json({ error: "Failed to update material", details: error.message });
  }
});

// DELETE /api/admin/materials/:id - Delete a material (must be before /:productId)
router.delete("/materials/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if material is assigned to any products
    const assignments = await db
      .select()
      .from(productMaterials)
      .where(eq(productMaterials.materialId, id));

    if (assignments.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete material that is assigned to products",
        assignedCount: assignments.length
      });
    }

    await db.delete(materials).where(eq(materials.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    res.status(500).json({ error: "Failed to delete material", details: error.message });
  }
});

// GET /api/admin/customizations/:productId - Get all customizations for a product
router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // Get all product-material assignments with material details
    const productMaterialsData = await db
      .select({
        id: productMaterials.id,
        productId: productMaterials.productId,
        materialId: productMaterials.materialId,
        isEnabled: productMaterials.isEnabled,
        isDefault: productMaterials.isDefault,
        sortOrder: productMaterials.sortOrder,
        materialName: materials.name,
        materialType: materials.type,
        materialSubType: materials.subType,
        materialDescription: materials.description,
        priceModifier: materials.priceModifier,
        priceMultiplier: materials.priceMultiplier,
        textureUrl: materials.textureUrl,
        color: materials.color,
        stock: materials.stock,
        isAvailable: materials.isAvailable,
      })
      .from(productMaterials)
      .leftJoin(materials, eq(productMaterials.materialId, materials.id))
      .where(eq(productMaterials.productId, productId))
      .orderBy(productMaterials.sortOrder);

    // Group by sub-type
    const groupedMaterials = productMaterialsData.reduce((acc: any, item: any) => {
      const subType = item.materialSubType || 'other';
      if (!acc[subType]) {
        acc[subType] = [];
      }
      acc[subType].push(item);
      return acc;
    }, {});

    res.json({
      productId,
      materials: groupedMaterials,
      allMaterials: productMaterialsData
    });
  } catch (error: any) {
    console.error("Error fetching product customizations:", error);
    res.status(500).json({ error: "Failed to fetch customizations", details: error.message });
  }
});

// GET /api/admin/customizations/:productId/status - Get customization status for a product
router.get("/:productId/status", async (req, res) => {
  try {
    const { productId } = req.params;

    // Count materials by sub-type
    const materialsCount = await db
      .select({
        subType: materials.subType,
        count: sql<number>`count(*)`,
      })
      .from(productMaterials)
      .leftJoin(materials, eq(productMaterials.materialId, materials.id))
      .where(and(
        eq(productMaterials.productId, productId),
        eq(productMaterials.isEnabled, true)
      ))
      .groupBy(materials.subType);

    // Get activity stats (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activityStats = await db
      .select({
        activityType: productActivity.activityType,
        count: sql<number>`count(*)`,
      })
      .from(productActivity)
      .where(and(
        eq(productActivity.productId, productId),
        sql`${productActivity.createdAt} >= ${oneDayAgo}`
      ))
      .groupBy(productActivity.activityType);

    // Determine status
    const counts = materialsCount.reduce((acc: any, item: any) => {
      acc[item.subType || 'other'] = Number(item.count);
      return acc;
    }, {});

    const hasWoodTypes = counts['wood-type'] > 0;
    const hasWoodStains = counts['wood-stain'] > 0;
    const hasUpholstery = counts['upholstery'] > 0;
    const hasHardware = counts['hardware'] > 0;
    const hasFinish = counts['surface-finish'] > 0;

    const totalCategories = 5;
    const configuredCategories = [hasWoodTypes, hasWoodStains, hasUpholstery, hasHardware, hasFinish].filter(Boolean).length;

    let status: 'complete' | 'partial' | 'not_setup';
    if (configuredCategories === 0) {
      status = 'not_setup';
    } else if (configuredCategories === totalCategories) {
      status = 'complete';
    } else {
      status = 'partial';
    }

    res.json({
      status,
      counts,
      configuredCategories,
      totalCategories,
      activity: activityStats.reduce((acc: any, item: any) => {
        acc[item.activityType] = Number(item.count);
        return acc;
      }, {}),
    });
  } catch (error: any) {
    console.error("Error fetching customization status:", error);
    res.status(500).json({ error: "Failed to fetch status", details: error.message });
  }
});

// POST /api/admin/customizations/:productId/materials - Assign materials to product
router.post("/:productId/materials", async (req, res) => {
  try {
    const { productId } = req.params;
    const { materialIds } = req.body;

    if (!Array.isArray(materialIds) || materialIds.length === 0) {
      return res.status(400).json({ error: "materialIds must be a non-empty array" });
    }

    // Insert product-material assignments
    const assignments = materialIds.map((materialId: string, index: number) => ({
      productId,
      materialId,
      isEnabled: true,
      isDefault: index === 0, // First one is default
      sortOrder: index,
    }));

    const created = await db
      .insert(productMaterials)
      .values(assignments)
      .returning();

    res.status(201).json({ assignments: created });
  } catch (error: any) {
    console.error("Error assigning materials:", error);
    res.status(500).json({ error: "Failed to assign materials", details: error.message });
  }
});

// PATCH /api/admin/customizations/:productId/materials/:assignmentId - Update material assignment
router.patch("/:productId/materials/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const validation = updateProductMaterialSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid assignment data", 
        details: validation.error.flatten() 
      });
    }

    const [updated] = await db
      .update(productMaterials)
      .set({ ...validation.data, updatedAt: new Date() })
      .where(eq(productMaterials.id, assignmentId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating material assignment:", error);
    res.status(500).json({ error: "Failed to update assignment", details: error.message });
  }
});

// DELETE /api/admin/customizations/:productId/materials/:assignmentId - Remove material from product
router.delete("/:productId/materials/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;

    await db
      .delete(productMaterials)
      .where(eq(productMaterials.id, assignmentId));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error removing material assignment:", error);
    res.status(500).json({ error: "Failed to remove assignment", details: error.message });
  }
});

// POST /api/admin/customizations/:productId/publish - Publish customizations to users
router.post("/:productId/publish", async (req, res) => {
  try {
    const { productId } = req.params;

    // For now, this is a no-op since materials are already available
    // In the future, this could trigger cache invalidation, notifications, etc.

    console.log(`Admin ${req.user?.userId} published customizations for product ${productId}`);

    res.json({ 
      success: true, 
      message: "Customizations published successfully",
      publishedAt: new Date()
    });
  } catch (error: any) {
    console.error("Error publishing customizations:", error);
    res.status(500).json({ error: "Failed to publish customizations", details: error.message });
  }
});

// POST /api/customizations/activity - Track product activity (public endpoint)
router.post("/activity", async (req, res) => {
  try {
    const validation = createProductActivitySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid activity data", 
        details: validation.error.flatten() 
      });
    }

    const [activity] = await db
      .insert(productActivity)
      .values(validation.data)
      .returning();

    res.status(201).json(activity);
  } catch (error: any) {
    console.error("Error tracking activity:", error);
    res.status(500).json({ error: "Failed to track activity", details: error.message });
  }
});

export default router;
