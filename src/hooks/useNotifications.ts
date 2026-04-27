import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface InAppNotification {
  id: string;
  userId: string;
  groupId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: InAppNotification[] = [];
      let unread = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data() as InAppNotification;
        notifs.push(data);
        if (!data.isRead) unread++;
      });
      
      // Sort in memory by descending date
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(notifs);
      setUnreadCount(unread);

      // Simple browser notification for new ones (this logic only fires when notifs change)
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as InAppNotification;
          const isNew = new Date(data.createdAt).getTime() > Date.now() - 5000; // Only pop up if created within last 5 seconds
          if (isNew && !data.isRead && permission === 'granted') {
            new Notification(data.title, { body: data.body });
          }
        }
      });
    }, (error) => {
      console.error("Notifications listener error:", error);
    });

    return () => unsubscribe();
  }, [userId, permission]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error("Error marking read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      for (const n of unreadNotifs) {
        await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
      }
    } catch (e) {
      console.error("Error marking all read:", e);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, requestPermission, permission };
}
