import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface SimulatorInputs {
  valorAluguel: number;
  valorCondominio: number;
  valorIptu: number;
  qtdParcelas: number;
  taxaPercentual: number;
}

const DEFAULT_INPUTS: SimulatorInputs = {
  valorAluguel: 2000,
  valorCondominio: 400,
  valorIptu: 100,
  qtdParcelas: 12,
  taxaPercentual: 12,
};

const QTDPARCELAS_OPTIONS = [4, 6, 8, 12];
const PLANOS = [
  { nome: "Start",   taxa: 15, cor: "border-gray-300" },
  { nome: "Prime",   taxa: 12, cor: "border-yellow-500" },
  { nome: "Exclusive", taxa: 10, cor: "border-purple-500" },
];

export default function Simulador() {
  const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
  const nav = useNavigate();

  const computed = useMemo(() => {
    const valorTotal = inputs.valorAluguel + inputs.valorCondominio + inputs.valorIptu;
    const garantiaMensal = valorTotal * (inputs.taxaPercentual / 100);
    const parcelas = Array.from({ length: inputs.qtdParcelas }, (_, i) => {
      const data = new Date();
      data.setMonth(data.getMonth() + i + 1);
      return { numero: i + 1, vencimento: data, valor: garantiaMensal };
    });
    const total = garantiaMensal * inputs.qtdParcelas;
    const coberturaMaxima = inputs.valorAluguel * 20; // política 20x
    return { valorTotal, garantiaMensal, parcelas, total, coberturaMaxima };
  }, [inputs]);

  const goToAnalysis = () => {
    nav("/analyses/new", {
      state: {
        prefill: {
          valor_aluguel: inputs.valorAluguel,
          valor_condominio: inputs.valorCondominio,
          valor_iptu: inputs.valorIptu,
          taxa_garantia_percentual: inputs.taxaPercentual,
        },
      },
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <header className="text-center mb-10">
        <Sparkles className="mx-auto mb-3 text-yellow-500" size={36} />
        <h1 className="text-4xl font-bold mb-2">Simulador GarantFácil</h1>
        <p className="text-muted-foreground">
          Calcule a cobertura e parcelamento da garantia locatícia em segundos.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator size={18} /> Dados do aluguel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Aluguel mensal (R$)</Label>
              <Input
                type="number" min={0} step={50}
                value={inputs.valorAluguel}
                onChange={(e) => setInputs({ ...inputs, valorAluguel: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Condomínio (R$)</Label>
              <Input
                type="number" min={0} step={50}
                value={inputs.valorCondominio}
                onChange={(e) => setInputs({ ...inputs, valorCondominio: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>IPTU (R$)</Label>
              <Input
                type="number" min={0} step={50}
                value={inputs.valorIptu}
                onChange={(e) => setInputs({ ...inputs, valorIptu: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Plano</Label>
              <Select
                value={String(inputs.taxaPercentual)}
                onValueChange={(v) => setInputs({ ...inputs, taxaPercentual: Number(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANOS.map((p) => (
                    <SelectItem key={p.nome} value={String(p.taxa)}>
                      {p.nome} — {p.taxa}% ao mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parcelas</Label>
              <Select
                value={String(inputs.qtdParcelas)}
                onValueChange={(v) => setInputs({ ...inputs, qtdParcelas: Number(v) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QTDPARCELAS_OPTIONS.map((q) => (
                    <SelectItem key={q} value={String(q)}>{q}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader>
            <CardTitle>Sua simulação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">Cobertura mensal</p>
                <p className="text-2xl font-bold">{formatBRL(computed.valorTotal)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-300">
                <p className="text-xs text-muted-foreground">Cobertura máxima (20x)</p>
                <p className="text-2xl font-bold text-green-700">{formatBRL(computed.coberturaMaxima)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">Parcela mensal da garantia</p>
                <p className="text-2xl font-bold text-yellow-700">{formatBRL(computed.garantiaMensal)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">Total da garantia em {inputs.qtdParcelas}x</p>
                <p className="text-2xl font-bold">{formatBRL(computed.total)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Cronograma de parcelas</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.parcelas.map((p) => (
                    <TableRow key={p.numero}>
                      <TableCell>{p.numero} de {inputs.qtdParcelas}</TableCell>
                      <TableCell>{p.vencimento.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(p.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button size="lg" onClick={goToAnalysis} className="gap-2">
                Quero esta cobertura <ArrowRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Esta simulação é meramente indicativa. Valores podem variar conforme análise de crédito.
        Cobertura máxima de até 20× o aluguel mensal sujeita aos termos contratuais.
      </footer>
    </div>
  );
}
