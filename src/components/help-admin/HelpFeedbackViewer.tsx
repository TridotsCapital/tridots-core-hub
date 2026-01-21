import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHelpAdminFeedback, useHelpFeedbackStats } from "@/hooks/useHelpAdmin";
import { ThumbsUp, ThumbsDown, TrendingUp, Users, MessageSquare, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function HelpFeedbackViewer() {
  const { data: feedback, isLoading: loadingFeedback } = useHelpAdminFeedback();
  const { data: stats, isLoading: loadingStats } = useHelpFeedbackStats();

  if (loadingFeedback || loadingStats) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total de Avaliações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              Útil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.helpful || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              Não Útil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats?.notHelpful || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Taxa de Satisfação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats?.rate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Avaliações Recentes
          </CardTitle>
          <CardDescription>
            Feedback dos usuários sobre as seções do Help Center
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!feedback?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p>Nenhuma avaliação recebida ainda</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {feedback.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        item.is_helpful
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.is_helpful ? (
                        <ThumbsUp className="h-5 w-5" />
                      ) : (
                        <ThumbsDown className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {item.profile?.full_name || "Usuário"}
                        </span>
                        <Badge variant={item.is_helpful ? "default" : "destructive"}>
                          {item.is_helpful ? "Útil" : "Não útil"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Seção:{" "}
                        <span className="font-medium">
                          {(item.section as unknown as { title: string })?.title || "Desconhecida"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
