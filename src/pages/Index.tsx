import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { OccupancyChart } from "@/components/OccupancyChart";
import { OccupancyTable } from "@/components/OccupancyTable";
import { processExcelFile, DailyOccupancy, CityTotals } from "@/utils/excelProcessor";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [data, setData] = useState<DailyOccupancy[] | null>(null);
  const [totals, setTotals] = useState<CityTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setFileName(file.name);

    try {
      const result = await processExcelFile(file);
      setData(result.daily);
      setTotals(result.totals);
      
      toast({
        title: "Ficheiro processado com sucesso!",
        description: `${result.daily.length} dias analisados`,
      });
    } catch (error) {
      toast({
        title: "Erro ao processar ficheiro",
        description: (error as Error).message,
        variant: "destructive",
      });
      setData(null);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setTotals(null);
    setFileName("");
  };

  const exportToCSV = () => {
    if (!data || !totals) return;

    const csvContent = [
      ["Dia de Ocupação", "Lisboa", "Porto", "Évora", "Setúbal"],
      ...data.map(row => {
        const date = new Date(row.date);
        const formattedDate = date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
        return [formattedDate, row.lisboa, row.porto, row.evora, row.setubal].join(",");
      }),
      ["Total", totals.lisboa, totals.porto, totals.evora, totals.setubal].join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ocupacao_cidades_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileSpreadsheet className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Análise de Ocupação de Portas
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Carregue um ficheiro Excel para analisar o fluxo de pessoas por porta
          </p>
        </header>

        {!data && !loading && (
          <div className="max-w-2xl mx-auto">
            <FileUpload onFileSelect={handleFileSelect} />
            
            <div className="mt-8 p-6 bg-accent/50 rounded-lg">
              <h3 className="font-semibold mb-3 text-accent-foreground">
                Formato esperado do Excel:
              </h3>
              <ul className="space-y-2 text-sm text-accent-foreground">
                <li><strong>Coluna 1:</strong> Data e Hora</li>
                <li><strong>Coluna 2:</strong> Nome do Utilizador</li>
                <li><strong>Coluna 3:</strong> Nome da Porta</li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                * A aplicação remove automaticamente entradas duplicadas do mesmo utilizador na mesma porta no mesmo dia
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">
              A processar {fileName}...
            </p>
          </div>
        )}

        {data && totals && !loading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Resultados</h2>
                <p className="text-muted-foreground">{fileName}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={handleReset}>
                  Carregar Novo Ficheiro
                </Button>
              </div>
            </div>

            <OccupancyChart data={data} />
            <OccupancyTable data={data} totals={totals} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
