'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, signOut } from '@/lib/auth'
import { api } from '@/lib/api-client'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      // Get Supabase user
      const supabaseUser = await getUser()
      
      if (!supabaseUser) {
        router.push('/login')
        return
      }
      
      setUser(supabaseUser)

      // Try to fetch profile from backend (this will trigger auto user creation)
      try {
        const profileData = await api.get('/profile/me')
        setProfile(profileData)
      } catch (err: any) {
        console.error('Failed to fetch profile:', err)
        setError('Could not load profile from backend')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      router.push('/login')
    } catch (err: any) {
      console.error('Sign out error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome! 🎉</h2>
          <p className="text-gray-600">
            You are successfully authenticated with Supabase.
          </p>
        </div>

        {/* Supabase User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Supabase User Info</h3>
          <div className="space-y-2">
            <div className="flex">
              <span className="font-medium text-gray-700 w-32">User ID:</span>
              <span className="text-gray-600 font-mono text-sm">{user?.id}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-32">Email:</span>
              <span className="text-gray-600">{user?.email}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-32">Full Name:</span>
              <span className="text-gray-600">{user?.user_metadata?.full_name || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-medium text-gray-700 w-32">Created At:</span>
              <span className="text-gray-600">{new Date(user?.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Backend Profile Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Backend Profile Info</h3>
          
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
              <p className="font-medium">⚠️ Backend Connection Issue</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-sm mt-2">
                Make sure your backend is running and CORS is configured correctly.
              </p>
            </div>
          )}

          {profile ? (
            <div className="space-y-2">
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Profile ID:</span>
                <span className="text-gray-600">{profile.id}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Email:</span>
                <span className="text-gray-600">{profile.email}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Full Name:</span>
                <span className="text-gray-600">{profile.fullName || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Phone:</span>
                <span className="text-gray-600">{profile.phone || 'N/A'}</span>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 font-medium">✅ Backend Integration Working!</p>
                <p className="text-green-700 text-sm mt-1">
                  User was automatically created/synced in the backend database.
                </p>
              </div>
            </div>
          ) : !error && (
            <p className="text-gray-500">No profile data available</p>
          )}
        </div>

        {/* Test Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🧪 Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Open Developer Tools (F12) → Network tab</li>
            <li>Refresh this page to see API calls</li>
            <li>Look for request to <code className="bg-blue-100 px-1 rounded">/api/profile/me</code></li>
            <li>Check Request Headers for <code className="bg-blue-100 px-1 rounded">Authorization: Bearer ...</code></li>
            <li>Verify response status is 200 OK</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
