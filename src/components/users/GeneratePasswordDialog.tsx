import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Key } from 'lucide-react';
import { useState } from 'react';

interface GeneratePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string | null;
  userName?: string;
  onCopy: () => void;
}

export function GeneratePasswordDialog({
  open,
  onOpenChange,
  password,
  userName,
  onCopy
}: GeneratePasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Senha Provisória Gerada
          </DialogTitle>
          <DialogDescription>
            {userName ? (
              <>Nova senha provisória para <strong>{userName}</strong>.</>
            ) : (
              'A nova senha foi gerada com sucesso.'
            )}
            {' '}O usuário deve alterá-la no primeiro acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Input
              value={password || ''}
              readOnly
              className="font-mono text-lg tracking-wider"
            />
            <Button
              type="button"
              size="icon"
              variant={copied ? "default" : "outline"}
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
            <p className="text-amber-800 dark:text-amber-200">
              <strong>Importante:</strong> Copie esta senha agora. Por segurança, ela não será exibida novamente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
