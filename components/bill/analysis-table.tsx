import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BillAnalysisItem } from "@/lib/types";

function badgeForFlag(flag: BillAnalysisItem["flag"]) {
  switch (flag) {
    case "HIGH":
      return <Badge variant="danger">HIGH</Badge>;
    case "LOW":
      return <Badge variant="warning">LOW</Badge>;
    case "OK":
      return <Badge variant="success">OK</Badge>;
    default:
      return <Badge variant="default">UNKNOWN</Badge>;
  }
}

export function BillAnalysisTable({ items }: { items: BillAnalysisItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Charged</TableHead>
            <TableHead>Average Price</TableHead>
            <TableHead>Difference</TableHead>
            <TableHead>Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.item}-${index}`}>
              <TableCell className="font-medium text-card-foreground">{item.item}</TableCell>
              <TableCell>${item.charged}</TableCell>
              <TableCell>{item.averagePrice ? `$${Math.round(item.averagePrice)}` : "Unavailable"}</TableCell>
              <TableCell>
                {item.differencePercent === null
                  ? "Unavailable"
                  : `${item.differencePercent > 0 ? "+" : ""}${item.differencePercent}%`}
              </TableCell>
              <TableCell>{badgeForFlag(item.flag)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
