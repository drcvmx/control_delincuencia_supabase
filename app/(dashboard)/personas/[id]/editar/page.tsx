"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { CARCELES } from "@/lib/constants"
import type { Persona, Delincuente, EstatusPenitenciario } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Esquemas base
const personaSchemaBase = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  apellido_paterno: z.string().min(2, {
    message: "El apellido paterno debe tener al menos 2 caracteres.",
  }),
  apellido_materno: z.string().min(2, {
    message: "El apellido materno debe tener al menos 2 caracteres.",
  }),
  fecha_de_nacimiento: z.string().refine(
    (date) => {
      return !isNaN(Date.parse(date))
    },
    {
      message: "Fecha de nacimiento inválida",
    },
  ),
  fecha_de_fin: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
})

const delincuenteSchemaBase = z.object({
  fecha_alta_delincuente: z.string().optional(),
  alias: z.string().optional(),
  antecedentes: z.string().optional(),
  fecha_detencion: z.string().optional(),
  lugar_detencion: z.string().optional(),
})

const estatusPenitenciarioSchemaBase = z.object({
  id_carcel: z.string().optional(),
  id_celda: z.string().optional(),
  fecha_ingreso: z.string().optional(),
  fecha_salida_prevista: z.string().optional(),
  fecha_salida_real: z.string().optional(),
  motivo_encarcelamiento: z.string().optional(),
})

// Esquema combinado con validaciones
const formSchema = personaSchemaBase
  .merge(delincuenteSchemaBase)
  .merge(estatusPenitenciarioSchemaBase)
  .refine(
    (data) => {
      // Validación: fecha de nacimiento anterior a fecha de fin
      if (data.fecha_de_fin && data.fecha_de_nacimiento) {
        const fechaNacimiento = new Date(data.fecha_de_nacimiento)
        const fechaFin = new Date(data.fecha_de_fin)
        return fechaNacimiento < fechaFin
      }
      return true
    },
    {
      message: "La fecha de nacimiento debe ser anterior a la fecha de fin",
      path: ["fecha_de_fin"],
    },
  )
  .refine(
    (data) => {
      // Validación: fecha de alta anterior o igual a fecha de detención
      if (data.fecha_alta_delincuente && data.fecha_detencion) {
        const fechaAlta = new Date(data.fecha_alta_delincuente)
        const fechaDetencion = new Date(data.fecha_detencion)
        return fechaAlta <= fechaDetencion
      }
      return true
    },
    {
      message: "La fecha de alta debe ser anterior o igual a la fecha de detención",
      path: ["fecha_detencion"],
    },
  )
  .refine(
    (data) => {
      // Validación: fecha de ingreso anterior a fecha de salida prevista
      if (data.fecha_ingreso && data.fecha_salida_prevista) {
        const fechaIngreso = new Date(data.fecha_ingreso)
        const fechaSalida = new Date(data.fecha_salida_prevista)
        return fechaIngreso < fechaSalida
      }
      return true
    },
    {
      message: "La fecha de ingreso debe ser anterior a la fecha de salida prevista",
      path: ["fecha_salida_prevista"],
    },
  )
  .refine(
    (data) => {
      // Validación: ID de cárcel debe ser válido si se proporciona
      if (data.id_carcel) {
        const num = Number.parseInt(data.id_carcel)
        return !isNaN(num) && num >= 1 && num <= 10
      }
      return true
    },
    {
      message: "El ID de cárcel debe ser un número entre 1 y 10",
      path: ["id_carcel"],
    },
  )

export default function EditarPersonaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDelincuente, setIsDelincuente] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_de_nacimiento: "",
      fecha_de_fin: null,
      fecha_alta_delincuente: "",
      alias: "",
      antecedentes: "",
      fecha_detencion: "",
      lugar_detencion: "",
      id_carcel: "",
      id_celda: "",
      fecha_ingreso: "",
      fecha_salida_prevista: "",
      fecha_salida_real: "",
      motivo_encarcelamiento: "",
    },
  })

  useEffect(() => {
    async function loadPersona() {
      try {
        setIsLoading(true)

        // Cargar datos de persona
        const { data: personaData, error: personaError } = await supabase
          .from("persona")
          .select("*")
          .eq("id", params.id)
          .single()

        if (personaError) {
          throw personaError
        }

        const persona = personaData as Persona

        // Verificar si es delincuente
        const { data: delincuenteData, error: delincuenteError } = await supabase
          .from("delincuente")
          .select("*")
          .eq("id_persona", params.id)
          .single()

        let delincuente: Delincuente | null = null
        if (!delincuenteError && delincuenteData) {
          delincuente = delincuenteData as Delincuente
          setIsDelincuente(true)
        }

        // Verificar si tiene estatus penitenciario
        const { data: estatusData, error: estatusError } = await supabase
          .from("estatus_penitenciario")
          .select("*")
          .eq("id_delincuente", params.id)
          .single()

        let estatus: EstatusPenitenciario | null = null
        if (!estatusError && estatusData) {
          estatus = estatusData as EstatusPenitenciario
        }

        // Resetear formulario con todos los datos
        form.reset({
          nombre: persona.nombre,
          apellido_paterno: persona.apellido_paterno,
          apellido_materno: persona.apellido_materno,
          fecha_de_nacimiento: persona.fecha_de_nacimiento,
          fecha_de_fin: persona.fecha_de_fin,
          fecha_alta_delincuente: delincuente?.fecha_alta_delincuente || "",
          alias: delincuente?.alias || "",
          antecedentes: delincuente?.antecedentes || "",
          fecha_detencion: delincuente?.fecha_detencion || "",
          lugar_detencion: delincuente?.lugar_detencion || "",
          id_carcel: estatus?.id_carcel?.toString() || "",
          id_celda: estatus?.id_celda || "",
          fecha_ingreso: estatus?.fecha_ingreso || "",
          fecha_salida_prevista: estatus?.fecha_salida_prevista || "",
          fecha_salida_real: estatus?.fecha_salida_real || "",
          motivo_encarcelamiento: estatus?.motivo_encarcelamiento || "",
        })
      } catch (error) {
        console.error("Error al cargar persona:", error)
        alert("Error al cargar los datos de la persona.")
        router.push("/personas")
      } finally {
        setIsLoading(false)
      }
    }

    loadPersona()
  }, [params.id, form, router])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Actualizar datos de persona
      const { error: personaError } = await supabase
        .from("persona")
        .update({
          nombre: values.nombre,
          apellido_paterno: values.apellido_paterno,
          apellido_materno: values.apellido_materno,
          fecha_de_nacimiento: values.fecha_de_nacimiento,
          fecha_de_fin: values.fecha_de_fin,
        })
        .eq("id", params.id)

      if (personaError) {
        throw personaError
      }

      // Si es delincuente, actualizar o insertar datos de delincuente
      if (
        isDelincuente &&
        (values.fecha_alta_delincuente ||
          values.alias ||
          values.antecedentes ||
          values.fecha_detencion ||
          values.lugar_detencion)
      ) {
        const { error: delincuenteError } = await supabase.from("delincuente").upsert({
          id_persona: Number.parseInt(params.id),
          fecha_alta_delincuente: values.fecha_alta_delincuente || null,
          alias: values.alias || null,
          antecedentes: values.antecedentes || null,
          fecha_detencion: values.fecha_detencion || null,
          lugar_detencion: values.lugar_detencion || null,
        })

        if (delincuenteError) {
          throw delincuenteError
        }

        // Si tiene datos de estatus penitenciario, actualizar o insertar
        if (
          values.id_carcel ||
          values.id_celda ||
          values.fecha_ingreso ||
          values.fecha_salida_prevista ||
          values.fecha_salida_real ||
          values.motivo_encarcelamiento
        ) {
          const { error: estatusError } = await supabase.from("estatus_penitenciario").upsert({
            id_delincuente: Number.parseInt(params.id),
            id_carcel: values.id_carcel ? Number.parseInt(values.id_carcel) : null,
            id_celda: values.id_celda || null,
            fecha_ingreso: values.fecha_ingreso || null,
            fecha_salida_prevista: values.fecha_salida_prevista || null,
            fecha_salida_real: values.fecha_salida_real || null,
            motivo_encarcelamiento: values.motivo_encarcelamiento || null,
          })

          if (estatusError) {
            throw estatusError
          }
        }
      }

      router.push(`/personas/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error al actualizar persona:", error)
      alert("Error al actualizar persona. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href={`/personas/${params.id}`} className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Editar Persona</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Datos Personales</TabsTrigger>
              <TabsTrigger value="delincuente" disabled={!isDelincuente}>
                Datos de Delincuente
              </TabsTrigger>
              <TabsTrigger value="estatus" disabled={!isDelincuente}>
                Estatus Penitenciario
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza los datos personales básicos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apellido_paterno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido Paterno</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido Paterno" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apellido_materno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido Materno</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido Materno" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_de_nacimiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Nacimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_de_fin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="delincuente">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Delincuente</CardTitle>
                  <CardDescription>Actualiza los datos específicos del delincuente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fecha_alta_delincuente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Alta como Delincuente</FormLabel>
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
                        <FormLabel>Alias</FormLabel>
                        <FormControl>
                          <Input placeholder="Alias o apodo" {...field} />
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
                        <FormLabel>Antecedentes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe los antecedentes del delincuente" {...field} />
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
                        <FormLabel>Fecha de Detención</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Lugar de Detención</FormLabel>
                        <FormControl>
                          <Input placeholder="Lugar donde fue detenido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="estatus">
              <Card>
                <CardHeader>
                  <CardTitle>Estatus Penitenciario</CardTitle>
                  <CardDescription>Actualiza la información penitenciaria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="id_carcel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cárcel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una cárcel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CARCELES).map(([id, descripcion]) => (
                              <SelectItem key={id} value={id}>
                                {id} - {descripcion}
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
                    name="id_celda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Celda</FormLabel>
                        <FormControl>
                          <Input placeholder="Identificador de la celda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_ingreso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Ingreso</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_salida_prevista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Salida Prevista</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fecha_salida_real"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Salida Real (opcional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="motivo_encarcelamiento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo de Encarcelamiento</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe el motivo del encarcelamiento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
