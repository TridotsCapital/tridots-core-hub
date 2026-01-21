import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpChapterList } from "./HelpChapterList";
import { HelpSectionEditor } from "./HelpSectionEditor";
import { HelpMediaManager } from "./HelpMediaManager";
import { HelpFeedbackViewer } from "./HelpFeedbackViewer";
import { HelpChapter, HelpSection } from "@/hooks/useHelpAdmin";
import { BookOpen, Image, MessageSquare } from "lucide-react";

type ViewState =
  | { type: "chapters" }
  | { type: "sections"; chapter: HelpChapter }
  | { type: "media"; section: HelpSection };

export function HelpAdminPanel() {
  const [view, setView] = useState<ViewState>({ type: "chapters" });
  const [selectedChapterId, setSelectedChapterId] = useState<string>();

  const handleSelectChapter = (chapter: HelpChapter) => {
    setSelectedChapterId(chapter.id);
    setView({ type: "sections", chapter });
  };

  const handleSelectSection = (section: HelpSection) => {
    setView({ type: "media", section });
  };

  const handleBackToChapters = () => {
    setView({ type: "chapters" });
    setSelectedChapterId(undefined);
  };

  const handleBackToSections = () => {
    if (view.type === "media") {
      // Find the chapter for this section
      setView({ type: "chapters" });
      setSelectedChapterId(undefined);
    }
  };

  return (
    <Tabs defaultValue="content" className="space-y-4">
      <TabsList>
        <TabsTrigger value="content" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Conteúdo
        </TabsTrigger>
        <TabsTrigger value="media" className="gap-2">
          <Image className="h-4 w-4" />
          Mídia Global
        </TabsTrigger>
        <TabsTrigger value="feedback" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Feedback
        </TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Conteúdo</CardTitle>
            <CardDescription>
              Edite capítulos, seções e configure mídias do Help Center
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view.type === "chapters" && (
              <HelpChapterList
                onSelectChapter={handleSelectChapter}
                selectedChapterId={selectedChapterId}
              />
            )}
            {view.type === "sections" && (
              <HelpSectionEditor
                chapter={view.chapter}
                onBack={handleBackToChapters}
                onSelectSection={handleSelectSection}
              />
            )}
            {view.type === "media" && (
              <HelpMediaManager
                section={view.section}
                onBack={handleBackToSections}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="media">
        <Card>
          <CardHeader>
            <CardTitle>Biblioteca de Mídia</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as mídias do Help Center
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HelpMediaGallery />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="feedback">
        <HelpFeedbackViewer />
      </TabsContent>
    </Tabs>
  );
}

// Global media gallery component
function HelpMediaGallery() {
  const { data: media, isLoading } = require("@/hooks/useHelpAdmin").useHelpAdminMedia();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!media?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Image className="h-12 w-12 mb-4" />
        <p>Nenhuma mídia cadastrada</p>
        <p className="text-sm">Acesse uma seção para fazer upload de screenshots ou vídeos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {media.map((item: any) => (
        <div
          key={item.id}
          className="aspect-video bg-muted rounded-lg overflow-hidden relative group"
        >
          {item.media_type === "screenshot" && item.file_path ? (
            <img
              src={item.file_path}
              alt={item.caption || item.placeholder_id}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">🎬</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium px-2 text-center">
              {item.placeholder_id}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
