import React, { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { INITIAL_STORE_CONFIG, CATEGORIES, PRODUCTS } from './data/storeData';
import { useCart } from './hooks/useCart';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { FloatingCartButton } from './components/FloatingCartButton';
import { AdminPage } from './pages/AdminPage';
import { AdminAuthView } from './components/AdminAuthView';
import { broadcastNewOrder, unlockAudioOnFirstInteraction } from './utils/orderNotification';

const STORE_CONFIG_STORAGE_KEY = 'beach_house_store_config_v1';
const PRODUCTS_STORAGE_KEY = 'beach_house_products_catalog_v2';
const ORDERS_STORAGE_KEY = 'beach_house_orders_v1';

export default function App() {
  // Controle de Rota / Página
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = (window.location.hash || '').toLowerCase();
    const path = (window.location.pathname || '').toLowerCase();
    if (hash === '#admin' || hash === '#/admin' || path === '/admin') return 'admin';
    return 'menu';
  });

  // Sessão de Autenticação do Lojista
  const [adminSession, setAdminSession] = useState(() => {
    try {
      const saved = localStorage.getItem('beach_house_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem('beach_house_admin_session');
    } catch {}
    setAdminSession(null);
  };

  useEffect(() => {
    const handleNavigation = () => {
      const hash = (window.location.hash || '').toLowerCase();
      const path = (window.location.pathname || '').toLowerCase();
      if (hash === '#admin' || hash === '#/admin' || path === '/admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('menu');
      }
    };

    unlockAudioOnFirstInteraction();

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const navigateToMenu = () => {
    try {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname);
      }
    } catch {
      window.location.hash = '';
    }
    setCurrentPage('menu');
  };

  const navigateToAdmin = () => {
    try {
      window.location.hash = 'admin';
    } catch {}
    setCurrentPage('admin');
  };

  // Configurações da Loja
  const [storeInfo, setStoreInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORE_CONFIG_STORAGE_KEY);
      return saved ? { ...INITIAL_STORE_CONFIG, ...JSON.parse(saved) } : INITIAL_STORE_CONFIG;
    } catch {
      return INITIAL_STORE_CONFIG;
    }
  });

  const updateStoreInfo = (newInfo) => {
    setStoreInfo(newInfo);
    try {
      localStorage.setItem(STORE_CONFIG_STORAGE_KEY, JSON.stringify(newInfo));
    } catch (e) {
      console.error(e);
    }
  };

  const resetStoreInfo = () => {
    setStoreInfo(INITIAL_STORE_CONFIG);
    try {
      localStorage.removeItem(STORE_CONFIG_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Produtos do Cardápio
  const [allProducts, setAllProducts] = useState(() => {
    try {
      localStorage.removeItem('beach_house_products_catalog_v1');
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtra qualquer destilado remanescente da versão anterior apagado pelo usuário
        return parsed.filter((p) => p.categoryId !== 'destilados' && !p.id?.startsWith('dest-'));
      }
      return PRODUCTS;
    } catch {
      return PRODUCTS;
    }
  });

  const updateProducts = (newProducts) => {
    setAllProducts(newProducts);
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts));
    } catch (e) {
      console.error(e);
    }
  };

  const DELETED_CATEGORIES_KEY = 'beach_house_deleted_categories_v1';
  const [deletedCategoryIds, setDeletedCategoryIds] = useState(() => {
    try {
      const saved = localStorage.getItem(DELETED_CATEGORIES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDeleteCategory = (categoryId) => {
    const nextDeleted = [...new Set([...deletedCategoryIds, categoryId])];
    setDeletedCategoryIds(nextDeleted);
    try {
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(nextDeleted));
    } catch (e) {
      console.error(e);
    }
    // Remove produtos pertencentes à categoria excluída
    const remainingProducts = allProducts.filter((p) => p.categoryId !== categoryId);
    updateProducts(remainingProducts);
  };

  // Pedidos da Loja (Persistidos e Sincronizados)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const updateOrders = (newOrders) => {
    setOrders(newOrders);
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(newOrders));
    } catch (e) {
      console.error(e);
    }
  };

  // Sincroniza em tempo real com outras abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Carrinho
  const {
    items: cartItems,
    subtotal,
    totalCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Estados dos Modais
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Modal de Pedido Concluído com Sucesso do Cliente
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);

  // Busca e Filtros
  const [searchQuery, setSearchQuery] = useState('');

  // Agrupamento Dinâmico de Categorias (categorias sem produtos somem automaticamente do cardápio)
  const dynamicCategories = useMemo(() => {
    const categoryMap = new Map();

    const baseMap = new Map();
    CATEGORIES.forEach((cat) => {
      if (!deletedCategoryIds.includes(cat.id)) {
        baseMap.set(cat.id, cat);
      }
    });

    allProducts.forEach((prod) => {
      if (prod.categoryId && !deletedCategoryIds.includes(prod.categoryId)) {
        if (baseMap.has(prod.categoryId)) {
          categoryMap.set(prod.categoryId, baseMap.get(prod.categoryId));
        } else if (!categoryMap.has(prod.categoryId)) {
          categoryMap.set(prod.categoryId, {
            id: prod.categoryId,
            name: prod.categoryName || (prod.categoryId.charAt(0).toUpperCase() + prod.categoryId.slice(1)),
            iconName: 'Utensils',
            order: 99,
          });
        }
      }
    });

    // Quando uma categoria não tiver produto ela automaticamente some do cardápio!
    const categoriesWithProducts = Array.from(categoryMap.values()).filter((cat) => {
      return allProducts.some((p) => p.categoryId === cat.id);
    });

    return categoriesWithProducts;
  }, [allProducts, deletedCategoryIds]);

  const [activeCategory, setActiveCategory] = useState(() => dynamicCategories[0]?.id || 'porcoes');

  // Se a categoria ativa atual não tiver mais produtos ou sumir, seleciona a primeira disponível
  useEffect(() => {
    if (dynamicCategories.length > 0 && !dynamicCategories.some((c) => c.id === activeCategory)) {
      setActiveCategory(dynamicCategories[0].id);
    }
  }, [dynamicCategories, activeCategory]);

  // Refs e efeito para centralizar a categoria selecionada no scroll lateral
  const categoryTabRefs = React.useRef({});

  useEffect(() => {
    if (activeCategory && categoryTabRefs.current[activeCategory]) {
      categoryTabRefs.current[activeCategory].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  // Filtragem de produtos pela busca
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return allProducts;
    const query = searchQuery.toLowerCase().trim();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }, [searchQuery, allProducts]);

  // Produtos agrupados por categoria
  const productsByCategory = useMemo(() => {
    return dynamicCategories.map((cat) => ({
      ...cat,
      products: filteredProducts.filter((p) => p.categoryId === cat.id),
    })).filter((cat) => cat.products.length > 0);
  }, [filteredProducts, dynamicCategories]);

  // Rolagem suave para a categoria selecionada e centralização da aba
  const handleSelectCategory = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryTabRefs.current[categoryId]) {
      categoryTabRefs.current[categoryId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const yOffset = -130;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  // Quando o cliente submete o pedido
  const handleOrderSubmitted = (orderData) => {
    const updated = [orderData, ...orders];
    updateOrders(updated);
    broadcastNewOrder(orderData);
    clearCart();
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setSubmittedOrder(orderData);
    setIsOrderSuccessOpen(true);
  };

  // Se o usuário estiver na página admin
  if (currentPage === 'admin') {
    if (!adminSession) {
      return (
        <AdminAuthView
          onLoginSuccess={(session) => {
            setAdminSession(session);
          }}
          onBackToMenu={navigateToMenu}
          onSyncStoreInfo={(info) => {
            if (updateStoreInfo) {
              updateStoreInfo({
                ...(info.name ? { name: info.name } : {}),
                ...(info.address ? { address: info.address } : {}),
                ...(info.whatsappNumber ? { whatsappNumber: info.whatsappNumber } : {}),
              });
            }
          }}
        />
      );
    }

    return (
      <AdminPage
        storeInfo={storeInfo}
        onUpdateStoreInfo={updateStoreInfo}
        onResetStoreInfo={resetStoreInfo}
        products={allProducts}
        categories={dynamicCategories}
        onUpdateProducts={updateProducts}
        onDeleteCategory={handleDeleteCategory}
        orders={orders}
        onUpdateOrders={updateOrders}
        onBackToMenu={navigateToMenu}
        adminSession={adminSession}
        onLogout={handleAdminLogout}
      />
    );
  }

  // Página do Cardápio do Cliente (Layout Editorial com adaptação para Mobile)
  return (
    <div className="min-h-screen bg-[#fbf9f5] font-manrope text-[#1b1c1a] pb-28 sm:pb-24 flex flex-col antialiased selection:bg-[#daeaaa] selection:text-[#161f00]">
      {/* Header Editorial do Cardápio */}
      <Header storeInfo={storeInfo} />

      {/* Barra de Filtros e Busca de Categorias integrada */}
      <div className="sticky top-0 z-30 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-[#dedad2] shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Categorias com scroll horizontal suave adaptado para mobile */}
          <nav
            aria-label="Categorias do Cardápio"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-2 px-2 sm:mx-0 sm:px-0"
          >
            {dynamicCategories.map((cat) => {
              const isActive = activeCategory === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  ref={(el) => (categoryTabRefs.current[cat.id] = el)}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="group relative px-3 sm:px-4 py-2 text-left whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer"
                  type="button"
                >
                  <span
                    className={`font-grotesk text-xs sm:text-sm uppercase tracking-wider ${
                      isActive
                        ? 'text-[#132512] font-bold'
                        : 'text-[#747870] hover:text-[#132512] font-semibold'
                    }`}
                  >
                    {cat.name}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#132512] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Campo de Busca Rápida */}
          <div className="relative w-full lg:w-72 flex-shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747870] w-4 h-4 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar sabor ou ingrediente..."
              className="w-full bg-[#f5f3ef] border border-[#dedad2] pl-10 pr-9 py-2 text-xs sm:text-sm text-[#1b1c1a] placeholder:text-[#747870] font-manrope rounded-xl focus:outline-none focus:bg-white focus:border-[#283b26] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747870] hover:text-[#132512] p-1 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal do Cardápio */}
      <main className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-32 flex-1">
        {searchQuery ? (
          // Modo Busca Ativa
          <div className="space-y-6">
            <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-[#dedad2]">
              <div>
                <span className="font-grotesk text-[11px] sm:text-xs uppercase tracking-widest text-[#747870] block">
                  Resultado da Busca
                </span>
                <h1 className="font-grotesk text-2xl sm:text-3xl text-[#132512] font-bold tracking-tight">
                  "{searchQuery}"
                </h1>
              </div>
              <span className="font-grotesk text-xs uppercase tracking-wider text-[#747870]">
                {filteredProducts.length} itens encontrados
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#dedad2] p-8 shadow-xs">
                <h3 className="font-grotesk font-bold text-[#132512] text-lg">Nenhum produto encontrado</h3>
                <p className="font-manrope text-sm text-[#747870] mt-1.5 max-w-sm mx-auto">
                  Não encontramos nenhum item com o termo "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-5 text-xs font-grotesk font-bold uppercase tracking-wider bg-[#283b26] hover:bg-[#132512] text-white px-6 py-3 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Ver todos os itens do cardápio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={handleOpenProduct}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Modo Normal Agrupado por Categorias
          <div className="space-y-12 sm:space-y-16">
            {productsByCategory.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-24"
              >
                {/* Título da Categoria Estilo Editorial */}
                <div className="flex items-baseline justify-between mb-6 sm:mb-8 pb-3 border-b border-[#dedad2]">
                  <div>
                    <span className="font-grotesk text-[11px] sm:text-xs uppercase tracking-widest text-[#747870] block">
                      Seleção para Mesa
                    </span>
                    <h2 className="font-grotesk text-2xl sm:text-3xl text-[#132512] font-bold tracking-tight">
                      {category.name}
                    </h2>
                  </div>
                  <span className="font-grotesk text-xs uppercase tracking-wider text-[#747870] hidden sm:block">
                    {category.products.length} {category.products.length === 1 ? 'receita artesanal' : 'receitas artesanais'}
                  </span>
                </div>

                {/* 2x2 Bento Editorial Grid adaptado para Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {category.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={handleOpenProduct}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Rodapé Editorial do Cardápio */}
      <footer className="w-full bg-[#f5f3ef] border-t border-[#dedad2] mt-16 sm:mt-24">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row items-baseline justify-between gap-6 pb-8 border-b border-[#dedad2]">
            <div className="space-y-2">
              <p className="font-grotesk text-lg sm:text-xl font-bold tracking-tight text-[#132512]">
                BEACH HOUSE SPORTS N' BAR
              </p>
              <p className="font-manrope text-xs sm:text-sm text-[#434841] max-w-md leading-relaxed">
                Gastronomia costeira despretensiosa, coquetelaria autoral e a energia do esporte à beira da areia.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 font-grotesk text-xs uppercase tracking-wider text-[#434841]">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-[#132512] transition-colors"
              >
                Menu Digital
              </a>
              <span className="hover:text-[#132512] transition-colors cursor-pointer">Reservas</span>
              <span className="hover:text-[#132512] transition-colors cursor-pointer">Quadras & Lounge</span>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-grotesk text-[11px] sm:text-xs text-[#747870] uppercase tracking-widest">
            <span>© {new Date().getFullYear()} Beach House Sports N' Bar. Todos os direitos reservados.</span>
            <span>Ambiente Calmo • Práticas Sustentáveis</span>
          </div>
        </div>
      </footer>

      {/* Modal de Detalhes do Produto */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={addToCart}
      />

      {/* Drawer do Carrinho */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        deliveryFee={storeInfo.deliveryFee}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        deliveryFee={storeInfo.deliveryFee}
        storeInfo={storeInfo}
        onOrderSubmitted={handleOrderSubmitted}
      />

      {/* Modal de Confirmação e Sucesso do Cliente */}
      <OrderSuccessModal
        order={submittedOrder}
        isOpen={isOrderSuccessOpen}
        onClose={() => setIsOrderSuccessOpen(false)}
        storeInfo={storeInfo}
      />

      {/* Botão Flutuante do Carrinho */}
      <FloatingCartButton
        totalCount={totalCount}
        subtotal={subtotal}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
