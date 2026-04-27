"use client";

import { useState } from 'react';
import { Trophy, Sparkles, AlertTriangle, PlayCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArisanGroup, Participant } from '@/lib/types';
import { generateWinnerAnnouncement } from '@/ai/flows/generate-winner-announcement-flow';
import { useToast } from '@/hooks/use-toast';

interface DrawingTabProps {
  group: ArisanGroup;
  onUpdate: (group: ArisanGroup) => void;
  isBandar: boolean;
}

export default function DrawingTab({ group, onUpdate, isBandar }: DrawingTabProps) {
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const pendingRound = group.rounds.find(r => r.status === 'pending');
  const eligibleParticipants = group.participants.filter(p => !p.hasWon);
  const paidCount = group.contributions.filter(c => c.roundNumber === pendingRound?.number && c.isPaid).length;
  const isReady = paidCount === group.participants.length;

  const playSynthesizedSound = (type: 'drumroll' | 'tada') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      
      if (type === 'drumroll') {
        const duration = 2.5;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(100, ctx.currentTime);
        // drum roll effect using frequency modulation
        oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(1, ctx.currentTime + duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
        
        // Tremolo effect for the drum roll
        const lfo = ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.value = 15; // 15 Hz
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.5;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime);
        lfo.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
        lfo.stop(ctx.currentTime + duration);
        
      } else if (type === 'tada') {
        const duration = 1.5;
        const oscillator1 = ctx.createOscillator();
        const oscillator2 = ctx.createOscillator();
        const oscillator3 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // C Major chord notes
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        
        oscillator3.type = 'sine';
        oscillator3.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        oscillator3.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator1.start(ctx.currentTime);
        oscillator2.start(ctx.currentTime);
        oscillator3.start(ctx.currentTime);
        
        oscillator1.stop(ctx.currentTime + duration);
        oscillator2.stop(ctx.currentTime + duration);
        oscillator3.stop(ctx.currentTime + duration);
      }
    } catch (e) {
      console.log('Web Audio API not supported or blocked');
    }
  };

  const startDraw = async () => {
    if (!pendingRound) return;
    
    setIsDrawing(true);
    setWinner(null);
    setAiMessage(null);

    playSynthesizedSound('drumroll');

    // Dramatic pause for animation effect
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    playSynthesizedSound('tada');

    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const selectedWinner = eligibleParticipants[randomIndex];
    
    setWinner(selectedWinner);

    try {
      // Use AI to generate a fun announcement
      const result = await generateWinnerAnnouncement({
        winnerName: selectedWinner.name,
        groupName: group.name,
        fairDrawingProcessExplanation: "Sistem mengacak secara digital dari daftar peserta yang belum pernah menang, memastikan keadilan bagi semua ibu."
      });
      setAiMessage(result.announcementMessage);
    } catch (error) {
      console.error(error);
      setAiMessage(`Selamat kepada ${selectedWinner.name}! Anda adalah pemenang Arisan ${group.name} putaran ini.`);
    } finally {
      setIsDrawing(false);
    }
  };

  const confirmWinner = () => {
    if (!winner || !pendingRound) return;

    const participants = group.participants.map(p => 
      p.id === winner.id ? { ...p, hasWon: true, winRound: pendingRound.number } : p
    );

    const rounds = group.rounds.map(r => 
      r.number === pendingRound.number ? { ...r, status: 'completed' as const, winnerId: winner.id } : r
    );

    onUpdate({ ...group, participants, rounds });
    setWinner(null);
    setAiMessage(null);
    
    toast({
      title: "Pemenang Disimpan!",
      description: `Putaran #${pendingRound.number} telah resmi dimenangkan oleh ${winner.name}.`
    });
  };

  if (!pendingRound) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Semua putaran telah selesai.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!isReady && (
        <div className="bg-violet-50 border border-violet-100 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
          <div className="text-sm text-violet-800">
            <p className="font-bold">Perhatian!</p>
            <p>Belum semua peserta melunasi iuran ({paidCount}/{group.participants.length}). Sebaiknya tunggu semua lunas sebelum mengundi.</p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="bg-primary/5 text-center">
          <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Pengundian Putaran #{pendingRound.number}
          </CardTitle>
          <CardDescription>
            Sistem MamaArisan menjamin keadilan bagi setiap peserta.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="py-10 text-center">
          {isDrawing ? (
            <div className="space-y-6 animate-pulse">
              <div className="relative h-32 w-32 mx-auto">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="relative bg-white rounded-full p-8 shadow-inner flex items-center justify-center">
                  <Trophy className="h-16 w-16 text-primary animate-bounce" />
                </div>
              </div>
              <p className="text-xl font-medium text-primary">Mengacak Nama Peserta...</p>
              <div className="flex flex-wrap justify-center gap-2 opacity-30">
                {eligibleParticipants.map(p => (
                  <span key={p.id} className="text-xs px-2 py-1 bg-muted rounded">{p.name}</span>
                ))}
              </div>
            </div>
          ) : winner ? (
            <div className="space-y-6 animate-in zoom-in duration-500">
              <div className="h-32 w-32 bg-secondary/10 rounded-full mx-auto flex items-center justify-center">
                <Trophy className="h-20 w-20 text-secondary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-primary font-headline">{winner.name}</h3>
                <p className="text-muted-foreground">Selamat, Ibu!</p>
              </div>
              
              {aiMessage && (
                <div className="mt-6 bg-secondary/5 p-6 rounded-2xl italic text-secondary-foreground shadow-sm relative border border-secondary/20">
                   <div className="absolute -top-3 left-6 bg-secondary text-white px-3 py-1 rounded-full text-xs not-italic">Pesan AI</div>
                  "{aiMessage}"
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-muted-foreground max-w-xs mx-auto">
                Terdapat <strong>{eligibleParticipants.length}</strong> peserta yang belum pernah menang dan siap diundi.
              </p>
              {isBandar ? (
                <Button 
                  onClick={startDraw} 
                  className="rounded-full px-12 py-8 text-xl bg-primary hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all"
                >
                  <PlayCircle className="mr-3 h-8 w-8" /> MULAI UNDI
                </Button>
              ) : (
                <div className="bg-muted p-4 rounded-xl text-sm">
                  Menunggu Bandar memulai pengundian...
                </div>
              )}
            </div>
          )}
        </CardContent>

        {winner && !isDrawing && isBandar && (
          <CardFooter className="bg-muted/30 gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => { setWinner(null); setAiMessage(null); }}>
              Ulang Undi
            </Button>
            <Button className="flex-1 rounded-full bg-primary" onClick={confirmWinner}>
              Konfirmasi & Selesai
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
