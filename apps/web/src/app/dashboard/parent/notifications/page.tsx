'use client';

import { useEffect, useState } from 'react';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentNotificationItem } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { Bell, Megaphone, Calendar } from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';

export default function ParentNotificationsPage() {
  const { selectedChildId, selectedChild } = useChildSwitcher();
  const [data, setData] = useState<ParentNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedChildId) return;
    let isMounted = true;
    setIsLoading(true);
    parentPortalService
      .getNotifications(selectedChildId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Announcements & Alerts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Recent notifications for <strong className="text-slate-800">{selectedChild?.name}</strong>
        </p>
      </div>

      <div className="space-y-3 max-w-3xl">
        {data.length > 0 ? (
          data.map((item) => (
            <Card
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2 hover:border-teal-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                  <Megaphone className="h-3 w-3" />
                  {item.category || 'ANNOUNCEMENT'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-white border border-slate-200">
            No announcements available right now.
          </Card>
        )}
      </div>
    </div>
  );
}
