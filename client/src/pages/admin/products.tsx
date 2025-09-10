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
import { Search, Edit2, Package, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: string;
  imageUrl?: string;
  inStock: boolean;
  stock?: number;
  materials?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleUpdateProduct = (data: Partial<Product>) => {
    if (editingProduct) {
      updateProductMutation.mutate({ productId: editingProduct.id, data });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case "draft":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Draft</Badge>;
      case "archived":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      "living-room": "bg-blue-100 text-blue-800",
      "dining": "bg-green-100 text-green-800",
      "bedroom": "bg-purple-100 text-purple-800",
      "study": "bg-orange-100 text-orange-800",
      "outdoor": "bg-yellow-100 text-yellow-800",
    };
    
    return (
      <Badge variant="outline" className={colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {category.replace("-", " ")}
      </Badge>
    );
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
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8 text-muted-foreground" />
          <span className="text-2xl font-bold" data-testid="text-total-products">
            {productsData?.total || 0}
          </span>
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
                      <div className="flex gap-2">
                        {getCategoryBadge(product.category)}
                        {getStatusBadge(product.status)}
                        {!product.inStock && (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </div>
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
        <DialogContent className="max-w-2xl" data-testid="dialog-view-product">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>
              View complete product information
            </DialogDescription>
          </DialogHeader>
          
          {viewingProduct && (
            <div className="space-y-4 py-4">
              {viewingProduct.imageUrl && (
                <img 
                  src={viewingProduct.imageUrl} 
                  alt={viewingProduct.name}
                  className="w-full h-48 object-cover rounded"
                />
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
                  <p className="font-medium">{viewingProduct.category}</p>
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
                  <Select value={editingProduct.category} onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}>
                    <SelectTrigger data-testid="select-edit-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="living-room">Living Room</SelectItem>
                      <SelectItem value="dining">Dining</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
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
              
              <div className="space-y-2">
                <Label htmlFor="edit-image">Image URL</Label>
                <Input
                  id="edit-image"
                  value={editingProduct.imageUrl || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  data-testid="input-edit-image"
                />
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
    </div>
  );
}