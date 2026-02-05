import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, Phone, Video, CalendarDays, Trash2, Edit, CheckCircle2, XCircle, Zap, Bot } from "lucide-react";
import { Link } from "wouter";
import type { CalendarEvent, Lead } from "@shared/schema";
import { canScheduleVisits, getPlanConfig } from "@shared/plans";

const eventTypeIcons: Record<string, typeof Calendar> = {
  visita: MapPin,
  reuniao: Video,
  chamada: Phone,
  outro: Calendar,
};

const eventTypeLabels: Record<string, string> = {
  visita: "Visita",
  reuniao: "Reuniao",
  chamada: "Chamada",
  outro: "Outro",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export function AgendaModule() {
  const { toast } = useToast();
  const { customer } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    eventType: "visita" as const,
    leadId: "",
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events", format(monthStart, "yyyy-MM-dd"), format(monthEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(`/api/calendar-events?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newEvent) => {
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Data invalida");
      }
      
      const payload = {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        eventType: data.eventType,
        customerId: customer?.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        leadId: data.leadId && data.leadId !== "none" ? data.leadId : null,
      };
      return apiRequest("POST", "/api/calendar-events", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setIsCreateOpen(false);
      setNewEvent({ title: "", description: "", startTime: "", endTime: "", location: "", eventType: "visita", leadId: "" });
      toast({ title: "Evento criado", description: "O evento foi adicionado a agenda." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel criar o evento.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/calendar-events/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      toast({ title: "Evento atualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/calendar-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      setSelectedEvent(null);
      toast({ title: "Evento eliminado" });
    },
  });

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, date);
    });
  };

  const todayEvents = events.filter((event) => {
    const eventDate = new Date(event.startTime);
    return isToday(eventDate) && event.status === "scheduled";
  });

  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= new Date() && event.status === "scheduled";
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      toast({ title: "Campos obrigatorios", description: "Preencha o titulo e as datas.", variant: "destructive" });
      return;
    }
    createMutation.mutate(newEvent);
  };

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

  const planId = customer?.plan || "basic";
  const canSchedule = canScheduleVisits(planId);
  const planConfig = getPlanConfig(planId);

  return (
    <div className="space-y-6" data-testid="agenda-module">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agenda</h2>
          <p className="text-muted-foreground">Gerencie as suas visitas e reunioes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{planConfig?.name || "Basic"}</Badge>
          {canSchedule ? (
            <Badge variant="default" className="gap-1">
              <Bot className="h-3 w-3" />
              Marcacao IA
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Bot className="h-3 w-3" />
              Marcacao IA (Pro)
            </Badge>
          )}
        </div>
      </div>

      {!canSchedule && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Marcacao de Visitas pelo Assistente IA</p>
                  <p className="text-sm text-muted-foreground">
                    Disponivel nos planos Pro e Custom - deixe a IA agendar visitas automaticamente
                  </p>
                </div>
              </div>
              <Link href="/loja">
                <Button variant="outline" size="sm" className="gap-1" data-testid="button-upgrade-calendar">
                  <Zap className="h-3 w-3" />
                  Fazer Upgrade
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  placeholder="Ex: Visita apartamento T3"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  data-testid="input-event-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventType">Tipo de Evento</Label>
                <Select
                  value={newEvent.eventType}
                  onValueChange={(value) => setNewEvent({ ...newEvent, eventType: value as typeof newEvent.eventType })}
                >
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="reuniao">Reuniao</SelectItem>
                    <SelectItem value="chamada">Chamada</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Inicio</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    data-testid="input-event-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Fim</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    data-testid="input-event-end"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localizacao</Label>
                <Input
                  id="location"
                  placeholder="Morada ou link de videochamada"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  data-testid="input-event-location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead">Lead Associado (opcional)</Label>
                <Select
                  value={newEvent.leadId || "none"}
                  onValueChange={(value) => setNewEvent({ ...newEvent, leadId: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-event-lead">
                    <SelectValue placeholder="Selecionar lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.property}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Notas</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes adicionais..."
                  value={newEvent.description || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  data-testid="input-event-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateEvent} disabled={createMutation.isPending} data-testid="button-save-event">
                {createMutation.isPending ? "A criar..." : "Criar Evento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {format(currentDate, "MMMM yyyy", { locale: pt })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  data-testid="button-today"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <button
                    key={index}
                    className={`
                      relative min-h-[80px] p-1 border rounded-md text-left transition-colors
                      ${isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground"}
                      ${isToday(day) ? "border-primary" : "border-border"}
                      ${isSelected ? "ring-2 ring-primary" : ""}
                      hover-elevate
                    `}
                    onClick={() => setSelectedDate(day)}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <span className={`text-sm ${isToday(day) ? "font-bold text-primary" : ""}`}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => {
                        const Icon = eventTypeIcons[event.eventType || "outro"];
                        return (
                          <div
                            key={event.id}
                            className={`text-xs truncate rounded px-1 py-0.5 ${statusColors[event.status]} text-white`}
                            title={event.title}
                          >
                            <Icon className="h-3 w-3 inline mr-1" />
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hoje ({todayEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos agendados para hoje.</p>
              ) : (
                <div className="space-y-3">
                  {todayEvents.map((event) => {
                    const Icon = eventTypeIcons[event.eventType || "outro"];
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded-md border hover-elevate cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                        data-testid={`event-today-${event.id}`}
                      >
                        <div className={`p-2 rounded ${statusColors[event.status]}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground truncate">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Proximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos proximos.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                    const Icon = eventTypeIcons[event.eventType || "outro"];
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded-md border hover-elevate cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                        data-testid={`event-upcoming-${event.id}`}
                      >
                        <div className={`p-2 rounded ${statusColors[event.status]}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.startTime), "dd MMM, HH:mm", { locale: pt })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {eventTypeLabels[event.eventType || "outro"]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedDate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {format(selectedDate, "dd MMMM yyyy", { locale: pt })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getEventsForDay(selectedDate).length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">Sem eventos neste dia.</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        const dateStr = format(selectedDate, "yyyy-MM-dd'T'09:00");
                        const endStr = format(selectedDate, "yyyy-MM-dd'T'10:00");
                        setNewEvent({ ...newEvent, startTime: dateStr, endTime: endStr });
                        setIsCreateOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Evento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getEventsForDay(selectedDate).map((event) => {
                      const Icon = eventTypeIcons[event.eventType || "outro"];
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-2 rounded border hover-elevate cursor-pointer"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{event.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.startTime), "HH:mm")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (
                <>
                  {(() => {
                    const Icon = eventTypeIcons[selectedEvent.eventType || "outro"];
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {selectedEvent.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedEvent.status]}>
                  {selectedEvent.status === "scheduled" ? "Agendado" : selectedEvent.status === "completed" ? "Concluido" : "Cancelado"}
                </Badge>
                <Badge variant="outline">
                  {eventTypeLabels[selectedEvent.eventType || "outro"]}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedEvent.startTime), "dd MMM yyyy, HH:mm", { locale: pt })} - {format(new Date(selectedEvent.endTime), "HH:mm")}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="pt-2">
                    <p className="text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                {selectedEvent.status === "scheduled" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateMutation.mutate({ id: selectedEvent.id, status: "completed" });
                        setSelectedEvent(null);
                      }}
                      data-testid="button-complete-event"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Concluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateMutation.mutate({ id: selectedEvent.id, status: "cancelled" });
                        setSelectedEvent(null);
                      }}
                      data-testid="button-cancel-event"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(selectedEvent.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-event"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
