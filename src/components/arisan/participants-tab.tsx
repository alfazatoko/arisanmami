"use client";

import { useState } from 'react';
import { UserMinus, UserPlus, Pencil, Check, MessageCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArisanGroup, Participant } from '@/lib/types';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { secondaryAuth, secondaryDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ParticipantsTabProps {
  group: ArisanGroup;
  onUpdate: (group: ArisanGroup) => void;
  isBandar: boolean;
}

export default function ParticipantsTab({ group, onUpdate, isBandar }: ParticipantsTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [participantToDelete, setParticipantToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const cleanPhone = (p: string) => p.replace(/\D/g, '');

  const startEdit = (p: Participant) => {
    if (!isBandar) return;
    setEditingId(p.id);
    setEditName(p.name);
    setEditPhone(p.phone || '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    
    try {
      const participant = group.participants.find(p => p.id === editingId);
      if (!participant) throw new Error("Peserta tidak ditemukan");

      let updatedParticipant = { ...participant, name: editName };
      let newMemberId = null;

      const currentPhoneCleaned = cleanPhone(participant.phone || '');
      const newPhoneCleaned = cleanPhone(editPhone);

      // If they added a valid phone, let's create a Firebase user if it changed
      if (newPhoneCleaned.length >= 8 && newPhoneCleaned !== currentPhoneCleaned) {
        updatedParticipant.phone = newPhoneCleaned;
        
        try {
          const email = `${newPhoneCleaned}@mamaarisan.app`;
          const password = newPhoneCleaned.slice(-4) + '00';
          
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
          const newUserId = userCredential.user.uid;
          
          // Save simple profile so they are marked as 'anggota'
          // We use secondaryDb because the user is signed in to secondaryAuth
          await setDoc(doc(secondaryDb, 'users', newUserId), {
            uid: newUserId,
            name: editName,
            phone: newPhoneCleaned,
            role: 'anggota',
            createdAt: new Date().toISOString()
          });

          // Good hygiene: sign out the secondary auth so we don't leak logic
          await signOut(secondaryAuth);

          updatedParticipant.userId = newUserId;
          newMemberId = newUserId;
          toast({ title: 'Akun Peserta Dibuat', description: `PIN: ${newPhoneCleaned.slice(-4)}` });
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            toast({ variant: 'destructive', title: 'Nomor HP sudah terdaftar', description: 'Gunakan nomor lain atau ini akun yang sudah ada.' });
          } else {
            console.error("Secondary auth error", error);
            toast({ variant: 'destructive', title: 'Gagal membuat akun peserta', description: error.message });
          }
        }
      } else {
        updatedParticipant.phone = editPhone;
      }

      const participants = group.participants.map(p => 
        p.id === editingId ? updatedParticipant : p
      );
      
      const newGroup = { ...group, participants };
      if (newMemberId && !group.memberIds.includes(newMemberId)) {
        newGroup.memberIds = [...group.memberIds, newMemberId];
      }
      
      await onUpdate(newGroup);
      setEditingId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveParticipant = () => {
    if (participantToDelete) {
      const participants = group.participants.filter(p => p.id !== participantToDelete);
      // We should arguably remove them from memberIds but it's okay to leave it for history.
      onUpdate({ ...group, participants });
      setParticipantToDelete(null);
    }
  };

  const addParticipant = () => {
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name: `Peserta Baru ${group.participants.length + 1}`,
      hasWon: false,
    };
    onUpdate({ ...group, participants: [...group.participants, newParticipant] });
  };

  const shareViaWA = (p: Participant) => {
    const message = `Halo ${p.name}, pengingat arisan "${group.name}". Jangan lupa menyelesaikan bagian arisan Anda ya.`;
    const encodedMessage = encodeURIComponent(message);
    let url = `https://wa.me/?text=${encodedMessage}`;
    if (p.phone) {
      let cleanP = cleanPhone(p.phone);
      if (cleanP.startsWith('0')) {
        cleanP = '62' + cleanP.slice(1);
      }
      url = `https://wa.me/${cleanP}?text=${encodedMessage}`;
    }
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-headline">Daftar Peserta</CardTitle>
          <CardDescription>
            {isBandar ? 'Masukkan nomor HP agar otomatis terdaftar dan bisa login.' : 'Data anggota grup arisan.'}
          </CardDescription>
        </div>
        {isBandar && (
          <Button onClick={addParticipant} disabled={loading} size="sm" className="rounded-full bg-primary">
            <UserPlus className="mr-2 h-4 w-4" /> Tambah
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Peserta</TableHead>
              {isBandar && <TableHead>Nomor HP</TableHead>}
              <TableHead>Status</TableHead>
              {isBandar && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {editingId === p.id ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="h-8 max-w-[150px]"
                      placeholder="Nama"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{p.name}</span>
                  )}
                </TableCell>
                {isBandar && (
                  <TableCell>
                    {editingId === p.id ? (
                      <Input 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)} 
                        className="h-8 max-w-[150px]"
                        placeholder="0812..."
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{p.phone || '-'}</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {p.hasWon ? (
                    <Badge variant="secondary" className="bg-secondary/20 text-secondary border-none">Sudah Menang</Badge>
                  ) : (
                    <Badge variant="outline">Belum Menang</Badge>
                  )}
                </TableCell>
                {isBandar && (
                  <TableCell className="text-right">
                    {editingId === p.id ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="default" className="h-8 px-2" onClick={saveEdit} disabled={loading}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => shareViaWA(p)} title="Kirim Pengingat WA">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(p)} disabled={loading}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setParticipantToDelete(p.id)} disabled={p.hasWon || loading}>
                          <UserMinus className="h-4 w-4 text-destructive opacity-50 hover:opacity-100" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!participantToDelete} onOpenChange={(open) => !open && setParticipantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Peserta</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus peserta ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveParticipant} className="bg-destructive hover:bg-destructive/90 text-white">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
