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
import { vietnamProvincesService } from '@/services/vietnam-provinces'
import type { Province, District, Ward } from '@/types/vietnam-provinces'
import { Loader2 } from 'lucide-react'

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

interface CheckoutAddressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addresses: AddressResponse[]
  selectedAddressId: string
  onSelectAddress: (id: string) => void
  onAddressUpdated: () => void // trigger reload addresses in parent
}

export function CheckoutAddressModal({
  open,
  onOpenChange,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddressUpdated,
}: CheckoutAddressModalProps) {
  // Mode: 'list' = showing list of addresses, 'form' = adding/editing
  const [mode, setMode] = useState<'list' | 'form'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedInModal, setSelectedInModal] = useState(selectedAddressId)

  // Reset internal selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedInModal(selectedAddressId)
      setMode('list')
    }
  }, [open, selectedAddressId])

  // Form states matching addresses/page.tsx
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
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/
    if (!phoneRegex.test(value.trim())) {
      setPhoneError('Số điện thoại không hợp lệ')
    } else {
      setPhoneError('')
    }
  }

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

  useEffect(() => {
    if (mode === 'form' && provinces.length === 0) {
      loadProvinces()
    }
  }, [mode, provinces.length])

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

  const openAddForm = () => {
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
    setMode('form')
  }

  const openEditForm = async (addr: AddressResponse) => {
    setEditingId(addr.id)
    setForm({
      label: addr.label ?? '',
      fullName: addr.fullName ?? '',
      phone: addr.phone ?? '',
      addressLine1: addr.addressLine1,
      ward: addr.ward ?? '',
      district: addr.district ?? '',
      city: addr.city,
      isDefault: addr.isDefault,
    })

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
    setMode('form')
  }

  const handleSaveForm = async () => {
    if (!form.fullName.trim()) {
      toast.error('Vui lòng nhập họ tên')
      return
    }
    if (!form.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại')
      return
    }
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/
    if (!phoneRegex.test(form.phone.trim())) {
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
          phone: form.phone,
          addressLine1: form.addressLine1,
          ward: form.ward || null,
          district: form.district || null,
          city: form.city,
          country: 'Vietnam',
          isDefault: form.isDefault,
        }
        const res = await profileService.updateAddress(editingId, data)
        if (res.success) {
          toast.success('Cập nhật địa chỉ thành công')
          onAddressUpdated()
          setMode('list')
        } else {
          toast.error(res.message ?? 'Cập nhật thất bại')
        }
      } else {
        const data: AddAddressRequest = {
          label: form.label || undefined,
          fullName: form.fullName,
          phone: form.phone,
          addressLine1: form.addressLine1,
          ward: form.ward || undefined,
          district: form.district || undefined,
          city: form.city,
          country: 'Vietnam',
          isDefault: form.isDefault,
        }
        const res = await profileService.addAddress(data)
        if (res.success) {
          toast.success('Thêm địa chỉ thành công')
          onAddressUpdated()
          setMode('list')
          if (res.data?.id) setSelectedInModal(res.data.id)
        } else {
          toast.error(res.message ?? 'Thêm thất bại')
        }
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof AddressFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleConfirmSelection = () => {
    if (selectedInModal) {
      onSelectAddress(selectedInModal)
      onOpenChange(false)
    } else {
      toast.error('Vui lòng chọn một địa chỉ')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setMode('list') // reset on close
      onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{mode === 'list' ? 'Chọn Địa Chỉ Giao Hàng' : editingId ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === 'list' && (
            <div className="space-y-4">
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[40px] text-muted-foreground">location_off</span>
                  <p className="text-sm text-muted-foreground mt-2">Bạn chưa có địa chỉ nào</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex gap-3 border rounded-[5px] p-4 transition-colors hover:bg-gray-50/50 cursor-pointer"
                    style={{ borderColor: selectedInModal === addr.id ? 'var(--color-primary)' : '#e5ded6' }}
                    onClick={() => setSelectedInModal(addr.id)}
                  >
                    <div className="pt-0.5">
                      <div className="size-4 m-1 rounded-full border flex items-center justify-center transition-all" style={{ 
                        borderColor: selectedInModal === addr.id ? 'var(--color-primary)' : '#d1c9c0'
                       }}>
                         {selectedInModal === addr.id && (
                           <div className="size-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                         )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: 'var(--color-text-main)' }}>
                          {addr.fullName}
                        </span>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="text-sm text-muted-foreground">{addr.phone}</span>
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
                      <p className="text-sm text-muted-foreground mt-1.5">{addr.addressLine1}</p>
                      <p className="text-sm text-muted-foreground">
                        {[addr.ward, addr.district, addr.city, addr.province].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditForm(addr)
                        }}
                        className="text-sm font-medium hover:underline px-2"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        Cập nhật
                      </button>
                    </div>
                  </div>
                ))
              )}
              <Button 
                variant="outline" 
                onClick={openAddForm}
                className="w-full flex items-center justify-center gap-2 border-dashed py-6"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Thêm Địa Chỉ Mới
              </Button>
            </div>
          )}

          {mode === 'form' && (
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
                    placeholder="(+84) 901 234 567"
                    className={phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {phoneError && (
                    <p className="text-xs text-destructive">{phoneError}</p>
                  )}
                </div>
              </div>

              {/* Location Picker */}
              <div className="space-y-1.5">
                <Label className="text-sm">
                  Tỉnh/ Thành phố, Quận/Huyện, Phường/Xã <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <div
                    className="flex items-center border rounded-md h-9 px-3 cursor-pointer hover:border-gray-400 transition-colors bg-white z-10"
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

                  {pickerOpen && (
                    <div className="border rounded-md mt-1 bg-white shadow-xl absolute w-full z-50 left-0 top-full" style={{ borderColor: '#e5ded6' }}>
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

                      <div className="flex border-b" style={{ borderColor: '#e5ded6' }}>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('province'); setLocationSearch('') }}
                          className={`flex-1 py-1.5 text-xs font-medium text-center transition-colors ${
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
                          className={`flex-1 py-1.5 text-xs font-medium text-center transition-colors ${
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
                          className={`flex-1 py-1.5 text-xs font-medium text-center transition-colors ${
                            activeTab === 'ward'
                              ? 'border-b-2 text-[var(--color-primary)]'
                              : selectedDistrictCode ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'
                          }`}
                          style={activeTab === 'ward' ? { borderBottomColor: 'var(--color-primary)' } : {}}
                        >
                          Phường/Xã
                        </button>
                      </div>

                      <div className="overflow-y-auto max-h-[200px] bg-white">
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

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="addr-default"
                  checked={form.isDefault}
                  onChange={(e) => updateField('isDefault', e.target.checked)}
                  className="size-4 rounded border accent-[var(--color-primary)] cursor-pointer"
                />
                <Label htmlFor="addr-default" className="text-sm font-normal cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 shrink-0">
          {mode === 'list' ? (
            <>
              <DialogClose asChild>
                <Button variant="outline">Trở Lại</Button>
              </DialogClose>
              <Button
                onClick={handleConfirmSelection}
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Xác nhận
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode('list')}>
                Trở lại hiển thị danh sách
              </Button>
              <Button
                onClick={handleSaveForm}
                disabled={saving}
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </span>
                ) : (
                  'Hoàn thành'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
