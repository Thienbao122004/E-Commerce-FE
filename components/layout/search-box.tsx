'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getProducts } from '@/services/storefront-products'

interface SearchBoxProps {
  initialValue?: string
}

export function SearchBox({ initialValue = '' }: SearchBoxProps) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Array<{
    id: string
    name: string
    shopName: string
    imageUrl?: string
  }>>([])
  const [shopSuggestions, setShopSuggestions] = useState<Array<{ slug: string; name: string; logoUrl?: string | null }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const searchParams = useSearchParams()
  const currentQuery = searchParams?.get('q') || searchParams?.get('search') || initialValue

  useEffect(() => {
    setValue(currentQuery)
  }, [currentQuery])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([])
      setShopSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true)
      try {
        const res = await getProducts({ search: value.trim(), pageSize: 8, sortBy: "relevance" })
        if (res.success) {
          const dedupedByName = new Map<string, { id: string; name: string; shopName: string; imageUrl?: string }>()
          const uniqueShops = new Map<string, { slug: string; name: string; logoUrl?: string | null }>()
          for (const p of res.products) {
            if (!dedupedByName.has(p.name)) {
              dedupedByName.set(p.name, {
                id: p.id,
                name: p.name,
                shopName: p.shopName,
                imageUrl: p.imageUrls?.[0],
              })
            }
            if (p.shopSlug && !uniqueShops.has(p.shopSlug)) {
              if (p.shopName.toLowerCase().includes(value.trim().toLowerCase())) {
                uniqueShops.set(p.shopSlug, { slug: p.shopSlug, name: p.shopName, logoUrl: p.shopLogoUrl })
              }
            }
          }
          setSuggestions(Array.from(dedupedByName.values()).slice(0, 6))
          const shops = Array.from(uniqueShops.values())
          if (shops.length === 0) {
            // Also suggest shops that just own the top matched products if no shop name matches
            const uniqueShopsFallback = new Map<string, { slug: string; name: string; logoUrl?: string | null }>()
            for (const p of res.products) {
              if (p.shopSlug && !uniqueShopsFallback.has(p.shopSlug)) {
                uniqueShopsFallback.set(p.shopSlug, { slug: p.shopSlug, name: p.shopName, logoUrl: p.shopLogoUrl })
              }
            }
            setShopSuggestions(Array.from(uniqueShopsFallback.values()).slice(0, 2))
          } else {
            setShopSuggestions(shops.slice(0, 2))
          }
        }
      } catch { }
      finally { setLoadingSuggestions(false) }
    }, 300)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (term: string) => {
    setShowSuggestions(false)
    if (!term.trim()) {
      router.push('/search')
      return
    }
    router.push(`/search?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl mx-4">
      <div
        className="flex w-full items-center rounded-lg overflow-hidden border transition-colors focus-within:border-[var(--color-primary)]"
        style={{
          backgroundColor: '#f0ebe4',
          borderColor: showSuggestions && suggestions.length > 0 ? 'var(--color-primary)' : 'transparent',
        }}
      >
        <div className="flex items-center pl-3" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setShowSuggestions(true) }}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(value) }}
          placeholder="Tìm kiếm sản phẩm, shop, thương hiệu..."
          className="w-full bg-transparent border-none py-2.5 px-3 text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400"
          style={{ color: 'var(--color-text-main)' }}
        />
        {value && (
          <button
            onClick={() => { setValue(''); setSuggestions([]); setShowSuggestions(false) }}
            className="px-2 pt-1.5 text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
        <button
          onClick={() => handleSearch(value)}
          className="px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Tìm
        </button>
      </div>

      {showSuggestions && value.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
              <span className="size-3.5 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
              Đang tìm...
            </div>
          ) : suggestions.length > 0 || shopSuggestions.length > 0 ? (
            <>
              {shopSuggestions.map((shop) => (
                <button
                  key={shop.slug}
                  onMouseDown={() => { setShowSuggestions(false); router.push(`/shop/${shop.slug}`) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8f5f1] transition-colors text-left border-b border-gray-50"
                >
                  <div className="size-9 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(236,127,19,0.1)' }}>
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt={shop.name} className="size-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[var(--color-primary)]">storefront</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
                      Shop: <span style={{ color: 'var(--color-primary)' }}>&quot;{shop.name}&quot;</span>
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                </button>
              ))}

              {suggestions.length > 0 && shopSuggestions.length > 0 && (
                <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100/50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sản phẩm gợi ý</span>
                </div>
              )}

              {suggestions.map((item, index) => (
                <button
                  key={`${item.id}-${item.name}-${index}`}
                  onMouseDown={() => handleSearch(item.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8f5f1] transition-colors text-left"
                >
                  <div className="size-9 rounded-md bg-gray-100 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-base text-gray-400">search</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ color: 'var(--color-text-main)' }}>{item.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.shopName}</p>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400">Không tìm thấy gợi ý phù hợp</div>
          )}
        </div>
      )}
    </div>
  )
}
