"use client"

import { useState, useEffect } from "react"
import { 
  Hash, 
  Plus, 
  MessageSquare, 
  User, 
  Clock, 
  ChevronRight, 
  Search,
  MessageCircle,
  Eye,
  Filter,
  ArrowLeft,
  Send,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface ForoTema {
  id: string
  titulo: string
  contenido: string
  categoria: string
  autor: { nombre: string; imagenUrl?: string }
  _count: { posts: number }
  vistas: number
  createdAt: string
}

interface ForoPost {
  id: string
  contenido: string
  autor: { nombre: string; imagenUrl?: string }
  createdAt: string
}

export function ForoModule() {
  const [temas, setTemas] = useState<ForoTema[]>([])
  const [selectedTema, setSelectedTema] = useState<ForoTema | null>(null)
  const [posts, setPosts] = useState<ForoPost[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [showNewTopicForm, setShowNewTopicForm] = useState(false)
  const [newTopic, setNewTopic] = useState({ titulo: "", contenido: "", categoria: "General" })
  const [newReply, setNewReply] = useState("")

  useEffect(() => {
    loadTemas()
  }, [])

  const loadTemas = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/foro/temas")
      const data = await response.json()
      setTemas(data.data || [])
    } catch (error) {
      toast.error("Error al cargar los temas del foro")
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async (temaId: string) => {
    setPosts([])
    setLoading(true)
    try {
      const response = await fetch(`/api/foro/temas/${temaId}/posts`)
      const data = await response.json()
      setPosts(data.data || [])
    } catch (error) {
      toast.error("Error al cargar los comentarios")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTopic = async () => {
    if (!newTopic.titulo || !newTopic.contenido) {
      toast.error("Debe completar todos los campos")
      return
    }

    try {
      const response = await fetch("/api/foro/temas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTopic)
      })
      if (response.ok) {
        toast.success("Tema creado correctamente")
        setShowNewTopicForm(false)
        setNewTopic({ titulo: "", contenido: "", categoria: "General" })
        loadTemas()
      }
    } catch (error) {
      toast.error("No se pudo crear el tema")
    }
  }

  const handleReply = async () => {
    if (!newReply || !selectedTema) return

    try {
      const response = await fetch(`/api/foro/temas/${selectedTema.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: newReply })
      })
      if (response.ok) {
        setNewReply("")
        loadPosts(selectedTema.id)
        toast.success("Respuesta enviada")
      }
    } catch (error) {
      toast.error("No se pudo enviar la respuesta")
    }
  }

  if (selectedTema) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => setSelectedTema(null)}>
            <ArrowLeft className="w-4 h-4" /> Volver al Foro
          </Button>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              {selectedTema.categoria}
            </Badge>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-white">{selectedTema.titulo}</CardTitle>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {selectedTema.autor.nombre}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(selectedTema.createdAt), { addSuffix: true, locale: es })}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedTema.contenido}</p>
          </CardContent>
        </Card>

        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#C5A059]" /> Respuestas ({posts.length})
          </h3>
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="bg-slate-950/50 border-slate-800">
                <CardContent className="p-4 flex gap-4">
                  <Avatar className="w-10 h-10 border border-slate-800">
                    <AvatarFallback className="bg-slate-800 text-slate-400">
                      {post.autor.nombre[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{post.autor.nombre}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{post.contenido}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900 border-slate-800 mt-6 overflow-hidden">
            <CardContent className="p-0">
              <Textarea 
                placeholder="Escribe tu respuesta..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="border-none bg-transparent h-32 resize-none focus-visible:ring-0 p-4 text-white"
              />
            </CardContent>
            <CardFooter className="p-3 bg-slate-950/50 border-t border-slate-800 flex justify-end">
              <Button 
                onClick={handleReply}
                className="bg-[#C5A059] hover:bg-[#A68040] text-white font-bold gap-2"
              >
                Publicar Respuesta <Send className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Hash className="w-8 h-8 text-[#C5A059]" /> Foro Comunitario
          </h2>
          <p className="text-slate-400">Espacio de discusión técnica y regulatoria</p>
        </div>
        <Button 
          onClick={() => setShowNewTopicForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black gap-2 h-11 px-6 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
        >
          <Plus className="w-5 h-5" /> Iniciar Nuevo Tema
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Buscar en el foro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-white"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-slate-900 border-slate-800">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="tecnica">Técnica</SelectItem>
            <SelectItem value="fiscal">Fiscal</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : temas.length === 0 ? (
          <Card className="bg-slate-950 border-dashed border-slate-800 py-20">
            <div className="text-center flex flex-col items-center gap-4">
              <MessageSquare className="w-12 h-12 text-slate-700" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No hay temas publicados todavía</p>
              <Button variant="ghost" className="text-blue-500 font-bold" onClick={() => setShowNewTopicForm(true)}>Sé el primero en participar</Button>
            </div>
          </Card>
        ) : (
          temas.map((tema) => (
            <Card 
              key={tema.id} 
              className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
              onClick={() => {
                setSelectedTema(tema)
                loadPosts(tema.id)
              }}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Hash className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {tema.titulo}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {tema.autor.nombre}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(tema.createdAt), { addSuffix: true, locale: es })}
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">
                        {tema.categoria}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-slate-400">
                  <div className="text-center">
                    <p className="text-white font-black text-sm">{tema._count.posts}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest">Respuestas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-sm">{tema.vistas}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest">Vistas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showNewTopicForm} onOpenChange={setShowNewTopicForm}>
        <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-500" /> Nuevo Tema de Discusión
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Inicia una conversación con la comunidad técnica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título del Tema</Label>
              <Input 
                placeholder="Ej: Dudas sobre la nueva providencia de minería"
                value={newTopic.titulo}
                onChange={(e) => setNewTopic({ ...newTopic, titulo: e.target.value })}
                className="bg-slate-900 border-slate-800 focus-visible:ring-blue-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select 
                  value={newTopic.categoria} 
                  onValueChange={(v) => setNewTopic({ ...newTopic, categoria: v })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Técnica">Técnica</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Fiscal">Fiscal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea 
                placeholder="Describe el tema o pregunta detalladamente..."
                rows={6}
                value={newTopic.contenido}
                onChange={(e) => setNewTopic({ ...newTopic, contenido: e.target.value })}
                className="bg-slate-900 border-slate-800 focus-visible:ring-blue-600 resize-none text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewTopicForm(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreateTopic}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8"
            >
              Crear Tema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
