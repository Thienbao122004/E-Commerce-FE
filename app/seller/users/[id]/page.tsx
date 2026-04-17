"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft, IconUser, IconMail, IconPhone,
  IconLock, IconLockOpen, IconHistory,
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
import { formatDateTimeVN as fmtDate } from "@/lib/formatters"
import { fetchUserById, suspendUser, unsuspendUser, fetchUserAuditLogs } from "@/services/users"
import {
  UserStatus,
  userStatusBadgeClass,
  userStatusLabel,
} from "@/types/user"
import type { AdminUser, UserAuditLog } from "@/types/user"

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = React.useState<AdminUser | null>(null)
  const [logs, setLogs] = React.useState<UserAuditLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [suspendDlg, setSuspendDlg] = React.useState(false)
  const [reason, setReason] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [ur, lr] = await Promise.all([
        fetchUserById(id),
        fetchUserAuditLogs(id),
      ])
      if (ur.success && ur.user) setUser(ur.user)
      else toast.error(ur.message ?? "Không tìm thấy")
      if (lr.success) setLogs(lr.logs)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [id])

  React.useEffect(() => { load() }, [load])

  const handleSuspend = async () => {
    if (!reason) return
    setBusy(true)
    try {
      const r = await suspendUser(id, reason)
      if (r.success) { toast.success("Đã khóa tài khoản"); setSuspendDlg(false); setReason(""); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleUnsuspend = async () => {
    setBusy(true)
    try {
      const r = await unsuspendUser(id)
      if (r.success) { toast.success("Đã mở khóa"); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}><IconArrowLeft className="size-5" /></Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chi tiết người dùng</h1>
              <p className="text-muted-foreground text-sm font-mono">{loading ? "Đang tải..." : (user?.userCode ?? user?.id)}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-[280px] rounded-lg" />
              <Skeleton className="h-[200px] rounded-lg" />
            </div>
          ) : !user ? (
            <Card><CardContent className="flex h-48 items-center justify-center text-muted-foreground">Không tìm thấy người dùng.</CardContent></Card>
          ) : (
            <>
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
                        <div><p className="text-sm">{user.phone}</p><p className="text-xs text-muted-foreground">SĐT</p></div>
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
                      {user.status === UserStatus.Active && (
                        <Button variant="destructive" className="flex-1" onClick={() => { setSuspendDlg(true); setReason("") }}>
                          <IconLock className="mr-1.5 size-4" />Khóa tài khoản
                        </Button>
                      )}
                      {user.status !== UserStatus.Active && (
                        <Button className="flex-1" onClick={handleUnsuspend} disabled={busy}>
                          <IconLockOpen className="mr-1.5 size-4" />Mở khóa
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Logs */}
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
            </>
          )}
        </div>
      </div>

      <Dialog open={suspendDlg} onOpenChange={setSuspendDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản</DialogTitle>
            <DialogDescription>{user?.fullName ?? user?.id}</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Lý do *</label>
            <Textarea placeholder="Nhập lý do khóa..." value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[60px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDlg(false)} disabled={busy}>Hủy</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={busy || !reason}>{busy ? "Đang xử lý..." : "Khóa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
