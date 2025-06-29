"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authenticateUser, setCurrentUser } from "@/lib/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Shield, Eye } from "lucide-react"

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    setError("")

    // Simular delay de autenticación
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = authenticateUser(values.username, values.password)

    if (user) {
      setCurrentUser(user)
      router.push("/")
    } else {
      setError("Usuario o contraseña incorrectos")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sistema de Control de Delincuencia</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa tu usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Ingresa tu contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </Form>

          <div className="mt-6 space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Credenciales de prueba - Haz clic para autocompletar:
            </div>

            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto p-3 justify-start bg-transparent"
                onClick={() => {
                  form.setValue("username", "admin")
                  
                }}
              >
                <div className="flex items-center gap-2 text-sm w-full">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Administrador</div>
                    <div className="text-muted-foreground">Acceso completo al sistema</div>
                  </div>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-auto p-3 justify-start bg-transparent"
                onClick={() => {
                  form.setValue("username", "viewer")
                  form.setValue("password", "viewer123")
                }}
              >
                <div className="flex items-center gap-2 text-sm w-full">
                  <Eye className="h-4 w-4 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">Visualizador</div>
                    <div className="text-muted-foreground">Solo lectura del sistema</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

