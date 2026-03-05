import{j as e,e as $}from"./index-5Z7zwtU2.js";import{r as m,u as C,L as p,e as M}from"./vendor-IyE87Von.js";import{c as S}from"./state-DTbPobMn.js";import{p as L,a as T}from"./api-Oxzd_j-s.js";import{m as b}from"./menuData-SpH9tcNn.js";const N=S()(L((s,a)=>({items:[],addItem:t=>s(r=>r.items.find(n=>n.menu_item_id===t.menu_item_id)?{items:r.items.map(n=>n.menu_item_id===t.menu_item_id?{...n,quantity:n.quantity+t.quantity}:n)}:{items:[...r.items,t]}),removeItem:t=>s(r=>({items:r.items.filter(o=>o.menu_item_id!==t)})),updateQuantity:(t,r)=>s(o=>r<=0?{items:o.items.filter(n=>n.menu_item_id!==t)}:{items:o.items.map(n=>n.menu_item_id===t?{...n,quantity:r}:n)}),clearCart:()=>s({items:[]}),getTotal:()=>{const{items:t}=a();return t.reduce((r,o)=>{const n=o.modifiers.reduce((c,i)=>c+i.price,0);return r+(o.price+n)*o.quantity},0)},getItemCount:()=>{const{items:t}=a();return t.reduce((r,o)=>r+o.quantity,0)}}),{name:"sushi-queen-cart"})),q=({onCartOpen:s})=>{const[a,t]=m.useState(!1),r=C(),o=N(i=>i.getItemCount()),n=[{to:"/",label:"Home"},{to:"/menu",label:"Menú"},{to:"/promotions",label:"Promociones"},{to:"/order",label:"Ordenar"}],c=i=>r.pathname===i;return e.jsxs("header",{className:"bg-sushi-secondary sticky top-0 z-50 shadow-lg",children:[e.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:e.jsxs("div",{className:"flex items-center justify-between h-16",children:[e.jsxs(p,{to:"/",className:"flex items-center gap-2",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sushi Queen",className:"h-10 w-10 object-contain"}),e.jsxs("span",{className:"font-display text-xl font-bold text-white",children:["Sushi ",e.jsx("span",{className:"text-sushi-accent",children:"Queen"})]})]}),e.jsx("nav",{className:"hidden md:flex items-center gap-1",children:n.map(i=>e.jsx(p,{to:i.to,className:`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${c(i.to)?"bg-sushi-primary text-white":"text-gray-300 hover:text-white hover:bg-white/10"}`,children:i.label},i.to))}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("button",{onClick:s,className:"relative p-2 text-gray-300 hover:text-white transition-colors","aria-label":"Abrir carrito",children:[e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"})}),o>0&&e.jsx("span",{className:"absolute -top-1 -right-1 bg-sushi-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center",children:o})]}),e.jsx("button",{onClick:()=>t(!a),className:"md:hidden p-2 text-gray-300 hover:text-white","aria-label":"Abrir menú",children:a?e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})}):e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 6h16M4 12h16M4 18h16"})})})]})]})}),a&&e.jsx("div",{className:"md:hidden bg-sushi-secondary border-t border-white/10",children:e.jsx("nav",{className:"px-4 py-3 space-y-1",children:n.map(i=>e.jsx(p,{to:i.to,onClick:()=>t(!1),className:`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${c(i.to)?"bg-sushi-primary text-white":"text-gray-300 hover:text-white hover:bg-white/10"}`,children:i.label},i.to))})})]})},P="5517966419",z=`https://wa.me/${P}?text=Hola%20Sushi%20Queen!%20Quiero%20hacer%20un%20pedido`,E=()=>e.jsx("footer",{className:"bg-sushi-secondary text-gray-300",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-8",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-4",children:[e.jsx("img",{src:"/images/logo.png",alt:"Sushi Queen",className:"h-10 w-10 object-contain"}),e.jsxs("span",{className:"font-display text-xl font-bold text-white",children:["Sushi ",e.jsx("span",{className:"text-sushi-accent",children:"Queen"})]})]}),e.jsx("p",{className:"text-sm leading-relaxed",children:"El mejor sushi de la Colonia Obrera, CDMX. Ingredientes frescos, preparación artesanal y un ambiente familiar con temática de michis 🐱"}),e.jsx("p",{className:"text-xs text-gray-500 mt-2",children:"⭐ 4.6 · 160 reseñas en Google Maps"})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white font-semibold mb-4",children:"Navegación"}),e.jsxs("ul",{className:"space-y-2 text-sm",children:[e.jsx("li",{children:e.jsx(p,{to:"/",className:"hover:text-sushi-accent transition-colors",children:"Home"})}),e.jsx("li",{children:e.jsx(p,{to:"/menu",className:"hover:text-sushi-accent transition-colors",children:"Menú"})}),e.jsx("li",{children:e.jsx(p,{to:"/promotions",className:"hover:text-sushi-accent transition-colors",children:"Promociones"})}),e.jsx("li",{children:e.jsx(p,{to:"/order",className:"hover:text-sushi-accent transition-colors",children:"Ordenar"})})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white font-semibold mb-4",children:"Contacto"}),e.jsxs("ul",{className:"space-y-3 text-sm",children:[e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx("svg",{className:"w-4 h-4 text-sushi-accent",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"})}),"55 1796 6419"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx("svg",{className:"w-4 h-4 text-sushi-accent",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"})}),"sushiqueen.mx"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsxs("svg",{className:"w-4 h-4 text-sushi-accent",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:[e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"}),e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 11a3 3 0 11-6 0 3 3 0 016 0z"})]}),"Jose T. Cuellar 39, Obrera, Cuauhtémoc, 06800 CDMX"]}),e.jsxs("li",{className:"flex items-center gap-2",children:[e.jsx("svg",{className:"w-4 h-4 text-sushi-accent",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})}),"Lun-Dom: 1:00 PM - 10:00 PM"]})]}),e.jsxs("div",{className:"flex items-center gap-4 mt-4",children:[e.jsx("a",{href:z,target:"_blank",rel:"noopener noreferrer",className:"bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors","aria-label":"WhatsApp",children:e.jsx("svg",{className:"w-5 h-5",fill:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{d:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"})})}),e.jsx("a",{href:"https://www.instagram.com/sushiqueenmx",target:"_blank",rel:"noopener noreferrer",className:"text-gray-400 hover:text-sushi-accent transition-colors","aria-label":"Instagram",children:e.jsx("svg",{className:"w-5 h-5",fill:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{d:"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"})})}),e.jsx("a",{href:"https://www.facebook.com/sushiqueenmx/",target:"_blank",rel:"noopener noreferrer",className:"text-gray-400 hover:text-sushi-accent transition-colors","aria-label":"Facebook",children:e.jsx("svg",{className:"w-5 h-5",fill:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{d:"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"})})})]})]})]}),e.jsxs("div",{className:"border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-500",children:["© ",new Date().getFullYear()," Sushi Queen. Desarrollado por MexInTouch. Todos los derechos reservados."]})]})});function D(){const{items:s,addItem:a,removeItem:t,updateQuantity:r,clearCart:o,getTotal:n,getItemCount:c}=N(),i=(g,l=1)=>{const f={menu_item_id:g._id,name:g.name,quantity:l,price:g.price,modifiers:[]};a(f),$(f)},u=n(),h=0,d=u,y=c();return{items:s,addItem:a,addMenuItem:i,removeItem:t,updateQuantity:r,clearCart:o,subtotal:u,tax:h,total:d,itemCount:y}}function v(s){return"$"+s.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(s){return Number.isInteger(s)?"$"+s.toLocaleString("en-US"):v(s)}const A=({item:s})=>{const{updateQuantity:a,removeItem:t}=N(),r=s.modifiers.reduce((n,c)=>n+c.price,0),o=(s.price+r)*s.quantity;return e.jsxs("div",{className:"flex items-start gap-3 py-4 border-b border-gray-100 last:border-0",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h4",{className:"font-medium text-sushi-secondary text-sm truncate",children:s.name}),s.modifiers.length>0&&e.jsx("p",{className:"text-xs text-gray-400 mt-0.5",children:s.modifiers.map(n=>n.name).join(", ")}),s.notes&&e.jsx("p",{className:"text-xs text-gray-400 italic mt-0.5",children:s.notes}),e.jsx("p",{className:"text-sm font-semibold text-sushi-primary mt-1",children:Q(o)})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>a(s.menu_item_id,s.quantity-1),className:"w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 transition-colors","aria-label":"Reducir cantidad",children:"−"}),e.jsx("span",{className:"text-sm font-medium w-5 text-center",children:s.quantity}),e.jsx("button",{onClick:()=>a(s.menu_item_id,s.quantity+1),className:"w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 transition-colors","aria-label":"Aumentar cantidad",children:"+"})]}),e.jsx("button",{onClick:()=>t(s.menu_item_id),className:"text-gray-300 hover:text-sushi-primary transition-colors p-1","aria-label":"Eliminar item",children:e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"})})})]})},_=({subtotal:s,total:a})=>e.jsxs("div",{className:"border-t border-gray-200 pt-4 space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm text-gray-600",children:[e.jsx("span",{children:"Subtotal"}),e.jsx("span",{children:v(s)})]}),e.jsx("div",{className:"flex justify-between text-xs text-gray-400",children:e.jsx("span",{children:"IVA incluido"})}),e.jsxs("div",{className:"flex justify-between text-lg font-bold text-sushi-secondary pt-2 border-t border-gray-100",children:[e.jsx("span",{children:"Total"}),e.jsx("span",{children:v(a)})]})]}),O=({open:s,onClose:a})=>{const{items:t,subtotal:r,tax:o,total:n,clearCart:c}=D(),i=M(),u=()=>{a(),i("/order")};return e.jsxs(e.Fragment,{children:[s&&e.jsx("div",{className:"fixed inset-0 bg-black/50 z-40 transition-opacity",onClick:a}),e.jsx("div",{className:`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${s?"translate-x-0":"translate-x-full"}`,children:e.jsxs("div",{className:"flex flex-col h-full",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 border-b border-gray-100",children:[e.jsx("h2",{className:"text-lg font-bold text-sushi-secondary",children:"Tu Pedido"}),e.jsx("button",{onClick:a,className:"p-2 text-gray-400 hover:text-gray-600 transition-colors","aria-label":"Cerrar carrito",children:e.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsx("div",{className:"flex-1 overflow-y-auto px-6",children:t.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center h-full text-gray-400",children:[e.jsx("svg",{className:"w-16 h-16 mb-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.5,d:"M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"})}),e.jsx("p",{className:"text-sm",children:"Tu carrito está vacío"}),e.jsx("button",{onClick:()=>{a(),i("/menu")},className:"mt-4 text-sushi-primary text-sm font-medium hover:underline",children:"Ver menú"})]}):e.jsx("div",{className:"py-2",children:t.map(h=>e.jsx(A,{item:h},h.menu_item_id))})}),t.length>0&&e.jsxs("div",{className:"px-6 py-4 border-t border-gray-100 space-y-4",children:[e.jsx(_,{subtotal:r,tax:o,total:n}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("button",{onClick:c,className:"flex-1 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors",children:"Vaciar"}),e.jsxs("button",{onClick:u,className:"flex-[2] btn-primary text-center",children:["Ordenar · $",n.toLocaleString("en-US",{minimumFractionDigits:2})]})]})]})]})})]})},I={id:"welcome",role:"assistant",content:`¡Hola! 🍣 Soy el asistente virtual de Sushi Queen. Puedo ayudarte con:

• Recomendaciones personalizadas
• Menú completo y precios
• Ingredientes y alérgenos
• Horarios y ubicación
• Hacer tu pedido
• Opiniones de clientes

¿En qué te puedo ayudar?`,timestamp:new Date},B=()=>{const[s,a]=m.useState(!1),[t,r]=m.useState([I]),[o,n]=m.useState(""),[c,i]=m.useState(!1),u=m.useRef(null),h=m.useRef(null);m.useEffect(()=>{var l;(l=u.current)==null||l.scrollIntoView({behavior:"smooth"})},[t]),m.useEffect(()=>{var l;s&&((l=h.current)==null||l.focus())},[s]);const d=async()=>{var f;if(!o.trim()||c)return;const l={id:Date.now().toString(),role:"user",content:o.trim(),timestamp:new Date};r(x=>[...x,l]),n(""),i(!0);try{const{data:x}=await T.post("/ai/chat",{message:l.content}),j={id:(Date.now()+1).toString(),role:"assistant",content:((f=x.data)==null?void 0:f.response)||x.message||k(l.content),timestamp:new Date};r(w=>[...w,j])}catch{const x={id:(Date.now()+1).toString(),role:"assistant",content:k(l.content),timestamp:new Date};r(j=>[...j,x])}finally{i(!1)}},y=l=>{l.key==="Enter"&&!l.shiftKey&&(l.preventDefault(),d())},g=[{label:"📋 Ver menú",msg:"Quiero ver el menú completo"},{label:"⭐ Recomendaciones",msg:"Qué me recomiendas?"},{label:"📍 Ubicación",msg:"Dónde están ubicados?"},{label:"🛒 Ordenar",msg:"Quiero hacer un pedido"}];return e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>a(!s),className:"fixed bottom-6 right-6 z-50 bg-sushi-primary hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all hover:scale-105","aria-label":"Abrir chat de asistencia",children:s?e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})}):e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"})})}),s&&e.jsxs("div",{className:"fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden",style:{height:"520px"},children:[e.jsxs("div",{className:"bg-sushi-secondary px-4 py-3 flex items-center gap-3",children:[e.jsx("div",{className:"w-9 h-9 bg-sushi-accent rounded-full flex items-center justify-center text-lg",children:"🍣"}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-white font-semibold text-sm",children:"Sushi Queen AI"}),e.jsx("p",{className:"text-gray-400 text-xs",children:"Asistente virtual · En línea"})]}),e.jsx("div",{className:"w-2 h-2 bg-green-400 rounded-full animate-pulse"})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50",children:[t.map(l=>e.jsx("div",{className:`flex ${l.role==="user"?"justify-end":"justify-start"}`,children:e.jsx("div",{className:`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${l.role==="user"?"bg-sushi-primary text-white rounded-br-md":"bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm"}`,children:l.content})},l.id)),c&&e.jsx("div",{className:"flex justify-start",children:e.jsx("div",{className:"bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm",children:e.jsxs("div",{className:"flex gap-1",children:[e.jsx("div",{className:"w-2 h-2 bg-gray-400 rounded-full animate-bounce",style:{animationDelay:"0ms"}}),e.jsx("div",{className:"w-2 h-2 bg-gray-400 rounded-full animate-bounce",style:{animationDelay:"150ms"}}),e.jsx("div",{className:"w-2 h-2 bg-gray-400 rounded-full animate-bounce",style:{animationDelay:"300ms"}})]})})}),t.length<=2&&!c&&e.jsx("div",{className:"flex flex-wrap gap-2",children:g.map(l=>e.jsx("button",{onClick:()=>{n(l.msg)},className:"text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-sushi-primary/5 hover:border-sushi-primary/30 transition-colors",children:l.label},l.label))}),e.jsx("div",{ref:u})]}),e.jsx("div",{className:"p-3 border-t border-gray-200 bg-white",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx("input",{ref:h,type:"text",value:o,onChange:l=>n(l.target.value),onKeyDown:y,placeholder:"Escribe tu mensaje...",className:"flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sushi-primary/20 focus:border-sushi-primary"}),e.jsx("button",{onClick:d,disabled:!o.trim()||c,className:"bg-sushi-primary hover:bg-red-700 disabled:opacity-50 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors","aria-label":"Enviar mensaje",children:e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8"})})})]})})]})]})};function k(s){const a=s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");if(/^(hola|hey|buenas|buenos|que tal|hi|hello|ola|saludos)/.test(a))return`¡Hola! 👋 Bienvenido a Sushi Queen, el mejor sushi de la Colonia Obrera en CDMX.

Tenemos más de 70 platillos en 11 categorías. ¿Te gustaría que te recomiende algo o prefieres ver el menú completo? 🍣`;if(/gracias|thanks|thx|agradec/.test(a))return"¡Con mucho gusto! 😊 En Sushi Queen siempre es un placer atenderte. Si necesitas algo más, aquí estoy. ¡Buen provecho! 🍣✨";if(/adios|bye|hasta luego|nos vemos|chao/.test(a))return"¡Hasta pronto! 👋 Fue un gusto ayudarte. Recuerda que estamos en Jose T. Cuellar 39, Obrera, CDMX. ¡Te esperamos de 1 a 10 PM! 🍣";if(/horario|hora|abren|cierran|abierto|cerrado|cuando|schedule|open|close/.test(a))return`🕐 Nuestro horario:

Lunes a Domingo: 1:00 PM - 10:00 PM

Abrimos todos los días de la semana. Te recomendamos llegar temprano los fines de semana ya que suele haber más gente. ¡Te esperamos!`;if(/direccion|ubicacion|donde|donde estan|como llego|llegar|mapa|maps|address|location/.test(a))return`📍 Estamos en:

Jose T. Cuellar 39, Colonia Obrera
Cuauhtémoc, 06800 Ciudad de México

Referencia: Cerca del metro Obrera (Línea 8)
Código Plus: CV85+QF Mexico City

Puedes buscarnos en Google Maps como "Sushi Queen" y te aparecemos con 4.6 estrellas ⭐

¿Necesitas indicaciones desde algún punto?`;if(/telefono|llamar|contacto|whatsapp|numero|cel|phone|contact/.test(a))return`📞 Contáctanos:

• Teléfono: 55 1796 6419
• WhatsApp: 55 1796 6419
• Web: sushiqueen.mx
• Menú Fudo: menu.fu.do

Por WhatsApp puedes hacer pedidos directamente. ¡Respondemos rápido! 💬`;if(/pedido|ordenar|pedir|orden|delivery|domicilio|llevar|para llevar|take out|envio/.test(a))return`🛒 ¡Claro! Puedes ordenar de varias formas:

1. 🌐 Aquí en la web → sección "Ordenar"
2. 📱 WhatsApp: 55 1796 6419
3. 🏠 Visítanos: Jose T. Cuellar 39, Obrera
4. 🚗 Drive-through disponible
5. 📦 Entrega sin contacto disponible

Aceptamos pedidos para comer aquí, para llevar y a domicilio.

¿Qué te gustaría ordenar?`;if(/menu completo|todo el menu|ver menu|ver el menu|carta|que tienen|que hay/.test(a)){const o=[...new Set(b.map(c=>c.category))],n=o.map(c=>{const i=b.filter(d=>d.category===c),u=Math.min(...i.map(d=>d.price)),h=Math.max(...i.map(d=>d.price));return`• ${c} (${i.length} platillos) - $${u} a $${h}`}).join(`
`);return`📋 Nuestro menú tiene ${b.length}+ platillos en ${o.length} categorías:

${n}

¿De qué categoría te gustaría saber más? También puedes ver el menú completo en la sección "Menú" de la web.`}if(/recomiend|mejor|favorito|popular|especial|estrella|top|best|must try|imperdible|que pido|que me/.test(a))return`⭐ ¡Nuestros más pedidos según nuestros clientes!

🥇 Queen Maki - Camarón empanizado envuelto en aguacate ($208)
🥈 Dragon Queen - Maki con aguacate y mango, salmón o atún empanizado ($228)
🥉 Spicy Tuna - Atún con salsa chipotle y queso manchego ($276)
🏅 Salmón Picante - Salmón y aguacate con chiles toreados ($276)
🍜 Yakisoba Mixto - Tallarines salteados mixtos ($146)
📦 Paquete Eby Furai - Camarón empanizado + yakimeshi + ensalada ($311)

Nuestros clientes en Google Maps (4.6⭐, 160+ reseñas) destacan especialmente los makis empanizados, el yakisoba y los kushiages.

¿Te gustaría ordenar alguno?`;if(/especialidad/.test(a))return`⭐ Especialidades de la casa:

• Gohan Especial - Tazón de gohan con pollo en salsa dulce ($127)
• Ramen Especial - Fideos con carne y verduras en caldo de soya ($164)
• Chop Suey Mixto - Soya, verduras, res, pollo y camarón ($173)
• Gyu Don - Guisado de bistec sobre gohan ($147)
• Tori Don - Guisado de pollo sobre gohan ($147)
• Misoshiru - Caldo de miso con pollo, salmón, tofu y algas ($164)

¡El Ramen y el Misoshiru son perfectos para días frescos! 🍜`;if(/kushiage|brocheta/.test(a))return`🍢 Kushiages - Brochetas empanizadas (4 pzas.):

• Plátano ($101)
• Queso ($122)
• Plátano con Queso ($144)
• Pollo ($144)
• Pollo con Queso ($158)
• Surimi ($130)
• Surimi con Queso ($158)
• Camarón ($181)
• Camarón con Queso ($196)
• Salmón ($181)
• Salmón con Queso ($196)

¡Las de plátano con queso son las favoritas de nuestros clientes! 😋`;if(/tempura/.test(a))return`🍤 Tempuras:

• Verduras - $130
• Camarón - $199
• Mixto (verduras + camarón) - $233

Crujientes y deliciosas. ¡La tempura de camarón es un clásico!`;if(/yakimeshi|arroz frito/.test(a))return`🍚 Yakimeshi (Arroz frito):

• Yasai (verduras) - $89
• Tori (pollo) - $115
• Gyuniku (res) - $115
• Ebi (camarón) - $130
• Shifudo (mariscos) - $141
• Mixto - $154

El Yakimeshi Yasai viene incluido en todos los paquetes. ¡El de mariscos (Shifudo) es espectacular! 🔥`;if(/yakisoba|tallarin|fideo/.test(a))return`🍜 Yakisoba (Tallarines con verduras):

• Verduras - $121
• Pollo - $130
• Res - $130
• Camarón - $137
• Mixto - $146

Según nuestras reseñas en Google, el Yakisoba es uno de los platillos más elogiados. Un cliente dijo: "El yakisoba estuvo riquísimo, excelente sabor" ⭐`;if(/teppanyaki|plancha/.test(a))return`🔥 Teppanyaki (A la plancha):

• Verduras - $121
• Res o Pollo - $156
• Camarón - $173
• Mixto - $199

Preparado al momento en la plancha. ¡Fresco y delicioso!`;if(/paquete|combo|promocion|promo/.test(a))return`📦 Paquetes (Incluyen Yakimeshi de verduras + Ensalada + Kushiage de queso):

• Pechuga Maki - $181
• Yakisoba - $181
• Sushi Maki - $181
• Tori Queso - $181
• Sakana Furai (pescado empanizado) - $242
• Eby Furai (camarón empanizado) - $311

¡Son la mejor opción calidad-precio! Comes completo con entrada, plato fuerte y guarnición. 🎉`;if(/maki especial|maki premium|rollo especial/.test(a))return`👑 Makis Especiales:

• Frutas (mango/plátano/kiwi/fresa) - $144
• Surimi - $156
• Philadelphia - $161
• Atún/Salmón/Camarón - $199
• Arcoíris (7 ingredientes, dulce o salado) - $199
• Queen Maki (camarón empanizado en aguacate) - $208
• Dragon Queen (aguacate, mango, salmón/atún) - $228
• Masago (huevas de capelán) - $240
• Anguila - $264
• Salmón Picante - $276
• Spicy Tuna - $276
• Combinación Queen (10 nigiris mixtos) - $276
• Oniguiri - $96

¡El Queen Maki y el Dragon Queen son los favoritos! 🐉`;if(/maki(?!.*especial)|sushi|rollo|roll/.test(a))return`🍣 Makis (Base: aguacate, pepino y queso Philadelphia):

• Kappa Maki (pepino) - $80
• Mini Rollo - $84
• Tekka Maki (atún o salmón) - $89
• Sandwich - $95
• Temaki - $101
• Ajonjolí Tostado - $115
• Empanizado - $124
• Manchego - $124
• Nori - $124
• Empanizado de Manchego - $137
• Nigiri (1 pza.) - $64

También tenemos Makis Especiales desde $144. ¿Te cuento sobre ellos?`;if(/pasta|espagueti|fettuccine|fettucine|italiano/.test(a))return`🍝 Pastas Queen (Elige espagueti o fettuccine):

• Alfredo - Crema, mantequilla, parmesano, finas hierbas ($140)
• Bolognesa - Tomate, vino tinto, carne molida, parmesano ($160)
• Poblana - Chile poblano, elote, pollo, parmesano ($165)
• 4 Quesos - Parmesano, crema, manchego, mozzarella ($165)
• Di Salmón - Mantequilla, jitomate cherry, espinaca, salmón ($250)

¡La Pasta di Salmón es una joya! Y la Poblana tiene un toque muy mexicano 🇲🇽`;if(/precio|costo|cuanto|cuánto|barato|economico|caro|presupuesto|budget/.test(a))return`💰 Rango de precios:

• Más económico: Nigiri $64, Kappa Maki $80
• Yakimeshi desde $89
• Makis desde $80
• Kushiages desde $101
• Yakisoba desde $121
• Paquetes completos desde $181
• Makis Especiales desde $144
• Pastas desde $140

El promedio por persona es de $200-$300 MXN. Nuestros clientes en Google destacan la excelente relación calidad-precio. ¡Hay opciones para todos los bolsillos! 😊`;if(/resena|review|opinion|comentario|calificacion|rating|estrella|google|maps/.test(a))return`⭐ Sushi Queen en Google Maps: 4.6/5 (160+ reseñas)

Lo que dicen nuestros clientes:

🗣️ "Los platillos abundantes y muy ricos" - Lazito Mol
🗣️ "Nos sorprendimos de lo rico del sushi, los makis están increíbles" - Keny
🗣️ "El sushi está riquísimo y súper fresco, 100% recomendable" - JESSYNICE TOY
🗣️ "El yakisoba estuvo riquísimo, excelente sabor" - Daniel Franco
🗣️ "Delicioso y a buen precio" - Agasef Velnades
🗣️ "El mejor sushi del rumbo" - Mauricio Vázquez
🗣️ "Excelente lugar, buen precio, limpio y amabilidad" - Alicia Lita

¡Nos encanta recibir sus comentarios! 💛`;if(/sobre|acerca|historia|quienes son|quien|negocio|restaurante|info/.test(a))return`🍣 Sobre Sushi Queen:

Somos un restaurante familiar de comida japonesa en la Colonia Obrera, CDMX, desde 2018. Dirigido por Jair Garcia.

🐱 Temática de michis (gatos) - ¡A los cat lovers les encanta!
🏳️‍🌈 LGBTQ+ friendly
👩 Negocio identificado como de mujeres
🎲 Juegos de mesa mientras esperas
🍣 Todo preparado al momento con ingredientes frescos

📍 Jose T. Cuellar 39, Obrera, 06800 CDMX
📞 55 1796 6419
🕐 Lun-Dom 1:00 PM - 10:00 PM
⭐ 4.6 en Google Maps (160+ reseñas)

¡La familia Sushi Queen te espera! 💛`;if(/alerg|ingrediente|gluten|vegano|vegetariano|sin carne|mariscos|lacteo|intolerancia/.test(a))return`🥗 Información sobre ingredientes:

• Opciones vegetarianas: Yakimeshi Yasai, Yakisoba Verduras, Teppanyaki Verduras, Tempura Verduras, Kushiage Plátano/Queso, Kappa Maki
• Sin mariscos: Kushiages de pollo/plátano/queso, Yakimeshi Tori/Gyuniku, Pastas (excepto di Salmón)
• Pastas: Disponibles en espagueti o fettuccine

⚠️ Nota: Trabajamos con mariscos, pescado, soya y lácteos en nuestra cocina. Si tienes alguna alergia específica, por favor infórmanos al hacer tu pedido.

¿Tienes alguna restricción alimentaria en particular?`;if(/pago|pagar|tarjeta|efectivo|transferencia|metodo/.test(a))return`💳 Métodos de pago:

Aceptamos efectivo y los métodos de pago habituales. Para pedidos por WhatsApp o web, consulta las opciones disponibles al momento de ordenar.

¿Te gustaría hacer un pedido?`;if(/estacionamiento|parking|estacionar|carro|auto/.test(a))return`🚗 Contamos con servicio de drive-through. El restaurante está en la Colonia Obrera, hay estacionamiento en la calle. Te recomendamos llegar temprano los fines de semana.

📍 Jose T. Cuellar 39, Obrera, CDMX`;if(/mascota|perro|gato|pet|dog|cat/.test(a))return`🐾 ¡Sí, somos pet friendly! Puedes traer a tu mascota con correa. Tenemos temática de michis (gatos) en todo el restaurante. ¡A los cat lovers les encanta! 🐱

Solo te pedimos que tu mascota esté con correa y controlada para no molestar a otros comensales.`;if(/juego|mesa|entretenimiento|espera|diversion/.test(a))return"🎲 ¡Sí! Tenemos juegos de mesa disponibles para que te entretengas mientras esperas tu orden. Como todo se prepara al momento con ingredientes frescos, puede tomar 25-35 minutos. ¡Pero vale la pena la espera! 😄";if(/tiempo|espera|tardan|demora|rapido|lento|cuanto tarda/.test(a))return`⏱️ Tiempo de espera:

Como preparamos todo al momento con ingredientes frescos, el tiempo promedio es de 25-35 minutos. ¡Pero tenemos juegos de mesa para que la espera sea divertida! 🎲

Para pedidos a domicilio, el tiempo puede variar según la zona.`;if(/reserv|reservacion|apartar/.test(a))return`📋 Actualmente no manejamos reservaciones formales ya que somos un lugar pequeño y acogedor. Te recomendamos llegar directamente. Los fines de semana suele haber más gente, así que te sugerimos llegar temprano (1-2 PM).

📞 Si tienes dudas, llámanos al 55 1796 6419.`;const t=a.split(/\s+/),r=b.filter(o=>{const n=(o.name+" "+o.description).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");return t.some(c=>c.length>3&&n.includes(c))});return r.length>0&&r.length<=8?`Encontré esto en nuestro menú:

${r.map(n=>`• ${n.name} - $${n.price}
  ${n.description}`).join(`

`)}

¿Te gustaría ordenar alguno? 🍣`:`¡Gracias por tu mensaje! 😊 Soy el asistente de Sushi Queen y puedo ayudarte con:

• "menú" - Ver todas las categorías
• "recomiéndame" - Nuestros favoritos
• "precios" - Rango de precios
• "horario" - Cuándo abrimos
• "ubicación" - Cómo llegar
• "ordenar" - Hacer un pedido
• "reseñas" - Lo que dicen nuestros clientes
• "pastas" / "makis" / "yakisoba" - Categorías específicas

¿Qué te gustaría saber? 🍣`}const Y=({children:s})=>{const[a,t]=m.useState(!1);return e.jsxs("div",{className:"min-h-screen flex flex-col bg-sushi-bg",children:[e.jsx(q,{onCartOpen:()=>t(!0)}),e.jsx("main",{className:"flex-1",children:s}),e.jsx(E,{}),e.jsx(O,{open:a,onClose:()=>t(!1)}),e.jsx(B,{})]})};export{A as C,Y as L,_ as a,Q as f,D as u};
