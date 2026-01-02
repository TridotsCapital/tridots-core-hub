import { useState, useRef } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUploadAgencyLogo, useDeleteAgencyLogo } from "@/hooks/useAgencyLogo";

interface AgencyLogoUploadProps {
  agencyId: string;
  currentLogoUrl?: string | null;
  agencyName: string;
  size?: "sm" | "md" | "lg";
}

export function AgencyLogoUpload({
  agencyId,
  currentLogoUrl,
  agencyName,
  size = "md",
}: AgencyLogoUploadProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadAgencyLogo();
  const deleteMutation = useDeleteAgencyLogo();

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadMutation.mutateAsync({ agencyId, file: selectedFile });
    setOpen(false);
    setPreview(null);
    setSelectedFile(null);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(agencyId);
    setOpen(false);
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={currentLogoUrl || undefined} alt={agencyName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(agencyName)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-4 w-4 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Logo da Imobiliária</DialogTitle>
          <DialogDescription>
            Faça upload de uma imagem para identificar sua imobiliária. Formatos: JPG, PNG ou WebP. Tamanho máximo: 2MB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Preview area */}
          <Avatar className="h-32 w-32">
            <AvatarImage
              src={preview || currentLogoUrl || undefined}
              alt={agencyName}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
              {getInitials(agencyName)}
            </AvatarFallback>
          </Avatar>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            {preview ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {currentLogoUrl ? "Trocar Imagem" : "Escolher Imagem"}
                </Button>
                {currentLogoUrl && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
