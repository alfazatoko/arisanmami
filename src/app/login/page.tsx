'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogIn, ShieldCheck, Download } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [bandarMode, setBandarMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const cleanPhone = (p: string) => p.replace(/\D/g, '');

  const handleAnggotaLogin = async () => {
    try {
      setLoading(true);
      const cleaned = cleanPhone(phone);
      if (cleaned.length < 8) throw new Error('Nomor HP tidak valid');
      
      const email = `${cleaned}@mamaarisan.app`;
      // Anggota PIN is auto-derived (the last 4 digits + '00')
      const password = cleaned.slice(-4) + '00';
      
      const cred = await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Berhasil masuk!', description: 'Selamat datang di Arisan Mami.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Pastikan nomor HP sudah didaftarkan Bandar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBandarLogin = async () => {
    try {
      setLoading(true);
      const cleaned = cleanPhone(phone);
      if (cleaned.length < 8) throw new Error('Nomor HP tidak valid');
      if (pin.length < 6) throw new Error('PIN minimal 6 karakter');
      
      const email = `${cleaned}@mamaarisan.app`;
      const password = pin;
      
      const cred = await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Berhasil masuk!', description: 'Selamat datang Bandar.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Nomor HP atau PIN salah.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBandar = async () => {
    try {
      setLoading(true);
      const cleaned = cleanPhone(phone);
      if (cleaned.length < 8) throw new Error('Nomor HP tidak valid');
      if (pin.length < 6) throw new Error('PIN minimal 6 karakter');
      if (!name.trim()) throw new Error('Nama harus diisi');
      
      const email = `${cleaned}@mamaarisan.app`;
      const password = pin;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc((await import('@/lib/firebase')).db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name,
        phone: cleaned,
        role: 'bandar',
        createdAt: new Date().toISOString()
      });
      toast({ title: 'Berhasil mendaftar!', description: 'Selamat datang Bandar.' });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ variant: 'destructive', title: 'Sudah terdaftar', description: 'Nomor HP sudah terdaftar. Silahkan masuk.' });
      } else {
        toast({ variant: 'destructive', title: 'Gagal mendaftar', description: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser && profile) router.push('/');
  }, [auth.currentUser, profile, router]);

  if (auth.currentUser && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (auth.currentUser && profile) return null;
  if (!isMounted) return null;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary">Masuk ke Arisan Mami</CardTitle>
          <CardDescription>Pilih peran Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="anggota" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="bandar">BANDAR</TabsTrigger>
              <TabsTrigger value="anggota">ANGGOTA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="anggota" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="phone-anggota">Nomor HP</Label>
                <Input 
                  id="phone-anggota" 
                  type="tel"
                  placeholder="Contoh: 081234567890" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Anggota tidak memerlukan PIN. Masukkan nomor yang didaftarkan Bandar.
                </p>
              </div>
              <Button onClick={handleAnggotaLogin} className="w-full py-6 flex gap-3 text-lg rounded-full" disabled={loading || phone.length < 8}>
                <LogIn className="h-5 w-5" />
                Masuk
              </Button>
            </TabsContent>

            <TabsContent value="bandar" className="space-y-4 pt-4">
              {bandarMode === 'login' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-bandar">Nomor HP</Label>
                    <Input 
                      id="phone-bandar" 
                      type="tel"
                      placeholder="Contoh: 081234567890" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin-bandar">PIN (Minimal 6 karakter)</Label>
                    <Input 
                      id="pin-bandar" 
                      type="password"
                      placeholder="******" 
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleBandarLogin} className="w-full py-6 flex gap-3 text-lg rounded-full" disabled={loading || phone.length < 8 || pin.length < 6}>
                    <LogIn className="h-5 w-5" />
                    Masuk
                  </Button>
                  <div className="text-center mt-4 text-sm">
                    <button onClick={() => setBandarMode('register')} className="text-primary hover:underline">
                      Baru di Arisan Mami? Daftar Bandar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nama Lengkap</Label>
                    <Input 
                      id="reg-name" 
                      placeholder="Misal: Arisan Mami" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Nomor HP</Label>
                    <Input 
                      id="reg-phone" 
                      type="tel"
                      placeholder="Contoh: 081234567890" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-pin">PIN Baru (Minimal 6 karakter)</Label>
                    <Input 
                      id="reg-pin" 
                      type="password"
                      placeholder="Buat PIN 6 angka/huruf" 
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleRegisterBandar} className="w-full py-6 flex gap-3 text-lg rounded-full" disabled={loading || phone.length < 8 || !name || pin.length < 6}>
                    <ShieldCheck className="h-5 w-5" />
                    Daftar Bandar
                  </Button>
                  <div className="text-center mt-4 text-sm">
                    <button onClick={() => setBandarMode('login')} className="text-primary hover:underline">
                      Sudah punya akun? Masuk
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {deferredPrompt && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            className="rounded-full shadow-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 font-bold border-none transition-transform hover:scale-105"
            size="lg"
            onClick={() => {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt');
                }
                setDeferredPrompt(null);
              });
            }}
          >
            <Download className="mr-2 h-5 w-5" />
            INSTALL APLIKASI
          </Button>
        </div>
      )}
    </div>
  );
}
