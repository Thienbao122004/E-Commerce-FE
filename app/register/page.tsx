import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-text-main dark:text-[#e7dbcf] min-h-screen flex flex-col md:flex-row overflow-x-hidden transition-colors duration-300">
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 xl:w-1/2 h-screen relative overflow-hidden bg-stone-200">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDM3QI4TpOU-uiVr-llHuc95ubjIKJZa_APXVVMsQVNGRUaxb7mp0ISY0-7By8BI3dKHeOTRXTU_FJtV1XUZy0iR-XuoZo7-amgzCkNtalFUh6ba0SPMe5z1Im6eaVLnZP6Xs3MhGN3YdHfJyR_Ly6Mhcwpb9g4_83_O0ElkkXIUx4LVfP9rY5uS6DU3CIujfBODZ2uU2T2IvSHaeujDVgQrCMBhftq3BA5jcJNhQnNBPOhsEOAkPmnFbHNvrUPqZX60HdywU1AfW4')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </div>
        <div className="absolute bottom-10 left-10 z-10 text-white max-w-md">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">EcomViet</h2>
          <p className="text-white/90 text-lg font-light">Nền tảng thương mại nội địa Việt Nam</p>
        </div>
      </div>

      <div className="w-full md:w-1/2 lg:w-7/12 xl:w-1/2 flex flex-col h-screen overflow-y-auto bg-background-light dark:bg-background-dark relative">
        <header className="w-full p-6 sm:p-8 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">manufacturing</span>
            <span className="text-xl font-bold tracking-tight text-text-main dark:text-white">Đăng ký</span>
          </div>
          <a className="text-sm font-medium text-text-secondary hover:text-primary transition-colors hidden sm:block" href="#">
            Bạn cần giúp đỡ?
          </a>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-18">
          <RegisterForm />
        </main>
      </div>
    </div>
  )
}
