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

        // Skip header row and process data (start from row 0 if no header)
        const rows: ExcelRow[] = [];
        
        // Detect if first row is header or data
        const firstRow = jsonData[0] as any[];
        const startIndex = (firstRow && firstRow[0] && typeof firstRow[0] === 'string' && 
                           (firstRow[0].toLowerCase().includes('date') || 
                            firstRow[0].toLowerCase().includes('time') ||
                            firstRow[0].toLowerCase().includes('data'))) ? 1 : 0;
        
        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row.length >= 3 && row[0] && row[1] && row[2]) {
            // Parse date (Excel dates are numbers or strings)
            let date: Date;
            let dateStr = String(row[0]);
            
            // Remove "Access granted to" or similar text
            dateStr = dateStr.replace(/:\s*Access granted to\s*$/i, '').trim();
            
            if (typeof row[0] === 'number') {
              // Excel serial date - convert to JS date
              const excelEpoch = new Date(1899, 11, 30);
              date = new Date(excelEpoch.getTime() + row[0] * 86400000);
            } else {
              // Parse string date
              date = new Date(dateStr);
              
              // If invalid, try extracting date from the string
              if (isNaN(date.getTime())) {
                const dateMatch = dateStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)/i);
                if (dateMatch) {
                  date = new Date(dateMatch[0]);
                }
              }
            }
            
            // Skip invalid dates
            if (isNaN(date.getTime())) {
              console.warn(`Invalid date found: ${row[0]}`);
              continue;
            }

            // Clean up user name (remove numbers in parentheses if present)
            let userName = String(row[1]).trim();
            
            rows.push({
              dataHora: date,
              utilizador: userName,
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
