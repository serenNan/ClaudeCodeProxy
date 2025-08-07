import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiService } from '@/services/api';

interface Announcement {
  id: number;
  title: string;
  content: string;
  isVisible: boolean;
  backgroundColor: string;
  textColor: string;
  priority: number;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  modifiedAt?: string;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCurrentAnnouncements();
      setAnnouncements(response);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (id: number) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedIds.includes(announcement.id)
  );

  if (isLoading || visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleAnnouncements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`mx-4 mt-4 p-4 ${announcement.backgroundColor} border-0 shadow-sm`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Bell className={`h-5 w-5 ${announcement.textColor} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium ${announcement.textColor}`}>
                  {announcement.title}
                </h3>
                <div className={`mt-1 text-sm ${announcement.textColor} opacity-90`}>
                  <p className="whitespace-pre-wrap">{announcement.content}</p>
                </div>
                {announcement.startTime && (
                  <p className={`text-xs ${announcement.textColor} opacity-70 mt-2`}>
                    开始时间: {new Date(announcement.startTime).toLocaleString('zh-CN')}
                  </p>
                )}
                {announcement.endTime && (
                  <p className={`text-xs ${announcement.textColor} opacity-70`}>
                    结束时间: {new Date(announcement.endTime).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(announcement.id)}
              className={`h-6 w-6 p-0 ${announcement.textColor} hover:opacity-70`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}