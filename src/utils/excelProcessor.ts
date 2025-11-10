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

export interface DailyOccupancy {
  date: string;
  lisboa: number;
  porto: number;
  evora: number;
  setubal: number;
}

export interface CityTotals {
  lisboa: number;
  porto: number;
  evora: number;
  setubal: number;
}

function getCityFromDoor(porta: string): string {
  const doorUpper = porta.toUpperCase();
  if (doorUpper.startsWith('C2') || doorUpper.startsWith('C3') || doorUpper.startsWith('P2')) {
    return 'lisboa';
  }
  if (doorUpper.includes('EVR')) {
    return 'evora';
  }
  if (doorUpper.includes('OPO')) {
    return 'porto';
  }
  if (doorUpper.includes('STB')) {
    return 'setubal';
  }
  return 'other';
}

export function processExcelFile(file: File): Promise<{ daily: DailyOccupancy[], totals: CityTotals }> {
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

        // Remove duplicates: same user, same city, same day
        const uniqueEntries = new Map<string, { date: Date; user: string; city: string }>();
        
        rows.forEach((row) => {
          const city = getCityFromDoor(row.porta);
          if (city === 'other') return; // Skip unrecognized doors
          
          const dateKey = row.dataHora.toISOString().split('T')[0];
          const key = `${dateKey}-${row.utilizador}-${city}`;
          
          if (!uniqueEntries.has(key)) {
            uniqueEntries.set(key, {
              date: row.dataHora,
              user: row.utilizador,
              city: city
            });
          }
        });

        // Group by date and city
        const dailyData = new Map<string, { lisboa: Set<string>, porto: Set<string>, evora: Set<string>, setubal: Set<string> }>();
        
        uniqueEntries.forEach((entry) => {
          const dateKey = entry.date.toISOString().split('T')[0];
          
          if (!dailyData.has(dateKey)) {
            dailyData.set(dateKey, {
              lisboa: new Set(),
              porto: new Set(),
              evora: new Set(),
              setubal: new Set()
            });
          }
          
          const dayData = dailyData.get(dateKey)!;
          dayData[entry.city as keyof typeof dayData].add(entry.user);
        });

        // Convert to array and sort by date
        const daily: DailyOccupancy[] = Array.from(dailyData.entries())
          .map(([date, cities]) => ({
            date,
            lisboa: cities.lisboa.size,
            porto: cities.porto.size,
            evora: cities.evora.size,
            setubal: cities.setubal.size,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate totals
        const totals: CityTotals = {
          lisboa: daily.reduce((sum, day) => sum + day.lisboa, 0),
          porto: daily.reduce((sum, day) => sum + day.porto, 0),
          evora: daily.reduce((sum, day) => sum + day.evora, 0),
          setubal: daily.reduce((sum, day) => sum + day.setubal, 0),
        };

        resolve({ daily, totals });
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
