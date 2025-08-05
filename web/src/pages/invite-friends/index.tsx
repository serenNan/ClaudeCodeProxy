import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Link2, Gift, Copy, Check, CalendarDays, Trophy, User, Mail } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { apiService, type InvitationStatsDto, type InvitationRecordDto } from '@/services/api'

const InviteFriendsPage: React.FC = () => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invitationStats, setInvitationStats] = useState<InvitationStatsDto | null>(null)
  const [invitationRecords, setInvitationRecords] = useState<InvitationRecordDto[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchInvitationData()
  }, [])

  const fetchInvitationData = async () => {
    try {
      setLoading(true)
      const [stats, records] = await Promise.all([
        apiService.getInvitationStats(),
        apiService.getInvitationRecords()
      ])

      setInvitationStats(stats)
      setInvitationRecords(records)
    } catch (error) {
      console.error('Failed to fetch invitation data:', error)
      showToast('获取邀请数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!invitationStats?.invitationLink) {
      showToast('邀请链接不可用', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invitationStats.invitationLink}`)
      setCopied(true)
      showToast('邀请链接已复制到剪贴板', 'success')

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      showToast('复制链接失败', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">邀请好友</h1>
          <p className="text-muted-foreground">邀请朋友注册，获得丰厚奖励</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已邀请人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {invitationStats?.totalInvited || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              最多可邀请 {invitationStats?.maxInvitations || 0} 人
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">邀请额度</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invitationStats ? invitationStats.maxInvitations - invitationStats.totalInvited : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              剩余邀请名额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计奖励</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ¥{invitationStats?.totalReward?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              已获得的邀请奖励
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {invitationStats?.maxInvitations ?
                ((invitationStats.totalInvited / invitationStats.maxInvitations) * 100).toFixed(1) :
                '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              邀请完成度
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invitation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link2 className="h-5 w-5" />
            <span>我的邀请链接</span>
          </CardTitle>
          <CardDescription>
            分享此链接给朋友，朋友注册成功后，您和朋友都将获得奖励
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={`${window.location.origin}${invitationStats?.invitationLink || ''}` || ''}
              readOnly
              className="flex-1 font-mono text-sm"
              placeholder="邀请链接加载中..."
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              disabled={!invitationStats?.invitationLink}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  复制
                </>
              )}
            </Button>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">邀请规则：</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 朋友通过您的邀请链接注册并完成首次充值</li>
              <li>• 您将获得 ¥10 奖励，朋友获得 ¥5 新人奖励</li>
              <li>• 奖励将在朋友完成首次充值后 24 小时内到账</li>
              <li>• 每个账户最多可邀请 {invitationStats?.maxInvitations || 0} 位朋友</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Invitation Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>邀请记录</span>
          </CardTitle>
          <CardDescription>
            查看您的邀请历史和奖励状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无邀请记录</h3>
              <p className="text-muted-foreground mb-4">
                开始邀请朋友加入，获得丰厚奖励
              </p>
              <Button onClick={handleCopyLink} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                复制邀请链接
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">头像</TableHead>
                      <TableHead>用户信息</TableHead>
                      <TableHead>邀请时间</TableHead>
                      <TableHead>我的奖励</TableHead>
                      <TableHead>朋友奖励</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitationRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{record.invitedUsername}</div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="mr-1 h-3 w-3" />
                              {record.invitedEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(record.invitedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            ¥{record.inviterReward.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-blue-600">
                            ¥{record.invitedReward.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={record.rewardProcessed ? 'default' : 'secondary'}
                          >
                            {record.rewardProcessed ? '已发放' : '处理中'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {record.notes || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                <span>
                  共 {invitationRecords.length} 条邀请记录
                </span>
                <span>
                  已处理奖励：{invitationRecords.filter(r => r.rewardProcessed).length} / {invitationRecords.length}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InviteFriendsPage