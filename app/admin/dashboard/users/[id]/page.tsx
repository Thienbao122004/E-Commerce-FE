"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconUser,
  IconMail,
  IconPhone,
  IconLock,
  IconLockOpen,
  IconHistory,
  IconMapPin,
  IconShoppingCart,
  IconWallet,
  IconAlertTriangle,
  IconStar,
  IconKey,
  IconActivity,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDateTimeVN as fmtDate, formatPriceVND as currency } from "@/lib/formatters"
import { fetchAdminOrders } from "@/services/admin-orders"
import { fetchDisputes } from "@/services/disputes"
import {
  fetchUserAddresses,
  fetchUserAuditLogs,
  fetchUserById,
  fetchUserProductReviews,
  fetchUserShopReviews,
  fetchUserWalletDetails,
  sendUserPasswordReset,
  suspendUser,
  unsuspendUser,
  updateUser,
  updateUserAccountStatus,
} from "@/services/users"
import {
  UserStatus,
  userStatusBadgeClass,
  userStatusLabel,
} from "@/types/user"
import type {
  AdminUser,
  UserAddress,
  UserAuditLog,
  UserProductReviewItem,
  UserShopReviewItem,
  WalletLedgerEntry,
} from "@/types/user"
import type { AdminOrderRow } from "@/services/admin-orders"
import type { AdminDispute } from "@/types/dispute"

function initials(name: string | null | undefined, email: string | null | undefined) {
  const s = (name ?? email ?? "?").trim()
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return s.slice(0, 2).toUpperCase()
}

function RowKV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="min-w-0 break-words">{value ?? "—"}</span>
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [user, setUser] = React.useState<AdminUser | null>(null)
  const [logs, setLogs] = React.useState<UserAuditLog[]>([])
  const [addresses, setAddresses] = React.useState<UserAddress[]>([])
  const [orders, setOrders] = React.useState<AdminOrderRow[]>([])
  const [ordersTotal, setOrdersTotal] = React.useState(0)
  const [disputes, setDisputes] = React.useState<AdminDispute[]>([])
  const [disputesTotal, setDisputesTotal] = React.useState(0)
  const [productReviews, setProductReviews] = React.useState<UserProductReviewItem[]>([])
  const [shopReviews, setShopReviews] = React.useState<UserShopReviewItem[]>([])
  const [customerLedger, setCustomerLedger] = React.useState<WalletLedgerEntry[]>([])
  const [sellerLedger, setSellerLedger] = React.useState<WalletLedgerEntry[]>([])
  const [customerBal, setCustomerBal] = React.useState<{ balance: number; cur: string } | null>(null)
  const [sellerBal, setSellerBal] = React.useState<{
    available: number
    held: number
    pending: number
    cur: string
  } | null>(null)

  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const [suspendDlg, setSuspendDlg] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [roleEdit, setRoleEdit] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const ur = await fetchUserById(id)
      if (ur.success && ur.user) {
        setUser(ur.user)
        setRoleEdit(ur.user.role)
      } else {
        toast.error(ur.message ?? "Không tìm thấy")
        setUser(null)
      }

      const [lr, ar, wr, or, dr, pr, sr] = await Promise.all([
        fetchUserAuditLogs(id),
        fetchUserAddresses(id),
        fetchUserWalletDetails(id),
        fetchAdminOrders(1, 15, id),
        fetchDisputes(1, 15, null, null, id),
        fetchUserProductReviews(id, 1, 15),
        fetchUserShopReviews(id, 1, 15),
      ])

      if (lr.success) setLogs(lr.logs)
      if (ar.success) setAddresses(ar.addresses)
      if (wr.success && wr.customer) {
        setCustomerBal({
          balance: wr.customer.availableBalance,
          cur: wr.customer.currency,
        })
        setCustomerLedger(wr.customer.ledger ?? [])
      } else {
        setCustomerBal(null)
        setCustomerLedger([])
      }
      if (wr.success && wr.seller) {
        setSellerBal({
          available: wr.seller.availableBalance,
          held: wr.seller.heldBalance,
          pending: wr.seller.pendingBalance,
          cur: wr.seller.currency,
        })
        setSellerLedger(wr.seller.ledger ?? [])
      } else {
        setSellerBal(null)
        setSellerLedger([])
      }
      if (or.success) {
        setOrders(or.orders)
        setOrdersTotal(or.totalCount)
      }
      if (dr.success) {
        setDisputes(dr.disputes)
        setDisputesTotal(dr.totalCount)
      }
      if (pr.success) setProductReviews(pr.reviews)
      if (sr.success) setShopReviews(sr.reviews)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    load()
  }, [load])

  const handleSuspend = async () => {
    if (!reason.trim()) return
    setBusy(true)
    try {
      const r = await suspendUser(id, reason.trim())
      if (r.success && r.user) {
        toast.success("Đã khóa tài khoản")
        setSuspendDlg(false)
        setReason("")
        setUser(r.user)
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setBusy(false)
    }
  }

  const handleUnsuspend = async () => {
    setBusy(true)
    try {
      const r = await unsuspendUser(id)
      if (r.success && r.user) {
        toast.success("Đã kích hoạt tài khoản")
        setUser(r.user)
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setBusy(false)
    }
  }

  const handleDeactivate = async () => {
    setBusy(true)
    try {
      const r = await updateUserAccountStatus(id, { status: UserStatus.Inactive })
      if (r.success && r.user) {
        toast.success("Đã vô hiệu hóa tài khoản")
        setUser(r.user)
        load()
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setBusy(false)
    }
  }

  const handleSaveRole = async () => {
    if (!roleEdit || !user || roleEdit === user.role) return
    setBusy(true)
    try {
      const r = await updateUser(id, { role: roleEdit })
      if (r.success && r.user) {
        toast.success("Đã cập nhật vai trò")
        setUser(r.user)
        setRoleEdit(r.user.role)
      } else toast.error(r.message ?? "Lỗi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setBusy(false)
    }
  }

  const handlePasswordReset = async () => {
    setBusy(true)
    try {
      const r = await sendUserPasswordReset(id)
      if (r.success) toast.success(r.message ?? "Đã gửi email")
      else toast.error(r.message ?? "Lỗi")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 p-4 lg:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <IconArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-tight">Chi tiết người dùng</h1>
              <p className="text-muted-foreground font-mono text-sm">
                {loading ? "Đang tải..." : user?.userCode ?? user?.id}
              </p>
            </div>
          </div>

          {loading || !user ? (
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-96 rounded-lg" />
            </div>
          ) : (
            <Tabs defaultValue="profile" className="w-full gap-4">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                <TabsTrigger value="profile" className="gap-1.5">
                  <IconUser className="size-4" />
                  Hồ sơ & địa chỉ
                </TabsTrigger>
                <TabsTrigger value="account" className="gap-1.5">
                  <IconLock className="size-4" />
                  Tài khoản
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-1.5">
                  <IconShoppingCart className="size-4" />
                  Đơn hàng
                </TabsTrigger>
                <TabsTrigger value="wallet" className="gap-1.5">
                  <IconWallet className="size-4" />
                  Ví
                </TabsTrigger>
                <TabsTrigger value="disputes" className="gap-1.5">
                  <IconAlertTriangle className="size-4" />
                  Tranh chấp
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-1.5">
                  <IconStar className="size-4" />
                  Đánh giá
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5">
                  <IconActivity className="size-4" />
                  Nhật ký
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <IconUser className="size-5 text-primary" />
                        Thông tin định danh
                      </CardTitle>
                      <CardDescription>Tên, email đăng nhập, SĐT, ảnh đại diện</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="size-16 border">
                          {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt="" className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-lg">
                              {initials(user.fullName, user.email)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{user.fullName ?? "—"}</span>
                            <Badge variant="secondary" className={userStatusBadgeClass(user)}>
                              {userStatusLabel(user)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            Tham gia:{" "}
                            <span className="text-foreground tabular-nums">{fmtDate(user.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                      <Separator />
                      {user.email && (
                        <div className="flex items-start gap-3">
                          <IconMail className="text-muted-foreground mt-0.5 size-4" />
                          <div>
                            <p className="text-sm">{user.email}</p>
                            <p className="text-muted-foreground text-xs">Email</p>
                          </div>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-start gap-3">
                          <IconPhone className="text-muted-foreground mt-0.5 size-4" />
                          <div>
                            <p className="text-sm">{user.phone}</p>
                            <p className="text-muted-foreground text-xs">Số điện thoại</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <IconMapPin className="size-5 text-primary" />
                        Sổ địa chỉ ({addresses.length})
                      </CardTitle>
                      <CardDescription>Địa chỉ nhận hàng đã lưu</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {addresses.length === 0 ? (
                        <div className="text-muted-foreground p-6 text-center text-sm">Chưa có địa chỉ.</div>
                      ) : (
                        <div className="max-h-[320px] space-y-3 overflow-y-auto p-4">
                          {addresses.map((a) => (
                            <div
                              key={a.id}
                              className="bg-muted/40 space-y-1 rounded-lg border p-3 text-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{a.label ?? "Địa chỉ"}</span>
                                {a.isDefault && (
                                  <Badge variant="outline" className="text-[10px]">
                                    Mặc định
                                  </Badge>
                                )}
                              </div>
                              <p>{a.fullName ?? "—"} · {a.phone ?? "—"}</p>
                              <p className="text-muted-foreground">
                                {[a.addressLine1, a.ward, a.district, a.city, a.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quản lý trạng thái & vai trò</CardTitle>
                    <CardDescription>
                      Hoạt động / vô hiệu hóa / khóa; gán vai trò; đặt lại mật khẩu qua email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Vai trò</label>
                        <Select
                          value={roleEdit ?? user.role}
                          onValueChange={(v) => setRoleEdit(v)}
                          disabled={user.role === "admin" || busy}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Khách hàng</SelectItem>
                            <SelectItem value="seller">Người bán</SelectItem>
                            <SelectItem value="admin">Quản trị</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleSaveRole}
                        disabled={busy || !roleEdit || roleEdit === user.role}
                      >
                        Lưu vai trò
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      {user.status === UserStatus.Active && user.role !== "admin" && (
                        <>
                          <Button variant="outline" onClick={handleDeactivate} disabled={busy}>
                            Vô hiệu hóa
                          </Button>
                          <Button variant="destructive" onClick={() => { setSuspendDlg(true); setReason("") }} disabled={busy}>
                            <IconLock className="mr-1.5 size-4" />
                            Khóa (có lý do)
                          </Button>
                        </>
                      )}
                      {user.status !== UserStatus.Active && user.role !== "admin" && (
                        <Button onClick={handleUnsuspend} disabled={busy}>
                          <IconLockOpen className="mr-1.5 size-4" />
                          Kích hoạt lại
                        </Button>
                      )}
                      <Button variant="secondary" onClick={handlePasswordReset} disabled={busy}>
                        <IconKey className="mr-1.5 size-4" />
                        Gửi email đặt lại mật khẩu
                      </Button>
                    </div>
                    {user.suspensionReason && (
                      <div className="bg-destructive/10 rounded-md border p-3 text-sm">
                        <p className="text-destructive font-medium">Lý do khóa</p>
                        <p>{user.suspensionReason}</p>
                        {user.suspendedAt && (
                          <p className="text-muted-foreground mt-1 text-xs">{fmtDate(user.suspendedAt)}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Đơn hàng đã mua</CardTitle>
                    <CardDescription>
                      {ordersTotal} đơn (hiển thị {orders.length} mới nhất)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {orders.length === 0 ? (
                      <div className="text-muted-foreground p-8 text-center text-sm">Chưa có đơn.</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã đơn</TableHead>
                            <TableHead>Shop</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Tổng</TableHead>
                            <TableHead>Ngày</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((o) => (
                            <TableRow key={o.id}>
                              <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}…</TableCell>
                              <TableCell className="max-w-[160px] truncate">{o.shopName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {o.statusName}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{currency(o.total)}</TableCell>
                              <TableCell className="text-muted-foreground text-xs tabular-nums">
                                {fmtDate(o.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wallet">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ví khách hàng</CardTitle>
                      <CardDescription>
                        {customerBal
                          ? `Số dư: ${currency(customerBal.balance)} ${customerBal.cur}`
                          : "Chưa có ví khách"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {customerLedger.length === 0 ? (
                        <div className="text-muted-foreground p-6 text-center text-sm">
                          Không có biến động.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Loại</TableHead>
                              <TableHead className="text-right">Số tiền</TableHead>
                              <TableHead>Thời gian</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customerLedger.map((e) => (
                              <TableRow key={e.id}>
                                <TableCell className="text-sm">{e.type}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {currency(e.amount)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {fmtDate(e.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ví người bán</CardTitle>
                      <CardDescription>
                        {sellerBal ? (
                          <>
                            Khả dụng {currency(sellerBal.available)} · Giữ {currency(sellerBal.held)} ·
                            Chờ {currency(sellerBal.pending)} ({sellerBal.cur})
                          </>
                        ) : (
                          "Không có ví người bán"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {sellerLedger.length === 0 ? (
                        <div className="text-muted-foreground p-6 text-center text-sm">
                          Không có biến động.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Loại</TableHead>
                              <TableHead className="text-right">Số tiền</TableHead>
                              <TableHead>Thời gian</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sellerLedger.map((e) => (
                              <TableRow key={e.id}>
                                <TableCell className="text-sm">{e.type}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {currency(e.amount)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {fmtDate(e.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="disputes">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tranh chấp / hoàn tiền</CardTitle>
                    <CardDescription>
                      {disputesTotal} khiếu nại liên quan người dùng này
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {disputes.length === 0 ? (
                      <div className="text-muted-foreground p-8 text-center text-sm">Không có tranh chấp.</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tiêu đề</TableHead>
                            <TableHead>Shop</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày</TableHead>
                            <TableHead className="w-24"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {disputes.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="max-w-[200px] truncate text-sm">{d.title}</TableCell>
                              <TableCell className="max-w-[140px] truncate text-sm">{d.shopName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {d.statusName}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs tabular-nums">
                                {fmtDate(d.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                                  <Link href={`/admin/dashboard/disputes/${d.id}`}>Chi tiết</Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Đánh giá sản phẩm</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {productReviews.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Chưa có đánh giá.</p>
                      ) : (
                        productReviews.map((r) => (
                          <div key={r.id} className="bg-muted/30 space-y-1 rounded-lg border p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{r.productName}</span>
                              <span className="text-amber-600">★ {r.rating}</span>
                            </div>
                            {r.title && <p className="font-medium">{r.title}</p>}
                            {r.content && (
                              <p className="text-muted-foreground line-clamp-3">{r.content}</p>
                            )}
                            <p className="text-muted-foreground text-xs">{fmtDate(r.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Đánh giá cửa hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {shopReviews.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Chưa có đánh giá.</p>
                      ) : (
                        shopReviews.map((r) => (
                          <div key={r.id} className="bg-muted/30 space-y-1 rounded-lg border p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{r.shopName}</span>
                              <span className="text-amber-600">★ {r.rating}</span>
                            </div>
                            {r.title && <p className="font-medium">{r.title}</p>}
                            {r.content && (
                              <p className="text-muted-foreground line-clamp-3">{r.content}</p>
                            )}
                            <p className="text-muted-foreground text-xs">{fmtDate(r.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <IconHistory className="size-5 text-primary" />
                        Nhật ký thay đổi ({logs.length})
                      </CardTitle>
                      <CardDescription>Thao tác admin trên tài khoản</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {logs.length === 0 ? (
                        <div className="text-muted-foreground p-6 text-center text-sm">Chưa có lịch sử.</div>
                      ) : (
                        <div className="max-h-[420px] overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Thao tác</TableHead>
                                <TableHead>Trường</TableHead>
                                <TableHead>Giá trị</TableHead>
                                <TableHead>Thời gian</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {logs.slice(0, 50).map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell className="text-sm">{log.action}</TableCell>
                                  <TableCell className="font-mono text-xs">{log.fieldName}</TableCell>
                                  <TableCell className="max-w-[200px] text-xs">
                                    {log.oldValue && (
                                      <span className="text-red-600 line-through">{log.oldValue}</span>
                                    )}{" "}
                                    {log.newValue && (
                                      <span className="text-green-600">{log.newValue}</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                                    {fmtDate(log.createdAt)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <IconActivity className="size-5 text-primary" />
                        Supabase Auth
                      </CardTitle>
                      <CardDescription>
                        Dữ liệu từ GoTrue (cùng nguồn với Dashboard → Authentication → Users). Địa chỉ IP
                        từng phiên cần bật log nâng cao / gói phù hợp trên Supabase.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {!user.supabase ? (
                        <p className="text-muted-foreground">
                          Không lấy được thông tin Auth (kiểm tra Service Role và URL Supabase trên API).
                        </p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-muted-foreground w-28 shrink-0">Đăng nhập</span>
                            <div className="flex flex-wrap gap-1">
                              {(user.supabase.providers ?? []).length === 0 ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                (user.supabase.providers ?? []).map((p) => (
                                  <Badge key={p} variant="secondary" className="text-xs capitalize">
                                    {p}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                          <RowKV
                            label="Tên hiển thị (metadata)"
                            value={user.supabase.authDisplayName}
                          />
                          <RowKV label="SĐT trên Auth" value={user.supabase.authPhone} />
                          <RowKV
                            label="Tạo tài khoản Auth"
                            value={
                              user.supabase.authUserCreatedAt
                                ? fmtDate(user.supabase.authUserCreatedAt)
                                : null
                            }
                          />
                          <RowKV
                            label="Email đã xác nhận"
                            value={
                              user.supabase.emailConfirmedAt
                                ? fmtDate(user.supabase.emailConfirmedAt)
                                : "Chưa xác nhận (Waiting for verification)"
                            }
                          />
                          <RowKV
                            label="Đăng nhập gần nhất"
                            value={
                              user.supabase.lastSignInAt
                                ? fmtDate(user.supabase.lastSignInAt)
                                : "Chưa đăng nhập"
                            }
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
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
            <label className="mb-1.5 block text-sm font-medium">Lý do *</label>
            <Textarea
              placeholder="Nhập lý do khóa..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDlg(false)} disabled={busy}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={busy || !reason.trim()}>
              {busy ? "Đang xử lý..." : "Khóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
