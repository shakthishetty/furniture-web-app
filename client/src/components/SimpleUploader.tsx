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

  const getUploadParams = async () => {
    const response = await apiRequest("POST", "/api/admin/objects/upload-url");
    return response.json();
  };

  const finalizeUpload = async (uploadURL: string) => {
    // Extract path from the upload URL
    const path = uploadURL.split('?')[0].split('/').pop();
    const response = await apiRequest("POST", "/api/admin/objects/finalize", {
      path,
      visibility: 'public'
    });
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

      // Get upload parameters
      const { method, url } = await getUploadParams();

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = async () => {
        try {
          if (xhr.status === 200) {
            // Finalize upload to get normalized path
            const normalizedPath = await finalizeUpload(url);
            onUploadSuccess(normalizedPath);
            setProgress(100);
          } else {
            throw new Error(`Upload failed with status ${xhr.status}`);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      xhr.onerror = () => {
        setError('Upload failed');
        setUploading(false);
      };

      xhr.open(method, url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
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