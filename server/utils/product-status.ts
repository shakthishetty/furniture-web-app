/**
 * Product Status Calculation Utilities
 * 
 * Automatically determines product status based on:
 * - Stock levels
 * - Customization setup completeness
 * - Active/inactive state
 */

export interface ProductMaterialCounts {
  woodTypes: number;
  woodStains: number;
  upholstery: number;
  hardwareFinish: number;
  surfaceFinish: number;
}

export interface ProductStatusResult {
  computedStatus: 'active' | 'partial' | 'out_of_stock' | 'draft';
  completionPercentage: number;
  missingSetup: string[];
}

/**
 * Calculate customization completion percentage
 * 
 * Expected setup for a fully configured product:
 * - At least 1 wood type option
 * - At least 1 wood stain option
 * - At least 1 upholstery option (for chairs)
 * - At least 1 hardware finish option
 * - At least 1 surface finish option
 */
export function calculateCompletionPercentage(
  materialCounts: ProductMaterialCounts,
  isChair: boolean = false
): { percentage: number; missingSetup: string[] } {
  const missingSetup: string[] = [];
  let totalCategories = 4; // wood type, wood stain, hardware, surface finish
  let completedCategories = 0;

  // For chairs, upholstery is also expected
  if (isChair) {
    totalCategories = 5;
  }

  if (materialCounts.woodTypes > 0) {
    completedCategories++;
  } else {
    missingSetup.push('Wood Type');
  }

  if (materialCounts.woodStains > 0) {
    completedCategories++;
  } else {
    missingSetup.push('Wood Stain');
  }

  if (materialCounts.hardwareFinish > 0) {
    completedCategories++;
  } else {
    missingSetup.push('Hardware Finish');
  }

  if (materialCounts.surfaceFinish > 0) {
    completedCategories++;
  } else {
    missingSetup.push('Surface Finish');
  }

  if (isChair) {
    if (materialCounts.upholstery > 0) {
      completedCategories++;
    } else {
      missingSetup.push('Upholstery');
    }
  }

  const percentage = Math.round((completedCategories / totalCategories) * 100);
  
  return { percentage, missingSetup };
}

/**
 * Determine product status based on stock and setup completeness
 * 
 * Status Priority:
 * 1. Draft - Product is marked as inactive/draft
 * 2. Out of Stock - stock <= 0 or inStock = false
 * 3. Partial - Customization setup incomplete (< 100%)
 * 4. Active - In stock, complete setup, and marked as active
 */
export function calculateProductStatus(
  product: {
    status?: string;
    stock?: number;
    inStock?: boolean;
    category?: string;
  },
  materialCounts: ProductMaterialCounts
): ProductStatusResult {
  const isChair = product.category?.toLowerCase().includes('chair') || false;
  const { percentage, missingSetup } = calculateCompletionPercentage(materialCounts, isChair);

  // Draft status (inactive or explicitly draft)
  if (product.status === 'inactive' || product.status === 'draft') {
    return {
      computedStatus: 'draft',
      completionPercentage: percentage,
      missingSetup
    };
  }

  // Out of Stock status
  if (product.inStock === false || (product.stock !== undefined && product.stock <= 0)) {
    return {
      computedStatus: 'out_of_stock',
      completionPercentage: percentage,
      missingSetup
    };
  }

  // Partial status (incomplete setup)
  if (percentage < 100) {
    return {
      computedStatus: 'partial',
      completionPercentage: percentage,
      missingSetup
    };
  }

  // Active status (everything is good)
  return {
    computedStatus: 'active',
    completionPercentage: 100,
    missingSetup: []
  };
}

/**
 * Get status badge properties for UI display
 */
export function getStatusBadgeProps(status: string): {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        emoji: '🟢',
        color: 'text-green-700',
        bgColor: 'bg-green-100'
      };
    case 'partial':
      return {
        label: 'Partial',
        emoji: '🟡',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100'
      };
    case 'out_of_stock':
      return {
        label: 'Out of Stock',
        emoji: '🔴',
        color: 'text-red-700',
        bgColor: 'bg-red-100'
      };
    case 'draft':
      return {
        label: 'Draft',
        emoji: '⚪',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100'
      };
    default:
      return {
        label: 'Unknown',
        emoji: '❓',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100'
      };
  }
}
