import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SimpleUploaderProps {
  onUploadSuccess: (url: string) => void;
  allowedTypes: string[];
  maxFileSize: number;
  children: React.ReactNode;
  className?: string;
}

export function SimpleUploader({
  onUploadSuccess,
  allowedTypes,
  maxFileSize,
  children,
  className = ""
}: SimpleUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct upload to local server (replaces signed URL approach)
  const uploadFileDirectly = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiRequest("POST", "/api/admin/objects/upload", formData);
    const result = await response.json();
    return result.path;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setProgress(0);

    // Validate file type
    if (allowedTypes.length > 0) {
      const isValidType = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type);
        }
        return file.type === type || file.type.startsWith(type.split('/')[0] + '/');
      });

      if (!isValidType) {
        setError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    try {
      setUploading(true);
      setProgress(25);

      // Direct upload to local server
      setProgress(75);
      const filePath = await uploadFileDirectly(file);
      
      // Upload complete
      setProgress(100);
      onUploadSuccess(filePath);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={allowedTypes.join(',')}
        className="hidden"
        disabled={uploading}
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={className}
      >
        {uploading ? (
          <>
            <Upload className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {children}
          </>
        )}
      </Button>

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{Math.round(progress)}% uploaded</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
          <span className="text-sm text-red-600">{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}