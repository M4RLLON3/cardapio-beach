import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_STORE_CONFIG, CATEGORIES, PRODUCTS } from './data/storeData';
import { useCart } from './hooks/useCart';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { FloatingCartButton } from './components/FloatingCartButton';
import { AdminPage } from './pages/AdminPage';
import { BeachHouseLogo } from './components/BeachHouseLogo';

const STORE_CONFIG_STORAGE_KEY = 'beach_house_store_config_v1';
const PRODUCTS_STORAGE_KEY = 'beach_house_products_catalog_v2';
const ORDERS_STORAGE_KEY = 'beach_house_orders_v1';

export default function App() {
  // Controle de Rota / Página
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash === '#admin' || path === '/admin') return 'admin';
    return 'menu';
  });

  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === '#admin' || path === '/admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('menu');
      }
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const navigateToMenu = () => {
    window.location.hash = '';
    setCurrentPage('menu');
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
      return saved ? JSON.parse(saved) : PRODUCTS;
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

  const resetProductsToOfficialMenu = () => {
    setAllProducts(PRODUCTS);
    try {
      localStorage.removeItem('beach_house_products_catalog_v1');
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(PRODUCTS));
    } catch (e) {
      console.error(e);
    }
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

  // Agrupamento Dinâmico de Categorias para suportar grupos personalizados
  const dynamicCategories = useMemo(() => {
    const categoryMap = new Map();
    CATEGORIES.forEach((cat) => categoryMap.set(cat.id, cat));

    allProducts.forEach((prod) => {
      if (prod.categoryId && !categoryMap.has(prod.categoryId)) {
        categoryMap.set(prod.categoryId, {
          id: prod.categoryId,
          name: prod.categoryName || prod.categoryId.charAt(0).toUpperCase() + prod.categoryId.slice(1),
          iconName: 'Utensils',
          order: 99,
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [allProducts]);

  const [activeCategory, setActiveCategory] = useState(() => dynamicCategories[0]?.id || 'petiscos');

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

  // Rolagem suave para a categoria selecionada
  const handleSelectCategory = (categoryId) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const yOffset = -70;
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
    clearCart();
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setSubmittedOrder(orderData);
    setIsOrderSuccessOpen(true);
  };

  // Se o usuário estiver na página admin
  if (currentPage === 'admin') {
    return (
      <AdminPage
        storeInfo={storeInfo}
        onUpdateStoreInfo={updateStoreInfo}
        onResetStoreInfo={resetStoreInfo}
        products={allProducts}
        onUpdateProducts={updateProducts}
        onResetToOfficialMenu={resetProductsToOfficialMenu}
        orders={orders}
        onUpdateOrders={updateOrders}
        onBackToMenu={navigateToMenu}
      />
    );
  }

  // Página do Cardápio do Cliente
  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#2C3E18] pb-28 sm:pb-20 flex flex-col font-sans selection:bg-[#4A692D] selection:text-white">
      {/* Header do Cardápio */}
      <Header storeInfo={storeInfo} />

      {/* Barra de Navegação por Categorias Fixa */}
      {!searchQuery && (
        <CategoryNav
          categories={dynamicCategories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {/* Conteúdo Principal do Cardápio */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        
        {/* Barra de Pesquisa */}
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalResults={filteredProducts.length}
          isFiltering={!!searchQuery.trim()}
        />

        {/* Listagem de Produtos */}
        {searchQuery ? (
          // Modo Busca Ativa
          <div className="space-y-4">
            <h2 className="text-base font-black text-[#2C3E18] flex items-center gap-2">
              <span>Resultado da Busca</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF0DF] text-[#3A5323] border border-[#4A692D]/20">
                {filteredProducts.length}
              </span>
            </h2>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-[#FCFAF6] rounded-3xl border-2 border-[#DDD7C4] p-8 shadow-sm">
                <h3 className="font-black text-[#2C3E18] text-base">Nenhum produto encontrado</h3>
                <p className="text-xs text-[#2C3E18]/60 mt-1 max-w-sm mx-auto">
                  Não encontramos nenhum item com o termo "{searchQuery}".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-xs font-black bg-[#4A692D] text-white px-5 py-2.5 rounded-xl shadow-md"
                >
                  Ver todos os itens
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
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
          <div className="space-y-8 sm:space-y-10">
            {productsByCategory.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-20"
              >
                {/* Título da Categoria */}
                <div className="flex items-center gap-2 mb-3.5 pb-2 border-b-2 border-[#DDD7C4]">
                  <h2 className="text-base sm:text-lg font-black text-[#2C3E18] tracking-tight uppercase">
                    {category.name}
                  </h2>
                  <span className="text-xs font-bold text-[#2C3E18]/50 ml-auto">
                    {category.products.length} itens
                  </span>
                </div>

                {/* Grade de Cards de Produtos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
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

      {/* Rodapé Limpo do Cliente */}
      <footer className="mt-16 border-t-2 border-[#DDD7C4] bg-[#FCFAF6] py-8 text-center text-xs text-[#2C3E18]/70">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <BeachHouseLogo size="normal" />
          <p className="text-[11px] text-[#2C3E18]/50 mt-2">
            Cardápio Digital Oficial • Beach House Sports N' Bar
          </p>
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
