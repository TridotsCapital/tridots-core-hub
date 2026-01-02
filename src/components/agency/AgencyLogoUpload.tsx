import { useState, useRef, useCallback } from "react";
import { Camera, Trash2, Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUploadAgencyLogo, useDeleteAgencyLogo } from "@/hooks/useAgencyLogo";

interface AgencyLogoUploadProps {
  agencyId: string;
  currentLogoUrl?: string | null;
  agencyName: string;
  size?: "sm" | "md" | "lg";
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AgencyLogoUpload({
  agencyId,
  currentLogoUrl,
  agencyName,
  size = "md",
}: AgencyLogoUploadProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImg = async (): Promise<File | null> => {
    if (!imgRef.current || !crop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (crop.x / 100) * image.width * scaleX,
      y: (crop.y / 100) * image.height * scaleY,
      width: (crop.width / 100) * image.width * scaleX,
      height: (crop.height / 100) * image.height * scaleY,
    };

    // Output size (square)
    const outputSize = 256;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Apply rotation
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-outputSize / 2, -outputSize / 2);

    // Draw cropped and zoomed image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], "logo.jpg", { type: "image/jpeg" }));
          } else {
            resolve(null);
          }
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleSave = async () => {
    const croppedFile = await getCroppedImg();
    if (!croppedFile) return;

    await uploadMutation.mutateAsync({ agencyId, file: croppedFile });
    handleClose();
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(agencyId);
    setDeleteDialogOpen(false);
    setOpen(false);
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop(undefined);
    setZoom(1);
    setRotation(0);
    setOpen(false);
  };

  const handleCancel = () => {
    setImageSrc(null);
    setCrop(undefined);
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={(value) => {
        if (!value) handleClose();
        else setOpen(true);
      }}>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Logo da Imobiliária</DialogTitle>
            <DialogDescription>
              {imageSrc 
                ? "Ajuste o enquadramento da sua logo. Arraste para posicionar e use os controles para zoom e rotação."
                : "Faça upload de uma imagem para identificar sua imobiliária. Formatos: JPG, PNG ou WebP. Tamanho máximo: 5MB."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {imageSrc ? (
              <>
                {/* Crop area */}
                <div className="relative w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    aspect={1}
                    circularCrop
                    className="max-h-72"
                  >
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transformOrigin: "center",
                        maxHeight: "288px",
                        width: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </ReactCrop>
                </div>

                {/* Zoom control */}
                <div className="flex items-center gap-3 w-full max-w-sm">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[zoom]}
                    onValueChange={(values) => setZoom(values[0])}
                    min={1}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRotate}
                    className="ml-2"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 w-full justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Current logo preview */}
                <Avatar className="h-32 w-32">
                  <AvatarImage src={currentLogoUrl || undefined} alt={agencyName} />
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
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover logo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a logo da imobiliária? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
