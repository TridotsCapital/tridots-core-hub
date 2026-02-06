import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BoletoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  currentBoletoUrl?: string | null;
  onSuccess: () => void;
}

export function BoletoUploadDialog({
  open,
  onOpenChange,
  invoiceId,
  currentBoletoUrl,
  onSuccess,
}: BoletoUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [boletoBarcode, setBoletoBarcode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo PDF",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileName = `boletos/${invoiceId}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("invoices")
        .getPublicUrl(fileName);

      // Update invoice with boleto URL
      const { error: updateError } = await supabase
        .from("agency_invoices")
        .update({
          boleto_url: urlData.publicUrl,
          boleto_barcode: boletoBarcode || null,
          status: "gerada", // Move to "gerada" status after uploading boleto
        })
        .eq("id", invoiceId);

      if (updateError) throw updateError;

      toast({
        title: "Boleto enviado",
        description: "O boleto foi carregado com sucesso",
      });

      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
      setBoletoBarcode("");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro ao enviar boleto",
        description: error.message || "Ocorreu um erro ao processar o arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentBoletoUrl ? "Substituir Boleto" : "Enviar Boleto"}
          </DialogTitle>
          <DialogDescription>
            Faça upload do arquivo PDF do boleto para esta fatura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File upload area */}
          <div className="space-y-2">
            <Label>Arquivo do Boleto (PDF)</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar ou arraste o arquivo PDF
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Barcode input */}
          <div className="space-y-2">
            <Label htmlFor="barcode">Código de Barras (opcional)</Label>
            <Input
              id="barcode"
              placeholder="Digite o código de barras do boleto"
              value={boletoBarcode}
              onChange={(e) => setBoletoBarcode(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Enviando..." : "Enviar Boleto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
