import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, MessageSquare, CheckCircle } from "lucide-react";
import { NpsRatingScale } from "./NpsRatingScale";
import type { PendingSurvey } from "@/hooks/useNpsSurveys";

interface NpsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveys: PendingSurvey[];
  onSubmit: (surveyId: string, rating: number, comment?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function NpsModal({
  open,
  onOpenChange,
  surveys,
  onSubmit,
  isSubmitting,
}: NpsModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  // Filter out already submitted surveys to get pending ones
  const pendingSurveys = surveys.filter(s => !submittedIds.includes(s.id));
  const currentSurvey = pendingSurveys[0];
  const isLastSurvey = pendingSurveys.length <= 1;
  
  // Show success only if we actually submitted something AND no more pending
  const showSuccess = submittedIds.length > 0 && pendingSurveys.length === 0;

  // Reset state when modal opens or surveys change
  useEffect(() => {
    if (open) {
      setSubmittedIds([]);
      setRating(null);
      setComment("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating === null || !currentSurvey) return;

    await onSubmit(currentSurvey.id, rating, comment || undefined);
    
    // Track submitted ID locally for seamless transition
    setSubmittedIds(prev => [...prev, currentSurvey.id]);
    
    // Reset form for next survey
    setRating(null);
    setComment("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setSubmittedIds([]);
    setRating(null);
    setComment("");
  };

  // Show success state only after actual submissions
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[480px]">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-center">Obrigado pela avaliação!</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-sm">
              Suas avaliações foram registradas com sucesso. Agora você pode abrir novos chamados.
            </p>
            <Button onClick={handleClose} className="mt-6">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentSurvey) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Avalie seu atendimento
          </DialogTitle>
          <DialogDescription>
            {surveys.length > 1 ? (
              <>
                Você tem <strong>{surveys.length} chamados</strong> pendentes de avaliação.
                Avalie cada um para poder abrir novos chamados.
              </>
            ) : (
              "Para abrir um novo chamado, primeiro avalie o atendimento do seu chamado anterior."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Survey counter */}
          {surveys.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {surveys.map((s, idx) => {
                const isSubmitted = submittedIds.includes(s.id);
                const isCurrent = s.id === currentSurvey?.id;
                return (
                  <div
                    key={s.id}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      isSubmitted
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* Current ticket info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{currentSurvey.ticket.subject}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Encerrado em{" "}
                    {currentSurvey.ticket.resolved_at
                      ? format(new Date(currentSurvey.ticket.resolved_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })
                      : "data desconhecida"}
                  </span>
                  {currentSurvey.ticket.closed_by_type === "agency" && (
                    <Badge variant="secondary" className="text-xs">
                      Encerrado por você
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rating question */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Em uma escala de 0 a 10, qual a probabilidade de você recomendar nosso atendimento?
            </Label>
            <NpsRatingScale value={rating} onChange={setRating} disabled={isSubmitting} />
          </div>

          {/* Comment field */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSubmit}
            disabled={rating === null || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : isLastSurvey ? (
              "Enviar Avaliação"
            ) : (
              "Próximo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
