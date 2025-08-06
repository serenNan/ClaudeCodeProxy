import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/contexts/ToastContext';
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

interface AnnouncementForm {
  title: string;
  content: string;
  isVisible: boolean;
  backgroundColor: string;
  textColor: string;
  priority: number;
  startTime?: string;
  endTime?: string;
}

const defaultColors = [
  { name: '蓝色', bg: 'bg-blue-50', text: 'text-blue-800' },
  { name: '绿色', bg: 'bg-green-50', text: 'text-green-800' },
  { name: '黄色', bg: 'bg-yellow-50', text: 'text-yellow-800' },
  { name: '红色', bg: 'bg-red-50', text: 'text-red-800' },
  { name: '紫色', bg: 'bg-purple-50', text: 'text-purple-800' },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementForm>({
    title: '',
    content: '',
    isVisible: true,
    backgroundColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    priority: 0,
    startTime: '',
    endTime: '',
  });

  const { showToast } = useToast();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAnnouncements();
      setAnnouncements(response);
    } catch (error) {
      showToast('加载失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      isVisible: true,
      backgroundColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      priority: 0,
      startTime: '',
      endTime: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      isVisible: announcement.isVisible,
      backgroundColor: announcement.backgroundColor,
      textColor: announcement.textColor,
      priority: announcement.priority,
      startTime: announcement.startTime || '',
      endTime: announcement.endTime || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认要删除这个公告吗？')) return;

    try {
      await apiService.deleteAnnouncement(id);
      showToast('删除成功', 'success');
      loadAnnouncements();
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const handleToggleVisibility = async (announcement: Announcement) => {
    try {
      const response = await apiService.toggleAnnouncementVisibility(announcement.id);
      setAnnouncements(prev =>
        prev.map(a => (a.id === announcement.id ? response : a))
      );
      showToast(response.isVisible ? '公告已显示' : '公告已隐藏', 'success');
    } catch (error) {
      showToast('无法切换公告状态', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast('请填写标题', 'error');
      return;
    }

    if (!formData.content.trim()) {
      showToast('请填写内容', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
      };

      if (editingAnnouncement) {
        const response = await apiService.updateAnnouncement(editingAnnouncement.id, payload);
        setAnnouncements(prev =>
          prev.map(a => (a.id === editingAnnouncement.id ? response : a))
        );
        showToast('公告已更新', 'success');
      } else {
        const response = await apiService.createAnnouncement(payload);
        setAnnouncements(prev => [response, ...prev]);
        showToast('公告已创建', 'success');
      }

      setIsDialogOpen(false);
    } catch (error) {
      showToast(editingAnnouncement ? '无法更新公告' : '无法创建公告', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">公告管理</h1>
          <p className="text-muted-foreground">管理系统顶部显示的公告内容</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建公告
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>公告列表</CardTitle>
          <CardDescription>管理所有公告内容</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无公告</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            announcement.isVisible
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {announcement.isVisible ? '显示' : '隐藏'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          优先级: {announcement.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {announcement.content}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        创建: {formatDate(announcement.createdAt)}
                        {announcement.modifiedAt && (
                          <span> · 更新: {formatDate(announcement.modifiedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(announcement)}
                      >
                        {announcement.isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? '编辑公告' : '新建公告'}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? '更新公告信息' : '创建新的系统公告'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>标题 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder='输入公告标题'
              />
            </div>

            <div>
              <Label>内容 *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder='输入公告内容'
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>优先级</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label>显示公告</Label>
                <Switch
                  checked={formData.isVisible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                />
              </div>
            </div>

            <div>
              <Label>颜色主题</Label>
              <div className="flex gap-2 mt-2">
                {defaultColors.map((color) => (
                  <Button
                    key={color.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`${
                      formData.backgroundColor === color.bg
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : ''
                    }`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        backgroundColor: color.bg,
                        textColor: color.text,
                      })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${color.bg}`} />
                      <span className="text-sm">{color.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>开始时间</Label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div>
                <Label>结束时间</Label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingAnnouncement ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}