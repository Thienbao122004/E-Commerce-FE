"use client"

import { useSellerShop } from "@/hooks/use-seller-shop"
import { ProfileCover } from "./_components/profile-cover"
import { ProfileEditForm } from "./_components/profile-edit-form"
import { ProfileInfoCards } from "./_components/profile-info-cards"

export default function SellerProfilePage() {
  const { shop, loading, saving, save } = useSellerShop()

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Hồ sơ cửa hàng</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quản lý thông tin và hình ảnh thương hiệu của bạn.
        </p>
      </div>

      <ProfileCover shop={shop} loading={loading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileEditForm shop={shop} loading={loading} saving={saving} onSave={save} />
        </div>
        <div>
          <ProfileInfoCards shop={shop} loading={loading} />
        </div>
      </div>
    </div>
  )
}
