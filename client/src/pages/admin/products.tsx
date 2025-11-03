import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Search, Edit2, Package, Eye, Plus, Upload, FileText, Box, Trash2, Settings, TreeDeciduous, Sofa, Wrench } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleUploader } from "@/components/SimpleUploader";
import { Model3DViewer } from "@/components/Model3DViewer";
import { CustomizationModal } from "@/components/CustomizationModal";
import { CustomizationStatusBadge } from "@/components/CustomizationStatusBadge";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  status: string;
  imageUrl?: string;
  additionalImages?: string[];
  modelUrl?: string;
  model3dUrl?: string;
  pdfUrl?: string;
  inStock: boolean;
  stock?: number;
  materials?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  // Computed status fields from backend
  computedStatus?: 'active' | 'partial' | 'out_of_stock' | 'draft';
  completionPercentage?: number;
  missingSetup?: string[];
  materialCounts?: {
    woodTypes: number;
    woodStains: number;
    upholstery: number;
    hardwareFinish: number;
    surfaceFinish: number;
  };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  status: string;
  imageUrl?: string;
  additionalImages?: string[];
  modelUrl?: string;
  model3dUrl?: string;
  pdfUrl?: string;
  inStock: boolean;
  stock?: number;
  woodIds?: string[];
  stainIds?: string[];
  upholsteryIds?: string[];
  hardwareIds?: string[];
  finishIds?: string[];
}

interface Asset {
  id: string;
  category: string;
  name: string;
  type: string;
  color?: string;
  imageUrl?: string;
}

// Component to render asset option with thumbnail
function AssetOption({ asset, icon }: { asset: Asset; icon: string }) {
  return (
    <div className="flex items-center gap-2">
      {asset.imageUrl ? (
        <img 
          src={asset.imageUrl} 
          alt={asset.name}
          className="w-8 h-8 object-cover rounded border"
        />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center bg-muted rounded border text-lg">
          {icon}
        </div>
      )}
      {asset.color && (
        <div 
          className="w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: asset.color }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{asset.name}</div>
        <div className="text-xs text-muted-foreground truncate">{asset.type}</div>
      </div>
    </div>
  );
}

// Component to show customization status for each product
function ProductCustomizationStatus({ productId }: { productId: string }) {
  const { data: statusData } = useQuery<{ status: string; counts: Record<string, number> }>({
    queryKey: ['/api/admin/customizations', productId, 'status'],
  });

  if (!statusData) {
    return null;
  }

  const status = statusData.status as 'complete' | 'partial' | 'not_setup';
  const counts = statusData.counts;

  return (
    <div className="flex items-center gap-2 mt-1" data-testid={`customization-status-${productId}`}>
      <div className="text-xs text-muted-foreground">🛠️ Customization:</div>
      <CustomizationStatusBadge status={status} />
      <div className="flex gap-1 text-xs text-muted-foreground">
        {counts['wood-type'] > 0 && (
          <Badge variant="outline" className="text-xs">
            <TreeDeciduous className="h-3 w-3 mr-1" />
            {counts['wood-type']}
          </Badge>
        )}
        {counts['upholstery'] > 0 && (
          <Badge variant="outline" className="text-xs">
            <Sofa className="h-3 w-3 mr-1" />
            {counts['upholstery']}
          </Badge>
        )}
        {counts['hardware'] > 0 && (
          <Badge variant="outline" className="text-xs">
            <Wrench className="h-3 w-3 mr-1" />
            {counts['hardware']}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    status: 'draft',
    inStock: true,
    stock: 0,
    woodIds: [],
    stainIds: [],
    upholsteryIds: [],
    hardwareIds: [],
    finishIds: []
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: '',
    imageUrl: '',
    sortOrder: 0,
    isActive: true
  });
  const { toast } = useToast();
  const limit = 20;

  const { data: productsData, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["/api/admin/products", page, search, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await apiRequest("GET", `/api/admin/products?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/categories?isActive=true");
      return response.json();
    },
  });

  // Fetch assets by category
  const { data: woodAssets } = useQuery<{ assets: Asset[] }>({
    queryKey: ["/api/admin/assets", "wood"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assets?category=wood");
      return response.json();
    },
  });

  const { data: stainAssets } = useQuery<{ assets: Asset[] }>({
    queryKey: ["/api/admin/assets", "stain"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assets?category=stain");
      return response.json();
    },
  });

  const { data: upholsteryAssets } = useQuery<{ assets: Asset[] }>({
    queryKey: ["/api/admin/assets", "upholstery"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assets?category=upholstery");
      return response.json();
    },
  });

  const { data: hardwareAssets } = useQuery<{ assets: Asset[] }>({
    queryKey: ["/api/admin/assets", "hardware"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assets?category=hardware");
      return response.json();
    },
  });

  const { data: finishAssets } = useQuery<{ assets: Asset[] }>({
    queryKey: ["/api/admin/assets", "finish"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/assets?category=finish");
      return response.json();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: Partial<Product> }) => {
      const response = await apiRequest("PATCH", `/api/admin/products/${productId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/admin/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        status: 'draft',
        inStock: true,
        stock: 0
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      imageUrl?: string;
      sortOrder: number;
      isActive: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/admin/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setIsCategoryDialogOpen(false);
      setNewCategory({
        name: '',
        description: '',
        slug: '',
        parentId: '',
        imageUrl: '',
        sortOrder: 0,
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (deletingProduct) {
      deleteProductMutation.mutate(deletingProduct.id);
    }
  };

  const handleUpdateProduct = (data: Partial<Product>) => {
    if (editingProduct) {
      const transformedData = transformProductData(data);
      updateProductMutation.mutate({ productId: editingProduct.id, data: transformedData });
    }
  };

  // Transform frontend data to match backend schema
  const transformProductData = (productData: ProductFormData | Partial<Product>) => {
    const transformed: any = {
      name: productData.name,
      description: productData.description,
      categoryId: productData.categoryId,
      // Transform price to basePrice as string
      basePrice: productData.price?.toString(),
      // Transform modelUrl to model3dUrl
      model3dUrl: (productData as any).modelUrl,
      // Keep additionalImages as array for frontend, transform for backend
      additionalImages: productData.additionalImages ? JSON.stringify(productData.additionalImages) : undefined,
      // Map status values to backend expectations
      status: productData.status === 'draft' ? 'inactive' : 
              productData.status === 'active' ? 'active' : 
              productData.status === 'archived' ? 'out_of_stock' :
              productData.status || 'inactive',
      imageUrl: productData.imageUrl,
      pdfUrl: (productData as any).pdfUrl,
      inStock: productData.inStock,
      stock: productData.stock
    };
    
    // Remove undefined values
    Object.keys(transformed).forEach(key => {
      if (transformed[key] === undefined) {
        delete transformed[key];
      }
    });
    
    return transformed;
  };

  const handleCreateProduct = () => {
    const transformedData = transformProductData(newProduct);
    createProductMutation.mutate(transformedData as any);
  };

  // File upload helper functions are now handled inside SimpleUploader component

  const handleFileUpload = (url: string, fileType: string, isEditing: boolean = false) => {
    if (isEditing && editingProduct) {
      if (fileType === 'image') {
        if (!editingProduct.additionalImages) {
          setEditingProduct({ ...editingProduct, additionalImages: [url] });
        } else {
          setEditingProduct({ 
            ...editingProduct, 
            additionalImages: [...editingProduct.additionalImages, url] 
          });
        }
      } else if (fileType === 'pdf') {
        setEditingProduct({ ...editingProduct, pdfUrl: url });
      } else if (fileType === '3d') {
        setEditingProduct({ ...editingProduct, modelUrl: url });
      }
    } else {
      // For new product creation
      if (fileType === 'image') {
        if (!newProduct.additionalImages) {
          setNewProduct({ ...newProduct, additionalImages: [url] });
        } else {
          setNewProduct({ 
            ...newProduct, 
            additionalImages: [...newProduct.additionalImages, url] 
          });
        }
      } else if (fileType === 'pdf') {
        setNewProduct({ ...newProduct, pdfUrl: url });
      } else if (fileType === '3d') {
        setNewProduct({ ...newProduct, modelUrl: url });
      }
    }
  };

  const getComputedStatusBadge = (computedStatus?: string) => {
    switch (computedStatus) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-300">🟢 Active</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">🟡 Partial</Badge>;
      case "out_of_stock":
        return <Badge className="bg-red-100 text-red-800 border-red-300">🔴 Out of Stock</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">⚪ Draft</Badge>;
      default:
        return <Badge variant="outline">{computedStatus || 'Unknown'}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryData = categoriesData?.categories.find(c => c.slug === category);
    const displayName = categoryData?.name || category.replace("-", " ");
    
    const colors = {
      "living-room": "bg-blue-100 text-blue-800",
      "dining": "bg-green-100 text-green-800",
      "bedroom": "bg-purple-100 text-purple-800",
      "study": "bg-orange-100 text-orange-800",
      "outdoor": "bg-yellow-100 text-yellow-800",
    };
    
    return (
      <Badge variant="outline" className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {displayName}
      </Badge>
    );
  };

  const getCategoryNameById = (categoryId?: string) => {
    if (!categoryId) return "Uncategorized";
    const category = categoriesData?.categories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-products-title">Products</h1>
          <p className="text-muted-foreground" data-testid="text-products-description">
            Manage your product catalog
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-muted-foreground" />
            <span className="text-2xl font-bold" data-testid="text-total-products">
              {productsData?.total || 0}
            </span>
          </div>
          <Button 
            variant="outline"
            onClick={() => setIsCategoryDialogOpen(true)}
            data-testid="button-create-category"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-product"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-products"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="living-room">Living Room</SelectItem>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            {productsData ? `${productsData.products.length} of ${productsData.total} products` : "Loading products..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : productsData?.products.length ? (
            <div className="space-y-4">
              {productsData.products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded hover:bg-muted/50" data-testid={`product-row-${product.id}`}>
                  <div className="flex gap-4">
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                        data-testid={`img-product-${product.id}`}
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </span>
                        <span className="font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`text-product-description-${product.id}`}>
                        {product.description?.slice(0, 100)}...
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {product.categoryId ? getCategoryBadge(product.category) : <Badge variant="outline">Uncategorized</Badge>}
                        {getComputedStatusBadge(product.computedStatus)}
                        {product.additionalImages && product.additionalImages.length > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Upload className="h-3 w-3 mr-1" />
                            {product.additionalImages.length} images
                          </Badge>
                        )}
                        {product.pdfUrl && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </Badge>
                        )}
                        {(product.modelUrl || product.model3dUrl) && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            <Box className="h-3 w-3 mr-1" />
                            3D Model
                          </Badge>
                        )}
                        {product.stock !== undefined && product.stock > 0 && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                            📦 {product.stock} in stock
                          </Badge>
                        )}
                      </div>
                      {/* Customization Completion Progress */}
                      {product.completionPercentage !== undefined && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">🛠️ Customization: {product.completionPercentage}% complete</span>
                            {product.missingSetup && product.missingSetup.length > 0 && (
                              <span className="text-yellow-600 text-xs">
                                Missing: {product.missingSetup.join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                product.completionPercentage === 100 
                                  ? 'bg-green-500' 
                                  : product.completionPercentage >= 50 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${product.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProduct(product)}
                      data-testid={`button-view-product-${product.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                      data-testid={`button-edit-product-${product.id}`}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomizingProduct(product);
                        setIsCustomizationModalOpen(true);
                      }}
                      data-testid={`button-options-product-${product.id}`}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Options
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product)}
                      data-testid={`button-delete-product-${product.id}`}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {productsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4" data-testid="text-page-info">
                    Page {page} of {productsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === productsData.totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-products">No products found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="dialog-view-product">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              View complete product information
            </DialogDescription>
          </DialogHeader>
          
          {viewingProduct && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
              {viewingProduct.imageUrl && (
                <div className="relative">
                  <img 
                    src={viewingProduct.imageUrl} 
                    alt={viewingProduct.name}
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <p className="font-medium">{viewingProduct.name}</p>
                </div>
                <div>
                  <Label>Price</Label>
                  <p className="font-medium">{formatPrice(viewingProduct.price)}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="font-medium">{getCategoryNameById(viewingProduct.categoryId) || viewingProduct.category}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="font-medium">{viewingProduct.status}</p>
                </div>
                <div>
                  <Label>Stock Status</Label>
                  <p className="font-medium">{viewingProduct.inStock ? "In Stock" : "Out of Stock"}</p>
                </div>
                {viewingProduct.stock && (
                  <div>
                    <Label>Stock Count</Label>
                    <p className="font-medium">{viewingProduct.stock}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{viewingProduct.description}</p>
              </div>
              
              {viewingProduct.materials && viewingProduct.materials.length > 0 && (
                <div>
                  <Label>Materials</Label>
                  <div className="flex gap-2 mt-1">
                    {viewingProduct.materials.map((material, index) => (
                      <Badge key={index} variant="outline">{material}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {viewingProduct.dimensions && (
                <div>
                  <Label>Dimensions</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingProduct.dimensions.width}W × {viewingProduct.dimensions.height}H × {viewingProduct.dimensions.depth}D cm
                  </p>
                </div>
              )}
              
              {/* Additional Images */}
              {viewingProduct.additionalImages && viewingProduct.additionalImages.length > 0 && (
                <div>
                  <Label>Additional Images</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {viewingProduct.additionalImages.map((imageUrl, index) => (
                      <img 
                        key={index}
                        src={imageUrl} 
                        alt={`${viewingProduct.name} - ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* PDF Document */}
              {viewingProduct.pdfUrl && (
                <div>
                  <Label>Product Documentation</Label>
                  <a 
                    href={viewingProduct.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-1"
                  >
                    <FileText className="h-4 w-4" />
                    View PDF Documentation
                  </a>
                </div>
              )}
              
              {/* 3D Model Viewer */}
              {(viewingProduct.model3dUrl || viewingProduct.modelUrl) && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <Label className="mb-3 block text-base font-semibold">3D Model</Label>
                  <Model3DViewer 
                    modelUrl={viewingProduct.model3dUrl || viewingProduct.modelUrl!}
                    width={600}
                    height={400}
                    className="mx-auto rounded-lg overflow-hidden border bg-white"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} data-testid="button-close-view">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-product">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  data-testid="textarea-edit-description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    data-testid="input-edit-price"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock Count</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                    data-testid="input-edit-stock"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editingProduct.categoryId || ''} onValueChange={(value) => {
                    const selectedCategory = categoriesData?.categories.find(c => c.id === value);
                    setEditingProduct({ 
                      ...editingProduct, 
                      categoryId: value,
                      category: selectedCategory?.slug || '' 
                    });
                  }}>
                    <SelectTrigger data-testid="select-edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesData?.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editingProduct.status} onValueChange={(value) => setEditingProduct({ ...editingProduct, status: value })}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* File Uploads Section */}
              <div className="space-y-4">
                <Separator />
                <h3 className="text-lg font-medium">File Management</h3>
                
                {/* Main Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="edit-image">Primary Image URL</Label>
                  <Input
                    id="edit-image"
                    value={editingProduct.imageUrl || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    data-testid="input-edit-image"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Upload Additional Images</Label>
                  <SimpleUploader
                    onUploadSuccess={(url: string) => handleFileUpload(url, 'image', true)}
                    allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                  >
                    Upload Images
                  </SimpleUploader>
                  {editingProduct.additionalImages && editingProduct.additionalImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {editingProduct.additionalImages.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={imageUrl} 
                            alt={`Additional ${index + 1}`}
                            className="w-full h-16 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => {
                              const newImages = editingProduct.additionalImages?.filter((_, i) => i !== index);
                              setEditingProduct({ ...editingProduct, additionalImages: newImages });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* PDF Upload */}
                <div className="space-y-2">
                  <Label>Product Documentation (PDF)</Label>
                  <SimpleUploader
                    onUploadSuccess={(url: string) => handleFileUpload(url, 'pdf', true)}
                    allowedTypes={['application/pdf']}
                    maxFileSize={10 * 1024 * 1024} // 10MB
                  >
                    Upload PDF
                  </SimpleUploader>
                  {editingProduct.pdfUrl && (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">PDF attached</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct({ ...editingProduct, pdfUrl: undefined })}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* 3D Model Upload */}
                <div className="space-y-2">
                  <Label>3D Model (GLB format)</Label>
                  <SimpleUploader
                    onUploadSuccess={(url: string) => handleFileUpload(url, '3d', true)}
                    allowedTypes={['model/gltf-binary', '.glb']}
                    maxFileSize={50 * 1024 * 1024} // 50MB
                  >
                    Upload 3D Model
                  </SimpleUploader>
                  {editingProduct.modelUrl && (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <Box className="h-4 w-4" />
                      <span className="text-sm">3D Model attached</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct({ ...editingProduct, modelUrl: undefined })}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateProduct(editingProduct!)}
              disabled={updateProductMutation.isPending}
              data-testid="button-save-product"
            >
              {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-product">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Product Name *</Label>
                <Input
                  id="create-name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  data-testid="input-create-name"
                  placeholder="Enter product name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-price">Price *</Label>
                <Input
                  id="create-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  data-testid="input-create-price"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                data-testid="textarea-create-description"
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-category">Category *</Label>
                <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}>
                  <SelectTrigger data-testid="select-create-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-status">Status</Label>
                <Select value={newProduct.status} onValueChange={(value) => setNewProduct({ ...newProduct, status: value })}>
                  <SelectTrigger data-testid="select-create-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-stock">Stock Count</Label>
                <Input
                  id="create-stock"
                  type="number"
                  min="0"
                  value={newProduct.stock || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                  data-testid="input-create-stock"
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* File Uploads Section */}
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-medium">File Management</h3>
              
              {/* Primary Image URL */}
              <div className="space-y-2">
                <Label htmlFor="create-image">Primary Image URL</Label>
                <Input
                  id="create-image"
                  value={newProduct.imageUrl || ""}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  data-testid="input-create-image"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              {/* Additional Images Upload */}
              <div className="space-y-2">
                <Label>Upload Additional Images</Label>
                <SimpleUploader
                  onUploadSuccess={(url: string) => handleFileUpload(url, 'image', false)}
                  allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                >
                  Upload Images
                </SimpleUploader>
                {newProduct.additionalImages && newProduct.additionalImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {newProduct.additionalImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Additional ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => {
                            const newImages = newProduct.additionalImages?.filter((_, i) => i !== index);
                            setNewProduct({ ...newProduct, additionalImages: newImages });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* PDF Upload */}
              <div className="space-y-2">
                <Label>Product Documentation (PDF)</Label>
                <SimpleUploader
                  onUploadSuccess={(url: string) => handleFileUpload(url, 'pdf', false)}
                  allowedTypes={['application/pdf']}
                  maxFileSize={10 * 1024 * 1024} // 10MB
                >
                  Upload PDF
                </SimpleUploader>
                {newProduct.pdfUrl && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">PDF attached</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewProduct({ ...newProduct, pdfUrl: undefined })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              
              {/* 3D Model Upload */}
              <div className="space-y-2">
                <Label>3D Model (GLB format)</Label>
                <SimpleUploader
                  onUploadSuccess={(url: string) => handleFileUpload(url, '3d', false)}
                  allowedTypes={['model/gltf-binary', '.glb']}
                  maxFileSize={50 * 1024 * 1024} // 50MB
                >
                  Upload 3D Model
                </SimpleUploader>
                {newProduct.modelUrl && (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Box className="h-4 w-4" />
                    <span className="text-sm">3D Model attached</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewProduct({ ...newProduct, modelUrl: undefined })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Material Selection Section */}
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-medium">Material Selection</h3>
              <p className="text-sm text-muted-foreground">Select multiple materials for each category from your Assets library.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wood Type Multi-Selection */}
                <div className="space-y-2">
                  <Label htmlFor="create-wood">Wood Types</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newProduct.woodIds?.includes(value)) {
                        setNewProduct({ 
                          ...newProduct, 
                          woodIds: [...(newProduct.woodIds || []), value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-create-wood">
                      <SelectValue placeholder="Add wood type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {woodAssets?.assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          🪵 {asset.name} — {asset.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newProduct.woodIds && newProduct.woodIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newProduct.woodIds.map((id) => {
                        const asset = woodAssets?.assets.find(a => a.id === id);
                        if (!asset) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-sm">
                            {asset.imageUrl ? (
                              <img src={asset.imageUrl} alt={asset.name} className="w-6 h-6 object-cover rounded" />
                            ) : (
                              <span className="text-base">🪵</span>
                            )}
                            <span className="font-medium">{asset.name}</span>
                            <button
                              type="button"
                              onClick={() => setNewProduct({ 
                                ...newProduct, 
                                woodIds: newProduct.woodIds?.filter(i => i !== id) 
                              })}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Stain Multi-Selection */}
                <div className="space-y-2">
                  <Label htmlFor="create-stain">Stains</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newProduct.stainIds?.includes(value)) {
                        setNewProduct({ 
                          ...newProduct, 
                          stainIds: [...(newProduct.stainIds || []), value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-create-stain">
                      <SelectValue placeholder="Add stain..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stainAssets?.assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          🎨 {asset.name} — {asset.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newProduct.stainIds && newProduct.stainIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newProduct.stainIds.map((id) => {
                        const asset = stainAssets?.assets.find(a => a.id === id);
                        if (!asset) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-sm">
                            {asset.imageUrl ? (
                              <img src={asset.imageUrl} alt={asset.name} className="w-6 h-6 object-cover rounded" />
                            ) : (
                              <span className="text-base">🎨</span>
                            )}
                            <span className="font-medium">{asset.name}</span>
                            <button
                              type="button"
                              onClick={() => setNewProduct({ 
                                ...newProduct, 
                                stainIds: newProduct.stainIds?.filter(i => i !== id) 
                              })}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Upholstery Multi-Selection */}
                <div className="space-y-2">
                  <Label htmlFor="create-upholstery">Upholstery</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newProduct.upholsteryIds?.includes(value)) {
                        setNewProduct({ 
                          ...newProduct, 
                          upholsteryIds: [...(newProduct.upholsteryIds || []), value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-create-upholstery">
                      <SelectValue placeholder="Add upholstery..." />
                    </SelectTrigger>
                    <SelectContent>
                      {upholsteryAssets?.assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          🛋️ {asset.name} — {asset.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newProduct.upholsteryIds && newProduct.upholsteryIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newProduct.upholsteryIds.map((id) => {
                        const asset = upholsteryAssets?.assets.find(a => a.id === id);
                        if (!asset) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-sm">
                            {asset.imageUrl ? (
                              <img src={asset.imageUrl} alt={asset.name} className="w-6 h-6 object-cover rounded" />
                            ) : (
                              <span className="text-base">🛋️</span>
                            )}
                            <span className="font-medium">{asset.name}</span>
                            <button
                              type="button"
                              onClick={() => setNewProduct({ 
                                ...newProduct, 
                                upholsteryIds: newProduct.upholsteryIds?.filter(i => i !== id) 
                              })}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Hardware Multi-Selection */}
                <div className="space-y-2">
                  <Label htmlFor="create-hardware">Hardware</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newProduct.hardwareIds?.includes(value)) {
                        setNewProduct({ 
                          ...newProduct, 
                          hardwareIds: [...(newProduct.hardwareIds || []), value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-create-hardware">
                      <SelectValue placeholder="Add hardware..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hardwareAssets?.assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          🔩 {asset.name} — {asset.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newProduct.hardwareIds && newProduct.hardwareIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newProduct.hardwareIds.map((id) => {
                        const asset = hardwareAssets?.assets.find(a => a.id === id);
                        if (!asset) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-sm">
                            {asset.imageUrl ? (
                              <img src={asset.imageUrl} alt={asset.name} className="w-6 h-6 object-cover rounded" />
                            ) : (
                              <span className="text-base">🔩</span>
                            )}
                            <span className="font-medium">{asset.name}</span>
                            <button
                              type="button"
                              onClick={() => setNewProduct({ 
                                ...newProduct, 
                                hardwareIds: newProduct.hardwareIds?.filter(i => i !== id) 
                              })}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Finish Multi-Selection */}
                <div className="space-y-2">
                  <Label htmlFor="create-finish">Finishes</Label>
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newProduct.finishIds?.includes(value)) {
                        setNewProduct({ 
                          ...newProduct, 
                          finishIds: [...(newProduct.finishIds || []), value] 
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-create-finish">
                      <SelectValue placeholder="Add finish..." />
                    </SelectTrigger>
                    <SelectContent>
                      {finishAssets?.assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          ✨ {asset.name} — {asset.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newProduct.finishIds && newProduct.finishIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newProduct.finishIds.map((id) => {
                        const asset = finishAssets?.assets.find(a => a.id === id);
                        if (!asset) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 p-2 border rounded bg-muted/50 text-sm">
                            {asset.imageUrl ? (
                              <img src={asset.imageUrl} alt={asset.name} className="w-6 h-6 object-cover rounded" />
                            ) : (
                              <span className="text-base">✨</span>
                            )}
                            <span className="font-medium">{asset.name}</span>
                            <button
                              type="button"
                              onClick={() => setNewProduct({ 
                                ...newProduct, 
                                finishIds: newProduct.finishIds?.filter(i => i !== id) 
                              })}
                              className="ml-1 text-muted-foreground hover:text-foreground"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProduct}
              disabled={createProductMutation.isPending || !newProduct.name || !newProduct.categoryId || !newProduct.price}
              data-testid="button-create-product-submit"
            >
              {createProductMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-category">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category for organizing products
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  value={newCategory.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewCategory({ ...newCategory, name, slug });
                  }}
                  data-testid="input-category-name"
                  placeholder="Enter category name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category-slug">Slug *</Label>
                <Input
                  id="category-slug"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  data-testid="input-category-slug"
                  placeholder="category-slug"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                data-testid="input-category-description"
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-parent">Parent Category</Label>
                <Select value={newCategory.parentId || 'none'} onValueChange={(value) => setNewCategory({ ...newCategory, parentId: value === 'none' ? '' : value })}>
                  <SelectTrigger data-testid="select-parent-category">
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level Category)</SelectItem>
                    {categoriesData?.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category-sort">Sort Order</Label>
                <Input
                  id="category-sort"
                  type="number"
                  min="0"
                  value={newCategory.sortOrder}
                  onChange={(e) => setNewCategory({ ...newCategory, sortOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-category-sort"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category-image">Image URL</Label>
              <Input
                id="category-image"
                value={newCategory.imageUrl}
                onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                data-testid="input-category-image"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} data-testid="button-cancel-category">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Normalize optional fields
                const categoryData = {
                  ...newCategory,
                  description: newCategory.description || undefined,
                  parentId: newCategory.parentId || undefined,
                  imageUrl: newCategory.imageUrl || undefined,
                };
                createCategoryMutation.mutate(categoryData);
              }}
              disabled={createCategoryMutation.isPending || !newCategory.name || !newCategory.slug}
              data-testid="button-create-category-submit"
            >
              {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-delete-product">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deletingProduct && (
            <div className="space-y-4 py-4">
              <div className="p-4 border rounded bg-muted/50">
                <div className="flex items-center gap-3">
                  {deletingProduct.imageUrl && (
                    <img 
                      src={deletingProduct.imageUrl} 
                      alt={deletingProduct.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{deletingProduct.name}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(deletingProduct.price)}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This will permanently remove the product from your catalog. Any associated orders will still reference this product.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteProduct}
              disabled={deleteProductMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customization Modal */}
      {customizingProduct && (
        <CustomizationModal
          productId={customizingProduct.id}
          productName={customizingProduct.name}
          open={isCustomizationModalOpen}
          onOpenChange={setIsCustomizationModalOpen}
        />
      )}
    </div>
  );
}