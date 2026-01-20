import { useState } from "react";
import { Link, Check } from "lucide-react";
import { toast } from "sonner";

interface HelpCopyLinkProps {
  slug: string;
}

export function HelpCopyLink({ slug }: HelpCopyLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title="Copiar link"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Link className="h-4 w-4" />
      )}
    </button>
  );
}
