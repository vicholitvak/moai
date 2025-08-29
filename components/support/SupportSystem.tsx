'use client';

import { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock, 
  Send,
  ChevronRight,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  User,
  Package,
  Truck,
  CreditCard,
  Shield,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface SupportTicket {
  userId: string;
  userEmail: string;
  userName: string;
  category: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const faqData = {
  general: [
    {
      question: '¿Cómo funciona Moai?',
      answer: 'Moai conecta cocineros caseros con clientes que buscan comida casera. Los cocineros publican sus platos, los clientes realizan pedidos, y los conductores entregan la comida directamente a tu puerta.'
    },
    {
      question: '¿Es seguro pedir en Moai?',
      answer: 'Sí, todos nuestros cocineros están verificados y deben cumplir con estándares de higiene y seguridad alimentaria. Además, contamos con un sistema de calificaciones y reseñas para garantizar la calidad.'
    },
    {
      question: '¿En qué zonas está disponible Moai?',
      answer: 'Actualmente operamos en las principales ciudades. Puedes verificar la disponibilidad ingresando tu dirección en la página principal.'
    },
    {
      question: '¿Cuáles son los horarios de atención?',
      answer: 'El horario de atención depende de cada cocinero. Puedes ver los horarios disponibles en el perfil de cada cocinero.'
    }
  ],
  orders: [
    {
      question: '¿Cómo realizo un pedido?',
      answer: 'Busca platos o cocineros en tu área, agrega los productos al carrito, ingresa tu dirección de entrega y completa el pago. Recibirás confirmación inmediata de tu pedido.'
    },
    {
      question: '¿Puedo cancelar mi pedido?',
      answer: 'Puedes cancelar tu pedido mientras esté en estado "Pendiente". Una vez que el cocinero acepta el pedido, no es posible cancelarlo.'
    },
    {
      question: '¿Cómo rastreo mi pedido?',
      answer: 'Puedes seguir el estado de tu pedido en tiempo real desde la sección "Mis Pedidos". Recibirás notificaciones en cada cambio de estado.'
    },
    {
      question: '¿Qué hago si mi pedido no llega?',
      answer: 'Si tu pedido no llega en el tiempo estimado, contacta al soporte inmediatamente a través del formulario de contacto o el chat en vivo.'
    }
  ],
  payments: [
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos pagos con tarjetas de crédito/débito a través de MercadoPago y efectivo contra entrega.'
    },
    {
      question: '¿Es seguro pagar en Moai?',
      answer: 'Sí, utilizamos MercadoPago para procesar los pagos de forma segura. No almacenamos información de tarjetas en nuestros servidores.'
    },
    {
      question: '¿Cuándo se cobra mi pedido?',
      answer: 'Para pagos con tarjeta, se realiza una retención al momento de hacer el pedido y se confirma cuando el cocinero acepta. Para efectivo, pagas al recibir.'
    },
    {
      question: '¿Cómo solicito un reembolso?',
      answer: 'Si hay algún problema con tu pedido, contacta al soporte dentro de las 24 horas posteriores a la entrega para evaluar tu caso.'
    }
  ],
  cooks: [
    {
      question: '¿Cómo me convierto en cocinero en Moai?',
      answer: 'Regístrate como cocinero, completa tu perfil con información sobre tu cocina y especialidades, sube fotos de tus platos y espera la aprobación.'
    },
    {
      question: '¿Cuáles son las comisiones?',
      answer: 'Moai cobra una comisión del 12% sobre cada venta para cubrir los costos de la plataforma y el procesamiento de pagos.'
    },
    {
      question: '¿Cómo recibo mis pagos?',
      answer: 'Los pagos se depositan semanalmente en tu cuenta bancaria registrada. Puedes ver el detalle de tus ganancias en el dashboard.'
    },
    {
      question: '¿Puedo establecer mis propios precios?',
      answer: 'Sí, tienes control total sobre los precios de tus platos. Te recomendamos considerar los costos de ingredientes y tu tiempo.'
    }
  ],
  drivers: [
    {
      question: '¿Cómo me uno como conductor?',
      answer: 'Regístrate como conductor, proporciona información de tu vehículo y documentación, y espera la verificación de antecedentes.'
    },
    {
      question: '¿Cuánto gano por entrega?',
      answer: 'Las ganancias varían según la distancia y el tiempo. Recibes una tarifa base más bonificaciones por distancia y propinas.'
    },
    {
      question: '¿Necesito un vehículo especial?',
      answer: 'Puedes usar bicicleta, motocicleta o automóvil. El vehículo debe estar en buenas condiciones y tener los documentos al día.'
    },
    {
      question: '¿Cómo funciona la asignación de pedidos?',
      answer: 'Los pedidos disponibles aparecen en tu dashboard. Puedes aceptar los que te convengan según tu ubicación y disponibilidad.'
    }
  ]
};

export function SupportSystem() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof faqData>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Contact form state
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para enviar un ticket');
      return;
    }

    if (!formData.category || !formData.subject || !formData.message) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const ticketData: Omit<SupportTicket, 'id'> = {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || 'Usuario',
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
        status: 'open',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'support_tickets'), ticketData);
      
      toast.success('Ticket enviado exitosamente. Te responderemos pronto.');
      
      // Reset form
      setFormData({
        category: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Error al enviar el ticket. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFAQs = faqData[selectedCategory].filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: keyof typeof faqData) => {
    const icons = {
      general: <HelpCircle className="h-4 w-4" />,
      orders: <Package className="h-4 w-4" />,
      payments: <CreditCard className="h-4 w-4" />,
      cooks: <User className="h-4 w-4" />,
      drivers: <Truck className="h-4 w-4" />
    };
    return icons[category];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Centro de Ayuda</h1>
        <p className="text-muted-foreground">
          Encuentra respuestas a tus preguntas o contacta con nuestro equipo de soporte
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            Preguntas Frecuentes
          </TabsTrigger>
          <TabsTrigger value="contact">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contactar Soporte
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <FileText className="h-4 w-4 mr-2" />
            Mis Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar en las preguntas frecuentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Selection */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(faqData) as Array<keyof typeof faqData>).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {getCategoryIcon(category)}
                <span className="ml-2">{category}</span>
              </Button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <Card>
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2">
                {getCategoryIcon(selectedCategory)}
                {selectedCategory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFAQs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No se encontraron preguntas que coincidan con tu búsqueda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          {/* Quick Contact Options */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Respuesta en 24-48 horas
                  </p>
                  <a 
                    href="mailto:soporte@moai.com" 
                    className="text-primary hover:underline text-sm"
                  >
                    soporte@moai.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-1">Chat en Vivo</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Disponible 9AM - 9PM
                  </p>
                  <Badge variant="outline" className="text-green-600 dark:text-green-400">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    En línea
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mb-3">
                    <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-1">Teléfono</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Lun-Vie 9AM - 6PM
                  </p>
                  <a 
                    href="tel:+1234567890" 
                    className="text-primary hover:underline text-sm"
                  >
                    +123 456 7890
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enviar Ticket de Soporte</CardTitle>
              <CardDescription>
                Completa el formulario y nuestro equipo te responderá lo antes posible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order_issue">Problema con pedido</SelectItem>
                        <SelectItem value="payment_issue">Problema de pago</SelectItem>
                        <SelectItem value="account_issue">Problema de cuenta</SelectItem>
                        <SelectItem value="cook_inquiry">Consulta de cocinero</SelectItem>
                        <SelectItem value="driver_inquiry">Consulta de conductor</SelectItem>
                        <SelectItem value="technical_issue">Problema técnico</SelectItem>
                        <SelectItem value="feedback">Comentarios/Sugerencias</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center">
                            <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                            Baja
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center">
                            <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2" />
                            Media
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center">
                            <div className="h-2 w-2 bg-red-500 rounded-full mr-2" />
                            Alta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Describe brevemente tu problema"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea
                    id="message"
                    placeholder="Proporciona todos los detalles relevantes sobre tu consulta..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Incluye números de pedido, fechas y cualquier información relevante
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || !user}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {user ? 'Enviar Ticket' : 'Inicia sesión para enviar'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Mis Tickets de Soporte</CardTitle>
                <CardDescription>
                  Historial de tus consultas y su estado actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No tienes tickets de soporte activos
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('contact')}
                  >
                    Crear nuevo ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    Inicia sesión para ver tus tickets de soporte
                  </p>
                  <Button onClick={() => window.location.href = '/login'}>
                    Iniciar Sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recursos Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/terms" 
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Términos y Condiciones</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </a>
            <a 
              href="/privacy" 
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Política de Privacidad</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </a>
            <a 
              href="/safety" 
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Seguridad Alimentaria</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </a>
            <a 
              href="/guidelines" 
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Guías de la Comunidad</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}