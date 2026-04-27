"use client"

import { useSellerShop } from "@/hooks/use-seller-shop"
import { ProfileCover } from "./_components/profile-cover"
import { ProfileEditForm } from "./_components/profile-edit-form"
import { ProfileInfoCards } from "./_components/profile-info-cards"
export default function SellerProfilePage() {
  const { shop, loading, saving, save } = useSellerShop()

  const handleUpdateLogo = async (url: string) => {
    return save({ logoUrl: url || undefined })
  }

  const handleUpdateCover = async (url: string) => {
    return save({ coverUrl: url })
  }

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 lg:gap-6 lg:p-6">
      <div className="mb-0.5 space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl" style={{ color: "var(--color-text-main)" }}>
          Hồ sơ cửa hàng
        </h1>
        <p className="text-sm text-muted-foreground">Thương hiệu và mặt hàng bạn bán trên sàn</p>
      </div>

      <ProfileCover
        shop={shop}
        loading={loading}
        saving={saving}
        onUpdateLogo={handleUpdateLogo}
        onUpdateCover={handleUpdateCover}
      />

      {/* Form + Info Cards */}
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
