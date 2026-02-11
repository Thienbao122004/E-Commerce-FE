"use client"

import * as React from "react"
import {
  IconPlus, IconRefresh, IconChevronLeft, IconChevronRight,
  IconTrash, IconEdit, IconSearch, IconTag,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { fetchTags, createTag, updateTag, deleteTag } from "@/lib/api/tags"
import type { Tag } from "@/lib/types/tag"

const fmtDate = (t: string) => new Date(t).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })

export default function TagsPage() {
  const [tags, setTags] = React.useState<Tag[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [pg, setPg] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [si, setSi] = React.useState("")
  const ps = 20
  const tp = Math.ceil(total / ps)
  const sr = React.useRef<NodeJS.Timeout | null>(null)
  const [dlg, setDlg] = React.useState(false)
  const [edit, setEdit] = React.useState<Tag | null>(null)
  const [name, setName] = React.useState("")
  const [del, setDel] = React.useState<Tag | null>(null)

  const doSearch = (v: string) => { setSi(v); if (sr.current) clearTimeout(sr.current); sr.current = setTimeout(() => { setSearch(v); setPg(1) }, 400) }

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setLoading(false); return }
    try {
      const r = await fetchTags(tk, pg, ps, search || null)
      if (r.success) { setTags(r.tags); setTotal(r.totalCount) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setLoading(false) }
  }, [pg, search])

  React.useEffect(() => { load() }, [load])

  const openCreate = () => { setEdit(null); setName(""); setDlg(true) }
  const openEdit = (t: Tag) => { setEdit(t); setName(t.name); setDlg(true) }

  const save = async () => {
    if (!name) return; setBusy(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setBusy(false); return }
    try {
      const r = edit ? await updateTag(tk, edit.id, name) : await createTag(tk, name)
      if (r.success) { toast.success(r.message ?? "OK"); setDlg(false); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  const doDelete = async () => {
    if (!del) return; setBusy(true)
    const { data } = await supabase.auth.getSession()
    const tk = data.session?.access_token
    if (!tk) { setBusy(false); return }
    try {
      const r = await deleteTag(tk, del.id)
      if (r.success) { toast.success(r.message ?? "Đã xóa"); setDel(null); load() }
      else toast.error(r.message ?? "Lỗi")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
    finally { setBusy(false) }
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
                <p className="text-muted-foreground text-sm">{loading ? "Đang tải..." : `${total} tags`}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={load} disabled={loading}><IconRefresh className="mr-1.5 size-4" />Làm mới</Button>
                <Button size="sm" onClick={openCreate}><IconPlus className="mr-1.5 size-4" />Thêm tag</Button>
              </div>
            </div>
            {/* Filter toolbar */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="relative max-w-sm">
                <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input placeholder="Tìm tag..." value={si} onChange={(e) => doSearch(e.target.value)} className="pl-9 bg-background" />
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead>ID</TableHead><TableHead>Tên tag</TableHead><TableHead>Slug</TableHead>
                    <TableHead className="text-center">Sản phẩm</TableHead><TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                  )) : tags.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground"><IconTag className="mx-auto mb-2 size-8 opacity-50" />Chưa có tag nào.</TableCell></TableRow>
                  ) : tags.map((t, idx) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(pg - 1) * ps + idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">{t.id}</TableCell>
                      <TableCell className="font-medium"><Badge variant="outline" className="text-sm">{t.name}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.slug}</TableCell>
                      <TableCell className="text-center tabular-nums">{t.productCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">{fmtDate(t.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(t)} disabled={busy}><IconEdit className="size-4" /></Button>
                          <Button variant="ghost" size="icon" className="size-8 text-red-600" onClick={() => setDel(t)} disabled={busy || t.productCount > 0}><IconTrash className="size-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!loading && tp > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">Trang {pg} / {tp}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg - 1)} disabled={pg <= 1}><IconChevronLeft className="size-4" /></Button>
                  <Button variant="outline" size="icon" className="size-8" onClick={() => setPg(pg + 1)} disabled={pg >= tp}><IconChevronRight className="size-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? "Sửa tag" : "Thêm tag"}</DialogTitle><DialogDescription>{edit ? `Đang sửa: ${edit.name}` : "Nhập tên tag"}</DialogDescription></DialogHeader>
          <div><label className="text-sm font-medium mb-1.5 block">Tên tag *</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: thời trang" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)} disabled={busy}>Hủy</Button>
            <Button onClick={save} disabled={busy || !name}>{busy ? "Đang xử lý..." : edit ? "Cập nhật" : "Tạo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={del !== null} onOpenChange={(v) => { if (!v) setDel(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xóa tag</DialogTitle><DialogDescription>Bạn có chắc muốn xóa tag &quot;{del?.name}&quot;?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)} disabled={busy}>Hủy</Button>
            <Button variant="destructive" onClick={doDelete} disabled={busy}>{busy ? "Đang xóa..." : "Xóa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
