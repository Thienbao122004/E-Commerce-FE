"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconSearch, IconChevronLeft, IconChevronRight, IconRefresh,
  IconExternalLink, IconLock, IconLockOpen, IconFilter,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchUsers, suspendUser, unsuspendUser } from "@/lib/api/users"
import { UserStatus, UserStatusLabels, UserStatusColors } from "@/lib/types/user"
import type { AdminUser } from "@/lib/types/user"

const fmtDate = (t: string) => new Date(t).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function UsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [role, setRole] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState("")
  const ps = 10
  const tp = Math.ceil(total / ps)

  const [suspendTarget, setSuspendTarget] = React.useState<AdminUser | null>(null)
  const [reason, setReason] = React.useState("")

  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const [searchInput, setSearchInput] = React.useState("")

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setSearch(val); setPg(1) }, 400)
  }

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchUsers(tk, pg, ps, role, status)
      if (r.success) { setUsers(r.users); setTotal(r.totalCount) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg, role, status])

  React.useEffect(() => { load() }, [load])

  const handleSuspend = async () => {
    if (!suspendTarget || !reason) return
    setBusy(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setBusy(false); return }
    try {
      const r = await suspendUser(tk, suspendTarget.id, reason)
      if (r.success) { toast.success(r.message ?? "Đã khóa"); setSuspendTarget(null); setReason(""); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleUnsuspend = async (u: AdminUser) => {
    setBusy(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setBusy(false); return }
    try {
      const r = await unsuspendUser(tk, u.id)
      if (r.success) { toast.success(r.message ?? "Đã mở khóa"); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const filtered = React.useMemo(() => {
    if (!search) return users
    const q = search.toLowerCase()
    return users.filter((u) =>
      (u.fullName?.toLowerCase().includes(q)) ||
      (u.email?.toLowerCase().includes(q)) ||
      (u.phone?.includes(q))
    )
  }, [users, search])

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quản lý người dùng</h1>
              <p className="text-muted-foreground text-sm">{loading ? "Đang tải..." : `${total} người dùng`}</p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <IconRefresh className="mr-1.5 size-4" />Làm mới
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Tìm tên, email, SĐT..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select value={role ?? "all"} onValueChange={(v) => { setRole(v === "all" ? null : v); setPg(1) }}>
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status === null ? "all" : String(status)} onValueChange={(v) => { setStatus(v === "all" ? null : Number(v)); setPg(1) }}>
                <SelectTrigger className="w-[150px] bg-background">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value={String(UserStatus.Active)}>Hoạt động</SelectItem>
                  <SelectItem value={String(UserStatus.Suspended)}>Bị khóa</SelectItem>
                  <SelectItem value={String(UserStatus.Inactive)}>Chưa kích hoạt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Không có người dùng nào.</TableCell></TableRow>
                ) : filtered.map((u, idx) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{u.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">{u.fullName ?? "—"}</span>
                        {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.phone ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${UserStatusColors[u.status] ?? ""}`}>
                        {UserStatusLabels[u.status] ?? u.statusName}
                      </Badge>
                      {u.status === UserStatus.Suspended && u.suspensionReason && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 max-w-[160px] truncate" title={u.suspensionReason}>{u.suspensionReason}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link href={`/admin/dashboard/users/${u.id}`}><IconExternalLink className="size-4" /></Link>
                        </Button>
                        {u.status === UserStatus.Active && u.role !== "admin" && (
                          <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setSuspendTarget(u); setReason("") }} disabled={busy}>
                            <IconLock className="mr-1 size-3.5" />Khóa
                          </Button>
                        )}
                        {u.status === UserStatus.Suspended && (
                          <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => handleUnsuspend(u)} disabled={busy}>
                            <IconLockOpen className="mr-1 size-3.5" />Mở khóa
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && tp > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Trang {pg} / {tp} · {total} người dùng</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg - 1)} disabled={pg <= 1}><IconChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg + 1)} disabled={pg >= tp}><IconChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={suspendTarget !== null} onOpenChange={(v) => { if (!v) setSuspendTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa tài khoản</DialogTitle>
            <DialogDescription>Người dùng: {suspendTarget?.fullName ?? suspendTarget?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          {suspendTarget?.role === "seller" && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">⚠️ Người dùng này là Seller</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Khóa tài khoản sẽ khiến cửa hàng không thể hoạt động và ảnh hưởng đến đơn hàng.</p>
            </div>
          )}
          {suspendTarget?.hasOrders && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">⚠️ Người dùng có đơn hàng đang xử lý</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Khóa tài khoản có thể ảnh hưởng đến các đơn hàng đang hoạt động.</p>
            </div>
          )}
          <DialogHeader className="sr-only">
          </DialogHeader>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Lý do khóa *</label>
            <Textarea placeholder="Nhập lý do..." value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[60px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)} disabled={busy}>Hủy</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={busy || !reason}>{busy ? "Đang xử lý..." : "Khóa tài khoản"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
