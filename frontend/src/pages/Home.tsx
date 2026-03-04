import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useMenu } from '../hooks/useMenu';
import MenuCard from '../components/menu/MenuCard';

const WHATSAPP_URL = 'https://wa.me/5517966419?text=Hola%20Sushi%20Queen!%20Quiero%20hacer%20un%20pedido';

const MOCK_PROMOS = [
  {
    id: '1',
    title: '15% OFF Primera Compra',
    description: '15% de descuento en tu primer pedido por la web. Código: BIENVENIDO15',
    image: '/images/promo_primera.png',
    badge: '15% OFF',
  },
  {
    id: '2',
    title: 'Camarones Coco $215',
    description: 'Camarones empanizados con coco, incluye yakimeshi, ensalada y kushiage.',
    image: '/images/promo1-Camarones-215.jpg',
    badge: '$215',
  },
  {
    id: '3',
    title: '2x1 en Makis',
    description: 'Lleva 2 makis y paga solo 1. Válido de lunes a miércoles. Código: MAKI2X1',
    image: '/images/promo1-2x1.png',
    badge: '2x1',
  },
];

const Home: React.FC = () => {
  const { items } = useMenu();
  const featuredItems = items.filter((i) => i.available).slice(0, 4);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="/images/hero-sushi.png"
            alt="Sushi Queen"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sushi-secondary/90 via-sushi-secondary/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <span className="inline-block text-sushi-accent font-medium text-sm tracking-wider uppercase mb-4">
              🍣 Sushi Queen
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              El mejor sushi <br />
              <span className="text-sushi-accent">de la Obrera, CDMX</span>
            </h1>
            <p className="text-gray-300 text-lg mt-6 leading-relaxed">
              Ingredientes frescos, preparación artesanal y sabor auténtico.
              Desde 2018 deleitando paladares en la Colonia Obrera.
              ⭐ 4.6 en Google Maps · 160+ reseñas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/menu" className="btn-primary text-center text-lg px-8">
                Ver Menú
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Pedir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-sushi-secondary">
            Nuestros Favoritos
          </h2>
          <p className="text-gray-500 mt-2">Los platos más pedidos por nuestros clientes</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item) => (
            <MenuCard key={item._id} item={item} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/menu" className="btn-secondary inline-block">
            Ver menú completo →
          </Link>
        </div>
      </section>

      {/* Promotions */}
      <section className="bg-sushi-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-white">
              Promociones <span className="text-sushi-accent">Activas</span>
            </h2>
            <p className="text-gray-400 mt-2">Aprovecha nuestras ofertas especiales</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_PROMOS.map((promo) => (
              <div key={promo.id} className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-sushi-accent/30 transition-colors group">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 right-3 bg-sushi-accent text-sushi-secondary text-xs font-bold px-3 py-1 rounded-full">
                    {promo.badge}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-white">{promo.title}</h3>
                  <p className="text-gray-400 text-sm mt-2">{promo.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/promotions"
              className="inline-block px-8 py-3 border-2 border-sushi-accent text-sushi-accent rounded-lg font-semibold hover:bg-sushi-accent hover:text-sushi-secondary transition-colors"
            >
              Ver todas las promociones
            </Link>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-green-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            ¿Prefieres pedir por WhatsApp?
          </h2>
          <p className="text-green-100 mb-6 max-w-md mx-auto">
            Escríbenos directamente y te atendemos al instante. Pedidos, consultas, lo que necesites.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Abrir WhatsApp
          </a>
        </div>
      </section>

      {/* About */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src="/images/about-sushi.png"
              alt="Sobre Sushi Queen"
              className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]"
              loading="lazy"
            />
            <div className="absolute -bottom-4 -right-4 bg-sushi-accent text-sushi-secondary p-4 rounded-xl shadow-lg hidden sm:block">
              <span className="text-3xl font-bold block">+5000</span>
              <span className="text-sm font-medium">Clientes felices</span>
            </div>
          </div>
          <div>
            <span className="text-sushi-accent font-medium text-sm tracking-wider uppercase">
              Nuestra historia
            </span>
            <h2 className="font-display text-3xl font-bold text-sushi-secondary mt-2">
              Pasión por el sushi desde 2018
            </h2>
            <p className="text-gray-600 mt-4 leading-relaxed">
              En Sushi Queen combinamos la tradición japonesa con el sazón mexicano.
              Cada pieza es preparada con ingredientes frescos del día, técnicas artesanales
              y mucho cariño. Somos un negocio familiar en la Colonia Obrera, CDMX.
            </p>
            <p className="text-gray-600 mt-3 leading-relaxed">
              Identificados como negocio de mujeres, LGBTQ+ friendly, y con una temática
              de michis que encanta a todos. Ven a disfrutar de juegos de mesa mientras
              esperas tu orden recién preparada.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <span className="text-2xl font-bold text-sushi-primary block">70+</span>
                <span className="text-xs text-gray-500">Platos en menú</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-sushi-primary block">$80-311</span>
                <span className="text-xs text-gray-500">Rango de precios</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-sushi-primary block">4.6★</span>
                <span className="text-xs text-gray-500">160 reseñas Google</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
