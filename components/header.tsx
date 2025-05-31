import { MainNav } from "@/components/main-nav"

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center font-bold text-xl mr-4">
          <span className="text-primary">Sistema de Control de Delincuencia</span>
        </div>
        <MainNav />
      </div>
    </header>
  )
}
