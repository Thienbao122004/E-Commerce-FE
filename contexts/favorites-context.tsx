"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getFavoriteIds, toggleFavorite } from "@/services/favorites"

interface FavoritesContextValue {
  favoriteIds: Set<string>
  isFavorited: (productId: string) => boolean
  toggle: (productId: string) => Promise<void>
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favoriteIds: new Set(),
  isFavorited: () => false,
  toggle: async () => {},
  isLoading: false,
})

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!session?.user?.id) {
      setFavoriteIds(new Set())
      return
    }

    setIsLoading(true)
    getFavoriteIds()
      .then((res) => {
        if (res.success) {
          setFavoriteIds((prev) => {
            const next = new Set(res.productIds)
            if (prev.size === next.size && [...prev].every((id) => next.has(id))) return prev
            return next
          })
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [authLoading, session?.user?.id])

  const isFavorited = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  )

  const toggle = useCallback(
    async (productId: string) => {
      if (!session?.access_token) {
        router.push("/login")
        return
      }

      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (next.has(productId)) next.delete(productId)
        else next.add(productId)
        return next
      })

      try {
        const res = await toggleFavorite(productId)
        if (res.success) {
          setFavoriteIds((prev) => {
            const next = new Set(prev)
            if (res.isFavorited) next.add(productId)
            else next.delete(productId)
            return next
          })
        }
      } catch {
        // revert optimistic update on error
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (next.has(productId)) next.delete(productId)
          else next.add(productId)
          return next
        })
      }
    },
    [session?.access_token, router]
  )

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorited, toggle, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
