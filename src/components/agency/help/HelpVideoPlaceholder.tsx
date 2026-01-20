import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "lucide-react";

interface HelpVideoPlaceholderProps {
  placeholderId: string;
  sectionId: string;
}

export function HelpVideoPlaceholder({
  placeholderId,
  sectionId,
}: HelpVideoPlaceholderProps) {
  // Try to fetch the actual media
  const { data: media } = useQuery({
    queryKey: ["help-media-video", sectionId, placeholderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_media")
        .select("*")
        .eq("section_id", sectionId)
        .eq("placeholder_id", placeholderId)
        .eq("media_type", "video")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // If we have a video URL, embed it
  if (media?.video_url) {
    // Parse YouTube or Vimeo URL
    const getEmbedUrl = (url: string) => {
      // YouTube
      const youtubeMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
      );
      if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }

      // Vimeo
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }

      return url;
    };

    return (
      <figure className="my-6">
        <div className="rounded-lg overflow-hidden border bg-black aspect-video">
          <iframe
            src={getEmbedUrl(media.video_url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
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

  // Show placeholder
  const formattedId = placeholderId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="my-6 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <Video className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          📹 Vídeo: {formattedId}
        </p>
        <p className="text-xs text-muted-foreground/60">
          Vídeo será adicionado em breve
        </p>
      </div>
    </div>
  );
}
