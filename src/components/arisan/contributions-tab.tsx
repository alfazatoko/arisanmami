"use client";

import { useState } from 'react';
import { Check, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArisanGroup, Contribution } from '@/lib/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ContributionsTabProps {
  group: ArisanGroup;
  onUpdate: (group: ArisanGroup) => void;
  isBandar: boolean;
}

export default function ContributionsTab({ group, onUpdate, isBandar }: ContributionsTabProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  
  const currentRound = group.rounds.find(r => r.status === 'pending');
  
  if (!currentRound) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Semua putaran telah selesai.
        </CardContent>
      </Card>
    );
  }

  const togglePayment = (participantId: string) => {
    if (!isBandar) return;
    const contributions = [...group.contributions];
    const index = contributions.findIndex(
      c => c.participantId === participantId && c.roundNumber === currentRound.number
    );

    if (index >= 0) {
      contributions[index].isPaid = !contributions[index].isPaid;
      if (contributions[index].isPaid) {
        contributions[index].status = 'verified';
      }
    } else {
      contributions.push({
        participantId,
        roundNumber: currentRound.number,
        isPaid: true,
        paymentDate: new Date().toISOString(),
        status: 'verified',
      });
    }

    onUpdate({ ...group, contributions });
  };

  const handleUploadProof = async (participantId: string, file: File) => {
    try {
      setUploading(participantId);
      const storageRef = ref(storage, `proofs/${group.id}/${currentRound.number}/${participantId}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const contributions = [...group.contributions];
      const index = contributions.findIndex(
        c => c.participantId === participantId && c.roundNumber === currentRound.number
      );

      if (index >= 0) {
        contributions[index].proofUrl = url;
        contributions[index].status = 'pending';
      } else {
        contributions.push({
          participantId,
          roundNumber: currentRound.number,
          isPaid: false,
          paymentDate: new Date().toISOString(),
          proofUrl: url,
          status: 'pending',
        });
      }

      onUpdate({ ...group, contributions });
      toast({ title: 'Bukti berhasil diunggah', description: 'Menunggu verifikasi bandar.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal mengunggah', description: error.message });
    } finally {
      setUploading(null);
    }
  };

  const getContribution = (participantId: string) => {
    return group.contributions.find(
      c => c.participantId === participantId && c.roundNumber === currentRound.number
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-headline">Iuran Putaran #{currentRound.number}</CardTitle>
        <CardDescription>Catat pembayaran iuran dari setiap peserta.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Peserta</TableHead>
              <TableHead>Status Bayar</TableHead>
              <TableHead className="text-right">Bukti / Tandai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.participants.map((p) => {
              const cont = getContribution(p.id);
              const isPaid = cont?.isPaid;
              const hasProof = !!cont?.proofUrl;

              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    {isPaid ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <Check className="mr-1 h-4 w-4" /> Lunas
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center text-violet-600 text-sm">
                          <X className="mr-1 h-4 w-4" /> Belum Bayar
                        </span>
                        {cont?.status === 'pending' && (
                          <span className="text-[10px] text-amber-600 font-medium italic">Menunggu verifikasi</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {hasProof && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Bukti Pembayaran - {p.name}</DialogTitle>
                            </DialogHeader>
                            <div className="relative aspect-[3/4] w-full">
                              <img 
                                src={cont.proofUrl} 
                                alt="Bukti Pembayaran" 
                                className="object-contain w-full h-full rounded-lg"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {!isBandar && !isPaid && (
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadProof(p.id, file);
                            }}
                            disabled={!!uploading}
                          />
                          <Button size="icon" variant="outline" className="h-8 w-8 border-violet-200 text-violet-600" disabled={!!uploading}>
                            {uploading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}

                      {isBandar && (
                        <Checkbox 
                          checked={!!isPaid}
                          onCheckedChange={() => togglePayment(p.id)}
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-6 bg-primary/5 p-4 rounded-lg flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Terkumpul:</span>
          <span className="font-bold text-primary text-lg">
            Rp {(group.contributions.filter(c => c.roundNumber === currentRound.number && c.isPaid).length * group.contributionAmount).toLocaleString('id-ID')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
