"use client";

import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useEffect } from 'react';

export function HeaderActions() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestPermission, permission } = useNotifications(user?.uid);

  useEffect(() => {
    // Optionally auto-prompt, but modern browsers require user gesture
  }, []);

  if (!user) return <div className="bg-secondary/20 p-2 rounded-full"><span className="text-secondary font-bold text-sm px-3 py-1 bg-white rounded-full shadow-sm">v1.0</span></div>;

  return (
    <div className="flex items-center gap-3">
      {permission !== 'granted' && (
        <Button variant="ghost" size="sm" onClick={requestPermission} className="text-xs text-muted-foreground hidden sm:flex">
          Enable Push Notif
        </Button>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative rounded-full h-10 w-10">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-bold">Notifikasi</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" onClick={markAllAsRead}>
                Tandai semua dibaca
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Belum ada notifikasi</div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b last:border-0 hover:bg-muted/50 cursor-pointer ${!n.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => !n.isRead && markAsRead(n.id)}
                  >
                    <div className="flex gap-3">
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground pt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: id })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <div className="bg-secondary/20 p-2 rounded-full hidden sm:block">
        <span className="text-secondary font-bold text-sm px-3 py-1 bg-white rounded-full shadow-sm">v1.0</span>
      </div>
    </div>
  );
}
