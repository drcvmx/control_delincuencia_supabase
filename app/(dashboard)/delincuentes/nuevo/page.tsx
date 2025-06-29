"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RoleGuard } from "@/components/role-guard"
import { supabase } from "@/lib/supabase"
import type { Persona } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ArrowLeft, Loader2, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z
  .object({
    id_persona: z.string().min(1, {
      message: "Debes seleccionar una persona.",
    }),
    fecha_alta_delincuente: z.string().refine(
      (date) => {
        return !isNaN(Date.parse(date))
      },
      {
        message: "Fecha de alta inválida",
      },
    ),
    alias: z.string().optional(),
    antecedentes: z.string().optional(),
    fecha_detencion: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    lugar_detencion: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.fecha_detencion && data.fecha_alta_delincuente) {
        const fechaAlta = new Date(data.fecha_alta_delincuente)
        const fechaDetencion = new Date(data.fecha_detencion)
        return fechaAlta <= fechaDetencion
      }
      return true
    },
    {
      message: "La fecha de alta debe ser igual o anterior a la fecha de detención",
      path: ["fecha_detencion"],
    },
  )

export default function NuevoDelincuentePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const personaId = searchParams.get("personaId")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_persona: personaId || "",
      fecha_alta_delincuente: format(new Date(), "yyyy-MM-dd"),
      alias: "",
      antecedentes: "",
      fecha_detencion: null,
      lugar_detencion: "",
    },
  })

  useEffect(() => {
    async function loadPersonas() {
      try {
        setIsLoadingPersonas(true)

        // Obtener personas que no son delincuentes
        const { data: delincuentes } = await supabase.from("delincuente").select("id_persona")

        const delincuentesIds = delincuentes?.map((d) => d.id_persona) || []

        let query = supabase.from("persona").select("*")

        if (delincuentesIds.length > 0) {
          query = query.not("id", "in", `(${delincuentesIds.join(",")})`)
        }

        const { data, error } = await query.order("apellido_paterno", { ascending: true })

        if (error) {
          throw error
        }

        setPersonas(data as Persona[])
      } catch (error) {
        console.error("Error al cargar personas:", error)
        alert("Error al cargar la lista de personas.")
      } finally {
        setIsLoadingPersonas(false)
      }
    }

    loadPersonas()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const { error } = await supabase.from("delincuente").insert([
        {
          id_persona: values.id_persona,
          fecha_alta_delincuente: values.fecha_alta_delincuente,
          alias: values.alias || null,
          antecedentes: values.antecedentes || null,
          fecha_detencion: values.fecha_detencion,
          lugar_detencion: values.lugar_detencion || null,
        },
      ])

      if (error) {
        throw error
      }

      router.push(`/personas/${values.id_persona}`)
      router.refresh()
    } catch (error) {
      console.error("Error al registrar delincuente:", error)
      alert("Error al registrar delincuente. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/delincuentes" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Registrar Delincuente</h1>
      </div>

      <RoleGuard
        allowedRoles={["ADMIN"]}
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                  <p className="text-muted-foreground">Solo los administradores pueden registrar delincuentes.</p>
                </div>
                <Link href="/delincuentes">
                  <Button variant="outline">Volver a Delincuentes</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Información de Delincuente</CardTitle>
            <CardDescription>Registra a una persona como delincuente</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="id_persona"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingPersonas || !!personaId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una persona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {personas.map((persona) => (
                            <SelectItem key={persona.id} value={persona.id.toString()}>
                              {persona.nombre} {persona.apellido_paterno} {persona.apellido_materno}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_alta_delincuente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Alta</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Alias" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_detencion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Detención (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lugar_detencion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar de Detención (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Lugar de detención" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="antecedentes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Antecedentes (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe los antecedentes del delincuente"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Delincuente
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </RoleGuard>
    </div>
  )
}


