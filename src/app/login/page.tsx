'use client';

import { useState } from 'react';
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
import { LogIn, Phone, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { profile, setRole } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');

  const cleanPhone = (p: string) => p.replace(/\D/g, '');

  const handlePhoneLogin = async () => {
    try {
      setLoading(true);
      const cleaned = cleanPhone(phone);
      if (cleaned.length < 8) {
        throw new Error('Nomor HP tidak valid');
      }
      const email = `${cleaned}@mamaarisan.app`;
      // PIN is the last 4 digits + '00' to satisfy 6-char minimum
      const password = cleaned.slice(-4) + '00';
      
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Berhasil masuk!', description: 'Selamat datang di MamaArisan.' });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast({ variant: 'destructive', title: 'Gagal masuk', description: 'Nomor HP belum terdaftar oleh Bandar atau PIN salah.' });
      } else {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Pastikan fitur Sign In Email/Password telah diaktifkan di Firebase Console.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBandar = async () => {
    try {
      setLoading(true);
      const cleaned = cleanPhone(phone);
      if (cleaned.length < 8) {
        throw new Error('Nomor HP tidak valid');
      }
      if (!name.trim()) {
        throw new Error('Nama harus diisi');
      }
      
      const email = `${cleaned}@mamaarisan.app`;
      const password = cleaned.slice(-4) + '00';
      
      // Create account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Automatic role assignment
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc((await import('@/lib/firebase')).db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name,
        phone: cleaned,
        role: 'bandar',
        createdAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast({ variant: 'destructive', title: 'Sudah terdaftar', description: 'Nomor HP sudah terdaftar. Silahkan masuk.' });
      } else {
        toast({ variant: 'destructive', title: 'Gagal mendaftar', description: 'Pastikan fitur Sign In Email/Password telah diaktifkan di Firebase Console.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (auth.currentUser && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (auth.currentUser && profile) {
    router.push('/');
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary">Masuk ke MamaArisan</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Masuk dengan Nomor HP yang didaftarkan Bandar' : 'Daftar sebagai Bandar Baru'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  placeholder="0812xxxxxx" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Catatan: PIN Anda otomatis 4 digit terakhir nomor HP Anda.
                </p>
              </div>
              <Button onClick={handlePhoneLogin} className="w-full py-6 flex gap-3 text-lg rounded-full" disabled={loading || phone.length < 8}>
                <LogIn className="h-5 w-5" />
                Masuk
              </Button>
              <div className="text-center mt-4 text-sm">
                <button onClick={() => setMode('register')} className="text-primary hover:underline">
                  Baru di MamaArisan? Daftar Bandar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nama Lengkap</Label>
                <Input 
                  id="reg-name" 
                  placeholder="Misal: Mama Arisan" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Nomor HP</Label>
                <Input 
                  id="reg-phone" 
                  type="tel"
                  placeholder="0812xxxxxx" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  PIN Anda otomatis 4 digit terakhir nomor HP.
                </p>
              </div>
              <Button onClick={handleRegisterBandar} className="w-full py-6 flex gap-3 text-lg rounded-full" disabled={loading || phone.length < 8 || !name}>
                <ShieldCheck className="h-5 w-5" />
                Daftar Bandar
              </Button>
              <div className="text-center mt-4 text-sm">
                <button onClick={() => setMode('login')} className="text-primary hover:underline">
                  Sudah punya akun? Masuk
                </button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground flex flex-col justify-center gap-2">
          <p>Karena menggunakan email/password terselubung, mohon pastikan <strong>Email/Password</strong> provider sudah diaktifkan di Firebase Console.</p>
          <p>Dengan masuk, Anda setuju dengan syarat dan ketentuan kami.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
