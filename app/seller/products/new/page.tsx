"use client"

import * as React from "react"
import Link from "next/link"
import { IconChevronRight, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCreateProductForm } from "./_components/use-create-product-form"
import { ProductBasicInfo } from "./_components/product-basic-info"
import { ProductVariants } from "./_components/product-variants"
import { ProductImageUploader } from "./_components/product-image-uploader"
import { ProductAiAssistant } from "./_components/product-ai-assistant"
import { ProductLocalBrand } from "./_components/product-local-brand"
import { ProductDescriptionSheet } from "./_components/product-description-sheet"

export default function CreateProductPage() {
  const f = useCreateProductForm()

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 p-3 lg:gap-4 lg:p-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/seller/products" className="hover:text-foreground transition-colors">Sản phẩm</Link>
          <IconChevronRight className="size-3" />
          <span className="text-foreground font-medium">Thêm mới</span>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-10 lg:items-stretch">

          {/* ── Left column ── */}
          <div className="lg:col-span-6 flex flex-col gap-4 lg:h-full">
            <ProductBasicInfo
              name={f.name}
              onNameChange={f.setName}
              nameTouched={f.nameTouched}
              onNameBlur={() => f.setNameTouched(true)}
              price={f.price}
              priceDisplayValue={f.variantPriceDisplayValue}
              priceRaw={f.priceRaw}
              onPriceChange={(formatted, raw) => { f.setPrice(formatted); f.setPriceRaw(raw) }}
              priceTouched={f.priceTouched}
              onPriceBlur={() => f.setPriceTouched(true)}
              priceDisabled={f.isPriceLockedByVariants}
              priceHint={f.variantPriceHint}
              commissionPercent={f.commissionPercent}
              platformFeeLoading={f.platformFeeLoading}
              useVariants={f.useVariants}
              onOpenDescSheet={() => f.setDescSheetOpen(true)}
              description={f.description}
            >
              <ProductVariants
                useVariants={f.useVariants}
                onUseVariantsChange={f.setUseVariants}
                variantRows={f.variantRows}
                onVariantRowsChange={f.setVariantRows}
                sku={f.sku}
                onSkuChange={f.setSku}
                baseStock={f.baseStock}
                onBaseStockChange={f.setBaseStock}
              />
            </ProductBasicInfo>

            <Card className="!rounded">
              <CardContent className="grid gap-3">
                <ProductImageUploader
                  imageUrls={f.imageUrls}
                  onImageUrlsChange={f.setImageUrls}
                  imageInput={f.imageInput}
                  onImageInputChange={f.setImageInput}
                  isDragging={f.isDragging}
                  onIsDraggingChange={f.setIsDragging}
                  brokenUrls={f.brokenUrls}
                  onBrokenUrlsChange={f.setBrokenUrls}
                  fileInputRef={f.fileInputRef}
                />
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-10 bg-white" onClick={() => window.history.back()}>
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={f.handleSubmit}
                disabled={f.actionLoading || f.uploadingImages}
                className="h-10"
              >
                {f.uploadingImages ? (
                  <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang tải ảnh...</>
                ) : f.actionLoading ? (
                  <><IconLoader2 className="mr-2 size-4 animate-spin" />Đang tạo...</>
                ) : "Đăng bán →"}
              </Button>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full min-w-0">
            <ProductAiAssistant
              catLoading={f.catLoading}
              tagLoading={f.tagLoading}
              imageAnalyzeLoading={f.imageAnalyzeLoading}
              catError={f.catError}
              imageAnalyzeResult={f.imageAnalyzeResult}
              catSuggestions={f.catSuggestions}
              tagSuggestions={f.tagSuggestions}
              matSuggestions={f.matSuggestions}
              selCategory={f.selCategory}
              onSelectCategory={f.handleSelectCategory}
              manualCategoryOptions={f.manualCategoryOptions}
              manualCatQuery={f.manualCatQuery}
              onManualCatQueryChange={f.setManualCatQuery}
              debouncedManualCatQuery={f.debouncedManualCatQuery}
              selTagIds={f.selTagIds}
              onToggleTag={f.toggleTag}
              onTogglePlatformTag={f.togglePlatformTag}
              platformTags={f.platformTags}
              tagDialogOpen={f.tagDialogOpen}
              onTagDialogOpenChange={f.setTagDialogOpen}
              platformTagLoading={f.platformTagLoading}
              platformTagQuery={f.platformTagQuery}
              onPlatformTagQueryChange={f.setPlatformTagQuery}
              groupedPlatformTags={f.groupedPlatformTags}
              selMatIds={f.selMatIds}
              onToggleMat={f.toggleMat}
              onTogglePlatformMat={f.togglePlatformMat}
              matDialogOpen={f.matDialogOpen}
              onMatDialogOpenChange={f.setMatDialogOpen}
              platformMatLoading={f.platformMatLoading}
              platformMatQuery={f.platformMatQuery}
              onPlatformMatQueryChange={f.setPlatformMatQuery}
              groupedPlatformMaterials={f.groupedPlatformMaterials}
              platformMaterials={f.platformMaterials}
              onRunAiAnalysis={f.runAiAnalysis}
              hasInput={f.hasInput}
            />

            {f.localProfiles.length > 0 && (
              <ProductLocalBrand
                localProfiles={f.localProfiles}
                selLocalProfileId={f.selLocalProfileId}
                onSelectProfile={(id) => { f.setSelLocalProfileId(id); f.setSelLocalTraits([]) }}
                selLocalTraits={f.selLocalTraits}
                onToggleTrait={f.toggleLocalTrait}
                name={f.name}
                description={f.description}
                isMeaningfulDescription={f.isMeaningfulDescription}
                verificationScore={f.verificationScore}
                scoreColor={f.scoreColor}
                scoreLabel={f.scoreLabel}
                localMismatch={f.localMismatch}
              />
            )}
          </div>
        </div>
      </div>

      <ProductDescriptionSheet
        open={f.descSheetOpen}
        onOpenChange={f.setDescSheetOpen}
        value={f.description}
        onChange={f.setDescription}
      />
    </div>
  )
}
