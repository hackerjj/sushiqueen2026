import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! 🍣 Soy el asistente de Sushi Queen. Puedo ayudarte con:\n\n• Recomendaciones del menú\n• Información sobre ingredientes\n• Estado de tu pedido\n• Horarios y ubicación\n\n¿En qué te puedo ayudar?',
  timestamp: new Date(),
};

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: userMsg.content });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data?.response || data.message || 'Lo siento, no pude procesar tu mensaje.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Fallback responses when API is unavailable
      const fallback = getFallbackResponse(userMsg.content);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-sushi-primary hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all hover:scale-105"
        aria-label="Abrir chat de asistencia"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-sushi-secondary px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-sushi-accent rounded-full flex items-center justify-center text-lg">
              🍣
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Sushi Queen AI</h3>
              <p className="text-gray-400 text-xs">Powered by Google AI</p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-sushi-primary text-white rounded-br-md'
                      : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sushi-primary/20 focus:border-sushi-primary"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-sushi-primary hover:bg-red-700 disabled:opacity-50 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
                aria-label="Enviar mensaje"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('horario') || lower.includes('hora') || lower.includes('abren') || lower.includes('cierran')) {
    return 'Nuestro horario es de Lunes a Domingo de 1:00 PM a 10:00 PM. ¡Te esperamos! 🕐';
  }
  if (lower.includes('dirección') || lower.includes('ubicación') || lower.includes('donde') || lower.includes('dónde')) {
    return 'Estamos en Jose T. Cuellar 39, Colonia Obrera, Cuauhtémoc, 06800 CDMX. ¡Ven a visitarnos! 📍';
  }
  if (lower.includes('teléfono') || lower.includes('llamar') || lower.includes('contacto')) {
    return 'Puedes contactarnos al 55 1796 6419 o escribirnos por WhatsApp. ¡Con gusto te atendemos! 📞';
  }
  if (lower.includes('recomiend') || lower.includes('mejor') || lower.includes('favorito') || lower.includes('popular')) {
    return '¡Nuestros favoritos! 🌟\n\n• Queen Maki - Camarón empanizado envuelto en aguacate ($208)\n• Dragon Queen - Maki con aguacate y mango ($228)\n• Spicy Tuna - Atún con salsa chipotle ($276)\n• Paquete Eby Furai - Camarón empanizado con yakimeshi ($311)\n\n¿Te gustaría ordenar alguno?';
  }
  if (lower.includes('maki') || lower.includes('sushi') || lower.includes('rollo')) {
    return 'Tenemos una gran variedad de makis desde $80:\n\n• Makis clásicos (desde $80)\n• Makis especiales (desde $144)\n• Queen Maki ($208)\n• Dragon Queen ($228)\n\nPuedes ver el menú completo en la sección de Menú. 🍣';
  }
  if (lower.includes('pasta')) {
    return '¡Nuestras Pastas Queen! 🍝 Elige entre espagueti o fettuccine:\n\n• Alfredo - $140\n• Bolognesa - $160\n• Poblana - $165\n• 4 Quesos - $165\n• Di Salmón - $250';
  }
  if (lower.includes('paquete') || lower.includes('combo')) {
    return 'Nuestros paquetes incluyen Yakimeshi de verduras, Ensalada y Kushiage de queso:\n\n• Pechuga Maki - $181\n• Yakisoba - $181\n• Sushi Maki - $181\n• Sakana Furai - $242\n• Eby Furai - $311\n\n¡Excelente relación calidad-precio! 📦';
  }
  if (lower.includes('pedido') || lower.includes('ordenar') || lower.includes('pedir')) {
    return 'Puedes hacer tu pedido de varias formas:\n\n1. 🌐 Aquí en la web - sección "Ordenar"\n2. 📱 Por WhatsApp al 55 1796 6419\n3. 🏠 Visítanos en Jose T. Cuellar 39, Obrera\n\n¿Cómo prefieres ordenar?';
  }
  if (lower.includes('hola') || lower.includes('buenas') || lower.includes('hey')) {
    return '¡Hola! 👋 Bienvenido a Sushi Queen. ¿En qué te puedo ayudar hoy? Puedo recomendarte platillos, darte información del menú o ayudarte con tu pedido. 🍣';
  }
  if (lower.includes('gracias') || lower.includes('thanks')) {
    return '¡De nada! 😊 Si necesitas algo más, aquí estoy. ¡Que disfrutes tu comida! 🍣✨';
  }
  if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto') || lower.includes('cuanto')) {
    return 'Nuestros precios van desde $64 (Nigiri) hasta $311 (Paquete Eby Furai). El promedio por persona es de $200-$300. ¿Te gustaría saber el precio de algún platillo en específico? 💰';
  }

  return 'Gracias por tu mensaje. Puedo ayudarte con recomendaciones del menú, precios, horarios, ubicación o tu pedido. ¿Qué te gustaría saber? 🍣';
}

export default AIChatbot;
