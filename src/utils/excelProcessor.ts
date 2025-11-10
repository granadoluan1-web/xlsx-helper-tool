import * as XLSX from "xlsx";

export interface ExcelRow {
  dataHora: Date;
  utilizador: string;
  porta: string;
}

export interface ProcessedData {
  porta: string;
  count: number;
}

export function processExcelFile(file: File): Promise<ProcessedData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error("O ficheiro não contém dados suficientes"));
          return;
        }

        // Skip header row and process data
        const rows: ExcelRow[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row.length >= 3 && row[0] && row[1] && row[2]) {
            // Parse date (Excel dates are numbers)
            let date: Date;
            if (typeof row[0] === 'number') {
              // Excel serial date - convert to JS date
              const excelEpoch = new Date(1899, 11, 30);
              date = new Date(excelEpoch.getTime() + row[0] * 86400000);
            } else if (typeof row[0] === 'string') {
              date = new Date(row[0]);
            } else {
              continue;
            }

            rows.push({
              dataHora: date,
              utilizador: String(row[1]).trim(),
              porta: String(row[2]).trim(),
            });
          }
        }

        // Remove duplicates: same user, same door, same day
        const uniqueEntries = new Map<string, ExcelRow>();
        
        rows.forEach((row) => {
          const dateKey = row.dataHora.toISOString().split('T')[0];
          const key = `${dateKey}-${row.utilizador}-${row.porta}`;
          
          if (!uniqueEntries.has(key)) {
            uniqueEntries.set(key, row);
          }
        });

        // Count unique people per door
        const doorCounts = new Map<string, Set<string>>();
        
        uniqueEntries.forEach((entry) => {
          if (!doorCounts.has(entry.porta)) {
            doorCounts.set(entry.porta, new Set());
          }
          doorCounts.get(entry.porta)!.add(entry.utilizador);
        });

        // Convert to array and sort by count
        const result: ProcessedData[] = Array.from(doorCounts.entries())
          .map(([porta, users]) => ({
            porta,
            count: users.size,
          }))
          .sort((a, b) => b.count - a.count);

        resolve(result);
      } catch (error) {
        reject(new Error("Erro ao processar o ficheiro Excel: " + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error("Erro ao ler o ficheiro"));
    };

    reader.readAsBinaryString(file);
  });
}
