export interface User {
    id: string
    username: string
    role: "ADMIN" | "VIEWER"
    name: string
  }
  
  // Credenciales hardcodeadas
  const USERS: User[] = [
    {
      id: "1",
      username: "admin",
      role: "ADMIN",
      name: "Administrador del Sistema",
    },
    {
      id: "2",
      username: "viewer",
      role: "VIEWER",
      name: "Usuario Visualizador",
    },
  ]
  
  const PASSWORDS: Record<string, string> = {
    admin: "admindrcv",
    viewer: "viewer123",
  }
  
  export function authenticateUser(username: string, password: string): User | null {
    const user = USERS.find((u) => u.username === username)
    if (user && PASSWORDS[username] === password) {
      return user
    }
    return null
  }
  
  export function getCurrentUser(): User | null {
    if (typeof window === "undefined") return null
  
    const userData = localStorage.getItem("currentUser")
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch {
        return null
      }
    }
    return null
  }
  
  export function setCurrentUser(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user))
    }
  }
  
  export function logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
  }
  
  export function isAdmin(): boolean {
    const user = getCurrentUser()
    return user?.role === "ADMIN"
  }
  
  export function isViewer(): boolean {
    const user = getCurrentUser()
    return user?.role === "VIEWER"
  }
  
  export function isAuthenticated(): boolean {
    return getCurrentUser() !== null
  }
  