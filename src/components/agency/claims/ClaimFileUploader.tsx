import { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ClaimFileType } from '@/types/claims';
import { claimFileTypeList } from '@/types/claims';
import type { DraftClaimFile } from '@/hooks/useClaimDraft';

interface ClaimFileUploaderProps {
  files: DraftClaimFile[];
  onChange: (files: DraftClaimFile[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  if (file.type === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ClaimFileUploader({ files, onChange, disabled }: ClaimFileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Arquivo muito grande (máx. 50MB)`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Tipo de arquivo não permitido`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validationErrors: string[] = [];
      const validFiles: DraftClaimFile[] = [];

      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          validationErrors.push(error);
        } else {
          const preview = file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined;

          validFiles.push({
            id: generateId(),
            file,
            file_type: 'outros',
            preview,
          });
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setTimeout(() => setErrors([]), 5000);
      }

      if (validFiles.length > 0) {
        onChange([...files, ...validFiles]);
      }
    },
    [files, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onChange(files.filter((f) => f.id !== id));
  };

  const handleTypeChange = (id: string, type: ClaimFileType) => {
    onChange(
      files.map((f) => (f.id === id ? { ...f, file_type: type } : f))
    );
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <label
          htmlFor="file-upload"
          className={cn('cursor-pointer', disabled && 'cursor-not-allowed')}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, XLS, JPG, PNG (máx. 50MB cada)
          </p>
        </label>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
          {errors.map((error, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="border rounded-lg divide-y">
          {files.map((draftFile) => (
            <div
              key={draftFile.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/30"
            >
              {/* Preview / Icon */}
              <div className="flex-shrink-0">
                {draftFile.preview ? (
                  <img
                    src={draftFile.preview}
                    alt={draftFile.file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                    {getFileIcon(draftFile.file)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {draftFile.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(draftFile.file.size)}
                </p>
              </div>

              {/* Type Select */}
              <Select
                value={draftFile.file_type}
                onValueChange={(value) =>
                  handleTypeChange(draftFile.id, value as ClaimFileType)
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {claimFileTypeList.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveFile(draftFile.id)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
