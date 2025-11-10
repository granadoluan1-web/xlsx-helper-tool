import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        onFileSelect(file);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um ficheiro Excel (.xlsx ou .xls)",
          variant: "destructive",
        });
      }
    },
    [onFileSelect, toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/5 scale-105"
          : "border-border hover:border-primary/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            {isDragging ? (
              <FileSpreadsheet className="w-12 h-12 text-primary animate-pulse" />
            ) : (
              <Upload className="w-12 h-12 text-primary" />
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          {isDragging ? "Solte o ficheiro aqui" : "Carregue o ficheiro Excel"}
        </h3>
        
        <p className="text-muted-foreground mb-6">
          Arraste e solte o ficheiro ou clique para selecionar
        </p>

        <input
          type="file"
          id="file-upload"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <Button asChild>
          <label htmlFor="file-upload" className="cursor-pointer">
            Selecionar Ficheiro
          </label>
        </Button>
      </div>
    </Card>
  );
}
