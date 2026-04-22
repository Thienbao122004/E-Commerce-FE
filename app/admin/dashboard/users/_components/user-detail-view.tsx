import * as React from "react"
import {
  IconUser, IconMail, IconPhone, IconLock, IconLockOpen,
  IconHistory, IconArrowLeft,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { formatDateTimeVN as fmtDate, formatPhoneVn } from "@/lib/formatters"
import {
  UserStatus,
  userStatusBadgeClass,
  userStatusLabel,
} from "@/types/user"
import type { AdminUser, UserAuditLog } from "@/types/user"

type Props = {
  user: AdminUser
  logs: UserAuditLog[]
  detailLoading: boolean
  busy: boolean
  onBack: () => void
  onSuspend: (userId: string, reason: string) => Promise<void>
  onUnsuspend: (userId: string) => Promise<void>
}

export function UserDetailView({ user, logs, detailLoading, busy, onBack, onSuspend, onUnsuspend }: Props) {
  const [suspendDlg, setSuspendDlg] = React.useState(false)
  const [reason, setReason] = React.useState("")

  const handleSuspend = async () => {
    if (!reason) return
    await onSuspend(user.id, reason)
    setSuspendDlg(false)
    setReason("")
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="size-9" onClick={onBack}>
              <IconArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chi tiết người dùng</h1>
              <p className="text-muted-foreground text-sm font-mono">{detailLoading ? "Đang tải..." : (user.userCode || user.id)}</p>
            </div>
          </div>

          {detailLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[280px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><IconUser className="size-5 text-primary" />Thông tin cá nhân</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trạng thái</span>
                    <Badge variant="secondary" className={userStatusBadgeClass(user)}>{userStatusLabel(user)}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <IconUser className="size-4 mt-0.5 text-muted-foreground" />
                    <div><p className="text-sm font-medium">{user.fullName ?? "—"}</p><p className="text-xs text-muted-foreground">Họ tên</p></div>
                  </div>
                  {user.email && (
                    <div className="flex items-start gap-3">
                      <IconMail className="size-4 mt-0.5 text-muted-foreground" />
                      <div><p className="text-sm">{user.email}</p><p className="text-xs text-muted-foreground">Email</p></div>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-start gap-3">
                      <IconPhone className="size-4 mt-0.5 text-muted-foreground" />
                      <div><p className="text-sm tabular-nums">{formatPhoneVn(user.phone)}</p><p className="text-xs text-muted-foreground">SĐT</p></div>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vai trò</span>
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Ngày tạo</span><span className="tabular-nums">{fmtDate(user.createdAt)}</span>
                  </div>
                  {user.suspensionReason && (
                    <>
                      <Separator />
                      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                        <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">Lý do khóa</p>
                        <p className="text-sm text-red-700 dark:text-red-400">{user.suspensionReason}</p>
                        {user.suspendedAt && <p className="text-xs text-red-500 mt-1">{fmtDate(user.suspendedAt)}</p>}
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex gap-2">
                    {user.status === UserStatus.Active && user.role !== "admin" && (
                      <Button variant="destructive" className="flex-1" onClick={() => { setSuspendDlg(true); setReason("") }}>
                        <IconLock className="mr-1.5 size-4" />Khóa tài khoản
                      </Button>
                    )}
                    {user.status !== UserStatus.Active && (
                      <Button className="flex-1" onClick={() => onUnsuspend(user.id)} disabled={busy}>
                        <IconLockOpen className="mr-1.5 size-4" />Mở khóa
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><IconHistory className="size-5 text-primary" />Lịch sử thay đổi ({logs.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {logs.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">Chưa có lịch sử.</div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead>Thao tác</TableHead>
                          <TableHead>Trường</TableHead>
                          <TableHead>Cũ → Mới</TableHead>
                          <TableHead>Thời gian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.slice(0, 20).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">{log.action}</TableCell>
                            <TableCell className="text-sm font-mono">{log.fieldName}</TableCell>
                            <TableCell className="text-xs">
                              {log.oldValue && <span className="line-through text-red-500 mr-1">{log.oldValue}</span>}
                              {log.newValue && <span className="text-green-600">{log.newValue}</span>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground tabular-nums">{fmtDate(log.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={suspendDlg} onOpenChange={setSuspendDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản</DialogTitle>
            <DialogDescription>{user.fullName ?? user.id}</DialogDescription>
          </DialogHeader>
          {user.role === "seller" && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">⚠️ Người dùng này là Seller</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Khóa tài khoản sẽ khiến cửa hàng không thể hoạt động và ảnh hưởng đến đơn hàng.</p>
            </div>
          )}
          {user.hasOrders && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">⚠️ Người dùng có đơn hàng đang xử lý</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Khóa tài khoản có thể ảnh hưởng đến các đơn hàng đang hoạt động.</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Lý do khóa *</label>
            <Textarea placeholder="Nhập lý do..." value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[60px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDlg(false)} disabled={busy}>Hủy</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={busy || !reason}>{busy ? "Đang xử lý..." : "Khóa tài khoản"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
