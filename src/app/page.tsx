"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Users, Calendar, Banknote, Trash2, ArrowRight, LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArisanGroup } from '@/lib/types';
import { getGroups, deleteGroup } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [groups, setGroups] = useState<ArisanGroup[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadGroups() {
      if (user && profile) {
        try {
          const data = await getGroups(user.uid, profile.role);
          setGroups(data);
        } catch (error) {
          console.error('Failed to load groups', error);
        } finally {
          setFetching(false);
        }
      } else if (!loading && !user) {
        setFetching(false);
      }
    }
    loadGroups();
  }, [user, profile, loading]);

  const handleDelete = async (groupId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus grup arisan ini?')) {
      try {
        await deleteGroup(groupId);
        setGroups(groups.filter(g => g.id !== groupId));
      } catch (error) {
        console.error('Failed to delete group', error);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-headline">Grup Arisan Saya</h2>
          <p className="text-sm text-muted-foreground capitalize">Peran: {profile.role}</p>
        </div>
        <div className="flex gap-2">
          {profile.role === 'bandar' && (
            <Link href="/groups/new">
              <Button className="rounded-full shadow-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-bold border-none transition-transform hover:scale-105">
                <Plus className="mr-2 h-5 w-5" /> Buat Grup Baru
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Keluar">
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Users className="h-12 w-12 text-primary opacity-50" />
          </div>
          <CardTitle className="text-xl mb-2">Belum ada grup arisan</CardTitle>
          <CardDescription className="max-w-xs mx-auto mb-6">
            {profile.role === 'bandar' 
              ? 'Mulai arisan pertama Anda dengan menambahkan peserta dan menentukan nilai iuran.'
              : 'Anda belum terdaftar di grup arisan manapun. Hubungi Bandar untuk ditambahkan.'}
          </CardDescription>
          {profile.role === 'bandar' && (
            <Link href="/groups/new">
              <Button variant="outline" className="rounded-full">
                Buat Grup Arisan Sekarang
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-primary font-headline">{group.name}</CardTitle>
                  {profile.role === 'bandar' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Dibuat {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true, locale: id })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{group.participants.length} Peserta</span>
                </div>
                <div className="flex items-center text-sm">
                  <Banknote className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Rp {group.contributionAmount.toLocaleString('id-ID')} / {group.frequency}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Putaran: {group.rounds.filter(r => r.status === 'completed').length} / {group.rounds.length}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/groups/${group.id}`} className="w-full">
                  <Button variant="secondary" className="w-full rounded-full group">
                    Buka Dashboard <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
