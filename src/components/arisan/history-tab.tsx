"use client";

import { Trophy, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArisanGroup } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface HistoryTabProps {
  group: ArisanGroup;
}

export default function HistoryTab({ group }: HistoryTabProps) {
  const completedRounds = group.rounds
    .filter(r => r.status === 'completed')
    .sort((a, b) => b.number - a.number);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-headline">Riwayat Pemenang</CardTitle>
        <CardDescription>Daftar pemenang dari setiap putaran.</CardDescription>
      </CardHeader>
      <CardContent>
        {completedRounds.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Belum ada pengundian yang dilakukan.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Putaran</TableHead>
                <TableHead>Pemenang</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedRounds.map((round) => {
                const winner = group.participants.find(p => p.id === round.winnerId);
                return (
                  <TableRow key={round.number}>
                    <TableCell className="font-bold">#{round.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Trophy className="mr-2 h-4 w-4 text-secondary" />
                        <span className="font-medium">{winner?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(round.date), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center text-primary text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Selesai
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
