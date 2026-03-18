"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Search, 
  ClipboardList, 
  Users, 
  MessageSquare,
  ChevronRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: Date
}

export function Criptobot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "¡Hola! Soy Criptobot, tu asistente inteligente de la Mesa Técnica. ¿En qué puedo ayudarte hoy? Puedo buscar consultas, mostrarte información de comités o guiarte por la plataforma.",
      timestamp: new Date()
    }
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      })

      if (!response.ok) throw new Error("Error en la comunicación con Criptobot")

      const data = await response.json()
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      toast.error("No pude procesar tu mensaje en este momento")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: "Estado de Consultas", icon: Search, command: "¿Cuál es el estado de mis consultas?" },
    { label: "Información de Comités", icon: Users, command: "Muéstrame información de los comités" },
    { label: "Nuevo Acuerdo", icon: ClipboardList, command: "¿Cómo registro un nuevo acuerdo?" }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[380px] h-[550px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Criptobot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">En línea</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <Avatar className="w-8 h-8 border border-slate-800">
                        <AvatarImage src={msg.role === "user" ? "/user-avatar.png" : ""} />
                        <AvatarFallback className={msg.role === "user" ? "bg-slate-800" : "bg-blue-600 text-white"}>
                          {msg.role === "user" ? "U" : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 items-center bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pensando...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length < 3 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {quickActions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(action.command)
                      // Trigger send automatically or just fill input? 
                      // For now just fill input.
                    }}
                    className="text-[10px] h-7 bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-full"
                  >
                    <action.icon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <div className="relative">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="bg-slate-900 border-slate-800 text-white pl-4 pr-12 h-12 rounded-2xl focus-visible:ring-blue-600"
                />
                <Button 
                  size="icon"
                  disabled={!input.trim() || loading}
                  onClick={handleSend}
                  className="absolute right-1 top-1 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
              <p className="text-[9px] text-center text-slate-500 mt-2 font-bold uppercase tracking-tighter">
                Criptobot v1.0 • Impulsado por IA
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? "bg-slate-800 rotate-90" : "bg-blue-600 hover:bg-blue-700 hover:scale-110"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Bot className="w-7 h-7 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-blue-600 rounded-full" />
          </div>
        )}
      </Button>
    </div>
  )
}
