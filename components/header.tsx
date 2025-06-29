"use client"

import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser, logout } from "@/lib/auth"
import { LogOut, User, Shield, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function Header() {
  const [user, setUser] = useState(getCurrentUser())
  const router = useRouter()

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) {
    return null
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center font-bold text-xl mr-4">
          <span className="text-primary">Sistema de Control de Delincuencia</span>
        </div>
        <MainNav />

        <div className="ml-auto flex items-center space-x-4">
          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="flex items-center gap-1">
              {user.role === "ADMIN" ? <Shield className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {user.role === "ADMIN" ? "Administrador" : "Visualizador"}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground">@{user.username}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Logout Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}


