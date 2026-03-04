"use client"

import * as React from "react"
import {
  IconPlus,
  IconRefresh,
  IconChevronRight,
  IconChevronLeft,
  IconTrash,
  IconEdit,
  IconToggleLeft,
  IconToggleRight,
  IconFolderOpen,
} from "@tabler/icons-react"
import { toast } from "sonner"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import {
  fetchCategories,
  createCategory,
  updateCategory,
  activateCategory,
  deactivateCategory,
  deleteCategory,
} from "@/services/categories"
import type { Category } from "@/types/category"

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  // Dialog
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editCat, setEditCat] = React.useState<Category | null>(null)
  const [formCode, setFormCode] = React.useState("")
  const [formName, setFormName] = React.useState("")
  const [formParentId, setFormParentId] = React.useState("")

  // Delete
  const [deleteCat, setDeleteCat] = React.useState<Category | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setLoading(false); return }
    try {
      const res = await fetchCategories(token, page, pageSize)
      if (res.success) {
        setCategories(res.categories)
        setTotalCount(res.totalCount)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải danh mục")
    } finally {
      setLoading(false)
    }
  }, [page])

  React.useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditCat(null)
    setFormCode("")
    setFormName("")
    setFormParentId("")
    setDialogOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditCat(c)
    setFormCode(c.code)
    setFormName(c.name)
    setFormParentId(c.parentId ? String(c.parentId) : "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formCode || !formName) return
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setActionLoading(false); return }
    try {
      const parentId = formParentId ? Number(formParentId) : null
      const res = editCat
        ? await updateCategory(token, editCat.id, { code: formCode, name: formName, parentId })
        : await createCategory(token, { code: formCode, name: formName, parentId })
      if (res.success) {
        toast.success(res.message ?? (editCat ? "Cập nhật thành công" : "Tạo thành công"))
        setDialogOpen(false)
        load()
      } else {
        toast.error(res.message ?? "Lỗi")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle = async (c: Category) => {
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setActionLoading(false); return }
    try {
      const res = c.isActive
        ? await deactivateCategory(token, c.id)
        : await activateCategory(token, c.id)
      if (res.success) {
        toast.success(res.message ?? "Thành công")
        load()
      } else {
        toast.error(res.message ?? "Lỗi")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCat) return
    setActionLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setActionLoading(false); return }
    try {
      const res = await deleteCategory(token, deleteCat.id)
      if (res.success) {
        toast.success(res.message ?? "Đã xóa")
        setDeleteCat(null)
        load()
      } else {
        toast.error(res.message ?? "Lỗi xóa")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
              <p className="text-muted-foreground text-sm">
                {loading ? "Đang tải..." : `${totalCount} danh mục`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <IconRefresh className="mr-1.5 size-4" />
                Làm mới
              </Button>
              <Button size="sm" onClick={openCreate}>
                <IconPlus className="mr-1.5 size-4" />
                Thêm mới
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead>Cấp</TableHead>
                  <TableHead>Danh mục cha</TableHead>
                  <TableHead className="text-center">Sản phẩm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <IconFolderOpen className="mx-auto mb-2 size-8 opacity-50" />
                      Chưa có danh mục nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c, idx) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{c.code}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.levelName}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.parentName ?? "—"}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{c.productCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${c.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                        >
                          {c.isActive ? "Hoạt động" : "Vô hiệu"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(c)} disabled={actionLoading}>
                            <IconEdit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleToggle(c)} disabled={actionLoading}>
                            {c.isActive ? <IconToggleRight className="size-4 text-green-600" /> : <IconToggleLeft className="size-4 text-red-600" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8 text-red-600" onClick={() => setDeleteCat(c)} disabled={actionLoading || c.productCount > 0}>
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Trang {page} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <IconChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCat ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
            <DialogDescription>
              {editCat ? `Đang sửa: ${editCat.name}` : "Nhập thông tin danh mục mới"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mã danh mục *</label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="VD: electronics" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên danh mục *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Điện tử" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">ID danh mục cha (tùy chọn)</label>
              <Input value={formParentId} onChange={(e) => setFormParentId(e.target.value)} placeholder="Để trống nếu là cấp cao nhất" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={actionLoading}>Hủy</Button>
            <Button onClick={handleSave} disabled={actionLoading || !formCode || !formName}>
              {actionLoading ? "Đang xử lý..." : editCat ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteCat !== null} onOpenChange={(v) => { if (!v) setDeleteCat(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa danh mục</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa danh mục &quot;{deleteCat?.name}&quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCat(null)} disabled={actionLoading}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
