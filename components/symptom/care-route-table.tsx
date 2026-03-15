"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CareRouteOption } from "@/lib/types";

interface CareRouteTableProps {
  routes: CareRouteOption[];
  recommendation?: CareRouteOption["option"];
}

export function CareRouteTable({ routes, recommendation }: CareRouteTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="overflow-x-auto rounded-xl border border-border"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Treatment Option</TableHead>
            <TableHead>Average Price</TableHead>
            <TableHead>When To Use</TableHead>
            <TableHead>Typical Wait</TableHead>
            <TableHead>When To Escalate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((route) => (
            <TableRow
              key={route.option}
              className={recommendation === route.option ? "bg-primary/10" : undefined}
            >
              <TableCell className="font-medium text-card-foreground">
                <div className="flex items-center gap-2">
                  {route.option}
                  {recommendation === route.option ? <Badge variant="primary">Recommended</Badge> : null}
                </div>
              </TableCell>
              <TableCell>{route.estimatedCost}</TableCell>
              <TableCell>{route.whenToUse}</TableCell>
              <TableCell>{route.typicalWaitTime}</TableCell>
              <TableCell>{route.escalationTrigger}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
