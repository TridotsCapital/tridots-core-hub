import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpScreenshotPlaceholderProps {
  placeholderId: string;
  sectionId: string;
}

export function HelpScreenshotPlaceholder({
  placeholderId,
  sectionId,
}: HelpScreenshotPlaceholderProps) {
  // Try to fetch the actual media
  const { data: media } = useQuery({
    queryKey: ["help-media", sectionId, placeholderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_media")
        .select("*")
        .eq("section_id", sectionId)
        .eq("placeholder_id", placeholderId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // If we have actual media, display it
  if (media?.file_path) {
    const { data: urlData } = supabase.storage
      .from("help-assets")
      .getPublicUrl(media.file_path);

    return (
      <figure className="my-6">
        <div className="rounded-lg overflow-hidden border bg-muted/30">
          <img
            src={urlData.publicUrl}
            alt={media.caption || placeholderId}
            className="w-full h-auto"
          />
        </div>
        {media.caption && (
          <figcaption className="text-xs text-center text-muted-foreground mt-2">
            {media.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // Otherwise show placeholder
  const formattedId = placeholderId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="my-6 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          📷 Screenshot: {formattedId}
        </p>
        <p className="text-xs text-muted-foreground/60">
          Imagem será adicionada em breve
        </p>
      </div>
    </div>
  );
}
