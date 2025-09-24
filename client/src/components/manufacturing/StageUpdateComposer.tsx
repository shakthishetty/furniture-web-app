import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Camera, 
  Lock, 
  Eye, 
  Upload,
  X,
  AlertCircle
} from "lucide-react";
import { SimpleUploader } from "@/components/SimpleUploader";

const stageUpdateSchema = z.object({
  message: z.string().min(1, "Update message is required").max(1000, "Message too long"),
  isInternal: z.boolean().default(false),
  photos: z.array(z.string()).optional().default([])
});

type StageUpdateFormData = z.infer<typeof stageUpdateSchema>;

interface StageUpdateComposerProps {
  stageId: string;
  processId: string;
  userRole: "manufacturer" | "admin";
  className?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  showTitle?: boolean;
  compact?: boolean;
  autoFocus?: boolean;
}

export function StageUpdateComposer({
  stageId,
  processId,
  userRole,
  className,
  onSuccess,
  onCancel,
  placeholder = "Share an update about this manufacturing stage...",
  showTitle = true,
  compact = false,
  autoFocus = false
}: StageUpdateComposerProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StageUpdateFormData>({
    resolver: zodResolver(stageUpdateSchema),
    defaultValues: {
      message: "",
      isInternal: false,
      photos: []
    }
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (data: StageUpdateFormData) => {
      const endpoint = userRole === "admin" 
        ? `/api/admin/manufacturing/processes/${processId}/stages/${stageId}/updates`
        : `/api/manufacturer/processes/${processId}/stages/${stageId}/updates`;
      
      const response = await apiRequest("POST", endpoint, {
        ...data,
        photos: uploadedPhotos
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturing/processes', processId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/manufacturing/processes'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/manufacturer/processes'] 
      });
      
      toast({
        title: "Update Created",
        description: "Your stage update has been posted successfully.",
      });
      
      // Reset form
      form.reset();
      setUploadedPhotos([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Update",
        description: error.message || "There was an error creating your update.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StageUpdateFormData) => {
    createUpdateMutation.mutate({
      ...data,
      photos: uploadedPhotos
    });
  };

  const handlePhotoUpload = (urls: string[]) => {
    setUploadedPhotos(prev => [...prev, ...urls]);
  };

  const removePhoto = (urlToRemove: string) => {
    setUploadedPhotos(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleCancel = () => {
    form.reset();
    setUploadedPhotos([]);
    onCancel?.();
  };

  const isInternal = form.watch("isInternal");
  const message = form.watch("message");

  return (
    <Card className={cn("w-full", className)} data-testid="stage-update-composer">
      {showTitle && (
        <CardHeader className={cn("pb-3", compact && "py-3")}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-4 w-4" />
            Create Stage Update
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-4", compact && "py-3")}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Message field */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={placeholder}
                      className={cn(
                        "min-h-[100px] resize-none",
                        compact && "min-h-[80px]"
                      )}
                      autoFocus={autoFocus}
                      data-testid="update-message-textarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Character count and length warning */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {message.length}/1000 characters
              </span>
              {message.length > 900 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>Approaching limit</span>
                </div>
              )}
            </div>

            {/* Photo upload section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Photos</Label>
                <SimpleUploader
                  onUploadSuccess={(url) => handlePhotoUpload([url])}
                  allowedTypes={["image/*"]}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  className=""
                >
                  <span>Add Photos</span>
                </SimpleUploader>
              </div>

              {/* Uploaded photos preview */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {uploadedPhotos.map((url, index) => (
                    <div 
                      key={index} 
                      className="relative group aspect-square overflow-hidden rounded border"
                      data-testid={`uploaded-photo-${index}`}
                    >
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(url)}
                        data-testid={`remove-photo-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Options section */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="isInternal"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        {isInternal ? (
                          <>
                            <Lock className="h-3 w-3" />
                            Internal Update
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            Public Update
                          </>
                        )}
                      </FormLabel>
                      <div className="text-xs text-muted-foreground">
                        {isInternal 
                          ? "Only visible to manufacturers and administrators"
                          : "Visible to customers, manufacturers, and administrators"
                        }
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="internal-update-switch"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Update preview badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Posting as:</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    userRole === "admin" 
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  )}
                >
                  {userRole === "admin" ? "Administrator" : "Manufacturer"}
                </Badge>
                {isInternal && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Internal
                  </Badge>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createUpdateMutation.isPending}
                  data-testid="cancel-update-button"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={createUpdateMutation.isPending || !message.trim()}
                data-testid="submit-update-button"
              >
                {createUpdateMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    Posting...
                  </div>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Post Update
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}