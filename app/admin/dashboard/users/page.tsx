"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconChevronLeft, IconChevronRight, IconRefresh,
  IconExternalLink, IconLock, IconLockOpen,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import UserFilters from "@/components/user-filters"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchUsers, suspendUser, unsuspendUser } from "@/services/users"
import { UserStatus, UserStatusLabels, UserStatusColors } from "@/types/user"
import type { AdminUser } from "@/types/user"

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
        <div className="flex flex-col gap-4 p-4">
          <UserFilters
            searchTerm={searchInput}
            roleFilter={role ?? "all"}
            statusFilter={status === null ? "all" : String(status)}
            onSearchChange={handleSearchChange}
            onRoleFilterChange={(v) => { setRole(v === "all" ? null : v); setPg(1) }}
            onStatusFilterChange={(v) => { setStatus(v === "all" ? null : Number(v)); setPg(1) }}
            onSearch={load}
          />

          <div className="overflow-x-auto rounded-lg border">
            <Table className="table-fixed w-full">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead className="w-[200px]">Họ tên</TableHead>
                  <TableHead className="w-28">SĐT</TableHead>
                  <TableHead className="w-24">Vai trò</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="w-24">Ngày tạo</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
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
                    <TableCell className="font-mono text-xs truncate">{u.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <span className="text-sm font-medium block truncate">{u.fullName ?? "—"}</span>
                        {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm truncate">{u.phone ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${UserStatusColors[u.status] ?? ""}`}>
                        {UserStatusLabels[u.status] ?? u.statusName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums truncate">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link href={`/dashboard/users/${u.id}`}><IconExternalLink className="size-4" /></Link>
                        </Button>
                        {u.status === UserStatus.Active && (
                          <Button variant="ghost" size="icon" className="h-8 text-xs text-red-600 hover:bg-red-50" onClick={() => { setSuspendTarget(u); setReason("") }} disabled={busy}>
                            <IconLock className="mr-1 size-3.5" />
                          </Button>
                        )}
                        {u.status === UserStatus.Suspended && (
                          <Button variant="ghost" size="icon" className="h-8 text-xs text-green-600 hover:bg-green-50" onClick={() => handleUnsuspend(u)} disabled={busy}>
                            <IconLockOpen className="mr-1 size-3.5" />
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
