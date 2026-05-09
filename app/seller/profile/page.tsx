"use client"

import { IconInfoCircle, IconMapPin } from "@tabler/icons-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useSellerShop } from "@/hooks/use-seller-shop"
import { ProfileCover } from "./_components/profile-cover"
import { ProfileEditForm } from "./_components/profile-edit-form"
import { ProfileAddressForm } from "./_components/profile-address-form"
import { ProfileInfoStrip } from "./_components/profile-info-strip"

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
        <h1
          className="text-xl font-semibold md:text-2xl"
          style={{ color: "var(--color-text-main)" }}
        >
          Hồ sơ cửa hàng
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thương hiệu, địa chỉ liên hệ và thông tin cửa hàng của bạn
        </p>
      </div>

      <ProfileCover
        shop={shop}
        loading={loading}
        saving={saving}
        onUpdateLogo={handleUpdateLogo}
        onUpdateCover={handleUpdateCover}
      />

      <ProfileInfoStrip shop={shop} loading={loading} />

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="h-auto bg-muted/60 p-1">
          <TabsTrigger
            value="basic"
            className="gap-2 px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <IconInfoCircle className="size-4" />
            Thông tin cơ bản
          </TabsTrigger>
          <TabsTrigger
            value="address"
            className="gap-2 px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <IconMapPin className="size-4" />
            Địa chỉ &amp; liên hệ
          </TabsTrigger>
        </TabsList>

        {/*
          forceMount: cả 2 form được mount ngay từ đầu (chỉ ẩn/hiện qua CSS),
          tránh trường hợp form địa chỉ mount sau khi shop đã load → race
          condition giữa hydrate state và fetch dropdown tỉnh/huyện/xã.
        */}
        <TabsContent
          value="basic"
          forceMount
          className="mt-4 data-[state=inactive]:hidden"
        >
          <ProfileEditForm
            shop={shop}
            loading={loading}
            saving={saving}
            onSave={save}
          />
        </TabsContent>

        <TabsContent
          value="address"
          forceMount
          className="mt-4 data-[state=inactive]:hidden"
        >
          <ProfileAddressForm
            shop={shop}
            loading={loading}
            saving={saving}
            onSave={save}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
