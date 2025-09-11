import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, Download, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  description?: string;
  createdAt: string;
  width?: number;
  height?: number;
  blurhash?: string;
}

interface PhotoGridProps {
  photos: Photo[];
  className?: string;
  size?: "sm" | "md" | "lg";
  maxColumns?: number;
  showDescriptions?: boolean;
  onPhotoClick?: (photo: Photo, index: number) => void;
}

export function PhotoGrid({ 
  photos, 
  className, 
  size = "md",
  maxColumns = 4,
  showDescriptions = false,
  onPhotoClick
}: PhotoGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg",
          className
        )}
        data-testid="photo-grid-empty"
      >
        <div className="text-center">
          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    );
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-16 w-16";
      case "md":
        return "h-24 w-24";
      case "lg":
        return "h-32 w-32";
      default:
        return "h-24 w-24";
    }
  };

  const getGridCols = () => {
    const cols = Math.min(photos.length, maxColumns);
    switch (cols) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      default:
        return "grid-cols-4";
    }
  };

  const handlePhotoClick = (photo: Photo, index: number) => {
    if (onPhotoClick) {
      onPhotoClick(photo, index);
    } else {
      setCurrentPhotoIndex(index);
      setLightboxOpen(true);
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <div 
        className={cn(
          "grid gap-2",
          getGridCols(),
          className
        )}
        data-testid="photo-grid"
      >
        {photos.map((photo, index) => (
          <div 
            key={photo.id} 
            className={cn(
              "relative group overflow-hidden rounded-lg border bg-muted cursor-pointer transition-all hover:shadow-md",
              getSizeClasses()
            )}
            onClick={() => handlePhotoClick(photo, index)}
            data-testid={`photo-item-${photo.id}`}
          >
            <img
              src={photo.url}
              alt={photo.description || `Photo ${index + 1}`}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Photo number indicator for multiple photos */}
            {photos.length > 1 && (
              <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                {index + 1}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Description list if enabled */}
      {showDescriptions && (
        <div className="mt-2 space-y-1">
          {photos.map((photo, index) => (
            photo.description && (
              <div key={photo.id} className="text-xs text-muted-foreground">
                <span className="font-medium">{index + 1}.</span> {photo.description}
              </div>
            )
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0" data-testid="photo-lightbox">
          <div className="relative h-full bg-black rounded-lg overflow-hidden">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
              data-testid="lightbox-close"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={prevPhoto}
                  data-testid="lightbox-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={nextPhoto}
                  data-testid="lightbox-next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Current photo */}
            <div className="h-full flex items-center justify-center p-4">
              <img
                src={photos[currentPhotoIndex]?.url}
                alt={photos[currentPhotoIndex]?.description || `Photo ${currentPhotoIndex + 1}`}
                className="max-h-full max-w-full object-contain"
                data-testid={`lightbox-image-${currentPhotoIndex}`}
              />
            </div>

            {/* Photo info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  {photos[currentPhotoIndex]?.description && (
                    <p className="text-sm font-medium" data-testid="lightbox-description">
                      {photos[currentPhotoIndex].description}
                    </p>
                  )}
                  <p className="text-xs text-gray-300" data-testid="lightbox-date">
                    {formatDate(photos[currentPhotoIndex]?.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" data-testid="lightbox-counter">
                    {currentPhotoIndex + 1} of {photos.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = photos[currentPhotoIndex]?.url;
                      link.download = photos[currentPhotoIndex]?.description || `photo-${currentPhotoIndex + 1}`;
                      link.click();
                    }}
                    data-testid="lightbox-download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}