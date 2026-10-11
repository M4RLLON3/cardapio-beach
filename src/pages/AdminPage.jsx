import React, { useState, useMemo } from 'react';
import {
  Settings,
  Phone,
  DollarSign,
  MapPin,
  Clock,
  Save,
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Plus,
  Trash2,
  X,
  Pencil,
  ClipboardList,
  MessageCircle,
  Bike,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  AlertCircle,
  FileText,
  Calendar,
  Filter,
  Search,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import {
  formatCurrency,
  formatPhone,
  buildStoreToCustomerMessage,
  generateWhatsAppUrl,
} from '../utils/formatters';
import { generateCompletedOrdersPdf } from '../utils/pdfReport';
import { AdminAuthView, formatCNPJ } from '../components/AdminAuthView';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getPdfDateFilterResult(orders, preset, customStart, customEnd) {
  const completed = orders.filter((o) => o.status === 'entregue');

  if (preset === 'all') {
    return {
      filteredOrders: completed,
      label: 'Todo o Histórico',
    };
  }

  let startDate, endDate, label;
  const now = new Date();

  if (preset === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    label = `Hoje (${startDate.toLocaleDateString('pt-BR')})`;
  } else if (preset === 'yesterday') {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    label = `Ontem (${startDate.toLocaleDateString('pt-BR')})`;
  } else if (preset === '7days') {
    const past7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    startDate = new Date(past7.getFullYear(), past7.getMonth(), past7.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    label = `Últimos 7 dias (${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')})`;
  } else if (preset === 'thisMonth') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthName = startDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    label = `Este Mês (${capitalizedMonth})`;
  } else if (preset === 'custom') {
    if (customStart && customEnd) {
      const [sY, sM, sD] = customStart.split('-').map(Number);
      const [eY, eM, eD] = customEnd.split('-').map(Number);
      startDate = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      endDate = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      label = `Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;
    } else if (customStart) {
      const [sY, sM, sD] = customStart.split('-').map(Number);
      startDate = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      endDate = new Date();
      label = `A partir de ${startDate.toLocaleDateString('pt-BR')}`;
    } else if (customEnd) {
      const [eY, eM, eD] = customEnd.split('-').map(Number);
      startDate = new Date(2000, 0, 1);
      endDate = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      label = `Até ${endDate.toLocaleDateString('pt-BR')}`;
    } else {
      return {
        filteredOrders: completed,
        label: 'Todo o Histórico',
      };
    }
  } else {
    return {
      filteredOrders: completed,
      label: 'Todo o Histórico',
    };
  }

  const filteredOrders = completed.filter((order) => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    if (isNaN(orderDate.getTime())) return false;
    return orderDate >= startDate && orderDate <= endDate;
  });

  return { filteredOrders, label };
}

const DEFAULT_CATEGORIES = [
  { id: "petiscos", name: "Porções & Petiscos" },
  { id: "burgers", name: "Burgers & Sanduíches" },
  { id: "drinks", name: "Drinks & Caipiras" },
  { id: "bebidas", name: "Cervejas & Não Alcoólicos" },
  { id: "sobremesas", name: "Açaí & Sobremesas" },
];

export function AdminPage({
  storeInfo,
  onUpdateStoreInfo,
  onResetStoreInfo,
  products,
  onUpdateProducts,
  orders = [],
  onUpdateOrders,
  onBackToMenu,
}) {
  const [formData, setFormData] = useState({
    name: storeInfo.name,
    subtitle: storeInfo.subtitle,
    whatsappNumber: storeInfo.whatsappNumber,
    pixKey: storeInfo.pixKey,
    deliveryFee: storeInfo.deliveryFee,
    address: storeInfo.address,
    openingHours: storeInfo.openingHours,
    estimatedTime: storeInfo.estimatedTime,
  });

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'settings'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pendente' | 'em_preparo' | 'entregue'
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [productFeedback, setProductFeedback] = useState(null);

  // Filtro e Busca de Produtos
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Modal para Adicionar Novo Produto
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: 'petiscos',
    customCategoryName: '',
    price: '',
    description: '',
    imageUrl: '',
    isAvailable: true,
  });

  // Modal para Editar Produto Existente
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Modal de Filtro de Data para Relatório PDF
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfDatePreset, setPdfDatePreset] = useState('today'); // 'today' | 'yesterday' | '7days' | 'thisMonth' | 'custom' | 'all'
  const [pdfStartDate, setPdfStartDate] = useState(() => getLocalDateString());
  const [pdfEndDate, setPdfEndDate] = useState(() => getLocalDateString());

  // Dados calculados para o relatório PDF
  const { filteredOrders: pdfFilteredOrders, label: pdfPeriodLabel } = getPdfDateFilterResult(
    orders,
    pdfDatePreset,
    pdfStartDate,
    pdfEndDate
  );
  const pdfTotalRevenue = pdfFilteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const pdfAverageTicket = pdfFilteredOrders.length > 0 ? pdfTotalRevenue / pdfFilteredOrders.length : 0;

  const pendingOrdersCount = orders.filter((o) => o.status === 'pendente').length;

  // Sessão de Autenticação do Lojista
  const [adminSession, setAdminSession] = useState(() => {
    try {
      const saved = localStorage.getItem('beach_house_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('beach_house_admin_session');
    setAdminSession(null);
  };

  // Se não estiver autenticado, exibe a tela de login com CNPJ e solicitação de acesso
  if (!adminSession) {
    return (
      <AdminAuthView
        onLoginSuccess={(session) => {
          setAdminSession(session);
        }}
        onBackToMenu={onBackToMenu}
        onSyncStoreInfo={(info) => {
          if (onUpdateStoreInfo) {
            onUpdateStoreInfo({
              ...(info.name ? { name: info.name } : {}),
              ...(info.address ? { address: info.address } : {}),
              ...(info.whatsappNumber ? { whatsappNumber: info.whatsappNumber } : {}),
            });
          }
        }}
      />
    );
  }

  const handleSaveStore = (e) => {
    e.preventDefault();
    onUpdateStoreInfo({
      ...storeInfo,
      ...formData,
      deliveryFee: parseFloat(formData.deliveryFee) || 0,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const showProductFeedback = (msg) => {
    setProductFeedback(msg);
    setTimeout(() => setProductFeedback(null), 3000);
  };

  // Pedidos: Chamar Cliente no WhatsApp
  const handleCallCustomer = (order) => {
    const message = buildStoreToCustomerMessage({ order, storeInfo });
    const url = generateWhatsAppUrl(order.customerPhone, message);
    window.open(url, '_blank');

    if (order.status === 'pendente' && onUpdateOrders) {
      const updated = orders.map((o) => (o.id === order.id ? { ...o, status: 'em_preparo' } : o));
      onUpdateOrders(updated);
    }
  };

  // Pedidos: Atualizar Status
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    if (!onUpdateOrders) return;
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    onUpdateOrders(updated);
  };

  // Pedidos: Excluir Pedido
  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Deseja excluir este pedido do histórico?')) {
      if (!onUpdateOrders) return;
      const updated = orders.filter((o) => o.id !== orderId);
      onUpdateOrders(updated);
    }
  };

  // Alternar disponibilidade de produto
  const toggleProductAvailability = (productId) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, isAvailable: !p.isAvailable };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Excluir Produto
  const handleDeleteProduct = (productId, productName) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${productName}"?`)) {
      const updated = products.filter((p) => p.id !== productId);
      onUpdateProducts(updated);
      showProductFeedback(`Produto "${productName}" removido com sucesso.`);
    }
  };

  // Abrir modal de edição para um produto
  const handleOpenEditModal = (product) => {
    const isCustomCat = !DEFAULT_CATEGORIES.some((c) => c.id === product.categoryId);
    setEditingProduct({
      ...product,
      isCustomCategory: isCustomCat,
      customCategoryName: isCustomCat ? (product.categoryName || product.categoryId) : '',
    });
    setIsEditProductOpen(true);
  };

  // Salvar Edição do Produto
  const handleSaveEditedProduct = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.name.trim()) {
      alert('Informe o nome do produto.');
      return;
    }
    const parsedPrice = parseFloat(String(editingProduct.price).replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    const categoryId = editingProduct.isCustomCategory
      ? editingProduct.customCategoryName.trim().toLowerCase().replace(/\s+/g, '-') || 'outros'
      : editingProduct.categoryId;

    const updated = products.map((p) => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          name: editingProduct.name.trim(),
          categoryId,
          categoryName: editingProduct.isCustomCategory ? editingProduct.customCategoryName.trim() : undefined,
          price: parsedPrice,
          description: editingProduct.description.trim(),
          imageUrl: editingProduct.imageUrl.trim() || p.imageUrl,
          isAvailable: editingProduct.isAvailable,
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setIsEditProductOpen(false);
    setEditingProduct(null);
    showProductFeedback(`Produto "${editingProduct.name}" atualizado com sucesso.`);
  };

  // Adicionar Novo Produto
  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      alert('Informe o nome do produto.');
      return;
    }
    const parsedPrice = parseFloat(String(newProduct.price).replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }

    const categoryId = newProduct.categoryId === 'custom' 
      ? newProduct.customCategoryName.trim().toLowerCase().replace(/\s+/g, '-') || 'outros'
      : newProduct.categoryId;

    const fallbackImages = {
      petiscos: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
      burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      drinks: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      bebidas: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
      sobremesas: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
    };

    const finalImage = newProduct.imageUrl.trim() 
      ? newProduct.imageUrl.trim()
      : (fallbackImages[categoryId] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');

    const created = {
      id: `prod-${Date.now()}`,
      categoryId,
      categoryName: newProduct.categoryId === 'custom' ? newProduct.customCategoryName.trim() : undefined,
      name: newProduct.name.trim(),
      description: newProduct.description.trim() || 'Sem descrição informada.',
      price: parsedPrice,
      imageUrl: finalImage,
      isAvailable: true,
    };

    const updated = [created, ...products];
    onUpdateProducts(updated);
    setIsAddProductOpen(false);
    setNewProduct({
      name: '',
      categoryId: 'petiscos',
      customCategoryName: '',
      price: '',
      description: '',
      imageUrl: '',
      isAvailable: true,
    });
    showProductFeedback(`Produto "${created.name}" adicionado com sucesso.`);
  };

  const getCategoryLabel = (catId, customName) => {
    if (customName) return customName;
    const found = DEFAULT_CATEGORIES.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  // Categorias disponíveis para o filtro de produtos
  const availableCategoriesForFilter = useMemo(() => {
    const list = [...DEFAULT_CATEGORIES];
    products.forEach((p) => {
      if (p.categoryId && !list.some((c) => c.id === p.categoryId)) {
        list.push({
          id: p.categoryId,
          name: p.categoryName || (p.categoryId.charAt(0).toUpperCase() + p.categoryId.slice(1)),
        });
      }
    });
    return list;
  }, [products]);

  // Filtragem dinâmica de produtos
  const filteredAdminProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = productCategoryFilter === 'all' || p.categoryId === productCategoryFilter;
      if (!matchesCat) return false;
      if (!productSearchQuery.trim()) return true;
      const q = productSearchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [products, productCategoryFilter, productSearchQuery]);

  // Filtragem de pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilter === 'all') return true;
      return o.status === orderFilter;
    });
  }, [orders, orderFilter]);

  return (
    <div className="min-h-screen flex flex-col font-sans select-none antialiased bg-[#FAF8F3] text-[#1E2B20]">
      
      {/* TopBar Navegação Mobile e Desktop */}
      <header className="sticky top-0 z-40 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#EBE7DF]">
        {/* Linha Superior: Voltar, Loja e Status */}
        <div className="px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
          {/* Voltar ao Cardápio */}
          <button
            type="button"
            onClick={onBackToMenu}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315433] hover:text-[#233F25] py-1.5 px-2.5 rounded-full bg-[#EBF2EA] transition-colors cursor-pointer"
            title="Ver Cardápio do Cliente"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Cardápio</span>
          </button>

          {/* Nome da Loja com Ícone (sem a escrita 'Painel da Loja') */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Store className="w-4 h-4 text-[#315433] shrink-0" />
            <span className="text-sm sm:text-base font-bold tracking-tight text-[#1E2B20] truncate">
              {adminSession.arena?.nome || storeInfo.name}
            </span>
          </div>

          {/* Status, CNPJ e Botão Sair */}
          <div className="flex items-center gap-2">
            <div
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EBF2EA] text-[#2D592C] text-[11px] font-bold"
              title={`CNPJ Autorizado: ${formatCNPJ(adminSession.arena?.cnpj || '60456569000198')}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{formatCNPJ(adminSession.arena?.cnpj || '60456569000198')}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 px-2.5 py-1 rounded-full transition cursor-pointer"
              title="Sair do Painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Abas Segmentadas de Navegação */}
        <nav aria-label="Seções do Painel" className="flex px-3 gap-1 overflow-x-auto no-scrollbar pt-1 text-sm font-medium max-w-5xl mx-auto w-full border-t border-[#EBE7DF]/40">
          {/* Aba Produtos */}
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'text-[#315433] font-bold border-b-2 border-[#315433]'
                : 'text-[#6A786D] hover:text-[#1E2B20]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Produtos</span>
          </button>

          {/* Aba Pedidos */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'text-[#315433] font-bold border-b-2 border-[#315433]'
                : 'text-[#6A786D] hover:text-[#1E2B20]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-[#315433] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          {/* Aba Dados da Loja */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'text-[#315433] font-bold border-b-2 border-[#315433]'
                : 'text-[#6A786D] hover:text-[#1E2B20]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Dados & WhatsApp</span>
          </button>
        </nav>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 px-4 py-4 max-w-md md:max-w-4xl mx-auto w-full space-y-4">
        
        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-[#EAF3E9] border border-emerald-200 text-[#2D592C] flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-[#2D592C] shrink-0" />
            <span>Configurações atualizadas e salvas com sucesso.</span>
          </div>
        )}

        {productFeedback && (
          <div className="p-3.5 rounded-2xl bg-[#EAF3E9] border border-emerald-200 text-[#2D592C] flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-[#2D592C] shrink-0" />
            <span>{productFeedback}</span>
          </div>
        )}

        {/* 1. ABA DE PRODUTOS (CATÁLOGO MOBILE) */}
        {activeTab === 'products' && (
          <div>
            {/* Header da Seção & Botão Novo Item */}
            <section className="mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-[#1E2B20]">Catálogo</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#315433]">
                      {filteredAdminProducts.length} itens
                    </span>
                  </div>
                  <p className="text-xs text-[#6A786D] mt-0.5">Gerencie disponibilidade, preços e receitas.</p>
                </div>

                {/* Botão Novo Item (Olive Green Pill) */}
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-[#315433] hover:bg-[#233F25] active:scale-95 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Novo Item</span>
                </button>
              </div>

              {/* Filtro Rápido de Categorias (Horizontal Scroll) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
                <button
                  type="button"
                  onClick={() => setProductCategoryFilter('all')}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    productCategoryFilter === 'all'
                      ? 'font-semibold bg-[#315433] text-white shadow-xs'
                      : 'font-medium bg-white text-[#6A786D] border border-[#EBE7DF] hover:border-[#315433]'
                  }`}
                >
                  Todos ({products.length})
                </button>

                {availableCategoriesForFilter.map((cat) => {
                  const isActive = productCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setProductCategoryFilter(cat.id)}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                        isActive
                          ? 'font-semibold bg-[#315433] text-white shadow-xs'
                          : 'font-medium bg-white text-[#6A786D] border border-[#EBE7DF] hover:border-[#315433]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Busca Rápida de Produtos */}
              <div className="relative w-full mt-3">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="search"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Buscar prato, drink ou ingrediente..."
                  className="w-full pl-8 pr-4 py-2 rounded-xl bg-white border border-[#EBE7DF] text-xs text-[#1E2B20] placeholder-[#6A786D]/70 focus:outline-none focus:border-[#315433] transition"
                />
              </div>
            </section>

            {/* Lista dos Cards de Produtos */}
            {filteredAdminProducts.length === 0 ? (
              <div className="py-12 text-center text-[#6A786D] space-y-2 bg-white rounded-2xl border border-[#EBE7DF] p-6">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-40 text-[#6A786D]" />
                <p className="text-sm font-semibold">Nenhum produto encontrado neste filtro.</p>
              </div>
            ) : (
              <div className="space-y-3" role="list">
                {filteredAdminProducts.map((product) => (
                  <article
                    key={product.id}
                    className="bg-white rounded-2xl p-3 border border-[#EBE7DF]/80 shadow-xs transition-all"
                  >
                    <div className="flex gap-3">
                      {/* Foto do Produto */}
                      <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[#FAF8F3] border border-[#EBE7DF]">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                      </div>

                      {/* Informações do Produto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#315433] bg-[#DEEAD8]/70 px-2 py-0.5 rounded-md">
                            {getCategoryLabel(product.categoryId, product.categoryName)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#1E2B20] truncate leading-snug">
                          {product.name}
                        </h3>
                        <p className="text-xs text-[#6A786D] line-clamp-2 mt-0.5 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Rodapé do Card: Preço, Status e Ações */}
                    <div className="mt-3 pt-2.5 border-t border-[#EBE7DF]/60 flex items-center justify-between gap-2">
                      {/* Pílula de Preço */}
                      <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-2.5 py-1.5 rounded-lg border border-[#EBE7DF]/70">
                        <span className="text-[10px] font-semibold text-[#6A786D]">PREÇO</span>
                        <span className="text-xs font-bold text-[#1E2B20]">
                          {formatCurrency(product.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Status Toggle (Ativo / Pausado) */}
                        <button
                          type="button"
                          onClick={() => toggleProductAvailability(product.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                            product.isAvailable
                              ? 'bg-[#EAF3E9] text-[#2D592C] border-emerald-200/60'
                              : 'bg-[#FDF1F0] text-[#C94A4A] border-red-200/60'
                          }`}
                          title="Alternar disponibilidade no cardápio"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.isAvailable ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          ></span>
                          <span>{product.isAvailable ? 'Ativo' : 'Pausado'}</span>
                        </button>

                        {/* Botão Editar Produto */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(product)}
                          className="w-8 h-8 rounded-lg bg-[#FAF8F3] hover:bg-[#EBF2EA] border border-[#EBE7DF]/80 flex items-center justify-center text-[#6A786D] hover:text-[#315433] transition-colors cursor-pointer"
                          title="Editar produto"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Botão Excluir Produto */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="w-8 h-8 rounded-lg bg-[#FDF1F0]/60 hover:bg-[#FDF1F0] border border-red-200/50 flex items-center justify-center text-[#C94A4A] transition-colors cursor-pointer"
                          title="Excluir produto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ABA DE PEDIDOS (MOBILE) */}
        {activeTab === 'orders' && (
          <div>
            <section className="mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-[#1E2B20]">Pedidos</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EBF2EA] text-[#315433]">
                      {orders.length} pedidos
                    </span>
                    {pendingOrdersCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {pendingOrdersCount} pendente{pendingOrdersCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6A786D] mt-0.5">Acompanhe novos pedidos e chame clientes.</p>
                </div>

                {/* Botão de Relatório PDF */}
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF8F3] text-[#315433] border border-[#EBE7DF] text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                  title="Filtrar por data e emitir relatório dos pedidos finalizados em PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-[#315433]" />
                  <span>Relatório PDF</span>
                  {orders.filter((o) => o.status === 'entregue').length > 0 && (
                    <span className="bg-[#315433] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {orders.filter((o) => o.status === 'entregue').length}
                    </span>
                  )}
                </button>
              </div>

              {/* Filtros de Status (Horizontal Scroll) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    orderFilter === 'all'
                      ? 'font-semibold bg-[#315433] text-white shadow-xs'
                      : 'font-medium bg-white text-[#6A786D] border border-[#EBE7DF]'
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('pendente')}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    orderFilter === 'pendente'
                      ? 'font-semibold bg-amber-600 text-white shadow-xs'
                      : 'font-medium bg-white text-[#6A786D] border border-[#EBE7DF]'
                  }`}
                >
                  Pendentes ({orders.filter((o) => o.status === 'pendente').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('em_preparo')}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    orderFilter === 'em_preparo'
                      ? 'font-semibold bg-blue-600 text-white shadow-xs'
                      : 'font-medium bg-white text-[#6A786D] border border-[#EBE7DF]'
                  }`}
                >
                  Em Preparo ({orders.filter((o) => o.status === 'em_preparo').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('entregue')}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    orderFilter === 'entregue'
                      ? 'font-semibold bg-emerald-600 text-white shadow-xs'
                      : 'font-medium bg-white text-[#6A786D] border border-[#EBE7DF]'
                  }`}
                >
                  Finalizados ({orders.filter((o) => o.status === 'entregue').length})
                </button>
              </div>
            </section>

            {/* Lista dos Cards de Pedidos */}
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-[#6A786D] space-y-2 bg-white rounded-2xl border border-[#EBE7DF] p-6">
                <ClipboardList className="w-10 h-10 mx-auto opacity-40 text-[#6A786D]" />
                <p className="text-sm font-semibold">Nenhum pedido encontrado nesta visualização.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const isDelivery = order.orderType === 'delivery';

                  return (
                    <article
                      key={order.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#EBE7DF]/80 shadow-xs space-y-3"
                    >
                      {/* Topo: ID, Horário, Tipo e Status */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EBE7DF]/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[#1E2B20]">
                            Pedido #{order.id}
                          </span>
                          <span className="text-[11px] text-[#6A786D]">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              isDelivery
                                ? 'bg-[#DEEAD8] text-[#2D592C]'
                                : 'bg-[#FAF8F3] text-[#6A786D] border border-[#EBE7DF]'
                            }`}
                          >
                            {isDelivery ? 'Delivery' : 'Balcão'}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                            order.status === 'pendente'
                              ? 'bg-amber-100 text-amber-800'
                              : order.status === 'em_preparo'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'entregue'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {order.status === 'pendente' && 'Pendente'}
                          {order.status === 'em_preparo' && 'Em Preparo'}
                          {order.status === 'entregue' && 'Finalizado'}
                          {order.status === 'cancelado' && 'Cancelado'}
                        </span>
                      </div>

                      {/* Informações do Cliente & Local */}
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[#1E2B20]">{order.customerName}</span>
                          <span className="font-mono text-[#6A786D] text-[11px]">
                            {formatPhone(order.customerPhone)}
                          </span>
                        </div>
                        {isDelivery && order.address ? (
                          <p className="text-[#6A786D] text-[11px]">
                            {order.address.street}, {order.address.number} - {order.address.neighborhood}
                            {order.address.complement ? ` (${order.address.complement})` : ''}
                          </p>
                        ) : (
                          <p className="text-[#6A786D] text-[11px]">Retirada direta no balcão</p>
                        )}
                      </div>

                      {/* Lista Resumida de Itens */}
                      <div className="bg-[#FAF8F3] rounded-xl p-2.5 border border-[#EBE7DF]/70 text-xs space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5">
                            <span className="font-medium text-[#1E2B20]">
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="font-semibold text-[#1E2B20]">
                              {formatCurrency(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.generalNotes && (
                          <div className="text-[11px] text-[#315433] italic pt-1 border-t border-[#EBE7DF]/60">
                            Obs: {order.generalNotes}
                          </div>
                        )}
                      </div>

                      {/* Total & Ações de Operação */}
                      <div className="pt-2 border-t border-[#EBE7DF]/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-[#6A786D] block">Total</span>
                          <span className="text-sm font-bold text-[#315433]">
                            {formatCurrency(order.total)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCallCustomer(order)}
                            className="bg-[#315433] hover:bg-[#233F25] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            title="Chamar Cliente no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-white border border-[#EBE7DF] text-[#1E2B20] text-xs font-semibold rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="pendente">Pendente</option>
                            <option value="em_preparo">Em Preparo</option>
                            <option value="entregue">Finalizado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-7 h-7 rounded-lg bg-[#FDF1F0] text-[#C94A4A] border border-red-200/50 flex items-center justify-center cursor-pointer hover:bg-red-100 transition-colors"
                            title="Excluir pedido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. ABA DE DADOS DA LOJA (MOBILE) */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EBE7DF]/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1E2B20]">
                Dados da Loja & WhatsApp
              </h2>
              <p className="text-xs text-[#6A786D] mt-0.5">
                Configure os dados oficiais de atendimento e entrega.
              </p>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Nome do Estabelecimento
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Slogan / Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-medium text-[#1E2B20]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                    WhatsApp Oficial (com DDD)
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsappNumber: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="Ex: 5511987654321"
                    className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-mono font-bold text-[#1E2B20]"
                  />
                  <span className="text-[10px] text-[#6A786D] mt-0.5 block">
                    Formato: 55 + DDD + Número
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                    Taxa de Entrega (R$)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-mono text-[#1E2B20]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                    Tempo Médio
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder="30-45 min"
                    className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none text-[#1E2B20]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Endereço do Estabelecimento
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Horário de Funcionamento
                </label>
                <input
                  type="text"
                  value={formData.openingHours}
                  onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none text-[#1E2B20]"
                />
              </div>

              <div className="pt-3 border-t border-[#EBE7DF] flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={onResetStoreInfo}
                  className="text-[#6A786D] hover:text-[#1E2B20] text-xs font-semibold flex items-center gap-1.5 p-2 rounded-xl hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>

                <button
                  type="submit"
                  className="bg-[#315433] hover:bg-[#233F25] text-white font-semibold py-2 px-5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Rodapé Resumo Mobile */}
      <footer className="mt-auto border-t border-[#EBE7DF] bg-white px-4 py-3">
        <div className="max-w-md md:max-w-4xl mx-auto flex items-center justify-between text-xs text-[#6A786D]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cardápio online sincronizado</span>
          </div>
          <span className="font-medium text-[#315433]">{storeInfo.name}</span>
        </div>
      </footer>

      {/* Modal de Adicionar Novo Produto */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAddProductOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-[#EBE7DF] shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#EBE7DF] flex items-center justify-between bg-[#FAF8F3]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EBF2EA] text-[#315433] rounded-xl border border-[#DEEAD8]">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1E2B20]">Adicionar Novo Produto</h3>
                  <p className="text-[11px] text-[#6A786D]">Preencha os dados do cardápio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="p-1.5 text-[#6A786D] hover:text-[#1E2B20] rounded-xl hover:bg-[#EBF2EA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-4 sm:p-6 space-y-3.5 text-xs overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ex.: Iscas de Tilápia Crocantes"
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Grupo / Categoria *
                </label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="custom">+ Outro Grupo / Nova Categoria</option>
                </select>

                {newProduct.categoryId === 'custom' && (
                  <input
                    type="text"
                    required
                    value={newProduct.customCategoryName}
                    onChange={(e) => setNewProduct({ ...newProduct, customCategoryName: e.target.value })}
                    placeholder="Digite o nome do novo grupo"
                    className="w-full mt-2 p-2 rounded-xl border border-[#EBE7DF] bg-white focus:border-[#315433] outline-none text-xs font-bold"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="Ex.: 35.00"
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Descrição dos Ingredientes / Porção
                </label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Ex.: Empanado em farinha especial com raspas de limão e molho tártaro."
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none resize-none text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Link / URL da Foto do Produto
                </label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  placeholder="https://exemplo.com/foto.jpg (opcional)"
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none text-[#1E2B20] font-mono text-xs"
                />
                <p className="text-[10px] text-[#6A786D] mt-1">
                  Se deixar em branco, uma foto profissional temática da categoria será usada automaticamente.
                </p>
              </div>

              <div className="pt-3 border-t border-[#EBE7DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#EBE7DF] text-[#6A786D] hover:text-[#1E2B20] font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#315433] hover:bg-[#233F25] text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Cadastrar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Produto Existente */}
      {isEditProductOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsEditProductOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-[#EBE7DF] shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#EBE7DF] flex items-center justify-between bg-[#FAF8F3]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#EBF2EA] text-[#315433] rounded-xl border border-[#DEEAD8]">
                  <Pencil className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1E2B20]">Editar Produto</h3>
                  <p className="text-[11px] text-[#6A786D]">Altere os dados cadastrais deste item</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProductOpen(false)}
                className="p-1.5 text-[#6A786D] hover:text-[#1E2B20] rounded-xl hover:bg-[#EBF2EA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedProduct} className="p-4 sm:p-6 space-y-3.5 text-xs overflow-y-auto max-h-[80vh]">
              {/* Preview da Foto Atual */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F3] border border-[#EBE7DF]">
                <img
                  src={editingProduct.imageUrl}
                  alt={editingProduct.name}
                  className="w-12 h-12 rounded-lg object-cover border border-[#EBE7DF] bg-stone-100"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-[#6A786D] block">Foto Atual</span>
                  <span className="text-xs font-bold text-[#1E2B20] truncate block">{editingProduct.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Grupo / Categoria *
                </label>
                <select
                  value={editingProduct.isCustomCategory ? 'custom' : editingProduct.categoryId}
                  onChange={(e) => {
                    const isCustom = e.target.value === 'custom';
                    setEditingProduct({
                      ...editingProduct,
                      isCustomCategory: isCustom,
                      categoryId: isCustom ? 'custom' : e.target.value,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="custom">+ Outro Grupo / Nova Categoria</option>
                </select>

                {editingProduct.isCustomCategory && (
                  <input
                    type="text"
                    required
                    value={editingProduct.customCategoryName || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, customCategoryName: e.target.value })
                    }
                    placeholder="Digite o nome do novo grupo"
                    className="w-full mt-2 p-2 rounded-xl border border-[#EBE7DF] bg-white focus:border-[#315433] outline-none text-xs font-bold"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Status do Produto
                </label>
                <select
                  value={editingProduct.isAvailable ? 'available' : 'unavailable'}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      isAvailable: e.target.value === 'available',
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none font-bold text-[#1E2B20]"
                >
                  <option value="available">Ativo (Disponível no cardápio)</option>
                  <option value="unavailable">Pausado (Esgotado)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Descrição dos Ingredientes / Porção
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none resize-none text-[#1E2B20]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                  Link / URL da Foto do Produto
                </label>
                <input
                  type="url"
                  value={editingProduct.imageUrl}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full p-2.5 rounded-xl border border-[#EBE7DF] bg-[#FAF8F3] focus:bg-white focus:border-[#315433] outline-none text-[#1E2B20] font-mono text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#EBE7DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProductOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#EBE7DF] text-[#6A786D] hover:text-[#1E2B20] font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#315433] hover:bg-[#233F25] text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Filtro de Data para Relatório PDF */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full border border-[#EBE7DF] shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DF]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBF2EA] text-[#315433] flex items-center justify-center border border-[#DEEAD8]">
                  <Calendar className="w-4 h-4 text-[#315433]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1E2B20]">Relatório de Pedidos em PDF</h3>
                  <p className="text-[11px] text-[#6A786D]">Selecione o filtro de data desejado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#FAF8F3] text-[#6A786D] hover:text-[#1E2B20] cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#1E2B20]">
                Período do Relatório
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: 'today', label: 'Hoje' },
                  { id: 'yesterday', label: 'Ontem' },
                  { id: '7days', label: 'Últimos 7 dias' },
                  { id: 'thisMonth', label: 'Este Mês' },
                  { id: 'custom', label: 'Personalizado' },
                  { id: 'all', label: 'Todo o Histórico' },
                ].map((preset) => {
                  const isActive = pdfDatePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPdfDatePreset(preset.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        isActive
                          ? 'bg-[#315433] text-white border-[#315433] shadow-xs'
                          : 'bg-white text-[#6A786D] border-[#EBE7DF] hover:bg-[#FAF8F3]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intervalo Personalizado */}
            {pdfDatePreset === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-[#FAF8F3] rounded-xl border border-[#EBE7DF] animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={pdfStartDate}
                    onChange={(e) => setPdfStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EBE7DF] bg-white text-[#1E2B20] font-semibold text-xs outline-none focus:border-[#315433]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1E2B20] mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={pdfEndDate}
                    onChange={(e) => setPdfEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#EBE7DF] bg-white text-[#1E2B20] font-semibold text-xs outline-none focus:border-[#315433]"
                  />
                </div>
              </div>
            )}

            {/* Resumo do Período */}
            <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EBE7DF] space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#6A786D]">
                <span>Período Selecionado:</span>
                <span className="text-[#1E2B20] font-bold text-right truncate max-w-[220px]">
                  {pdfPeriodLabel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EBE7DF]">
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#6A786D]">Pedidos</div>
                  <div className="text-sm font-bold text-[#315433]">{pdfFilteredOrders.length}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#6A786D]">Faturamento</div>
                  <div className="text-sm font-bold text-[#1E2B20]">{formatCurrency(pdfTotalRevenue)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#6A786D]">Ticket Médio</div>
                  <div className="text-sm font-bold text-[#1E2B20]">{formatCurrency(pdfAverageTicket)}</div>
                </div>
              </div>

              {pdfFilteredOrders.length === 0 && (
                <div className="pt-1.5 text-[11px] text-amber-800 font-medium border-t border-[#EBE7DF]">
                  Nenhum pedido com status "Finalizado" foi encontrado neste intervalo.
                </div>
              )}
            </div>

            {/* Ações do Rodapé */}
            <div className="pt-2 border-t border-[#EBE7DF] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-[#EBE7DF] text-[#6A786D] hover:text-[#1E2B20] font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pdfFilteredOrders.length === 0) {
                    alert('Não há pedidos finalizados no período selecionado.');
                    return;
                  }
                  generateCompletedOrdersPdf({
                    completedOrders: pdfFilteredOrders,
                    storeInfo,
                    periodLabel: pdfPeriodLabel,
                  });
                  setIsPdfModalOpen(false);
                }}
                disabled={pdfFilteredOrders.length === 0}
                className={`font-semibold py-2 px-4 rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  pdfFilteredOrders.length === 0
                    ? 'bg-[#315433]/40 text-white cursor-not-allowed'
                    : 'bg-[#315433] hover:bg-[#233F25] text-white active:scale-95'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Gerar Relatório PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
