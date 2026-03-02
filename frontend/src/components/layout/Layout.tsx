import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Cart from '../cart/Cart';
import AIChatbot from '../chat/AIChatbot';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-sushi-bg">
      <Header onCartOpen={() => setCartOpen(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Cart open={cartOpen} onClose={() => setCartOpen(false)} />
      <AIChatbot />
    </div>
  );
};

export default Layout;
