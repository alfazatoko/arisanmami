"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveGroup, createInitialRounds } from '@/lib/store';
import { DrawingFrequency, ArisanGroup } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function NewGroup() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('100000');
  const [frequency, setFrequency] = useState<DrawingFrequency>('monthly');
  const [participantCount, setParticipantCount] = useState('5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'bandar')) {
      router.push('/');
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    try {
      setSaving(true);
      const count = parseInt(participantCount);
      const newGroup: any = {
        id: crypto.randomUUID(),
        name,
        contributionAmount: parseInt(amount),
        frequency,
        creatorId: user.uid,
        memberIds: [user.uid],
        participants: Array.from({ length: count }, (_, i) => ({
          id: crypto.randomUUID(),
          name: `Peserta ${i + 1}`,
          hasWon: false,
        })),
        rounds: createInitialRounds(count),
        contributions: [],
        createdAt: new Date().toISOString(),
      };

      await saveGroup(newGroup);
      toast({ title: 'Grup berhasil dibuat', description: 'Silahkan kelola peserta Anda.' });
      router.push(`/groups/${newGroup.id}`);
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal membuat grup', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || profile?.role !== 'bandar') return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="rounded-full">
        <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Buat Grup Arisan Baru</CardTitle>
          <CardDescription>
            Tentukan nama grup, jumlah iuran, dan frekuensi pengundian.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Grup Arisan</Label>
              <Input 
                id="name" 
                placeholder="Misal: Arisan RT 01" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Iuran (Rp)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frekuensi Pengundian</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as DrawingFrequency)}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Pilih frekuensi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="biweekly">Dua Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Jumlah Peserta (Awal)</Label>
              <Input 
                id="participants" 
                type="number" 
                min="2" 
                value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value)}
                required 
              />
              <p className="text-xs text-muted-foreground">Anda bisa mengubah nama peserta setelah grup dibuat.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90 py-6" disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan dan Lanjutkan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
