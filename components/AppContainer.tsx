'use client'

import React, { useState, useEffect } from 'react'
import { Home, Bell, Briefcase, Phone, MoreHorizontal, Share2, Info, LogOut, Settings, MessageSquare, Shield, FileText, User, Trash2, Calendar, MapPin, ChevronRight, Plus, Users, AlertCircle, X, Camera, Send, Mail, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Logo, SubLogo } from './Logo'
import Image from 'next/image'
import { supabase, getSupabaseConfig } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Types
type Aviso = {
  id: string
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  address?: string
  isNew?: boolean
  icon?: any
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  // Convert YYYY-MM-DD to DD/MM/YYYY
  const regex = /^(\d{4})-(\d{2})-(\d{2})/;
  const match = dateStr.match(regex);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return dateStr;
};

type Screen = 'home' | 'avisos' | 'servicos' | 'contato' | 'mais' | 'admin-login' | 'admin-dashboard' | 'compartilhar' | 'sobre'

export default function AppContainer() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('ouvidoria@comunidade.com.br')
  const [adminPhone, setAdminPhone] = useState('(11) 0800-123-456')
  const [adminWhatsapp, setAdminWhatsapp] = useState('(11) 98765-4321')
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [stats, setStats] = useState({
    atendimentos: '1.240+',
    documentos: '3.800+',
    animais: '950+',
    familias: '5.000+',
    limpeza: '120+'
  })
  const [avisos, setAvisos] = useState<Aviso[]>([
    { id: '1', title: "Vacinação", description: "Leve o documento de identificação e a carteira de vacinação.", date: "02/06/2024", startTime: "08:00", endTime: "17:00", isNew: true, icon: Calendar, address: "Posto de Saúde Central" },
    { id: '2', title: "Reunião Comunitária", description: "Teremos uma reunião para discutir melhorias no bairro. Participe!", date: "25/05/2024", startTime: "19:00", endTime: "21:00", icon: Users, address: "Rua das Flores, 123" },
    { id: '3', title: "Mutirão de Limpeza", description: "Participe do mutirão de limpeza na praça central.", date: "22/05/2024", startTime: "08:00", endTime: "13:00", icon: Trash2, address: "Praça Central" },
  ])

  const [appContent, setAppContent] = useState({
    historia: 'Um aplicativo feito para aproximar as pessoas, informar e facilitar o acesso a serviços importantes para a nossa comunidade.',
    missao: 'Aproximar a gestão da comunidade dos seus membros, promovendo transparência e facilidade.',
    privacidade: 'Seus dados são protegidos e utilizados apenas para as finalidades do aplicativo.',
    termos: 'Ao usar o app, você concorda com nossas regras de convivência e participação.',
    desenvolvedor: 'Desenvolvido com carinho pela equipe da Comunidade.',
    heroImage: 'https://picsum.photos/seed/community_logo/320/320',
    networkImage: 'https://picsum.photos/seed/network_action/400/400',
    networkTitle: 'PARTICIPE DA NOSSA REDE!',
    networkDesc: 'Faça parte das decisões que mudam nossa realidade.'
  })

  // Supabase Data Sync
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch Settings
        const { data: settings, error: settingsError } = await supabase.from('settings').select('*')
        if (!settingsError && settings) {
          settings.forEach(s => {
            if (s.key === 'admin_contacts') {
                setAdminEmail(s.value.email)
                setAdminPhone(s.value.phone)
                setAdminWhatsapp(s.value.whatsapp)
            }
            if (s.key === 'app_stats') setStats(s.value)
            if (s.key === 'app_content') setAppContent(s.value)
          })
        }

        // Fetch Avisos
        const { data: avisosData, error: avisosError } = await supabase.from('avisos').select('*').order('created_at', { ascending: false })
        if (!avisosError && avisosData) {
          setAvisos(avisosData.map(a => ({
            ...a,
            startTime: a.startTime || a.start_time,
            endTime: a.endTime || a.end_time,
            isNew: a.isNew !== undefined ? a.isNew : a.is_new,
            icon: a.icon === 'Calendar' ? Calendar : a.icon === 'Users' ? Users : a.icon === 'Trash2' ? Trash2 : Bell
          })))
        }

        // Check Auth
        const { data: authData } = await supabase.auth.getSession()
        if (authData?.session) setIsAdmin(true)

      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            setIsAdmin(true)
        } else {
            setIsAdmin(false)
        }
    })

    const subscription = authListener?.subscription

    // Real-time listener for new avisos
    const avisosChannel = supabase
        .channel('public:avisos')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avisos' }, (payload) => {
            const raw = payload.new as any
            const newAviso: Aviso = {
                ...raw,
                startTime: raw.startTime || raw.start_time,
                endTime: raw.endTime || raw.end_time,
                isNew: raw.isNew !== undefined ? raw.isNew : raw.is_new,
                icon: raw.icon === 'Calendar' ? Calendar : raw.icon === 'Users' ? Users : raw.icon === 'Trash2' ? Trash2 : Bell
            }
            setAvisos(prev => {
                if (prev.some(a => a.id === newAviso.id)) return prev
                return [newAviso, ...prev]
            })
            setHasNewNotification(true)
            setNotification({ type: 'info', message: `Novo Aviso: ${newAviso.title}` })
        })
        .subscribe()

    return () => {
        subscription?.unsubscribe()
        if (avisosChannel) supabase.removeChannel(avisosChannel)
    }
  }, []) // Run once on mount

  // Auto-clear notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const addAviso = async (novo: Omit<Aviso, 'id'>) => {
    try {
      // 1. Tenta a inserção completa (com todas as colunas novas)
      let { data, error } = await supabase.from('avisos').insert([{
          title: novo.title,
          description: novo.description,
          date: novo.date,
          startTime: novo.startTime,
          endTime: novo.endTime,
          address: novo.address,
          isNew: true,
          icon: 'Bell'
      }]).select()

      if (error) {
          // Fallback para nomes de colunas alternativos (snake_case)
          console.warn("Primeira tentativa falhou, tentando nomes alternativos...", error);
          const { data: altData, error: altError } = await supabase.from('avisos').insert([{
            title: novo.title,
            description: novo.description,
            date: novo.date,
            start_time: novo.startTime,
            end_time: novo.endTime,
            address: novo.address,
            is_new: true,
            icon: 'Bell'
          }]).select()

          if (altError) {
              // Se o erro for "coluna não encontrada", tentamos salvar apenas o básico
              if (altError.code === 'PGRST204' || altError.message?.includes('column')) {
                  console.warn("Colunas estendidas não encontradas. Salvando apenas campos básicos...");
                  const { data: basicData, error: basicError } = await supabase.from('avisos').insert([{
                      title: novo.title,
                      description: novo.description,
                      date: novo.date
                  }]).select()
                  
                  if (basicError) throw basicError
                  
                  if (basicData && basicData[0]) {
                      const insertedAviso: Aviso = {
                          ...basicData[0],
                          icon: Bell,
                          isNew: true
                      }
                      setAvisos(prev => [insertedAviso, ...prev])
                      setNotification({ type: 'info', message: 'Aviso básico publicado. Execute o SQL para habilitar horários.' })
                      return true
                  }
              }
              throw altError
          }
          if (altData) {
            data = altData
          }
      }

      if (data && data[0]) {
          const insertedAviso: Aviso = {
              ...data[0],
              startTime: data[0].start_time || data[0].startTime,
              endTime: data[0].end_time || data[0].endTime,
              isNew: data[0].is_new !== undefined ? data[0].is_new : data[0].isNew,
              icon: data[0].icon === 'Calendar' ? Calendar : data[0].icon === 'Users' ? Users : data[0].icon === 'Trash2' ? Trash2 : Bell
          }
          setAvisos(prev => [insertedAviso, ...prev.filter(a => a.id !== insertedAviso.id)])
          setNotification({ type: 'success', message: 'Aviso publicado com sucesso!' })
          return true
      }
      return false
    } catch (err: any) {
      console.error("Erro ao publicar aviso:", err)
      const errorMessage = err.message || 'Erro inesperado ao salvar no banco de dados.';
      setNotification({ type: 'error', message: `Falha na publicação: ${errorMessage}` })
      return false
    }
  }

  const updateSettings = async (key: string, value: any) => {
    const { error } = await supabase.from('settings').upsert({ key, value })
    if (error) console.error(`Error updating ${key}:`, error)
  }

  const markAvisoAsRead = async (id: string) => {
    // Try camelCase first, then snake_case if it fails
    const { error } = await supabase.from('avisos').update({ isNew: false }).eq('id', id)
    if (error && (error.code === 'PGRST204' || error.message.includes('column'))) {
        await supabase.from('avisos').update({ is_new: false }).eq('id', id)
    }
    setAvisos(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a))
  }

  const handleOpenAviso = (aviso: Aviso) => {
    setSelectedAviso(aviso)
    if (aviso.isNew) {
        markAvisoAsRead(aviso.id)
    }
  }

  const handleUpdateAppContent = (val: any) => {
    setAppContent(val)
    updateSettings('app_content', val)
  }

  const handleUpdateStats = (val: any) => {
    setStats(val)
    updateSettings('app_stats', val)
  }

  const handleUpdateContacts = (val: { email: string, phone: string, whatsapp: string }) => {
    setAdminEmail(val.email)
    setAdminPhone(val.phone)
    setAdminWhatsapp(val.whatsapp)
    updateSettings('admin_contacts', val)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentScreen('home')
  }

  const deleteAviso = async (id: string) => {
    const { error } = await supabase.from('avisos').delete().eq('id', id)
    if (!error) {
        setAvisos(avisos.filter(a => a.id !== id))
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen onNavigate={setCurrentScreen} avisos={avisos} onOpenAviso={handleOpenAviso} content={appContent} hasAlert={hasNewNotification} clearAlert={() => setHasNewNotification(false)} />
      case 'avisos': return <AvisosScreen avisos={avisos} onOpenAviso={handleOpenAviso} />
      case 'servicos': return <ServicosScreen stats={stats} />
      case 'contato': return <ContatoScreen adminEmail={adminEmail} adminPhone={adminPhone} adminWhatsapp={adminWhatsapp} setNotification={setNotification} />
      case 'mais': return <MaisScreen onNavigate={setCurrentScreen} content={appContent} />
      case 'compartilhar': return <CompartilharScreen onNavigate={setCurrentScreen} />
      case 'sobre': return <SobreScreen onNavigate={setCurrentScreen} content={appContent} />
      case 'admin-login': return <AdminLoginScreen onNavigate={setCurrentScreen} adminPhone={adminPhone} />
      case 'admin-dashboard': return <AdminDashboardScreen onNavigate={setCurrentScreen} onAddAviso={addAviso} onDeleteAviso={deleteAviso} avisos={avisos} stats={stats} onUpdateStats={handleUpdateStats} adminEmail={adminEmail} adminPhone={adminPhone} adminWhatsapp={adminWhatsapp} appContent={appContent} setAppContent={handleUpdateAppContent} onSyncContacts={handleUpdateContacts} onLogout={handleLogout} />
      default: return <HomeScreen onNavigate={setCurrentScreen} avisos={avisos} onOpenAviso={handleOpenAviso} content={appContent} />
    }
  }

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-primary">
            <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mb-4"
            >
                <Plus size={48} strokeWidth={3} />
            </motion.div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Carregando Comunidade...</p>
        </div>
    )
  }

  const showNav = !['admin-login', 'admin-dashboard'].includes(currentScreen)

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-slate-50 overflow-hidden shadow-2xl relative font-sans">
      {/* Global Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 shadow-2xl flex items-center gap-3 w-[90%] max-w-sm border-l-4",
              notification.type === 'success' ? "bg-white border-green-500 text-slate-800" :
              notification.type === 'error' ? "bg-white border-red-500 text-slate-800" : 
              "bg-white border-primary text-slate-800"
            )}
          >
            {notification.type === 'success' ? <Shield className="text-green-500" size={18} /> : 
             notification.type === 'error' ? <AlertCircle className="text-red-500" size={18} /> : 
             <Info className="text-primary" size={18} />}
            <p className="text-xs font-bold uppercase tracking-tight flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="text-slate-300 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aviso Details Dialog (The "Balloon") */}
      <Dialog open={!!selectedAviso} onOpenChange={(open) => !open && setSelectedAviso(null)}>
        <DialogContent className="sm:max-w-[320px] !rounded-none p-0 overflow-hidden border border-slate-100 shadow-2xl" showCloseButton={false}>
            {selectedAviso && (
                <div className="animate-in zoom-in-95 duration-300 bg-white">
                    <div className="p-8 pt-10 flex flex-col items-center text-center space-y-4">
                        <div className="p-5 bg-slate-50 text-slate-400 !rounded-none">
                            {selectedAviso.icon ? <selectedAviso.icon size={32} strokeWidth={1.5} /> : <AlertCircle size={32} strokeWidth={1.5} />}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight italic">{selectedAviso.title}</h2>
                            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">Comunicado oficial</p>
                        </div>
                    </div>
                    
                    <div className="p-8 pt-0 space-y-6 flex flex-col items-center text-center">
                        <div className="space-y-2">
                            <p className="text-slate-500 font-medium leading-relaxed italic text-base">
                                &quot;{selectedAviso.description}&quot;
                            </p>
                        </div>

                        <div className="w-full space-y-4">
                             <div className="flex flex-col items-center">
                                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">Data e Período</p>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">
                                        {formatDate(selectedAviso.date)}
                                        {selectedAviso.startTime && selectedAviso.endTime && (
                                            <span className="block text-[10px] text-primary mt-1">
                                                Das {selectedAviso.startTime} às {selectedAviso.endTime}
                                            </span>
                                        )}
                                    </p>
                             </div>

                             {selectedAviso.address && (
                                <div className="flex flex-col items-center">
                                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">Localização</p>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{selectedAviso.address}</p>
                                </div>
                             )}
                        </div>

                        <Button 
                            className="h-12 w-12 rounded-full font-black shadow-lg shadow-slate-200/50 p-0 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary transition-all active:scale-95"
                            onClick={() => setSelectedAviso(null)}
                        >
                            <X size={24} />
                        </Button>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
          <NavButton icon={Home} label="Home" active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} />
          <NavButton icon={Bell} label="Avisos" active={currentScreen === 'avisos'} isAlert={hasNewNotification} onClick={() => {
            setCurrentScreen('avisos')
            setHasNewNotification(false)
          }} />
          <NavButton icon={Briefcase} label="Serviços" active={currentScreen === 'servicos'} onClick={() => setCurrentScreen('servicos')} />
          <NavButton icon={Phone} label="Contato" active={currentScreen === 'contato'} onClick={() => setCurrentScreen('contato')} />
          <NavButton icon={MoreHorizontal} label="Mais" active={currentScreen === 'mais' || currentScreen === 'sobre' || currentScreen === 'compartilhar'} onClick={() => setCurrentScreen('mais')} />
        </nav>
      )}
    </div>
  )
}

function NavButton({ icon: Icon, label, active, isAlert, onClick }: { icon: any, label: string, active: boolean, isAlert?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all active:scale-95 relative",
        active ? "text-primary" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className="relative">
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {isAlert && (
            <motion.span 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                    boxShadow: [
                        '0 0 0 0px rgba(85, 101, 240, 0.4)',
                        '0 0 0 10px rgba(85, 101, 240, 0)',
                        '0 0 0 0px rgba(85, 101, 240, 0)'
                    ]
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border border-white z-10" 
            />
        )}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 rounded-none bg-primary" />}
    </button>
  )
}

// --- Screens ---
function HomeScreen({ onNavigate, avisos, onOpenAviso, content, hasAlert, clearAlert }: { onNavigate: (s: Screen) => void, avisos: Aviso[], onOpenAviso: (a: Aviso) => void, content: any, hasAlert?: boolean, clearAlert?: () => void }) {
  const recentAvisos = avisos.slice(0, 1) 
  const hasNewAvisos = avisos.some(a => a.isNew)

  return (
    <div className="bg-white w-full min-h-full animate-in fade-in duration-500 pb-24 relative">
      {/* Top Header - Logo Centered with Pulse Icon */}
      <div className="p-6 pt-12 flex flex-col items-center space-y-6">
        <div className="relative w-full flex justify-center">
            {content.heroImage ? (
                <div className="relative w-56 h-56 group">
                   <Image 
                     src={content.heroImage} 
                     alt="Community Logo" 
                     fill 
                     className="object-contain drop-shadow-2xl"
                     referrerPolicy="no-referrer"
                   />
                </div>
            ) : (
                <Logo className="w-56 h-56 drop-shadow-2xl" color="#5565F0" />
            )}
            
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "text-primary bg-slate-50 border border-slate-100 !rounded-none h-12 w-12 transition-all absolute right-0 top-0",
                    hasAlert && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => {
                    onNavigate('avisos')
                    clearAlert?.()
                }}
            >
                <div className="relative">
                    <motion.div
                        animate={hasAlert ? { rotate: [-10, 10, -10, 10, 0] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                        <Bell size={24} />
                    </motion.div>
                    {(hasNewAvisos || hasAlert) && (
                        <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.9, 1]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-sm z-50 overflow-visible"
                        >
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </motion.span>
                    )}
                </div>
            </Button>
        </div>
      </div>

      <div className="px-6 space-y-8">
        {/* Welcome Message */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Novidades e Informações</h1>
          <p className="text-slate-400 text-xs font-medium">Acompanhe as últimas atualizações do seu bairro.</p>
        </div>

        {/* Main Marketing Banner */}
        <div className={cn(
            "relative !rounded-none overflow-hidden p-6 text-white min-h-[180px] flex items-center shadow-lg shadow-blue-200 group transition-all",
            content.networkImage ? "bg-white" : "bg-primary"
        )}>
          {content.networkImage && (
            <div className="absolute inset-0">
                <Image 
                    src={content.networkImage} 
                    alt="Network Background" 
                    fill
                    className="object-cover" 
                    referrerPolicy="no-referrer"
                />
            </div>
          )}
          
          {!content.networkImage && (
            <>
                <div className="relative z-10 space-y-3 max-w-[65%]">
                    <h2 className="text-2xl font-black uppercase leading-[1] tracking-tighter drop-shadow-md">
                        {content.networkTitle}
                    </h2>
                    <p className="text-blue-50 text-[10px] font-medium leading-tight max-w-[90%] drop-shadow-sm">
                        {content.networkDesc}
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 w-[45%] h-full">
                    <Image 
                        src="https://picsum.photos/seed/community_action/400/400" 
                        alt="Community Group" 
                        fill
                        className="object-contain object-bottom p-2 opacity-90" 
                        referrerPolicy="no-referrer"
                    />
                </div>
            </>
          )}
        </div>

        {/* Quick Access */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 tracking-tight">Acesso rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAccessIcon icon={Bell} label="Avisos" color="text-primary" onClick={() => onNavigate('avisos')} />
            <QuickAccessIcon icon={Calendar} label="Serviços" color="text-primary" onClick={() => onNavigate('servicos')} />
            <QuickAccessIcon icon={Phone} label="Contato" color="text-primary" onClick={() => onNavigate('contato')} />
            <QuickAccessIcon icon={Share2} label="Compartilhar" color="text-primary" onClick={() => onNavigate('compartilhar')} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 tracking-tight">Avisos recentes</h3>
            <Button variant="link" className="text-primary p-0 h-auto text-xs font-bold" onClick={() => onNavigate('avisos')}>Ver todos</Button>
          </div>
          {recentAvisos.length > 0 ? (
          <AlertCard 
            icon={recentAvisos[0].icon || Calendar} 
            title={recentAvisos[0].title} 
            description={recentAvisos[0].description} 
            date={recentAvisos[0].date}
            startTime={recentAvisos[0].startTime}
            endTime={recentAvisos[0].endTime}
            isNew={recentAvisos[0].isNew}
            onClick={() => onOpenAviso(recentAvisos[0])}
          />
          ) : (
            <p className="text-slate-400 text-xs text-center py-4">Nenhum aviso no momento.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function AvisosScreen({ avisos, onOpenAviso }: { avisos: Aviso[], onOpenAviso: (a: Aviso) => void }) {
  return (
    <div className="bg-white w-full min-h-full p-6 pt-10 space-y-6 pb-24 scrollbar-hide">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Avisos</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Fique por dentro</p>
      </div>
      <div className="space-y-4">
        {avisos.length > 0 ? avisos.map((aviso, idx) => (
          <AlertCard 
            key={aviso.id || idx}
            icon={aviso.icon || Users}
            title={aviso.title}
            description={aviso.description}
            date={aviso.date}
            startTime={aviso.startTime}
            endTime={aviso.endTime}
            isNew={aviso.isNew}
            onClick={() => onOpenAviso(aviso)}
          />
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
            <Bell size={48} className="opacity-20" />
            <p className="font-medium text-sm">Nenhum aviso cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ServicosScreen({ stats }: { stats: any }) {
  const services = [
    { title: "Atendimento Odontológico", desc: "Consultas, extrações e orientações de saúde bucal gratuitas para toda a comunidade.", icon: Shield, color: "bg-blue-600", stat: stats.atendimentos, statLabel: "atendimentos", items: ["Consultas e avaliações", "Extrações dentárias", "Orientação de higiene bucal", "Encaminhamentos especializados"] },
    { title: "Emissão de Documentos", desc: "Auxílio na obtenção de RG, CPF, Certidão de Nascimento e outros documentos essenciais.", icon: FileText, color: "bg-indigo-600", stat: stats.documentos, statLabel: "documentos", items: ["RG (Registro Geral)", "CPF (Cadastro de Pessoa Física)", "Certidão de Nascimento", "Carteira de Trabalho", "Título de Eleitor"] },
    { title: "Vacinação Animal", desc: "Vacinação antirrábica e orientação veterinária para cães e gatos da comunidade.", icon: Users, color: "bg-purple-600", stat: stats.animais, statLabel: "animais", items: ["Vacina antirrábica", "Vermifugação", "Orientação veterinária", "Castração (encaminhamento)"] },
    { title: "Limpeza de Ruas e Canaletas", desc: "Mutirões de limpeza e desobstrução de canaletas para prevenir enchentes e doenças.", icon: Trash2, color: "bg-cyan-600", stat: stats.limpeza, statLabel: "ruas atendidas", items: ["Limpeza de ruas e calçadas", "Desobstrução de canaletas", "Retirada de entulho", "Capina e roçagem", "Prevenção de enchentes"] },
    { title: "Outros Serviços Sociais", desc: "Ações diversas de apoio à comunidade, incluindo cestas básicas, orientação jurídica e mais.", icon: Briefcase, color: "bg-pink-600", stat: stats.familias, statLabel: "famílias", items: ["Distribuição de cestas básicas", "Orientação jurídica", "Encaminhamento para CRAS", "Apoio a idosos e PCDs", "Eventos culturais e esportivos"] },
  ]

  return (
    <div className="bg-white w-full min-h-full p-6 pt-10 space-y-6 animate-in fade-in duration-500 pb-24 scrollbar-hide">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Serviços</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Para a nossa comunidade</p>
      </div>
      
      {/* Key Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50/50 p-3 !rounded-none border border-blue-100/50 flex flex-col items-center text-center">
            <span className="text-xs font-black text-blue-600">{stats.atendimentos}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pacientes</span>
        </div>
        <div className="bg-indigo-50/50 p-3 !rounded-none border border-indigo-100/50 flex flex-col items-center text-center">
            <span className="text-xs font-black text-indigo-600">{stats.documentos}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Documentos</span>
        </div>
        <div className="bg-purple-50/50 p-3 !rounded-none border border-purple-100/50 flex flex-col items-center text-center">
            <span className="text-xs font-black text-purple-600">{stats.animais}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">Animais</span>
        </div>
      </div>

      <div className="space-y-4">
        {services.map((service, idx) => (
          <Card key={idx} className="border border-slate-100 bg-white text-slate-800 shadow-sm overflow-hidden !rounded-none group relative">
            <CardContent className="p-7 space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 !rounded-none", service.color, "bg-opacity-10")}>
                  <service.icon size={22} className={cn(service.color.replace('bg-', 'text-'))} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-lg leading-tight tracking-tight">{service.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-50 px-2 py-0.5 !rounded-none text-[10px] font-black text-primary uppercase tracking-tighter border border-slate-100">
                        {service.stat} {service.statLabel}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed italic pr-4">
                {service.desc}
              </p>

              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">O que oferecemos:</p>
                <div className="grid grid-cols-1 gap-1.5 pl-1">
                    {service.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={cn("w-1 h-1 rounded-none", service.color)} />
                            <span className="text-[10px] font-bold text-slate-600 leading-none">{item}</span>
                        </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/10 p-6 !rounded-none mt-8 flex items-center gap-4 border border-primary/5">
        <div className="p-3 bg-primary text-white !rounded-none rotate-12">
            <Bell size={24} />
        </div>
        <div>
            <p className="text-xs font-bold text-primary leading-tight">Fique atento aos avisos para saber quando os próximos serviços acontecerão no seu bairro!</p>
        </div>
      </div>
    </div>
  )
}

function ContatoScreen({ adminEmail, adminPhone, adminWhatsapp, setNotification }: { adminEmail: string, adminPhone: string, adminWhatsapp: string, setNotification: (n: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [formData, setFormData] = useState({
    solicitacao: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: ''
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.solicitacao.trim() || formData.solicitacao.trim().length < 5) {
      newErrors.solicitacao = "A descrição precisa ter pelo menos 5 caracteres."
    }
    if (!formData.telefone.trim() && !formData.whatsapp.trim() && !formData.email.trim()) {
      newErrors.contato = "Por favor, informe pelo menos uma forma de contato."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
        setErrors(prev => {
            const next = { ...prev }
            delete next[field]
            return next
        })
    }
    if (errors.contato && (field === 'telefone' || field === 'whatsapp' || field === 'email')) {
        setErrors(prev => {
            const next = { ...prev }
            delete next.contato
            return next
        })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            setNotification({ type: 'error', message: "Arquivo muito grande. Máximo 5MB." })
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
        setNotification({ type: 'error', message: "Verifique os erros no formulário." })
        return
    }

    setLoading(true)
    
    try {
        const { error } = await supabase.from('contatos').insert([
            {
                solicitacao: formData.solicitacao,
                telefone: formData.telefone,
                whatsapp: formData.whatsapp,
                email: formData.email,
                endereco: formData.endereco,
                photo: photoPreview
            }
        ])

        if (error) throw error

        // Enviar E-mail via API
        try {
            const emailResponse = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: adminEmail,
                    subject: `Nova Solicitação: ${formData.solicitacao.substring(0, 30)}...`,
                    data: {
                        solicitacao: formData.solicitacao,
                        telefone: formData.telefone,
                        whatsapp: formData.whatsapp,
                        email: formData.email,
                        endereco: formData.endereco,
                        photo: photoPreview
                    }
                })
            })
            
            if (!emailResponse.ok) {
                const errData = await emailResponse.json()
                console.warn("E-mail não pôde ser enviado, mas os dados foram salvos no banco:", errData)
                setNotification({ type: 'info', message: "Mensagem enviada com sucesso ao banco de dados." })
            } else {
                setNotification({ type: 'success', message: "Solicitação enviada com sucesso! O administrador foi notificado." })
            }
        } catch (emailErr) {
            console.error("Erro na rede ao tentar enviar e-mail:", emailErr)
            setNotification({ type: 'info', message: "Solicitação salva com sucesso (Notificação via e-mail pendente)." })
        }

        setFormData({ solicitacao: '', telefone: '', whatsapp: '', email: '', endereco: '' })
        setPhotoPreview(null)
        setErrors({})
    } catch (err: any) {
        console.error("Error sending contact:", err)
        setNotification({ type: 'error', message: `Falha no envio: ${err.message}` })
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="bg-white w-full min-h-full p-6 pt-10 space-y-6 animate-in fade-in duration-500 pb-24 scrollbar-hide">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Contato</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Fale conosco, envie sua solicitação</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição da Solicitação</label>
            <textarea 
                required
                className={`w-full !rounded-none bg-white border ${errors.solicitacao ? 'border-red-500' : 'border-slate-100'} p-5 text-sm focus:ring-2 focus:ring-primary outline-none shadow-sm min-h-[120px] italic text-slate-600`}
                placeholder="Descreva aqui o que você precisa..."
                value={formData.solicitacao}
                onChange={(e) => handleInputChange('solicitacao', e.target.value)}
            />
            {errors.solicitacao && (
                <p className="text-[10px] text-red-500 font-bold ml-1">{errors.solicitacao}</p>
            )}
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anexo (Foto)</label>
            <div className="relative flex items-center justify-center border-2 border-dashed border-slate-200 !rounded-none overflow-hidden min-h-[160px] hover:border-primary transition-colors cursor-pointer group bg-white">
                <input type="file" className="hidden" id="photo-upload" accept="image/*" onChange={handleFileChange} />
                <label htmlFor="photo-upload" className="flex flex-col items-center gap-3 cursor-pointer w-full h-full p-8 text-center px-4">
                    {photoPreview ? (
                        <div className="absolute inset-0 w-full h-full">
                            <Image 
                                src={photoPreview} 
                                alt="Preview" 
                                fill 
                                className="object-cover" 
                                referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={32} className="text-white" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-slate-50 text-slate-400 !rounded-none group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Camera size={32} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Toque para tirar ou anexar foto</span>
                        </>
                    )}
                </label>
            </div>
        </div>

        <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-1">Seus Dados de Contato</h4>
                {errors.contato && (
                    <p className="text-[10px] text-red-500 font-bold ml-1">{errors.contato}</p>
                )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <ContactInput icon={Phone} placeholder="Seu Telefone" value={formData.telefone} onChange={(v) => handleInputChange('telefone', v)} hasError={!!errors.contato} />
                <ContactInput icon={MessageSquare} placeholder="Seu WhatsApp" value={formData.whatsapp} onChange={(v) => handleInputChange('whatsapp', v)} hasError={!!errors.contato} />
                <ContactInput icon={Mail} placeholder="Seu E-mail" value={formData.email} onChange={(v) => handleInputChange('email', v)} hasError={!!errors.contato} />
                <ContactInput icon={MapPin} placeholder="Seu Endereço / Referência" value={formData.endereco} onChange={(v) => handleInputChange('endereco', v)} />
            </div>
        </div>

        <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 !rounded-none font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-blue-100 mt-4 active:scale-95 transition-all"
        >
            {loading ? 'Enviando...' : 'Enviar Agora'}
            {!loading && <Send size={20} className="ml-2" />}
        </Button>
      </form>

      <div className="pt-4 space-y-4">
        <h3 className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Canais Oficiais</h3>
        <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-4 bg-white/50 p-4 !rounded-none border border-slate-100 shadow-sm">
                <div className="p-2 bg-blue-50 text-primary !rounded-none">
                    <Phone size={18} />
                </div>
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Telefone de Contato</p>
                    <p className="text-xs font-bold text-slate-700">{adminPhone}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 bg-white/50 p-4 !rounded-none border border-slate-100 shadow-sm">
                <div className="p-2 bg-green-50 text-green-600 !rounded-none">
                    <MessageSquare size={18} />
                </div>
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Ouvidoria</p>
                    <p className="text-xs font-bold text-slate-700">{adminWhatsapp}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function ContactInput({ icon: Icon, placeholder, value, onChange, hasError }: { icon: any, placeholder: string, value: string, onChange: (v: string) => void, hasError?: boolean }) {
    return (
        <div className="relative group">
            <div className={`absolute left-5 top-1/2 -translate-y-1/2 ${hasError ? 'text-red-300' : 'text-slate-300'} group-focus-within:text-primary transition-colors`}>
                <Icon size={18} />
            </div>
            <input 
                className={`w-full h-14 pl-14 pr-6 !rounded-none bg-white border ${hasError ? 'border-red-200 ring-1 ring-red-50' : 'border-slate-100'} text-sm font-medium focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all`}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}

function MaisScreen({ onNavigate, content }: { onNavigate: (s: Screen) => void, content: any }) {
  return (
    <div className="bg-white w-full min-h-full p-6 pt-10 space-y-8 animate-in fade-in duration-500 pb-24 scrollbar-hide">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Mais</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Acesso e Configurações</p>
      </div>

      <div className="space-y-2">
        <div className="bg-slate-50/50 !rounded-none p-2 space-y-1">
            <Dialog>
                <DialogTrigger 
                    nativeButton={false}
                    render={<MenuButton icon={Info} label="Nossa História" />}
                />
                <DialogContent className="sm:max-w-md !rounded-none p-8 text-center items-center justify-center flex flex-col">
                    <DialogHeader className="w-full flex items-center justify-center">
                        <DialogTitle className="text-xl font-bold text-center italic uppercase tracking-tighter">Nossa História</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4 text-slate-600 italic text-sm leading-relaxed text-center px-2">
                        &quot;{content.historia}&quot;
                    </div>
                </DialogContent>
            </Dialog>
            
            <Dialog>
                <DialogTrigger 
                    nativeButton={false}
                    render={<MenuButton icon={Users} label="Missão" />}
                />
                <DialogContent className="sm:max-w-md !rounded-none p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center italic uppercase tracking-tighter">Nossa Missão</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4 text-slate-600 italic text-sm leading-relaxed text-center">
                        &quot;{content.missao}&quot;
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger 
                    nativeButton={false}
                    render={<MenuButton icon={Shield} label="Política de Privacidade" />}
                />
                <DialogContent className="sm:max-w-md !rounded-none p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center italic uppercase tracking-tighter">Privacidade</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4 text-slate-600 italic text-sm leading-relaxed text-center">
                        &quot;{content.privacidade}&quot;
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger 
                    nativeButton={false}
                    render={<MenuButton icon={FileText} label="Termo de Uso" />}
                />
                <DialogContent className="sm:max-w-md !rounded-none p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center italic uppercase tracking-tighter">Termos de Uso</DialogTitle>
                    </DialogHeader>
                    <div className="pt-4 text-slate-600 italic text-sm leading-relaxed text-center">
                        &quot;{content.termos}&quot;
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        <div className="pt-6 space-y-3">
            <Button 
                variant="ghost" 
                className="w-full h-16 justify-between px-6 !rounded-none text-primary bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100/30 group transition-all active:scale-[0.98]" 
                onClick={() => onNavigate('admin-login')}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white !rounded-none shadow-sm text-primary group-hover:scale-110 transition-transform">
                        <Shield size={20} />
                    </div>
                    <span className="font-bold">Acesso Administrativo</span>
                </div>
                <ChevronRight size={18} className="text-primary/30" />
            </Button>

            <Button 
                variant="ghost" 
                className="w-full h-16 justify-between px-6 !rounded-none text-red-500 bg-red-50/50 hover:bg-red-100/50 border border-red-100/30 group transition-all active:scale-[0.98]"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white !rounded-none shadow-sm text-red-500 group-hover:scale-110 transition-transform">
                        <LogOut size={20} />
                    </div>
                    <span className="font-bold">Sair do Aplicativo</span>
                </div>
                <ChevronRight size={18} className="text-red-300" />
            </Button>
        </div>
      </div>

      <div className="pt-4 flex flex-col items-center">
            <Logo className="w-12 h-12 opacity-5 grayscale" color="#000" />
            <p className="text-[10px] font-bold text-slate-300 mt-2 tracking-widest uppercase italic">Versão 1.0.0</p>
      </div>
    </div>
  )
}

function CompartilharScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
    return (
        <div className="bg-white w-full min-h-full p-6 pt-10 flex flex-col animate-in fade-in duration-500 pb-24 scrollbar-hide">
            <div className="flex-1 space-y-8">
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Compartilhar</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Espalhe essa idéia</p>
                </div>

                <div className="flex justify-center gap-6 py-8">
                    <ShareIcon color="bg-green-500" icon={MessageSquare} />
                    <ShareIcon color="bg-pink-500" icon={Users} /> {/* Substitute for instagram icon */}
                    <ShareIcon color="bg-blue-600" icon={Share2} />
                </div>

                <div className="flex flex-col items-center justify-center text-center space-y-6 pt-10">
                    <div className="relative w-48 h-48 overflow-hidden !rounded-none">
                        <Image 
                            src="https://picsum.photos/seed/friends/480/480" 
                            alt="Sharing" 
                            fill
                            className="object-cover" 
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <p className="text-slate-500 px-8 text-sm">Quanto mais pessoas conectadas, mais forte fica nossa comunidade!</p>
                </div>
            </div>

            <Button className="w-full py-7 !rounded-none text-lg font-bold" onClick={() => onNavigate('home')}>Compartilhar agora</Button>
        </div>
    )
}

function SobreScreen({ onNavigate, content }: { onNavigate: (s: Screen) => void, content: any }) {
    return (
        <div className="bg-white w-full min-h-full p-6 pt-10 flex flex-col animate-in fade-in duration-500 pb-24 scrollbar-hide overflow-y-auto">
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Sobre</h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Nossa História</p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-6 mb-12">
                <p className="text-slate-500 leading-relaxed px-4 text-sm font-medium">
                    {content.historia}
                </p>
            </div>



            <div className="mt-12 flex justify-center opacity-30">
                <Logo className="w-12 h-12 grayscale" />
            </div>
        </div>
    )
}

function AdminLoginScreen({ onNavigate, adminPhone }: { onNavigate: (s: Screen) => void, adminPhone: string }) {
    const [step, setStep] = useState<'phone' | 'pin'>('phone')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async () => {
        setLoading(true)
        setError(null)
        try {
            const clean = (val: string | undefined) => {
                let s = (val || '').trim().replace(/^['"]|['"]$/g, '')
                s = s.replace(/\/+$/, '')
                s = s.replace(/\/(rest|auth)\/v\d+$/, '')
                return s
            }
            let url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
            const key = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
            
            if (!url || !key || url.includes('your-project-id') || url.includes('placeholder')) {
                throw new Error('CONFIGURAÇÃO REQUERIDA: Você precisa configurar as chaves do Supabase no menu "Settings > Secrets" para ativar o login.')
            }

            if (!url.startsWith('https://')) {
                url = `https://${url}`
            }

            // Extract domain for display
            const maskedUrl = url.replace("https://", "").split("/")[0]

            if (key.length < 40) {
                throw new Error(`CHAVE INVÁLIDA: A Anon Key para ${maskedUrl} parece estar incompleta. Verifique no painel do Supabase.`)
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            onNavigate('admin-dashboard')
        } catch (err: any) {
            console.error("Login attempt failed:", err)
            const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace("https://", "").split("/")[0] || 'servidor'
            
            if (err.message === 'Failed to fetch') {
                setError(`CONEXÃO FALHOU: Não foi possível alcançar "${url}". Verifique se a URL no menu Secrets está correta (ex: xxxxx.supabase.co).`)
            } else if (err.message === 'Invalid login credentials' || err.status === 400) {
                setError('USUÁRIO OU SENHA INCORRETOS: Verifique as credenciais no painel do Supabase.')
            } else {
                setError(`ERRO: ${err.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white w-full min-h-full p-6 pt-10 flex flex-col animate-in fade-in duration-500 pb-24 scrollbar-hide">
            <div className="flex flex-col space-y-1 mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">Acesso Administrativo</h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] ml-1">Para gestores da comunidade</p>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center -mt-12">
                <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary !rounded-none flex items-center justify-center border border-primary/20 shadow-inner">
                        <Shield size={40} strokeWidth={2.5} />
                    </div>
                    
                    <div className="text-center space-y-2">
                        <h2 className="font-black text-xl text-slate-800 italic uppercase">
                            Identificação
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">
                            Acesse o painel com seu e-mail e senha.
                        </p>
                        {!getSupabaseConfig().isConfigured && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 !rounded-none">
                                <p className="text-[9px] text-amber-700 font-bold uppercase leading-tight">
                                    Nota: Configure o Supabase no menu &quot;Settings&quot; para ativar este recurso.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="w-full space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-1">E-mail</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                <Mail size={18} />
                            </div>
                            <input 
                                className="w-full h-14 pl-14 pr-6 !rounded-none bg-slate-50 border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all"
                                placeholder="admin@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-1">Senha</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                <Shield size={18} />
                            </div>
                            <input 
                                type="password"
                                className="w-full h-14 pl-14 pr-6 !rounded-none bg-slate-50 border border-slate-100 text-sm font-medium focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{error}</p>}
                    <Button 
                        className="w-full h-16 !rounded-none font-black text-md uppercase tracking-[0.2em] shadow-lg shadow-blue-100 transition-all active:scale-95" 
                        onClick={handleLogin}
                        disabled={loading || !email || !password}
                    >
                        {loading ? 'Validando...' : 'Entrar no Painel'}
                    </Button>
                </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex justify-center">
                <button 
                    className="text-slate-400 font-bold text-sm flex items-center gap-2 hover:text-slate-600 transition-colors" 
                    onClick={() => onNavigate('mais')}
                >
                    <X size={16} /> Voltar ao Início
                </button>
            </div>
        </div>
    )
}

function AdminDashboardScreen({ onNavigate, onAddAviso, onDeleteAviso, avisos, stats, onUpdateStats, adminEmail, adminPhone, adminWhatsapp, appContent, setAppContent, onSyncContacts, onLogout }: { onNavigate: (s: Screen) => void, onAddAviso: (a: Omit<Aviso, 'id'>) => Promise<boolean>, onDeleteAviso: (id: string) => void, avisos: Aviso[], stats: any, onUpdateStats: (val: any) => void, adminEmail: string, adminPhone: string, adminWhatsapp: string, appContent: any, setAppContent: (val: any) => void, onSyncContacts: (val: any) => void, onLogout: () => void }) {
    const [open, setOpen] = useState(false)
    const [statsOpen, setStatsOpen] = useState(false)
    const [configOpen, setConfigOpen] = useState(false)
    const [contentOpen, setContentOpen] = useState(false)
    const [avisosOpen, setAvisosOpen] = useState(false)
    const [mensagensOpen, setMensagensOpen] = useState(false)
    const [mensagens, setMensagens] = useState<any[]>([])
    const [tempEmail, setTempEmail] = useState(adminEmail)
    const [tempPhone, setTempPhone] = useState(adminPhone)
    const [tempWhatsapp, setTempWhatsapp] = useState(adminWhatsapp)
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        address: '',
        message: ''
    })
    const [tempStats, setTempStats] = useState(stats)
    const [tempContent, setTempContent] = useState(appContent)

    useEffect(() => {
        if (mensagensOpen) {
            const fetchMensagens = async () => {
                const { data, error } = await supabase.from('contatos').select('*').order('created_at', { ascending: false })
                if (!error && data) setMensagens(data)
            }
            fetchMensagens()
        }
    }, [mensagensOpen])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempContent({ ...tempContent, [field]: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const success = await onAddAviso({
            title: formData.title,
            description: formData.message,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            address: formData.address,
            isNew: true,
            icon: Bell
        })
        
        if (success) {
            setOpen(false)
            setFormData({ title: '', date: '', startTime: '', endTime: '', address: '', message: '' })
        }
    }

    const handleStatsSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onUpdateStats(tempStats)
        setStatsOpen(false)
    }

    return (
        <div className="p-6 pt-10 space-y-8 bg-slate-50 w-full h-full overflow-y-auto pb-24 animate-in fade-in duration-500 scrollbar-hide">
            <div className="flex justify-between items-center border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary text-white !rounded-none flex items-center justify-center shadow-lg shadow-primary/20">
                        <Shield size={28} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Painel de Controle</span>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter">Administrador</h1>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400" onClick={onLogout}>
                    <LogOut size={20} />
                </Button>
            </div>

            <div className="bg-primary !rounded-none p-6 text-white shadow-xl shadow-primary/10 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h2 className="text-lg font-black uppercase italic tracking-tighter">Comunicar Comunidade</h2>
                        <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest">Publique avisos e eventos</p>
                    </div>
                    <div className="p-3 bg-white/10 !rounded-none backdrop-blur-md border border-white/10">
                        <Megaphone size={20} />
                    </div>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger 
                        nativeButton={false}
                        render={
                            <div 
                                role="button"
                                tabIndex={0}
                                className="w-full bg-white text-primary hover:bg-slate-50 font-black uppercase tracking-[0.1em] h-14 !rounded-none shadow-sm transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                            >
                                Publicar Novo Aviso
                            </div>
                        }
                    />
                    <DialogContent className="sm:max-w-md !rounded-none p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-center italic uppercase leading-none">Novo Aviso Oficial</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Serviço / Evento</label>
                                <Input 
                                    required
                                    placeholder="Ex: Reunião Comunitária" 
                                    className="!rounded-none bg-slate-50 border-none h-12"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                    <Input 
                                        required
                                        type="date" 
                                        className="!rounded-none bg-slate-50 border-none h-12"
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">De</label>
                                        <Input 
                                            required
                                            type="time" 
                                            className="!rounded-none bg-slate-50 border-none h-12 text-center text-xs px-1"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Até</label>
                                        <Input 
                                            required
                                            type="time" 
                                            className="!rounded-none bg-slate-50 border-none h-12 text-center text-xs px-1"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço / Local</label>
                                <Input 
                                    required
                                    placeholder="Ex: Rua das Flores, 123" 
                                    className="!rounded-none bg-slate-50 border-none h-12"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição do Comunicado</label>
                                <textarea 
                                    required
                                    rows={3}
                                    placeholder="Descreva o aviso aqui..." 
                                    className="w-full !rounded-none bg-slate-50 border-none p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                />
                            </div>
                            <Button type="submit" className="w-full h-14 !rounded-none font-bold text-lg mt-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Publicar Agora</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center pr-2">
                    <h3 className="font-bold text-lg text-slate-800">Estatísticas do Impacto</h3>
                    <Button variant="ghost" className="text-primary h-auto p-0 text-xs font-bold" onClick={() => {
                        setTempStats(stats)
                        setStatsOpen(true)
                    }}>Editar</Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Atendimentos" value={stats.atendimentos} sub="Pacientes" color="text-primary" />
                    <StatCard label="Documentos" value={stats.documentos} sub="Emitidos" color="text-slate-800" />
                    <StatCard label="Animais" value={stats.animais} sub="Vacinados" color="text-blue-600" />
                    <StatCard label="Famílias" value={stats.familias} sub="Apoiadas" color="text-pink-600" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center pr-2">
                    <h3 className="font-bold text-lg text-slate-800">Canais de Contato</h3>
                    <Button variant="ghost" className="text-primary h-auto p-0 text-xs font-bold" onClick={() => {
                        setTempEmail(adminEmail)
                        setTempPhone(adminPhone)
                        setTempWhatsapp(adminWhatsapp)
                        setConfigOpen(true)
                    }}>Gerenciar</Button>
                </div>
                <div className="space-y-3">
                    <div className="bg-white p-5 !rounded-none shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-primary !rounded-none">
                            <Mail size={18} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">E-mail Ouvidoria</p>
                            <p className="text-xs font-black text-slate-700 truncate">{adminEmail}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 !rounded-none shadow-sm flex flex-col items-center text-center gap-2">
                            <div className="p-2 bg-blue-50 text-primary !rounded-none">
                                <Phone size={16} />
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Telefone</p>
                                <p className="text-[10px] font-black text-slate-700 mt-1">{adminPhone}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 !rounded-none shadow-sm flex flex-col items-center text-center gap-2">
                            <div className="p-2 bg-green-50 text-green-600 !rounded-none">
                                <MessageSquare size={16} />
                            </div>
                            <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">WhatsApp</p>
                                <p className="text-[10px] font-black text-slate-700 mt-1">{adminWhatsapp}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center pr-2">
                    <h3 className="font-bold text-lg text-slate-800">Conteúdo do App</h3>
                    <Button variant="ghost" className="text-primary h-auto p-0 text-xs font-bold" onClick={() => {
                        setTempContent(appContent)
                        setContentOpen(true)
                    }}>Gerenciar</Button>
                </div>
                <div className="bg-white p-5 !rounded-none shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 !rounded-none">
                        <FileText size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Informações Gerais</p>
                        <p className="text-xs font-bold text-slate-700 italic">Missão, História, Termos e Privacidade</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center pr-2">
                    <h3 className="font-bold text-lg text-slate-800">Gerenciar Avisos</h3>
                    <Button variant="ghost" className="text-primary h-auto p-0 text-xs font-bold" onClick={() => setAvisosOpen(true)}>Ver Todos</Button>
                </div>
                {avisos.length > 0 ? (
                    <div className="bg-white p-5 !rounded-none shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 !rounded-none">
                            <Bell size={18} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Último Aviso</p>
                            <p className="text-xs font-black text-slate-700 truncate">{avisos[0].title}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">Nenhum aviso ativo</p>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center pr-2">
                    <h3 className="font-bold text-lg text-slate-800">Mensagens de Contato</h3>
                    <Button variant="ghost" className="text-primary h-auto p-0 text-xs font-bold" onClick={() => setMensagensOpen(true)}>Ver Todas</Button>
                </div>
                <div className="bg-white p-5 !rounded-none shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 !rounded-none">
                        <MessageSquare size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Solicitações Recebidas</p>
                        <p className="text-xs font-bold text-slate-700 italic">Clique em ver todas para acompanhar as mensagens enviadas pela comunidade.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-800">Atividade recente</h3>
                <div className="space-y-3">
                    <ActivityItem label="Novo aviso cadastrado" sub="Reunião Comunitária" time="Agora" icon={Bell} />
                    <ActivityItem label="Estatísticas atualizadas" sub="Atendimentos odonto" time="15 min" icon={Briefcase} />
                    <ActivityItem label="Novo contato recebido" sub="Solicitação de informação" time="2h" icon={MessageSquare} />
                </div>
            </div>

            {/* Dialog for Stats Update */}
            <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
                <DialogContent className="sm:max-w-md !rounded-none p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">Atualizar Estatísticas</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleStatsSubmit} className="space-y-4 pt-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pacientes Atendidos</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                value={tempStats.atendimentos}
                                onChange={(e) => setTempStats({...tempStats, atendimentos: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Documentos Feitos</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                value={tempStats.documentos}
                                onChange={(e) => setTempStats({...tempStats, documentos: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Animais Atendidos</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                value={tempStats.animais}
                                onChange={(e) => setTempStats({...tempStats, animais: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Famílias Apoiadas</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                value={tempStats.familias}
                                onChange={(e) => setTempStats({...tempStats, familias: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Limpeza (Ruas)</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                value={tempStats.limpeza}
                                onChange={(e) => setTempStats({...tempStats, limpeza: e.target.value})}
                            />
                        </div>
                        <Button type="submit" className="w-full h-14 !rounded-none font-bold text-lg mt-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Salvar Estatísticas</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog for Config Update */}
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogContent className="sm:max-w-md !rounded-none p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">Canais de Atendimento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 pt-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail da Ouvidoria</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                placeholder="exemplo@email.com"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone de Contato</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                placeholder="(11) 0800..."
                                value={tempPhone}
                                onChange={(e) => setTempPhone(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp da Ouvidoria</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                placeholder="(11) 9..."
                                value={tempWhatsapp}
                                onChange={(e) => setTempWhatsapp(e.target.value)}
                            />
                        </div>
                        <Button 
                            className="w-full h-14 !rounded-none font-bold text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 mt-2"
                            onClick={() => {
                                onSyncContacts({
                                    email: tempEmail,
                                    phone: tempPhone,
                                    whatsapp: tempWhatsapp
                                })
                                setConfigOpen(false)
                            }}
                        >
                            Atualizar Canais
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Content Update */}
            <Dialog open={contentOpen} onOpenChange={setContentOpen}>
                <DialogContent className="sm:max-w-md !rounded-none p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center italic uppercase leading-none">Conteúdo Informativo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Logo da Comunidade</label>
                            <div className="flex gap-2">
                                <Input 
                                    className="flex-1 !rounded-none bg-slate-50 border-none h-12"
                                    placeholder="URL da imagem"
                                    value={tempContent.heroImage}
                                    onChange={(e) => setTempContent({...tempContent, heroImage: e.target.value})}
                                />
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    className="h-12 w-12 !rounded-none p-0 flex items-center justify-center border-dashed border-2 text-slate-400 hover:text-primary hover:border-primary transition-colors"
                                    onClick={() => document.getElementById('hero-file')?.click()}
                                >
                                    <Camera size={20} />
                                </Button>
                                <input 
                                    id="hero-file" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleFileChange(e, 'heroImage')} 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Banner Rede Social</label>
                            <div className="flex gap-2">
                                <Input 
                                    className="flex-1 !rounded-none bg-slate-50 border-none h-12"
                                    placeholder="URL da imagem (Fundo Card)"
                                    value={tempContent.networkImage}
                                    onChange={(e) => setTempContent({...tempContent, networkImage: e.target.value})}
                                />
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    className="h-12 w-12 !rounded-none p-0 flex items-center justify-center border-dashed border-2 text-slate-400 hover:text-primary hover:border-primary transition-colors"
                                    onClick={() => document.getElementById('network-file')?.click()}
                                >
                                    <Camera size={20} />
                                </Button>
                                <input 
                                    id="network-file" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleFileChange(e, 'networkImage')} 
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título Banner Rede</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                value={tempContent.networkTitle}
                                onChange={(e) => setTempContent({...tempContent, networkTitle: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição Banner Rede</label>
                            <textarea 
                                className="w-full !rounded-none bg-slate-50 border-none p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                                rows={2}
                                value={tempContent.networkDesc}
                                onChange={(e) => setTempContent({...tempContent, networkDesc: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nossa História</label>
                            <textarea 
                                className="w-full !rounded-none bg-slate-50 border-none p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                                rows={3}
                                value={tempContent.historia}
                                onChange={(e) => setTempContent({...tempContent, historia: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nossa Missão</label>
                            <textarea 
                                className="w-full !rounded-none bg-slate-50 border-none p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                                rows={2}
                                value={tempContent.missao}
                                onChange={(e) => setTempContent({...tempContent, missao: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Privacidade</label>
                            <textarea 
                                className="w-full !rounded-none bg-slate-50 border-none p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                                rows={2}
                                value={tempContent.privacidade}
                                onChange={(e) => setTempContent({...tempContent, privacidade: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Termos de Uso</label>
                            <textarea 
                                className="w-full !rounded-none bg-slate-50 border-none p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                                rows={2}
                                value={tempContent.termos}
                                onChange={(e) => setTempContent({...tempContent, termos: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Desenvolvedor</label>
                            <Input 
                                className="!rounded-none bg-slate-50 border-none h-12"
                                value={tempContent.desenvolvedor}
                                onChange={(e) => setTempContent({...tempContent, desenvolvedor: e.target.value})}
                            />
                        </div>
                        <Button 
                            className="w-full h-14 !rounded-none font-bold text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 mt-2"
                            onClick={() => {
                                setAppContent(tempContent)
                                setContentOpen(false)
                            }}
                        >
                            Atualizar Conteúdo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Managing Avisos */}
            <Dialog open={avisosOpen} onOpenChange={setAvisosOpen}>
                <DialogContent className="sm:max-w-md !rounded-none p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center italic uppercase">Gerenciar Avisos</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-6">
                        {avisos.length > 0 ? avisos.map((aviso) => (
                            <div key={aviso.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 !rounded-none group">
                                <div className="flex-1 overflow-hidden pr-4">
                                    <h4 className="text-sm font-black text-slate-800 truncate">{aviso.title}</h4>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">{formatDate(aviso.date)}</p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    onClick={() => {
                                        if (confirm('Tem certeza que deseja excluir este aviso?')) {
                                            onDeleteAviso(aviso.id)
                                        }
                                    }}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 text-sm py-10">Nenhum aviso para remover.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Managing Messages */}
            <Dialog open={mensagensOpen} onOpenChange={setMensagensOpen}>
                <DialogContent className="sm:max-w-md !rounded-none p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center italic uppercase">Mensagens Recebidas</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        {mensagens.length > 0 ? mensagens.map((msg, idx) => (
                            <div key={msg.id || idx} className="p-5 bg-slate-50 border border-slate-100 !rounded-none space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tighter">De: {msg.email || 'Anônimo'}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{msg.created_at ? new Date(msg.created_at).toLocaleString('pt-BR') : 'Recém enviada'}</p>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-600 border-blue-200 text-[8px] !rounded-none">Contato</Badge>
                                </div>
                                
                                <p className="text-sm text-slate-600 leading-relaxed italic pr-2">
                                    &quot;{msg.solicitacao}&quot;
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Telefone</p>
                                        <p className="text-[10px] font-bold text-slate-700">{msg.telefone || '-'}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">WhatsApp</p>
                                        <p className="text-[10px] font-bold text-slate-700">{msg.whatsapp || '-'}</p>
                                    </div>
                                </div>

                                {msg.endereco && (
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Endereço</p>
                                        <p className="text-[10px] font-bold text-slate-700 italic truncate">{msg.endereco}</p>
                                    </div>
                                )}

                                {msg.photo && (
                                    <div className="relative w-full aspect-video bg-slate-200 !rounded-none overflow-hidden group border border-slate-100">
                                        <Image 
                                            src={msg.photo} 
                                            alt="Anexo" 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition-transform" 
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                )}
                                
                                <div className="flex justify-end pt-2">
                                     <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-[10px] font-black uppercase tracking-widest h-8 !rounded-none text-red-400 border-red-100 hover:bg-red-50"
                                        onClick={async () => {
                                            if (confirm('Excluir esta mensagem?')) {
                                                const { error } = await supabase.from('contatos').delete().eq('id', msg.id)
                                                if (!error) setMensagens(mensagens.filter(m => m.id !== msg.id))
                                            }
                                        }}
                                     >
                                        Excluir
                                     </Button>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                                <MessageSquare size={48} className="opacity-10" />
                                <p className="font-bold text-[10px] uppercase tracking-widest">Nenhuma mensagem recebida ainda.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex justify-center pt-4">
                <button className="text-slate-400 text-sm font-medium" onClick={onLogout}>Sair do painel</button>
            </div>
        </div>
    )
}

// --- Helper Components ---

function QuickAccessIcon({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-white !rounded-none shadow-sm border border-slate-50 hover:shadow-md transition-all">
      <div className={cn("p-2 bg-blue-50/50 !rounded-none", color)}>
        <Icon size={20} className="stroke-[2.5px]" />
      </div>
      <span className="text-[10px] font-bold text-slate-700 tracking-tight">{label}</span>
    </button>
  )
}

function AlertCard({ icon: Icon, title, description, date, startTime, endTime, isNew, onClick }: { icon: any, title: string, description: string, date: string, startTime?: string, endTime?: string, isNew?: boolean, onClick?: () => void }) {
  return (
    <Card 
        className={cn("border-none shadow-sm hover:shadow-md transition-all overflow-hidden !rounded-none", onClick && "cursor-pointer active:scale-[0.98]")}
        onClick={onClick}
    >
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-3 bg-slate-50 !rounded-none text-slate-400">
          <Icon size={24} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800">{title}</h4>
            {isNew && <Badge className="bg-primary text-white text-[8px] font-bold py-0.5 px-2 !rounded-none uppercase">Novo</Badge>}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatDate(date)}</p>
            {startTime && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">| {startTime} - {endTime}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContactItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 bg-white p-4 py-5 !rounded-none shadow-sm">
      <div className="p-2 text-primary">
        <Icon size={20} />
      </div>
      <div>
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</h5>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  )
}

const MenuButton = React.forwardRef<HTMLDivElement, { icon: any, label: string, onClick?: () => void }>(
  ({ icon: Icon, label, onClick, ...props }, ref) => {
    return (
      <div 
          ref={ref}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                onClick?.()
            }
          }}
          className="w-full flex items-center justify-between p-4 px-6 hover:bg-white/80 transition-all !rounded-none group active:scale-[0.98] cursor-pointer"
          {...props}
      >
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 !rounded-none shadow-sm text-slate-400 group-hover:text-primary transition-colors">
            <Icon size={18} />
          </div>
          <span className="font-bold text-slate-700 text-sm">{label}</span>
        </div>
        <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1 transition-transform" size={16} />
      </div>
    )
  }
)
MenuButton.displayName = 'MenuButton'



function ShareIcon({ color, icon: Icon }: { color: string, icon: any }) {
  return (
    <div className={cn("w-14 h-14 !rounded-none flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform", color)}>
      <Icon size={24} />
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string, value: string, sub: string, color: string }) {
    return (
        <Card className="border-none shadow-sm !rounded-none p-5">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</h5>
            <p className={cn("text-3xl font-black mt-1", color)}>{value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{sub}</p>
        </Card>
    )
}

function ActivityItem({ label, sub, time, icon: Icon }: { label: string, sub: string, time: string, icon: any }) {
    return (
        <div className="flex items-center gap-4 bg-white p-4 !rounded-none shadow-sm">
            <div className="p-2 bg-slate-50 text-primary !rounded-none">
                <Icon size={18} />
            </div>
            <div className="flex-1">
                <h5 className="text-[10px] font-bold text-slate-800">{label}</h5>
                <p className="text-[9px] text-slate-400 font-medium">{sub}</p>
            </div>
            <span className="text-[8px] font-black text-slate-300 uppercase">{time}</span>
        </div>
    )
}
