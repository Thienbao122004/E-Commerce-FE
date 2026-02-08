import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            E-Commerce Platform
          </h1>
          <p className="text-xl text-gray-600">
            Powered by Supabase Authentication
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          {/* Hero Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome! 👋
              </h2>
              <p className="text-lg text-gray-600">
                Get started by signing in or creating a new account
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl text-center"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition shadow-lg hover:shadow-xl text-center"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-4xl mb-3">🔐</div>
              <h3 className="text-xl font-semibold mb-2">Secure Auth</h3>
              <p className="text-gray-600">
                Powered by Supabase with JWT token authentication
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Auto Sync</h3>
              <p className="text-gray-600">
                User data automatically synced with backend database
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Modern Stack</h3>
              <p className="text-gray-600">
                Next.js 15 + ASP.NET Core + Supabase
              </p>
            </div>
          </div>

          {/* Test Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🧪 Testing the Integration
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Click "Create Account" to register a new user</li>
              <li>Fill in your details and submit</li>
              <li>Sign in with your credentials</li>
              <li>You'll be redirected to the dashboard</li>
              <li>Open DevTools (F12) to see API calls with Authorization headers</li>
            </ol>
          </div>
        </main>
      </div>
    </div>
  )
}

