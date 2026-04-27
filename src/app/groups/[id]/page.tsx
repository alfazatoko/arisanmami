"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Trophy, History, MessageCircle, CreditCard, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArisanGroup, Participant } from '@/lib/types';
import { getGroupById, saveGroup } from '@/lib/store';
import ParticipantsTab from '@/components/arisan/participants-tab';
import ContributionsTab from '@/components/arisan/contributions-tab';
import DrawingTab from '@/components/arisan/drawing-tab';
import HistoryTab from '@/components/arisan/history-tab';
import RemindersTab from '@/components/arisan/reminders-tab';
import { useAuth } from '@/context/AuthContext';

export default function GroupDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [group, setGroup] = useState<ArisanGroup | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadGroup() {
      if (!id) return;
      try {
        const data = await getGroupById(id);
        if (!data) {
          router.push('/');
          return;
        }
        setGroup(data);
      } catch (error) {
        console.error(`Failed to load group with id: ${id}`, error);
        router.push('/');
      } finally {
        setFetching(false);
      }
    }
    loadGroup();
  }, [id, router]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group || !profile) return null;

  const isBandar = profile.role === 'bandar' || group.creatorId === user?.uid;

  const updateGroup = async (updatedGroup: ArisanGroup) => {
    if (!isBandar) return;
    try {
      await saveGroup(updatedGroup);
      setGroup({ ...updatedGroup });
    } catch (error) {
      console.error('Failed to update group', error);
    }
  };

  const nextRound = group.rounds.find(r => r.status === 'pending');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/')} className="rounded-full">
          <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </div>

      <header className="space-y-1">
        <h2 className="text-3xl font-bold font-headline text-primary">{group.name}</h2>
        <p className="text-muted-foreground">
          Iuran: Rp {group.contributionAmount.toLocaleString('id-ID')} • Frekuensi: {group.frequency}
        </p>
      </header>

      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid grid-cols-5 w-full bg-muted/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="participants" className="rounded-lg py-2 flex-col gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            <span className="text-[10px] sm:text-xs">Peserta</span>
          </TabsTrigger>
          <TabsTrigger value="contributions" className="rounded-lg py-2 flex-col gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4" />
            <span className="text-[10px] sm:text-xs">Iuran</span>
          </TabsTrigger>
          <TabsTrigger value="drawing" className="rounded-lg py-2 flex-col gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Trophy className="h-4 w-4" />
            <span className="text-[10px] sm:text-xs">Undian</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="rounded-lg py-2 flex-col gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageCircle className="h-4 w-4" />
            <span className="text-[10px] sm:text-xs">Pengingat</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg py-2 flex-col gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="h-4 w-4" />
            <span className="text-[10px] sm:text-xs">Riwayat</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="participants">
            <ParticipantsTab group={group} onUpdate={updateGroup} isBandar={isBandar} />
          </TabsContent>
          <TabsContent value="contributions">
            <ContributionsTab group={group} onUpdate={updateGroup} isBandar={isBandar} />
          </TabsContent>
          <TabsContent value="drawing">
            <DrawingTab group={group} onUpdate={updateGroup} isBandar={isBandar} />
          </TabsContent>
          <TabsContent value="reminders">
            <RemindersTab group={group} isBandar={isBandar} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab group={group} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
