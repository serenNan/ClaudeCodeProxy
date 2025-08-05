import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Gift,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { apiService } from '@/services/api'
import type {
  RedeemCode,
  CreateRedeemCodeRequest,
  RedeemCodeListRequest,
  RedeemCodeStats
} from '@/services/api'

const RedeemCodesPage: React.FC = () => {
  const { showToast } = useToast()
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<RedeemCodeStats | null>(null)

  // 分页和过滤
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    code: '',
    type: 'all',
    isUsed: 'all',
    isEnabled: 'all',
    sortBy: 'CreatedAt',
    sortDirection: 'desc'
  })

  // 对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm, setCreateForm] = useState<CreateRedeemCodeRequest>({
    type: 'balance',
    amount: 0,
    description: '',
    expiresAt: undefined,
    count: 1
  })
  const [createdCodes, setCreatedCodes] = useState<RedeemCode[]>([])
  const [showCreatedCodesDialog, setShowCreatedCodesDialog] = useState(false)

  useEffect(() => {
    loadRedeemCodes()
    loadStats()
  }, [currentPage, filters])

  const loadRedeemCodes = async () => {
    setLoading(true)
    try {
      const request: RedeemCodeListRequest = {
        page: currentPage,
        pageSize: 20,
        code: filters.code || undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        isUsed: filters.isUsed !== 'all' ? filters.isUsed === 'true' : undefined,
        isEnabled: filters.isEnabled !== 'all' ? filters.isEnabled === 'true' : undefined,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection
      }

      const response = await apiService.getRedeemCodeList(request)
      setRedeemCodes(response.data)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error('加载兑换码失败:', error)
      showToast('加载兑换码失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await apiService.getRedeemCodeStats()
      setStats(data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  const handleCreateRedeemCodes = async () => {
    if (createForm.amount <= 0) {
      showToast('金额必须大于0', 'error')
      return
    }
    if (createForm.count <= 0 || createForm.count > 100) {
      showToast('生成数量必须在1-100之间', 'error')
      return
    }

    setCreateLoading(true)
    try {
      const data = await apiService.createRedeemCodes(createForm)
      showToast(`成功创建 ${data.length} 个兑换码`, 'success')
      setCreatedCodes(data)
      setShowCreateDialog(false)
      setShowCreatedCodesDialog(true)
      setCreateForm({
        type: 'balance',
        amount: 0,
        description: '',
        expiresAt: undefined,
        count: 1
      })
      loadRedeemCodes()
      loadStats()
    } catch (error) {
      console.error('创建兑换码失败:', error)
      showToast('创建兑换码失败', 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiService.updateRedeemCodeStatus(id, !currentStatus)
      showToast(response.message, 'success')
      loadRedeemCodes()
    } catch (error) {
      console.error('更新状态失败:', error)
      showToast('更新状态失败', 'error')
    }
  }

  const handleDeleteRedeemCode = async (id: string) => {
    try {
      const response = await apiService.deleteRedeemCode(id)
      showToast(response.message, 'success')
      loadRedeemCodes()
      loadStats()
    } catch (error) {
      console.error('删除失败:', error)
      showToast('删除失败', 'error')
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadRedeemCodes()
  }

  const handleReset = () => {
    setFilters({
      code: '',
      type: 'all',
      isUsed: 'all',
      isEnabled: 'all',
      sortBy: 'CreatedAt',
      sortDirection: 'desc'
    })
    setCurrentPage(1)
  }

  const exportCodes = () => {
    if (createdCodes.length === 0) return

    const csvContent = 'data:text/csv;charset=utf-8,' +
      '兑换码,类型,金额,描述,过期时间,创建时间\n' +
      createdCodes.map(code =>
        `${code.code},${code.type === 'balance' ? '余额充值' : '积分奖励'},${code.amount},"${code.description || ''}","${code.expiresAt ? new Date(code.expiresAt).toLocaleString() : '永不过期'}","${code.createdAt}"`
      ).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `兑换码_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Gift className="h-8 w-8" />
            <span>兑换码管理</span>
          </h1>
          <p className="text-muted-foreground">创建和管理兑换码</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建兑换码
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建兑换码</DialogTitle>
              <DialogDescription>
                创建新的兑换码供用户使用
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">类型</Label>
                  <Select value={createForm.type} onValueChange={(value) => setCreateForm({ ...createForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance">余额充值</SelectItem>
                      <SelectItem value="credits">积分奖励</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">金额</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">描述（可选）</Label>
                <Textarea
                  id="description"
                  placeholder="兑换码用途描述"
                  value={createForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiresAt">过期时间（可选）</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={createForm.expiresAt || ''}
                    onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="count">生成数量</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={createForm.count}
                    onChange={(e) => setCreateForm({ ...createForm, count: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={createLoading}>
                取消
              </Button>
              <Button onClick={handleCreateRedeemCodes} disabled={createLoading}>
                {createLoading ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总兑换码</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已使用</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.usedCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未使用</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unusedCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已过期</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expiredCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">兑换总额</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{stats.totalRedeemedAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">使用率</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usageRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索和过滤</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label htmlFor="search-code">兑换码</Label>
              <Input
                id="search-code"
                placeholder="搜索兑换码"
                value={filters.code}
                onChange={(e) => setFilters({ ...filters, code: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="filter-type">类型</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="balance">余额充值</SelectItem>
                  <SelectItem value="credits">积分奖励</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-used">使用状态</Label>
              <Select value={filters.isUsed} onValueChange={(value) => setFilters({ ...filters, isUsed: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="true">已使用</SelectItem>
                  <SelectItem value="false">未使用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-enabled">启用状态</Label>
              <Select value={filters.isEnabled}
                onValueChange={(value) => setFilters({ ...filters, isEnabled: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="true">已启用</SelectItem>
                  <SelectItem value="false">已禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2 items-end">
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 兑换码列表 */}
      <Card>
        <CardHeader>
          <CardTitle>兑换码列表</CardTitle>
          <CardDescription>
            管理所有兑换码，包括启用、禁用和删除操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">加载中...</div>
            </div>
          ) : redeemCodes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">暂无兑换码</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>兑换码</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>使用者</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redeemCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code}</TableCell>
                      <TableCell>
                        <Badge variant={code.type === 'balance' ? 'default' : 'secondary'}>
                          {code.type === 'balance' ? '余额充值' : '积分奖励'}
                        </Badge>
                      </TableCell>
                      <TableCell>¥{code.amount.toLocaleString()}</TableCell>
                      <TableCell>{code.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {code.isUsed ? (
                            <Badge variant="outline" className="text-green-600">已使用</Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600">未使用</Badge>
                          )}
                          {code.isEnabled ? (
                            <Badge variant="default">已启用</Badge>
                          ) : (
                            <Badge variant="destructive">已禁用</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.usedByUserName || '-'}
                        {code.usedAt && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(code.usedAt).toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : '永不过期'}
                      </TableCell>
                      <TableCell>{new Date(code.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={code.isEnabled}
                            onCheckedChange={() => handleToggleStatus(code.id, code.isEnabled)}
                            disabled={code.isUsed}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={code.isUsed}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除兑换码 {code.code} 吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRedeemCode(code.id)}>
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  第 {currentPage} 页，共 {totalPages} 页
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 创建成功对话框 */}
      <Dialog open={showCreatedCodesDialog} onOpenChange={setShowCreatedCodesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>兑换码创建成功</DialogTitle>
            <DialogDescription>
              已成功创建 {createdCodes.length} 个兑换码，请保存好这些兑换码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={exportCodes}>
                <Download className="mr-2 h-4 w-4" />
                导出CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>兑换码</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>过期时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {createdCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono">{code.code}</TableCell>
                    <TableCell>
                      <Badge variant={code.type === 'balance' ? 'default' : 'secondary'}>
                        {code.type === 'balance' ? '余额充值' : '积分奖励'}
                      </Badge>
                    </TableCell>
                    <TableCell>¥{code.amount.toLocaleString()}</TableCell>
                    <TableCell>{code.description || '-'}</TableCell>
                    <TableCell>
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : '永不过期'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCreatedCodesDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RedeemCodesPage