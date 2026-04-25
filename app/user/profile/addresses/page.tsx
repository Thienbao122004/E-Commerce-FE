/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { profileService } from '@/services/profile'
import type { AddressResponse, AddAddressRequest, UpdateAddressRequest } from '@/types/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  vietnamProvincesService,
} from '@/services/vietnam-provinces'
import type { Province, District, Ward } from '@/types/vietnam-provinces'
import { formatPhoneVn, isVietnamPhoneLocal, normalizeVietnamPhone } from '@/lib/phone-vn'

interface AddressFormData {
  label: string
  fullName: string
  phone: string
  addressLine1: string
  ward: string
  district: string
  city: string
  isDefault: boolean
}

const emptyForm: AddressFormData = {
  label: '',
  fullName: '',
  phone: '',
  addressLine1: '',
  ward: '',
  district: '',
  city: '',
  isDefault: false,
}

export default function AddressPage() {
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Vietnam provinces cascading data
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('')
  const [selectedWardCode, setSelectedWardCode] = useState<string>('')
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'province' | 'district' | 'ward'>('province')
  const [locationSearch, setLocationSearch] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const validatePhone = (value: string) => {
    if (!value.trim()) {
      setPhoneError('')
      return
    }
    const n = normalizeVietnamPhone(value)
    if (!isVietnamPhoneLocal(n)) {
      setPhoneError('Số điện thoại không hợp lệ')
    } else {
      setPhoneError('')
    }
  }

  useEffect(() => {
    loadAddresses()
    loadProvinces()
  }, [])

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true)
      const data = await vietnamProvincesService.getProvinces()
      setProvinces(data)
    } catch {
      toast.error('Không thể tải danh sách tỉnh/thành phố')
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadDistricts = useCallback(async (provinceCode: number) => {
    try {
      setLoadingDistricts(true)
      setDistricts([])
      setWards([])
      const data = await vietnamProvincesService.getDistricts(provinceCode)
      setDistricts(data)
    } catch {
      toast.error('Không thể tải danh sách quận/huyện')
    } finally {
      setLoadingDistricts(false)
    }
  }, [])

  const loadWards = useCallback(async (districtCode: number) => {
    try {
      setLoadingWards(true)
      setWards([])
      const data = await vietnamProvincesService.getWards(districtCode)
      setWards(data)
    } catch {
      toast.error('Không thể tải danh sách phường/xã')
    } finally {
      setLoadingWards(false)
    }
  }, [])

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvinceCode(String(province.code))
    setSelectedDistrictCode('')
    setSelectedWardCode('')
    setDistricts([])
    setWards([])
    setForm((prev) => ({ ...prev, city: province.name, district: '', ward: '' }))
    setActiveTab('district')
    setLocationSearch('')
    loadDistricts(province.code)
  }

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrictCode(String(district.code))
    setSelectedWardCode('')
    setWards([])
    setForm((prev) => ({ ...prev, district: district.name, ward: '' }))
    setActiveTab('ward')
    setLocationSearch('')
    loadWards(district.code)
  }

  const handleWardSelect = (ward: Ward) => {
    setSelectedWardCode(String(ward.code))
    setForm((prev) => ({ ...prev, ward: ward.name }))
    setLocationSearch('')
    setPickerOpen(false)
  }

  const clearLocation = () => {
    setSelectedProvinceCode('')
    setSelectedDistrictCode('')
    setSelectedWardCode('')
    setDistricts([])
    setWards([])
    setForm((prev) => ({ ...prev, city: '', district: '', ward: '' }))
    setActiveTab('province')
    setLocationSearch('')
  }

  const locationDisplayText = useMemo(() => {
    const parts = [form.city, form.district, form.ward].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : ''
  }, [form.city, form.district, form.ward])

  const filteredProvinces = useMemo(() => {
    if (!locationSearch) return provinces
    const q = locationSearch.toLowerCase()
    return provinces.filter((p) => p.name.toLowerCase().includes(q))
  }, [provinces, locationSearch])

  const filteredDistricts = useMemo(() => {
    if (!locationSearch) return districts
    const q = locationSearch.toLowerCase()
    return districts.filter((d) => d.name.toLowerCase().includes(q))
  }, [districts, locationSearch])

  const filteredWards = useMemo(() => {
    if (!locationSearch) return wards
    const q = locationSearch.toLowerCase()
    return wards.filter((w) => w.name.toLowerCase().includes(q))
  }, [wards, locationSearch])

  const loadAddresses = async () => {
    try {
      setLoading(true)
      const res = await profileService.getAddresses()
      if (res.success) {
        setAddresses(res.data ?? [])
      }
    } catch {
      toast.error('Không thể tải danh sách địa chỉ')
    } finally {
      setLoading(false)
    }
  }

  const openAddDialog = () => {
    setEditingId(null)
    setForm(emptyForm)
    setSelectedProvinceCode('')
    setSelectedDistrictCode('')
    setSelectedWardCode('')
    setDistricts([])
    setWards([])
    setPickerOpen(false)
    setActiveTab('province')
    setLocationSearch('')
    setPhoneError('')
    setDialogOpen(true)
  }

  const openEditDialog = async (addr: AddressResponse) => {
    setEditingId(addr.id)
    setForm({
      label: addr.label ?? '',
      fullName: addr.fullName ?? '',
      phone: normalizeVietnamPhone(addr.phone) || (addr.phone ?? ''),
      addressLine1: addr.addressLine1,
      ward: addr.ward ?? '',
      district: addr.district ?? '',
      city: addr.city,
      isDefault: addr.isDefault,
    })

    // Try to match province/district/ward by name to pre-select
    const matchedProvince = provinces.find((p) => p.name === addr.city)
    if (matchedProvince) {
      setSelectedProvinceCode(String(matchedProvince.code))
      try {
        const districtList = await vietnamProvincesService.getDistricts(matchedProvince.code)
        setDistricts(districtList)
        const matchedDistrict = districtList.find((d) => d.name === addr.district)
        if (matchedDistrict) {
          setSelectedDistrictCode(String(matchedDistrict.code))
          const wardList = await vietnamProvincesService.getWards(matchedDistrict.code)
          setWards(wardList)
          const matchedWard = wardList.find((w) => w.name === addr.ward)
          if (matchedWard) {
            setSelectedWardCode(String(matchedWard.code))
          } else {
            setSelectedWardCode('')
          }
        } else {
          setSelectedDistrictCode('')
          setWards([])
          setSelectedWardCode('')
        }
      } catch {
        setDistricts([])
        setWards([])
      }
    } else {
      setSelectedProvinceCode('')
      setSelectedDistrictCode('')
      setSelectedWardCode('')
      setDistricts([])
      setWards([])
    }

    setPickerOpen(false)
    setActiveTab('province')
    setLocationSearch('')
    setPhoneError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast.error('Vui lòng nhập họ tên')
      return
    }
    if (!form.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }
    const phoneNorm = normalizeVietnamPhone(form.phone)
    if (!isVietnamPhoneLocal(phoneNorm)) {
      setPhoneError('Số điện thoại không hợp lệ')
      return
    }
    if (!form.city.trim()) {
      toast.error('Vui lòng chọn tỉnh/thành phố')
      return
    }
    if (!form.district.trim()) {
      toast.error('Vui lòng chọn quận/huyện')
      return
    }
    if (!form.ward.trim()) {
      toast.error('Vui lòng chọn phường/xã')
      return
    }
    if (!form.addressLine1.trim()) {
      toast.error('Vui lòng nhập địa chỉ cụ thể')
      return
    }

    try {
      setSaving(true)
      if (editingId) {
        const data: UpdateAddressRequest = {
          label: form.label || null,
          fullName: form.fullName,
          phone: phoneNorm,
          addressLine1: form.addressLine1,
          ward: form.ward || null,
          district: form.district || null,
          city: form.city,
          country: 'Vietnam',
          isDefault: form.isDefault,
        }
        const res = await profileService.updateAddress(editingId, data)
        if (res.success) {
          setAddresses((prev) => {
            const next = prev.map((addr) => {
              if (addr.id !== editingId) {
                return form.isDefault ? { ...addr, isDefault: false } : addr
              }

              return {
                ...addr,
                label: form.label || null,
                fullName: form.fullName,
                phone: phoneNorm,
                addressLine1: form.addressLine1,
                ward: form.ward || null,
                district: form.district || null,
                city: form.city,
                country: 'Vietnam',
                isDefault: form.isDefault,
              }
            })

            return sortAddresses(next)
          })
          toast.success('Cập nhật địa chỉ thành công')
        } else {
          toast.error(res.message ?? 'Cập nhật thất bại')
          return
        }
      } else {
        const data: AddAddressRequest = {
          label: form.label || undefined,
          fullName: form.fullName,
          phone: phoneNorm,
          addressLine1: form.addressLine1,
          ward: form.ward || undefined,
          district: form.district || undefined,
          city: form.city,
          country: 'Vietnam',
          isDefault: form.isDefault,
        }
        const res = await profileService.addAddress(data)
        if (res.success) {
          if (res.data) {
            setAddresses((prev) => {
              let next = [res.data, ...prev.filter((addr) => addr.id !== res.data.id)]

              if (res.data.isDefault) {
                next = next.map((addr) =>
                  addr.id === res.data.id ? addr : { ...addr, isDefault: false }
                )
              }

              return sortAddresses(next)
            })
          }
          toast.success('Thêm địa chỉ thành công')
        } else {
          toast.error(res.message ?? 'Thêm thất bại')
          return
        }
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await profileService.deleteAddress(id)
      if (res.success) {
        setAddresses((prev) => prev.filter((addr) => addr.id !== id))
        toast.success('Xóa địa chỉ thành công')
      } else {
        toast.error(res.message ?? 'Xóa thất bại')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await profileService.setDefaultAddress(id)
      if (res.success) {
        setAddresses((prev) =>
          sortAddresses(
            prev.map((addr) => ({
              ...addr,
              isDefault: addr.id === id,
            }))
          )
        )
        toast.success('Đã đặt làm địa chỉ mặc định')
      } else {
        toast.error(res.message ?? 'Thất bại')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra')
    }
  }

  const updateField = (field: keyof AddressFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const sortAddresses = (list: AddressResponse[]) => {
    return [...list].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[5px] shadow-sm border p-6" style={{ borderColor: '#e5ded6' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-60 bg-gray-200 rounded" />
          <Separator />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border rounded-[5px] p-4 space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-80 bg-gray-200 rounded" />
              <div className="h-3 w-64 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-[5px] shadow-sm border" style={{ borderColor: '#e5ded6' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-main)' }}>
              Địa Chỉ Của Tôi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Quản lý địa chỉ giao hàng</p>
          </div>
          <Button onClick={openAddDialog} style={{ backgroundColor: 'var(--color-primary)' }}>
            <span className="material-symbols-outlined text-[18px] mr-1">add</span>
            Thêm Địa Chỉ Mới
          </Button>
        </div>
        <Separator />

        {/* Address List */}
        <div className="p-6">
          {addresses.length === 0 ? (
            <div className="text-center py-12">
              <span
                className="material-symbols-outlined text-[48px] text-muted-foreground"
              >
                location_off
              </span>
              <p className="text-muted-foreground mt-2">Bạn chưa có địa chỉ nào</p>
              <Button onClick={openAddDialog} variant="outline" className="mt-4">
                Thêm địa chỉ đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="border rounded-[5px] p-4 transition-colors hover:bg-gray-50/50"
                  style={{ borderColor: addr.isDefault ? 'var(--color-primary)' : '#e5ded6' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: 'var(--color-text-main)' }}>
                          {addr.fullName}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-sm text-muted-foreground tabular-nums">{formatPhoneVn(addr.phone)}</span>
                        {addr.label && (
                          <Badge variant="secondary" className="text-xs">
                            {addr.label}
                          </Badge>
                        )}
                        {addr.isDefault && (
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: 'rgba(236,127,19,0.1)', color: 'var(--color-primary)' }}
                          >
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {addr.addressLine1}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[addr.ward, addr.district, addr.city, addr.province].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditDialog(addr)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          Sửa
                        </button>
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleDelete(addr.id)}
                            disabled={deletingId === addr.id}
                            className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      {!addr.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs"
                        >
                          Thiết lập mặc định
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="addr-fullName" className="text-sm">
                  Họ và tên <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addr-fullName"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-phone" className="text-sm">
                  Số điện thoại <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="addr-phone"
                  value={form.phone}
                  onChange={(e) => {
                    updateField('phone', e.target.value)
                    if (phoneError) validatePhone(e.target.value)
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="0901 234 567"
                  className={phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {phoneError && (
                  <p className="text-xs text-destructive">{phoneError}</p>
                )}
              </div>
            </div>

            {/* Location Picker - Shopee style */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                Tỉnh/ Thành phố, Quận/Huyện, Phường/Xã <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                {/* Display input */}
                <div
                  className="flex items-center border rounded-md h-9 px-3 cursor-pointer hover:border-gray-400 transition-colors"
                  style={{ borderColor: pickerOpen ? 'var(--color-primary)' : undefined }}
                  onClick={() => setPickerOpen(!pickerOpen)}
                >
                  <span className={`flex-1 text-sm truncate ${locationDisplayText ? '' : 'text-muted-foreground'}`}>
                    {locationDisplayText || 'Chọn Tỉnh/Thành phố, Quận/Huyện, Phường/Xã'}
                  </span>
                  {locationDisplayText && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearLocation()
                      }}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Picker dropdown panel */}
                {pickerOpen && (
                  <div className="border rounded-md mt-1 bg-white shadow-md" style={{ borderColor: '#e5ded6' }}>
                    {/* Search */}
                    <div className="p-2 border-b" style={{ borderColor: '#e5ded6' }}>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-muted-foreground">search</span>
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Tìm kiếm..."
                          className="w-full h-8 pl-8 pr-3 text-sm border rounded-md outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b" style={{ borderColor: '#e5ded6' }}>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('province'); setLocationSearch('') }}
                        className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                          activeTab === 'province'
                            ? 'border-b-2 text-[var(--color-primary)]'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        style={activeTab === 'province' ? { borderBottomColor: 'var(--color-primary)' } : {}}
                      >
                        Tỉnh/Thành phố
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (selectedProvinceCode) { setActiveTab('district'); setLocationSearch('') } }}
                        className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                          activeTab === 'district'
                            ? 'border-b-2 text-[var(--color-primary)]'
                            : selectedProvinceCode ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'
                        }`}
                        style={activeTab === 'district' ? { borderBottomColor: 'var(--color-primary)' } : {}}
                      >
                        Quận/Huyện
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (selectedDistrictCode) { setActiveTab('ward'); setLocationSearch('') } }}
                        className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                          activeTab === 'ward'
                            ? 'border-b-2 text-[var(--color-primary)]'
                            : selectedDistrictCode ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'
                        }`}
                        style={activeTab === 'ward' ? { borderBottomColor: 'var(--color-primary)' } : {}}
                      >
                        Phường/Xã
                      </button>
                    </div>

                    {/* Scrollable list */}
                    <div className="overflow-y-auto max-h-[200px]">
                      {activeTab === 'province' && (
                        loadingProvinces ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Đang tải...</div>
                        ) : filteredProvinces.length === 0 ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Không tìm thấy</div>
                        ) : (
                          filteredProvinces.map((p) => (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => handleProvinceSelect(p)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                String(p.code) === selectedProvinceCode ? 'text-[var(--color-primary)] font-medium' : ''
                              }`}
                            >
                              {p.name}
                            </button>
                          ))
                        )
                      )}
                      {activeTab === 'district' && (
                        loadingDistricts ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Đang tải...</div>
                        ) : filteredDistricts.length === 0 ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Không tìm thấy</div>
                        ) : (
                          filteredDistricts.map((d) => (
                            <button
                              key={d.code}
                              type="button"
                              onClick={() => handleDistrictSelect(d)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                String(d.code) === selectedDistrictCode ? 'text-[var(--color-primary)] font-medium' : ''
                              }`}
                            >
                              {d.name}
                            </button>
                          ))
                        )
                      )}
                      {activeTab === 'ward' && (
                        loadingWards ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Đang tải...</div>
                        ) : filteredWards.length === 0 ? (
                          <div className="p-4 text-sm text-center text-muted-foreground">Không tìm thấy</div>
                        ) : (
                          filteredWards.map((w) => (
                            <button
                              key={w.code}
                              type="button"
                              onClick={() => handleWardSelect(w)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                String(w.code) === selectedWardCode ? 'text-[var(--color-primary)] font-medium' : ''
                              }`}
                            >
                              {w.name}
                            </button>
                          ))
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specific Address */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-line1" className="text-sm">
                Địa chỉ cụ thể <span className="text-destructive">*</span>
              </Label>
              <Input
                id="addr-line1"
                value={form.addressLine1}
                onChange={(e) => updateField('addressLine1', e.target.value)}
                placeholder="Số nhà, tên đường"
              />
            </div>

            {/* Label (type) - free text */}
            <div className="space-y-1.5">
              <Label htmlFor="addr-label" className="text-sm">Loại địa chỉ</Label>
              <Input
                id="addr-label"
                value={form.label}
                onChange={(e) => updateField('label', e.target.value)}
                placeholder="Nhà riêng, Văn phòng, ..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="addr-default"
                checked={form.isDefault}
                onChange={(e) => updateField('isDefault', e.target.checked)}
                className="size-4 rounded border accent-[var(--color-primary)]"
              />
              <Label htmlFor="addr-default" className="text-sm font-normal cursor-pointer">
                Đặt làm địa chỉ mặc định
              </Label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Trở Lại</Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Đang lưu...
                </span>
              ) : (
                'Hoàn thành'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
