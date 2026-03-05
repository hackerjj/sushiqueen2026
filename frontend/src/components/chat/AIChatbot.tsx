import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { menuData } from '../../data/menuData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! 🍣 Soy el asistente virtual de Sushi Queen. Puedo ayudarte con:\n\n• Recomendaciones personalizadas\n• Menú completo y precios\n• Ingredientes y alérgenos\n• Horarios y ubicación\n• Hacer tu pedido\n• Opiniones de clientes\n\n¿En qué te puedo ayudar?',
  timestamp: new Date(),
};

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

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
        content: data.data?.response || data.message || getSmartResponse(userMsg.content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSmartResponse(userMsg.content),
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

  const quickActions = [
    { label: '📋 Ver menú', msg: 'Quiero ver el menú completo' },
    { label: '⭐ Recomendaciones', msg: 'Qué me recomiendas?' },
    { label: '📍 Ubicación', msg: 'Dónde están ubicados?' },
    { label: '🛒 Ordenar', msg: 'Quiero hacer un pedido' },
  ];

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
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-sushi-secondary px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-sushi-accent rounded-full flex items-center justify-center text-lg">🍣</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Sushi Queen AI</h3>
              <p className="text-gray-400 text-xs">Asistente virtual · En línea</p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sushi-primary text-white rounded-br-md'
                    : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm'
                }`}>
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
            {/* Quick actions after welcome */}
            {messages.length <= 2 && !loading && (
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => { setInput(action.msg); }}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-sushi-primary/5 hover:border-sushi-primary/30 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
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

// ═══════════════════════════════════════════════════════════════
// SMART RESPONSE ENGINE - Full context from menu + Google Maps
// ═══════════════════════════════════════════════════════════════

function getSmartResponse(message: string): string {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // ─── GREETINGS ─────────────────────────────────────────────
  if (/^(hola|hey|buenas|buenos|que tal|hi|hello|ola|saludos)/.test(lower)) {
    return '¡Hola! 👋 Bienvenido a Sushi Queen, el mejor sushi de la Colonia Obrera en CDMX.\n\nTenemos más de 70 platillos en 11 categorías. ¿Te gustaría que te recomiende algo o prefieres ver el menú completo? 🍣';
  }

  // ─── THANKS ────────────────────────────────────────────────
  if (/gracias|thanks|thx|agradec/.test(lower)) {
    return '¡Con mucho gusto! 😊 En Sushi Queen siempre es un placer atenderte. Si necesitas algo más, aquí estoy. ¡Buen provecho! 🍣✨';
  }

  // ─── GOODBYE ───────────────────────────────────────────────
  if (/adios|bye|hasta luego|nos vemos|chao/.test(lower)) {
    return '¡Hasta pronto! 👋 Fue un gusto ayudarte. Recuerda que estamos en Jose T. Cuellar 39, Obrera, CDMX. ¡Te esperamos de 1 a 10 PM! 🍣';
  }

  // ─── HOURS / SCHEDULE ──────────────────────────────────────
  if (/horario|hora|abren|cierran|abierto|cerrado|cuando|schedule|open|close/.test(lower)) {
    return '🕐 Nuestro horario:\n\nLunes a Domingo: 1:00 PM - 10:00 PM\n\nAbrimos todos los días de la semana. Te recomendamos llegar temprano los fines de semana ya que suele haber más gente. ¡Te esperamos!';
  }

  // ─── LOCATION / ADDRESS ────────────────────────────────────
  if (/direccion|ubicacion|donde|donde estan|como llego|llegar|mapa|maps|address|location/.test(lower)) {
    return '📍 Estamos en:\n\nJose T. Cuellar 39, Colonia Obrera\nCuauhtémoc, 06800 Ciudad de México\n\nReferencia: Cerca del metro Obrera (Línea 8)\nCódigo Plus: CV85+QF Mexico City\n\nPuedes buscarnos en Google Maps como "Sushi Queen" y te aparecemos con 4.6 estrellas ⭐\n\n¿Necesitas indicaciones desde algún punto?';
  }

  // ─── PHONE / CONTACT ───────────────────────────────────────
  if (/telefono|llamar|contacto|whatsapp|numero|cel|phone|contact/.test(lower)) {
    return '📞 Contáctanos:\n\n• Teléfono: 55 1796 6419\n• WhatsApp: 55 1796 6419\n• Web: sushiqueen.mx\n• Menú Fudo: menu.fu.do\n\nPor WhatsApp puedes hacer pedidos directamente. ¡Respondemos rápido! 💬';
  }

  // ─── ORDER / DELIVERY ──────────────────────────────────────
  if (/pedido|ordenar|pedir|orden|delivery|domicilio|llevar|para llevar|take out|envio/.test(lower)) {
    return '🛒 ¡Claro! Puedes ordenar de varias formas:\n\n1. 🌐 Aquí en la web → sección "Ordenar"\n2. 📱 WhatsApp: 55 1796 6419\n3. 🏠 Visítanos: Jose T. Cuellar 39, Obrera\n4. 🚗 Drive-through disponible\n5. 📦 Entrega sin contacto disponible\n\nAceptamos pedidos para comer aquí, para llevar y a domicilio.\n\n¿Qué te gustaría ordenar?';
  }

  // ─── FULL MENU ─────────────────────────────────────────────
  if (/menu completo|todo el menu|ver menu|ver el menu|carta|que tienen|que hay/.test(lower)) {
    const categories = [...new Set(menuData.map(i => i.category))];
    const catSummary = categories.map(cat => {
      const items = menuData.filter(i => i.category === cat);
      const minPrice = Math.min(...items.map(i => i.price));
      const maxPrice = Math.max(...items.map(i => i.price));
      return `• ${cat} (${items.length} platillos) - $${minPrice} a $${maxPrice}`;
    }).join('\n');

    return `📋 Nuestro menú tiene ${menuData.length}+ platillos en ${categories.length} categorías:\n\n${catSummary}\n\n¿De qué categoría te gustaría saber más? También puedes ver el menú completo en la sección "Menú" de la web.`;
  }

  // ─── RECOMMENDATIONS / BEST ────────────────────────────────
  if (/recomiend|mejor|favorito|popular|especial|estrella|top|best|must try|imperdible|que pido|que me/.test(lower)) {
    return '⭐ ¡Nuestros más pedidos según nuestros clientes!\n\n🥇 Queen Maki - Camarón empanizado envuelto en aguacate ($208)\n🥈 Dragon Queen - Maki con aguacate y mango, salmón o atún empanizado ($228)\n🥉 Spicy Tuna - Atún con salsa chipotle y queso manchego ($276)\n🏅 Salmón Picante - Salmón y aguacate con chiles toreados ($276)\n🍜 Yakisoba Mixto - Tallarines salteados mixtos ($146)\n📦 Paquete Eby Furai - Camarón empanizado + yakimeshi + ensalada ($311)\n\nNuestros clientes en Google Maps (4.6⭐, 160+ reseñas) destacan especialmente los makis empanizados, el yakisoba y los kushiages.\n\n¿Te gustaría ordenar alguno?';
  }

  // ─── SPECIFIC CATEGORIES ───────────────────────────────────
  if (/especialidad/.test(lower)) {
    return '⭐ Especialidades de la casa:\n\n• Gohan Especial - Tazón de gohan con pollo en salsa dulce ($127)\n• Ramen Especial - Fideos con carne y verduras en caldo de soya ($164)\n• Chop Suey Mixto - Soya, verduras, res, pollo y camarón ($173)\n• Gyu Don - Guisado de bistec sobre gohan ($147)\n• Tori Don - Guisado de pollo sobre gohan ($147)\n• Misoshiru - Caldo de miso con pollo, salmón, tofu y algas ($164)\n\n¡El Ramen y el Misoshiru son perfectos para días frescos! 🍜';
  }

  if (/kushiage|brocheta/.test(lower)) {
    return '🍢 Kushiages - Brochetas empanizadas (4 pzas.):\n\n• Plátano ($101)\n• Queso ($122)\n• Plátano con Queso ($144)\n• Pollo ($144)\n• Pollo con Queso ($158)\n• Surimi ($130)\n• Surimi con Queso ($158)\n• Camarón ($181)\n• Camarón con Queso ($196)\n• Salmón ($181)\n• Salmón con Queso ($196)\n\n¡Las de plátano con queso son las favoritas de nuestros clientes! 😋';
  }

  if (/tempura/.test(lower)) {
    return '🍤 Tempuras:\n\n• Verduras - $130\n• Camarón - $199\n• Mixto (verduras + camarón) - $233\n\nCrujientes y deliciosas. ¡La tempura de camarón es un clásico!';
  }

  if (/yakimeshi|arroz frito/.test(lower)) {
    return '🍚 Yakimeshi (Arroz frito):\n\n• Yasai (verduras) - $89\n• Tori (pollo) - $115\n• Gyuniku (res) - $115\n• Ebi (camarón) - $130\n• Shifudo (mariscos) - $141\n• Mixto - $154\n\nEl Yakimeshi Yasai viene incluido en todos los paquetes. ¡El de mariscos (Shifudo) es espectacular! 🔥';
  }

  if (/yakisoba|tallarin|fideo/.test(lower)) {
    return '🍜 Yakisoba (Tallarines con verduras):\n\n• Verduras - $121\n• Pollo - $130\n• Res - $130\n• Camarón - $137\n• Mixto - $146\n\nSegún nuestras reseñas en Google, el Yakisoba es uno de los platillos más elogiados. Un cliente dijo: "El yakisoba estuvo riquísimo, excelente sabor" ⭐';
  }

  if (/teppanyaki|plancha/.test(lower)) {
    return '🔥 Teppanyaki (A la plancha):\n\n• Verduras - $121\n• Res o Pollo - $156\n• Camarón - $173\n• Mixto - $199\n\nPreparado al momento en la plancha. ¡Fresco y delicioso!';
  }

  if (/paquete|combo|promocion|promo/.test(lower)) {
    return '📦 Paquetes (Incluyen Yakimeshi de verduras + Ensalada + Kushiage de queso):\n\n• Pechuga Maki - $181\n• Yakisoba - $181\n• Sushi Maki - $181\n• Tori Queso - $181\n• Sakana Furai (pescado empanizado) - $242\n• Eby Furai (camarón empanizado) - $311\n\n¡Son la mejor opción calidad-precio! Comes completo con entrada, plato fuerte y guarnición. 🎉';
  }

  if (/maki especial|maki premium|rollo especial/.test(lower)) {
    return '👑 Makis Especiales:\n\n• Frutas (mango/plátano/kiwi/fresa) - $144\n• Surimi - $156\n• Philadelphia - $161\n• Atún/Salmón/Camarón - $199\n• Arcoíris (7 ingredientes, dulce o salado) - $199\n• Queen Maki (camarón empanizado en aguacate) - $208\n• Dragon Queen (aguacate, mango, salmón/atún) - $228\n• Masago (huevas de capelán) - $240\n• Anguila - $264\n• Salmón Picante - $276\n• Spicy Tuna - $276\n• Combinación Queen (10 nigiris mixtos) - $276\n• Oniguiri - $96\n\n¡El Queen Maki y el Dragon Queen son los favoritos! 🐉';
  }

  if (/maki(?!.*especial)|sushi|rollo|roll/.test(lower)) {
    return '🍣 Makis (Base: aguacate, pepino y queso Philadelphia):\n\n• Kappa Maki (pepino) - $80\n• Mini Rollo - $84\n• Tekka Maki (atún o salmón) - $89\n• Sandwich - $95\n• Temaki - $101\n• Ajonjolí Tostado - $115\n• Empanizado - $124\n• Manchego - $124\n• Nori - $124\n• Empanizado de Manchego - $137\n• Nigiri (1 pza.) - $64\n\nTambién tenemos Makis Especiales desde $144. ¿Te cuento sobre ellos?';
  }

  if (/pasta|espagueti|fettuccine|fettucine|italiano/.test(lower)) {
    return '🍝 Pastas Queen (Elige espagueti o fettuccine):\n\n• Alfredo - Crema, mantequilla, parmesano, finas hierbas ($140)\n• Bolognesa - Tomate, vino tinto, carne molida, parmesano ($160)\n• Poblana - Chile poblano, elote, pollo, parmesano ($165)\n• 4 Quesos - Parmesano, crema, manchego, mozzarella ($165)\n• Di Salmón - Mantequilla, jitomate cherry, espinaca, salmón ($250)\n\n¡La Pasta di Salmón es una joya! Y la Poblana tiene un toque muy mexicano 🇲🇽';
  }

  // ─── PRICES ────────────────────────────────────────────────
  if (/precio|costo|cuanto|cuánto|barato|economico|caro|presupuesto|budget/.test(lower)) {
    return '💰 Rango de precios:\n\n• Más económico: Nigiri $64, Kappa Maki $80\n• Yakimeshi desde $89\n• Makis desde $80\n• Kushiages desde $101\n• Yakisoba desde $121\n• Paquetes completos desde $181\n• Makis Especiales desde $144\n• Pastas desde $140\n\nEl promedio por persona es de $200-$300 MXN. Nuestros clientes en Google destacan la excelente relación calidad-precio. ¡Hay opciones para todos los bolsillos! 😊';
  }

  // ─── REVIEWS / OPINIONS ────────────────────────────────────
  if (/resena|review|opinion|comentario|calificacion|rating|estrella|google|maps/.test(lower)) {
    return '⭐ Sushi Queen en Google Maps: 4.6/5 (160+ reseñas)\n\nLo que dicen nuestros clientes:\n\n🗣️ "Los platillos abundantes y muy ricos" - Lazito Mol\n🗣️ "Nos sorprendimos de lo rico del sushi, los makis están increíbles" - Keny\n🗣️ "El sushi está riquísimo y súper fresco, 100% recomendable" - JESSYNICE TOY\n🗣️ "El yakisoba estuvo riquísimo, excelente sabor" - Daniel Franco\n🗣️ "Delicioso y a buen precio" - Agasef Velnades\n🗣️ "El mejor sushi del rumbo" - Mauricio Vázquez\n🗣️ "Excelente lugar, buen precio, limpio y amabilidad" - Alicia Lita\n\n¡Nos encanta recibir sus comentarios! 💛';
  }

  // ─── ABOUT THE RESTAURANT ──────────────────────────────────
  if (/sobre|acerca|historia|quienes son|quien|negocio|restaurante|info/.test(lower)) {
    return '🍣 Sobre Sushi Queen:\n\nSomos un restaurante familiar de comida japonesa en la Colonia Obrera, CDMX, desde 2018. Dirigido por Jair Garcia.\n\n🐱 Temática de michis (gatos) - ¡A los cat lovers les encanta!\n🏳️‍🌈 LGBTQ+ friendly\n👩 Negocio identificado como de mujeres\n🎲 Juegos de mesa mientras esperas\n🍣 Todo preparado al momento con ingredientes frescos\n\n📍 Jose T. Cuellar 39, Obrera, 06800 CDMX\n📞 55 1796 6419\n🕐 Lun-Dom 1:00 PM - 10:00 PM\n⭐ 4.6 en Google Maps (160+ reseñas)\n\n¡La familia Sushi Queen te espera! 💛';
  }

  // ─── ALLERGIES / INGREDIENTS ───────────────────────────────
  if (/alerg|ingrediente|gluten|vegano|vegetariano|sin carne|mariscos|lacteo|intolerancia/.test(lower)) {
    return '🥗 Información sobre ingredientes:\n\n• Opciones vegetarianas: Yakimeshi Yasai, Yakisoba Verduras, Teppanyaki Verduras, Tempura Verduras, Kushiage Plátano/Queso, Kappa Maki\n• Sin mariscos: Kushiages de pollo/plátano/queso, Yakimeshi Tori/Gyuniku, Pastas (excepto di Salmón)\n• Pastas: Disponibles en espagueti o fettuccine\n\n⚠️ Nota: Trabajamos con mariscos, pescado, soya y lácteos en nuestra cocina. Si tienes alguna alergia específica, por favor infórmanos al hacer tu pedido.\n\n¿Tienes alguna restricción alimentaria en particular?';
  }

  // ─── PAYMENT ───────────────────────────────────────────────
  if (/pago|pagar|tarjeta|efectivo|transferencia|metodo/.test(lower)) {
    return '💳 Métodos de pago:\n\nAceptamos efectivo y los métodos de pago habituales. Para pedidos por WhatsApp o web, consulta las opciones disponibles al momento de ordenar.\n\n¿Te gustaría hacer un pedido?';
  }

  // ─── PARKING ───────────────────────────────────────────────
  if (/estacionamiento|parking|estacionar|carro|auto/.test(lower)) {
    return '🚗 Contamos con servicio de drive-through. El restaurante está en la Colonia Obrera, hay estacionamiento en la calle. Te recomendamos llegar temprano los fines de semana.\n\n📍 Jose T. Cuellar 39, Obrera, CDMX';
  }

  // ─── PETS ──────────────────────────────────────────────────
  if (/mascota|perro|gato|pet|dog|cat/.test(lower)) {
    return '🐾 ¡Sí, somos pet friendly! Puedes traer a tu mascota con correa. Tenemos temática de michis (gatos) en todo el restaurante. ¡A los cat lovers les encanta! 🐱\n\nSolo te pedimos que tu mascota esté con correa y controlada para no molestar a otros comensales.';
  }

  // ─── GAMES ─────────────────────────────────────────────────
  if (/juego|mesa|entretenimiento|espera|diversion/.test(lower)) {
    return '🎲 ¡Sí! Tenemos juegos de mesa disponibles para que te entretengas mientras esperas tu orden. Como todo se prepara al momento con ingredientes frescos, puede tomar 25-35 minutos. ¡Pero vale la pena la espera! 😄';
  }

  // ─── WAIT TIME ─────────────────────────────────────────────
  if (/tiempo|espera|tardan|demora|rapido|lento|cuanto tarda/.test(lower)) {
    return '⏱️ Tiempo de espera:\n\nComo preparamos todo al momento con ingredientes frescos, el tiempo promedio es de 25-35 minutos. ¡Pero tenemos juegos de mesa para que la espera sea divertida! 🎲\n\nPara pedidos a domicilio, el tiempo puede variar según la zona.';
  }

  // ─── RESERVATION ───────────────────────────────────────────
  if (/reserv|reservacion|apartar/.test(lower)) {
    return '📋 Actualmente no manejamos reservaciones formales ya que somos un lugar pequeño y acogedor. Te recomendamos llegar directamente. Los fines de semana suele haber más gente, así que te sugerimos llegar temprano (1-2 PM).\n\n📞 Si tienes dudas, llámanos al 55 1796 6419.';
  }

  // ─── SEARCH FOR SPECIFIC ITEM ──────────────────────────────
  const searchTerms = lower.split(/\s+/);
  const matchedItems = menuData.filter(item => {
    const itemLower = (item.name + ' ' + item.description).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return searchTerms.some(term => term.length > 3 && itemLower.includes(term));
  });

  if (matchedItems.length > 0 && matchedItems.length <= 8) {
    const itemList = matchedItems.map(i =>
      `• ${i.name} - $${i.price}\n  ${i.description}`
    ).join('\n\n');
    return `Encontré esto en nuestro menú:\n\n${itemList}\n\n¿Te gustaría ordenar alguno? 🍣`;
  }

  // ─── DEFAULT ───────────────────────────────────────────────
  return '¡Gracias por tu mensaje! 😊 Soy el asistente de Sushi Queen y puedo ayudarte con:\n\n• "menú" - Ver todas las categorías\n• "recomiéndame" - Nuestros favoritos\n• "precios" - Rango de precios\n• "horario" - Cuándo abrimos\n• "ubicación" - Cómo llegar\n• "ordenar" - Hacer un pedido\n• "reseñas" - Lo que dicen nuestros clientes\n• "pastas" / "makis" / "yakisoba" - Categorías específicas\n\n¿Qué te gustaría saber? 🍣';
}

export default AIChatbot;
