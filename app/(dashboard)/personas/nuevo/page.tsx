"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RoleGuard } from "@/components/role-guard"
import { supabase } from "@/lib/supabase"
import { CARCELES } from "@/lib/constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ArrowLeft, Loader2, CheckCircle2, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Esquemas base sin refine
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
  es_delincuente: z.boolean().default(false),
  fecha_alta_delincuente: z.string().optional(),
  alias: z.string().optional(),
  antecedentes: z.string().optional(),
  fecha_detencion: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  lugar_detencion: z.string().optional(),
})

const estatusPenitenciarioSchemaBase = z.object({
  registrar_estatus: z.boolean().default(false),
  id_carcel: z.string().optional(),
  id_celda: z.string().optional(),
  fecha_ingreso: z.string().optional(),
  fecha_salida_prevista: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  motivo_encarcelamiento: z.string().optional(),
})

// Esquema combinado con todas las validaciones
const formSchema = personaSchemaBase
  .merge(delincuenteSchemaBase)
  .merge(estatusPenitenciarioSchemaBase)
  .refine(
    (data) => {
      // Validación: fecha de nacimiento debe ser anterior a fecha de fin
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
      // Validación: fecha de alta debe ser igual o anterior a fecha de detención
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
  .refine(
    (data) => {
      // Validación: fecha de ingreso debe ser anterior a fecha de salida prevista
      if (data.fecha_salida_prevista && data.fecha_ingreso) {
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
      // Validación: si se registra estatus penitenciario, id_carcel debe ser válido
      if (data.registrar_estatus && data.id_carcel) {
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

export default function NuevaPersonaPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("persona")
  const [showSuccess, setShowSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_de_nacimiento: format(new Date(), "yyyy-MM-dd"),
      fecha_de_fin: null,
      es_delincuente: false,
      fecha_alta_delincuente: format(new Date(), "yyyy-MM-dd"),
      alias: "",
      antecedentes: "",
      fecha_detencion: null,
      lugar_detencion: "",
      registrar_estatus: false,
      id_carcel: "",
      id_celda: "",
      fecha_ingreso: format(new Date(), "yyyy-MM-dd"),
      fecha_salida_prevista: null,
      motivo_encarcelamiento: "",
    },
  })

  const watchEsDelincuente = form.watch("es_delincuente")
  const watchRegistrarEstatus = form.watch("registrar_estatus")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // 1. Insertar persona
      const { data: personaData, error: personaError } = await supabase
        .from("persona")
        .insert([
          {
            nombre: values.nombre,
            apellido_paterno: values.apellido_paterno,
            apellido_materno: values.apellido_materno,
            fecha_de_nacimiento: values.fecha_de_nacimiento,
            fecha_de_fin: values.fecha_de_fin,
          },
        ])
        .select()

      if (personaError) {
        throw personaError
      }

      const personaId = personaData[0].id

      // 2. Si es delincuente, insertar en la tabla delincuente
      if (values.es_delincuente) {
        const { error: delincuenteError } = await supabase.from("delincuente").insert([
          {
            id_persona: personaId,
            fecha_alta_delincuente: values.fecha_alta_delincuente,
            alias: values.alias || null,
            antecedentes: values.antecedentes || null,
            fecha_detencion: values.fecha_detencion,
            lugar_detencion: values.lugar_detencion || null,
          },
        ])

        if (delincuenteError) {
          throw delincuenteError
        }

        // 3. Si se registra estatus penitenciario, insertar en la tabla
        if (values.registrar_estatus) {
          const { error: estatusError } = await supabase.from("estatus_penitenciario").insert([
            {
              id_delincuente: personaId,
              id_carcel: Number.parseInt(values.id_carcel || "0"),
              id_celda: values.id_celda || "",
              fecha_ingreso: values.fecha_ingreso,
              fecha_salida_prevista: values.fecha_salida_prevista,
              fecha_salida_real: null,
              motivo_encarcelamiento: values.motivo_encarcelamiento || "",
            },
          ])

          if (estatusError) {
            throw estatusError
          }
        }
      }

      // Mostrar mensaje de éxito y resetear el formulario
      setShowSuccess(true)
      form.reset({
        nombre: "",
        apellido_paterno: "",
        apellido_materno: "",
        fecha_de_nacimiento: format(new Date(), "yyyy-MM-dd"),
        fecha_de_fin: null,
        es_delincuente: false,
        fecha_alta_delincuente: format(new Date(), "yyyy-MM-dd"),
        alias: "",
        antecedentes: "",
        fecha_detencion: null,
        lugar_detencion: "",
        registrar_estatus: false,
        id_carcel: "",
        id_celda: "",
        fecha_ingreso: format(new Date(), "yyyy-MM-dd"),
        fecha_salida_prevista: null,
        motivo_encarcelamiento: "",
      })
      setActiveTab("persona")

      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } catch (error) {
      console.error("Error al crear persona:", error)
      alert("Error al crear persona. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href="/personas" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Persona</h1>
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
                  <p className="text-muted-foreground">Solo los administradores pueden crear nuevas personas.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        {showSuccess && (
          <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>¡Éxito!</AlertTitle>
            <AlertDescription>
              La persona ha sido guardada correctamente. Puedes registrar otra persona.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="persona">Datos Personales</TabsTrigger>
                <TabsTrigger value="delincuente" disabled={!watchEsDelincuente}>
                  Datos de Delincuente
                </TabsTrigger>
                <TabsTrigger value="estatus" disabled={!watchEsDelincuente || !watchRegistrarEstatus}>
                  Estatus Penitenciario
                </TabsTrigger>
              </TabsList>

              <TabsContent value="persona">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>Ingresa los datos básicos de la persona</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input type="date" {...field} className="border-white focus:border-white" />
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
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                                className="border-white focus:border-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="es_delincuente"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (checked) {
                                  setActiveTab("delincuente")
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Registrar como Delincuente</FormLabel>
                            <FormDescription>
                              Marca esta opción si deseas registrar a esta persona como delincuente
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      {!watchEsDelincuente && (
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Guardar
                        </Button>
                      )}
                      {watchEsDelincuente && (
                        <Button type="button" onClick={() => setActiveTab("delincuente")}>
                          Siguiente
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="delincuente">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Delincuente</CardTitle>
                    <CardDescription>Ingresa los datos del delincuente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fecha_alta_delincuente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Alta</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="border-white focus:border-white" />
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
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                                className="border-white focus:border-white"
                              />
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
                    </div>

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

                    <FormField
                      control={form.control}
                      name="registrar_estatus"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked)
                                if (checked) {
                                  setActiveTab("estatus")
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Registrar Estatus Penitenciario</FormLabel>
                            <FormDescription>
                              Marca esta opción si deseas registrar el estatus penitenciario del delincuente
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("persona")}>
                        Anterior
                      </Button>
                      <div className="space-x-2">
                        {!watchRegistrarEstatus && (
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                          </Button>
                        )}
                        {watchRegistrarEstatus && (
                          <Button type="button" onClick={() => setActiveTab("estatus")}>
                            Siguiente
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="estatus">
                <Card>
                  <CardHeader>
                    <CardTitle>Estatus Penitenciario</CardTitle>
                    <CardDescription>Ingresa la información penitenciaria del delincuente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Input placeholder="ID Celda" {...field} />
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
                              <Input type="date" {...field} className="border-white focus:border-white" />
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
                            <FormLabel>Fecha de Salida Prevista (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ""}
                                className="border-white focus:border-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="motivo_encarcelamiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo de Encarcelamiento</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe el motivo de encarcelamiento"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setActiveTab("delincuente")}>
                        Anterior
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </RoleGuard>
    </div>
  )
}
