"use client"

import * as React from "react"
import {
  IconSearch, IconChevronLeft, IconChevronRight, IconRefresh,
  IconCheck, IconX, IconFilter, IconCash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchWithdrawals, approveWithdrawal, rejectWithdrawal } from "@/services/withdrawals"
import { WithdrawStatus, WithdrawStatusLabels, WithdrawStatusColors } from "@/types/withdraw"
import type { WithdrawRequest } from "@/types/withdraw"
import { WithdrawalDialogs } from "./_components/withdrawal-dialogs"

const fmtDate = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"

const fmtMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: currency || "VND" }).format(amount)

type DialogType = "approve" | "reject" | null

export default function WithdrawalsPage() {
  const [requests, setRequests] = React.useState<WithdrawRequest[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [status, setStatus] = React.useState<number | null>(null)
  const ps = 10
  const tp = Math.ceil(total / ps)

  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => { setSearch(val); setPg(1) }, 400)
  }

  const [dialogType, setDialogType] = React.useState<DialogType>(null)
  const [target, setTarget] = React.useState<WithdrawRequest | null>(null)

  const openDialog = (type: DialogType, req: WithdrawRequest) => { setDialogType(type); setTarget(req) }
  const closeDialog = () => { setDialogType(null); setTarget(null) }

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  }

  const load = React.useCallback(async () => {
    setLoading(true)
    const tk = await getToken()
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchWithdrawals(tk, pg, ps, status)
      if (r.success) { setRequests(r.requests); setTotal(r.totalCount) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg, status])

  React.useEffect(() => { load() }, [load])

  const handleApprove = async (adminNote: string) => {
    if (!target) return
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await approveWithdrawal(tk, target.id, adminNote || undefined)
      if (r.success) { toast.success(r.message ?? "Đã duyệt"); closeDialog(); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const handleReject = async (reason: string, adminNote: string) => {
    if (!target || !reason) return
    setBusy(true)
    const tk = await getToken()
    if (!tk) { setBusy(false); return }
    try {
      const r = await rejectWithdrawal(tk, target.id, reason, adminNote || undefined)
      if (r.success) { toast.success(r.message ?? "Đã từ chối"); closeDialog(); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const filtered = React.useMemo(() => {
    if (!search) return requests
    const q = search.toLowerCase()
    return requests.filter((r) =>
      r.sellerName?.toLowerCase().includes(q) ||
      r.bankAccountName?.toLowerCase().includes(q) ||
      r.bankAccountNumber?.includes(q)
    )
  }, [requests, search])

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <IconCash className="size-7" />Yêu cầu rút tiền
              </h1>
              <p className="text-muted-foreground text-sm">{loading ? "Đang tải..." : `${total} yêu cầu`}</p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <IconRefresh className="mr-1.5 size-4" />Làm mới
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input placeholder="Tìm người bán, tên TK, số TK..." value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9 bg-background" />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter className="size-4 text-muted-foreground" />
              <Select value={status === null ? "all" : String(status)} onValueChange={(v) => { setStatus(v === "all" ? null : Number(v)); setPg(1) }}>
                <SelectTrigger className="w-[160px] bg-background"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value={String(WithdrawStatus.Pending)}>Chờ xử lý</SelectItem>
                  <SelectItem value={String(WithdrawStatus.Approved)}>Đã duyệt</SelectItem>
                  <SelectItem value={String(WithdrawStatus.Rejected)}>Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Người bán</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>Số TK</TableHead>
                  <TableHead>Chủ TK</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead>Ngày duyệt</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 10 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">Không có yêu cầu rút tiền nào.</TableCell></TableRow>
                ) : filtered.map((r, idx) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{r.sellerName ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {fmtMoney(r.amount, r.currency)}
                    </TableCell>
                    <TableCell className="text-sm">{r.bankName}</TableCell>
                    <TableCell className="text-sm font-mono">{r.bankAccountNumber}</TableCell>
                    <TableCell className="text-sm">{r.bankAccountName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${WithdrawStatusColors[r.status] ?? ""}`}>
                        {WithdrawStatusLabels[r.status] ?? r.statusName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">{fmtDate(r.requestedAt)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">{fmtDate(r.reviewedAt)}</TableCell>
                    <TableCell>
                      {r.status === WithdrawStatus.Pending && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => openDialog("approve", r)} disabled={busy}>
                            <IconCheck className="mr-1 size-3.5" />Duyệt
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => openDialog("reject", r)} disabled={busy}>
                            <IconX className="mr-1 size-3.5" />Từ chối
                          </Button>
                        </div>
                      )}
                      {r.status === WithdrawStatus.Rejected && r.rejectionReason && (
                        <span className="text-xs text-red-500 max-w-[120px] truncate inline-block" title={r.rejectionReason}>{r.rejectionReason}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && tp > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Trang {pg} / {tp} · {total} yêu cầu</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg - 1)} disabled={pg <= 1}><IconChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg + 1)} disabled={pg >= tp}><IconChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <WithdrawalDialogs
        dialogType={dialogType}
        target={target}
        busy={busy}
        onClose={closeDialog}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  )
}
