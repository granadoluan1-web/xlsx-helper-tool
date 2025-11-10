import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyOccupancy, CityTotals } from "@/utils/excelProcessor";

interface OccupancyTableProps {
  data: DailyOccupancy[];
  totals: CityTotals;
}

export function OccupancyTable({ data, totals }: OccupancyTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  };

  const grandTotal = totals.lisboa + totals.porto + totals.evora + totals.setubal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ocupação por Cidade e Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dia de Ocupação</TableHead>
              <TableHead className="text-right">Lisboa</TableHead>
              <TableHead className="text-right">Porto</TableHead>
              <TableHead className="text-right">Évora</TableHead>
              <TableHead className="text-right">Setúbal</TableHead>
              <TableHead className="text-right font-semibold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const dayTotal = row.lisboa + row.porto + row.evora + row.setubal;
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{formatDate(row.date)}</TableCell>
                  <TableCell className="text-right">{row.lisboa}</TableCell>
                  <TableCell className="text-right">{row.porto}</TableCell>
                  <TableCell className="text-right">{row.evora}</TableCell>
                  <TableCell className="text-right">{row.setubal}</TableCell>
                  <TableCell className="text-right font-medium">{dayTotal}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="text-right font-bold">{totals.lisboa}</TableCell>
              <TableCell className="text-right font-bold">{totals.porto}</TableCell>
              <TableCell className="text-right font-bold">{totals.evora}</TableCell>
              <TableCell className="text-right font-bold">{totals.setubal}</TableCell>
              <TableCell className="text-right font-bold">{grandTotal}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
