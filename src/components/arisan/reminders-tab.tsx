"use client";

import { useState } from 'react';
import { MessageSquare, Send, Copy, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArisanGroup } from '@/lib/types';
import { generateArisanReminders, GenerateArisanRemindersOutput } from '@/ai/flows/generate-arisan-reminders-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RemindersTabProps {
  group: ArisanGroup;
  isBandar: boolean;
}

export default function RemindersTab({ group, isBandar }: RemindersTabProps) {
  const { toast } = useToast();
  const [eventType, setEventType] = useState<'contribution' | 'drawing'>('contribution');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerateArisanRemindersOutput | null>(null);

  if (!isBandar) {
    return (
      <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
        <AlertCircle className="h-12 w-12 opacity-20 mb-4" />
        <p>Fitur pengingat AI hanya tersedia untuk Bandar.</p>
      </div>
    );
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Prepare participants with context for AI
      const participantsWithContext = group.participants.map(p => {
        let context = "";
        const nextRound = group.rounds.find(r => r.status === 'pending');
        if (nextRound) {
            const contribution = group.contributions.find(c => c.participantId === p.id && c.roundNumber === nextRound.number);
            if (!contribution || !contribution.isPaid) {
                context = "belum bayar iuran";
            } else {
                context = "sudah bayar";
            }
        }
        if (p.hasWon) context += ", sudah pernah menang";
        return {
          name: p.name,
          additionalContext: context
        };
      });

      const result = await generateArisanReminders({
        groupName: group.name,
        participants: participantsWithContext,
        eventType: eventType,
        eventDate: new Date().toLocaleDateString('id-ID'),
        contributionAmount: group.contributionAmount,
        additionalInfo: "Jangan lupa bawa semangat dan ceritanya ya!"
      });
      setResults(result);
    } catch (error) {
      console.error(error);
      toast({
        title: "Gagal membuat pengingat",
        description: "Terjadi kesalahan saat menghubungi asisten AI.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Pesan disalin ke papan klip!"
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-secondary/20 bg-secondary/5">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2 text-secondary">
            <Sparkles className="h-5 w-5" /> Buat Pengingat Otomatis
          </CardTitle>
          <CardDescription>
            Gunakan AI untuk membuat pesan pengingat yang ramah dan personal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Jenis Acara</label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as any)}>
                <SelectTrigger className="bg-white rounded-full">
                  <SelectValue placeholder="Pilih jenis acara" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution">Pembayaran Iuran</SelectItem>
                  <SelectItem value="drawing">Pengundian Arisan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="w-full rounded-full bg-secondary hover:bg-secondary/90 shadow-md"
              >
                {isGenerating ? "Sedang Menulis..." : "Buat Pesan Sekarang"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {results && (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {results.reminders.map((reminder, idx) => (
              <Card key={idx} className="bg-white shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-primary">{reminder.participantName}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 rounded-full opacity-0 group-hover:opacity-100"
                      onClick={() => copyToClipboard(reminder.message)}
                    >
                      <Copy className="mr-2 h-3 w-3" /> Salin
                    </Button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {reminder.message}
                  </p>
                  <div className="flex justify-end pt-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-8 rounded-full text-xs"
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(reminder.message)}`, '_blank')}
                    >
                      <Send className="mr-2 h-3 w-3" /> Kirim via WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {!results && !isGenerating && (
        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
          <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
          <p>Pilih jenis acara dan klik tombol di atas untuk membuat pesan.</p>
        </div>
      )}
    </div>
  );
}
