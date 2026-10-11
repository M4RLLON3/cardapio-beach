import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Settings,
  Phone,
  DollarSign,
  MapPin,
  Clock,
  Save,
  ArrowLeft,
  CheckCircle,
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
  Check,
  ChevronRight,
  TrendingUp,
  Upload,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import {
  formatCurrency,
  formatPhone,
  buildStoreToCustomerMessage,
  generateWhatsAppUrl,
} from '../utils/formatters';
import { generateCompletedOrdersPdf } from '../utils/pdfReport';
import { formatCNPJ } from '../components/AdminAuthView';
import {
  CATEGORIES as DEFAULT_CATEGORIES,
} from '../data/storeData';

const compressImageFile = (file, maxWidth = 900, maxHeight = 900, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Por favor, selecione um arquivo de imagem válido.'));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Erro ao processar imagem.'));
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo do dispositivo.'));
  });
};

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

export function AdminPage({
  storeInfo,
  onUpdateStoreInfo,
  onResetStoreInfo,
  products,
  categories,
  onUpdateProducts,
  onDeleteCategory,
  orders = [],
  onUpdateOrders,
  onBackToMenu,
  adminSession,
  onLogout,
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

  // Refs para centralização horizontal da aba de categorias ativa no Admin
  const adminCategoryTabRefs = useRef({});

  useEffect(() => {
    if (productCategoryFilter && adminCategoryTabRefs.current[productCategoryFilter]) {
      adminCategoryTabRefs.current[productCategoryFilter].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [productCategoryFilter]);

  // Modal para Adicionar Novo Produto
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: 'porcoes',
    customCategoryName: '',
    price: '',
    description: '',
    imageUrl: '',
    isAvailable: true,
    hasOptions: false,
    options: [
      { name: '1 Dose', price: '' },
      { name: '2 Doses', price: '' },
      { name: 'Garrafa', price: '' },
    ],
  });

  // Funções de manipulação de opções/doses para Novo Produto
  const handleAddOptionNewProduct = () => {
    setNewProduct((prev) => ({
      ...prev,
      options: [...(prev.options || []), { name: '', price: '' }],
    }));
  };

  const handleUpdateOptionNewProduct = (index, field, value) => {
    setNewProduct((prev) => {
      const updated = [...(prev.options || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, options: updated };
    });
  };

  const handleRemoveOptionNewProduct = (index) => {
    setNewProduct((prev) => {
      const updated = prev.options.filter((_, i) => i !== index);
      return { ...prev, options: updated };
    });
  };

  // Modal para Editar Produto Existente
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Funções de manipulação de opções/doses para Editar Produto
  const handleAddOptionEditProduct = () => {
    setEditingProduct((prev) => ({
      ...prev,
      options: [...(prev.options || []), { name: '', price: '' }],
    }));
  };

  const handleUpdateOptionEditProduct = (index, field, value) => {
    setEditingProduct((prev) => {
      const updated = [...(prev.options || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, options: updated };
    });
  };

  const handleRemoveOptionEditProduct = (index) => {
    setEditingProduct((prev) => {
      const updated = prev.options.filter((_, i) => i !== index);
      return { ...prev, options: updated };
    });
  };
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  // Upload e Processamento de Foto do Aparelho
  const handlePhotoUpload = async (e, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsPhotoLoading(true);
      const compressedDataUrl = await compressImageFile(file);
      if (isEditing) {
        setEditingProduct((prev) => (prev ? { ...prev, imageUrl: compressedDataUrl } : null));
      } else {
        setNewProduct((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
      }
      showProductFeedback('Foto carregada com sucesso.');
    } catch (err) {
      alert(err.message || 'Erro ao carregar a imagem. Tente novamente.');
    } finally {
      setIsPhotoLoading(false);
      e.target.value = '';
    }
  };

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
  const handleDeleteOrder = (orderId, customerName) => {
    const label = orderId ? `#${String(orderId).slice(-6)}` : '';
    if (
      window.confirm(
        `Tem certeza que deseja excluir o pedido ${label} de "${customerName || 'Cliente'}"? Esta ação não pode ser desfeita.`
      )
    ) {
      if (onUpdateOrders) {
        const updated = orders.filter((o) => o.id !== orderId);
        onUpdateOrders(updated);
        showProductFeedback('Pedido excluído com sucesso.');
      }
    }
  };

  // Alternar Disponibilidade de Produto
  const toggleProductAvailability = (productId) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const nextState = p.isAvailable === false ? true : false;
        showProductFeedback(`"${p.name}" foi ${nextState ? 'ativado' : 'pausado'} no cardápio.`);
        return { ...p, isAvailable: nextState };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  // Excluir Produto
  const handleDeleteProduct = (productId, productName) => {
    if (window.confirm(`Deseja realmente remover "${productName}" do cardápio?`)) {
      const updated = products.filter((p) => p.id !== productId);
      onUpdateProducts(updated);
      showProductFeedback(`Produto "${productName}" removido com sucesso.`);
    }
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (product) => {
    const isCustomCat = !DEFAULT_CATEGORIES.some((c) => c.id === product.categoryId);
    const hasOpts = Array.isArray(product.options) && product.options.length > 0;
    const isDest = product.categoryId === 'destilados';

    const initialOptions = hasOpts
      ? product.options.map((o) => ({ name: o.name, price: String(o.price) }))
      : isDest
      ? [
          { name: '1 Dose', price: String(product.price || '') },
          { name: '2 Doses', price: '' },
          { name: 'Garrafa', price: '' },
        ]
      : [];

    setEditingProduct({
      ...product,
      isCustomCategory: isCustomCat,
      customCategoryName: isCustomCat ? (product.categoryName || product.categoryId) : '',
      hasOptions: hasOpts || isDest,
      options: initialOptions,
      price: String(product.price),
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

    const categoryId = editingProduct.isCustomCategory
      ? editingProduct.customCategoryName.trim().toLowerCase().replace(/\s+/g, '-') || 'outros'
      : editingProduct.categoryId;

    const isDestilados = categoryId === 'destilados' || editingProduct.hasOptions;
    let parsedOptions = undefined;
    let finalPrice = parseFloat(String(editingProduct.price).replace(',', '.'));

    if (isDestilados && Array.isArray(editingProduct.options)) {
      const validOptions = editingProduct.options
        .map((opt) => ({
          name: opt.name.trim(),
          price: parseFloat(String(opt.price).replace(',', '.')),
        }))
        .filter((opt) => opt.name && !isNaN(opt.price) && opt.price > 0);

      if (validOptions.length > 0) {
        parsedOptions = validOptions;
        if (isNaN(finalPrice) || finalPrice <= 0) {
          finalPrice = validOptions[0].price;
        }
      }
    }

    if (isNaN(finalPrice) || finalPrice <= 0) {
      alert('Informe um valor válido maior que zero (ou preencha os valores das doses/garrafa).');
      return;
    }

    const updated = products.map((p) => {
      if (p.id === editingProduct.id) {
        return {
          ...p,
          name: editingProduct.name.trim(),
          categoryId,
          categoryName: editingProduct.isCustomCategory ? editingProduct.customCategoryName.trim() : undefined,
          price: finalPrice,
          description: editingProduct.description.trim(),
          imageUrl: editingProduct.imageUrl.trim() || p.imageUrl,
          isAvailable: editingProduct.isAvailable,
          options: parsedOptions,
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

    const categoryId = newProduct.categoryId === 'custom' 
      ? newProduct.customCategoryName.trim().toLowerCase().replace(/\s+/g, '-') || 'outros'
      : newProduct.categoryId;

    const isDestilados = categoryId === 'destilados' || newProduct.hasOptions;
    let parsedOptions = undefined;
    let finalPrice = parseFloat(String(newProduct.price).replace(',', '.'));

    if (isDestilados && Array.isArray(newProduct.options)) {
      const validOptions = newProduct.options
        .map((opt) => ({
          name: opt.name.trim(),
          price: parseFloat(String(opt.price).replace(',', '.')),
        }))
        .filter((opt) => opt.name && !isNaN(opt.price) && opt.price > 0);

      if (validOptions.length > 0) {
        parsedOptions = validOptions;
        if (isNaN(finalPrice) || finalPrice <= 0) {
          finalPrice = validOptions[0].price;
        }
      }
    }

    if (isNaN(finalPrice) || finalPrice <= 0) {
      alert('Informe um valor válido maior que zero (ou preencha os valores das doses/garrafa).');
      return;
    }

    const fallbackImages = {
      porcoes: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
      combos: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      combinacoes: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      pizzas: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      cervejas: 'https://images.unsplash.com/photo-1608270178550-9694e9f7831f?auto=format&fit=crop&w=800&q=80',
      coqueteis: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      bebidas: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80',
      energeticos: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=800&q=80',
      destilados: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80',
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
      price: finalPrice,
      imageUrl: finalImage,
      isAvailable: true,
      options: parsedOptions,
    };

    const updated = [created, ...products];
    onUpdateProducts(updated);
    setIsAddProductOpen(false);
    setNewProduct({
      name: '',
      categoryId: 'porcoes',
      customCategoryName: '',
      price: '',
      description: '',
      imageUrl: '',
      isAvailable: true,
      hasOptions: false,
      options: [
        { name: '1 Dose', price: '' },
        { name: '2 Doses', price: '' },
        { name: 'Garrafa', price: '' },
      ],
    });
    showProductFeedback(`Produto "${created.name}" adicionado com sucesso.`);
  };

  const getCategoryLabel = (catId, customName) => {
    if (customName) return customName;
    const found = DEFAULT_CATEGORIES.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  // Categorias disponíveis para o filtro de produtos (categorias sem produtos somem automaticamente!)
  const availableCategoriesForFilter = useMemo(() => {
    const list = [];
    const catMap = new Map();
    DEFAULT_CATEGORIES.forEach((c) => catMap.set(c.id, c));
    if (categories) {
      categories.forEach((c) => catMap.set(c.id, c));
    }

    products.forEach((p) => {
      if (p.categoryId && !list.some((c) => c.id === p.categoryId)) {
        const found = catMap.get(p.categoryId);
        list.push({
          id: p.categoryId,
          name: p.categoryName || (found ? found.name : (p.categoryId.charAt(0).toUpperCase() + p.categoryId.slice(1))),
        });
      }
    });

    return list.sort((a, b) => {
      const orderA = catMap.get(a.id)?.order ?? 99;
      const orderB = catMap.get(b.id)?.order ?? 99;
      return orderA - orderB;
    });
  }, [categories, products]);

  // Se a categoria selecionada não tiver mais produtos, reseta o filtro para 'all'
  useEffect(() => {
    if (
      productCategoryFilter !== 'all' &&
      !availableCategoriesForFilter.some((c) => c.id === productCategoryFilter)
    ) {
      setProductCategoryFilter('all');
    }
  }, [availableCategoriesForFilter, productCategoryFilter]);

  // Excluir Categoria Completa
  const handleDeleteCategoryPrompt = (categoryId) => {
    const category = availableCategoriesForFilter.find((c) => c.id === categoryId);
    const catName = category ? category.name : categoryId;
    const countInCat = products.filter((p) => p.categoryId === categoryId).length;
    const confirmMessage =
      countInCat > 0
        ? `Tem certeza que deseja excluir a categoria "${catName}" e seus ${countInCat} produto(s)? Esta ação não pode ser desfeita.`
        : `Tem certeza que deseja excluir a categoria "${catName}"?`;

    if (window.confirm(confirmMessage)) {
      if (onDeleteCategory) {
        onDeleteCategory(categoryId);
      } else {
        const updated = products.filter((p) => p.categoryId !== categoryId);
        onUpdateProducts(updated);
      }
      setProductCategoryFilter('all');
      showProductFeedback(`Categoria "${catName}" excluída com sucesso.`);
    }
  };

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

  // Estatísticas dos pedidos
  const completedOrdersList = useMemo(() => orders.filter((o) => o.status === 'entregue'), [orders]);
  const totalRevenueAllTime = useMemo(
    () => completedOrdersList.reduce((acc, o) => acc + (o.total || 0), 0),
    [completedOrdersList]
  );

  return (
    <div className="min-h-screen bg-[#fbf9f5] font-manrope text-[#1b1c1a] antialiased selection:bg-[#daeaaa] selection:text-[#161f00]">
      {/* ── BEGIN: TopBar Navigation (Header Fixo Editorial) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbf9f5]/90 backdrop-blur-md shadow-[0_1px_8px_rgba(40,59,38,0.03)] border-b border-[#efeeea]">
        <div className="h-16 md:h-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Identidade da Marca Beach House */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="font-grotesk font-semibold text-base sm:text-xl tracking-tight text-[#132512]">
                BEACH HOUSE
              </span>
              <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870] -mt-1">
                Sports N' Bar
              </span>
            </div>
          </div>

          {/* Abas Centrais Desktop */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#f5f3ef] p-1 rounded-xl border border-[#e4e2de]">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 uppercase tracking-wider text-xs font-grotesk font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#283b26] text-white shadow-xs'
                  : 'text-[#434841] hover:text-[#132512] hover:bg-[#efeeea]'
              }`}
            >
              Produtos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 uppercase tracking-wider text-xs font-grotesk font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#283b26] text-white shadow-xs'
                  : 'text-[#434841] hover:text-[#132512] hover:bg-[#efeeea]'
              }`}
            >
              <span>Pedidos</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#daeaaa] text-[#161f00]">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 uppercase tracking-wider text-xs font-grotesk font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#283b26] text-white shadow-xs'
                  : 'text-[#434841] hover:text-[#132512] hover:bg-[#efeeea]'
              }`}
            >
              Perfil / Loja
            </button>
          </nav>

          {/* Ações da Direita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* CNPJ Badge */}
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f3ef] border border-[#e4e2de] text-xs font-grotesk text-[#132512]"
              title={`CNPJ Autorizado: ${formatCNPJ(adminSession?.arena?.cnpj || '60456569000198')}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#566431]" />
              <span className="font-semibold">{formatCNPJ(adminSession?.arena?.cnpj || '60456569000198')}</span>
            </div>

            {/* Ver Cardápio */}
            <button
              type="button"
              onClick={onBackToMenu}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#c4c8bf] text-xs font-grotesk font-semibold text-[#132512] hover:bg-[#efeeea] transition shadow-xs cursor-pointer"
              title="Visualizar o cardápio como cliente"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Cardápio</span>
            </button>

            {/* Botão Sair */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-grotesk font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação Segmentada Mobile (Abaixo do TopBar) */}
        <div className="flex md:hidden items-center justify-around px-4 py-2 border-t border-[#efeeea] bg-[#fbf9f5]">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-1.5 text-center text-xs font-grotesk uppercase tracking-wider font-semibold rounded-lg transition-all ${
              activeTab === 'products'
                ? 'bg-[#283b26] text-white shadow-xs'
                : 'text-[#434841] hover:text-[#132512]'
            }`}
          >
            Produtos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-1.5 text-center text-xs font-grotesk uppercase tracking-wider font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'orders'
                ? 'bg-[#283b26] text-white shadow-xs'
                : 'text-[#434841] hover:text-[#132512]'
            }`}
          >
            <span>Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#daeaaa] text-[#161f00]">
                {pendingOrdersCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 text-center text-xs font-grotesk uppercase tracking-wider font-semibold rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-[#283b26] text-white shadow-xs'
                : 'text-[#434841] hover:text-[#132512]'
            }`}
          >
            Perfil
          </button>
        </div>
      </header>

      {/* ── BEGIN: Conteúdo Principal com Top Ambient Glow ── */}
      <main className="w-full pt-28 md:pt-24 min-h-screen relative overflow-hidden pb-24">
        {/* Ambient Top Glow Effect */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[840px] h-[320px] bg-[#daeaaa]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          
          {/* Feedback de Sucesso */}
          {saveSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#daeaaa]/40 border border-[#becd90] text-[#161f00] flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-[#566431] shrink-0" />
              <span>Configurações da loja salvas com sucesso.</span>
            </div>
          )}

          {productFeedback && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#daeaaa]/40 border border-[#becd90] text-[#161f00] flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-[#566431] shrink-0" />
              <span>{productFeedback}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              ABA 1: CATÁLOGO DE PRODUTOS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div className="pt-2 sm:pt-4">
              {/* Barra de Filtros, Categorias e Ações */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6">
                {/* Categorias Estilo Editorial com Sublinhado Ativo e Auto-centralização */}
                <nav
                  aria-label="Categorias do Cardápio"
                  className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  <button
                    type="button"
                    ref={(el) => (adminCategoryTabRefs.current['all'] = el)}
                    onClick={() => {
                      setProductCategoryFilter('all');
                      if (adminCategoryTabRefs.current['all']) {
                        adminCategoryTabRefs.current['all'].scrollIntoView({
                          behavior: 'smooth',
                          block: 'nearest',
                          inline: 'center',
                        });
                      }
                    }}
                    className="group relative px-3 py-1.5 text-left transition-all duration-200 cursor-pointer shrink-0"
                  >
                    <span
                      className={`font-grotesk text-xs uppercase tracking-wider transition-colors ${
                        productCategoryFilter === 'all'
                          ? 'text-[#132512] font-bold'
                          : 'text-[#434841] hover:text-[#132512]'
                      }`}
                    >
                      Todos ({products.length})
                    </span>
                    {productCategoryFilter === 'all' && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#132512] rounded-full"></span>
                    )}
                  </button>

                  {availableCategoriesForFilter.map((cat) => {
                    const isSelected = productCategoryFilter === cat.id;
                    const countInCat = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        ref={(el) => (adminCategoryTabRefs.current[cat.id] = el)}
                        className="flex items-center shrink-0 group relative"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setProductCategoryFilter(cat.id);
                            if (adminCategoryTabRefs.current[cat.id]) {
                              adminCategoryTabRefs.current[cat.id].scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',
                                inline: 'center',
                              });
                            }
                          }}
                          className="px-3 py-1.5 text-left transition-all duration-200 cursor-pointer"
                        >
                          <span
                            className={`font-grotesk text-xs uppercase tracking-wider transition-colors ${
                              isSelected
                                ? 'text-[#132512] font-bold'
                                : 'text-[#434841] hover:text-[#132512]'
                            }`}
                          >
                            {cat.name} ({countInCat})
                          </span>
                          {isSelected && (
                            <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#132512] rounded-full"></span>
                          )}
                        </button>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategoryPrompt(cat.id);
                            }}
                            className="p-1 -ml-1 mr-1 text-[#747870] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded-md transition cursor-pointer"
                            title={`Excluir categoria ${cat.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </nav>

                {/* Busca e Botões de Ação */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                  {/* Campo de Busca Minimalista */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-4 h-4 text-[#747870] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Buscar item..."
                      className="w-full pl-9 pr-8 py-2 bg-[#f5f3ef] border border-[#e4e2de] rounded-xl text-xs font-grotesk text-[#132512] focus:bg-white focus:border-[#283b26] outline-none transition"
                    />
                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#747870] hover:text-[#132512]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Botão Excluir Categoria Selecionada */}
                  {productCategoryFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategoryPrompt(productCategoryFilter)}
                      className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-grotesk uppercase tracking-wider font-semibold px-3 py-2 rounded-xl transition cursor-pointer shadow-2xs"
                      title="Excluir esta categoria e seus produtos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Excluir Categoria</span>
                    </button>
                  )}

                  {/* Botão Novo Item */}
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-[#283b26] hover:bg-[#132512] active:scale-95 text-white text-xs font-grotesk uppercase tracking-wider font-semibold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Novo Item</span>
                  </button>
                </div>
              </div>

              {/* Título de Seção Editorial */}
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870]">
                    Seleção para Mesa & Lounge
                  </span>
                  <h2 className="font-grotesk text-xl sm:text-2xl font-semibold text-[#132512] tracking-tight">
                    {productCategoryFilter === 'all'
                      ? 'Todos os Produtos'
                      : availableCategoriesForFilter.find((c) => c.id === productCategoryFilter)?.name || 'Categoria'}
                  </h2>
                </div>
                <span className="font-grotesk text-xs text-[#747870]">
                  {filteredAdminProducts.length} itens encontrados
                </span>
              </div>

              {/* Bento Editorial Grid (2 Colunas em Desktop / 1 Coluna em Mobile) */}
              {filteredAdminProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#efeeea] p-8">
                  <div className="w-12 h-12 rounded-full bg-[#f5f3ef] text-[#747870] flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-grotesk font-bold text-base text-[#132512]">Nenhum produto localizado</h3>
                  <p className="font-manrope text-xs text-[#747870] mt-1 max-w-sm mx-auto">
                    Tente ajustar o termo da busca ou selecione outra categoria no menu superior.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  {filteredAdminProducts.map((product) => {
                    const isAvailable = product.isAvailable !== false;
                    const hasOptions = product.options && product.options.length > 1;
                    const startingPrice = hasOptions
                      ? Math.min(...product.options.map((o) => o.price))
                      : product.price;

                    return (
                      <article
                        key={product.id}
                        className={`group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#efeeea] shadow-[0_2px_12px_rgba(40,59,38,0.03)] hover:shadow-md transition-all duration-300 ${
                          !isAvailable ? 'opacity-70 bg-[#fbf9f5]' : ''
                        }`}
                      >
                        {/* Imagem do Produto com Badges */}
                        <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#efeeea]">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            className={`w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out ${
                              !isAvailable ? 'grayscale' : ''
                            }`}
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                            }}
                          />

                          {/* Badge de Destaque ou Categoria */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                            {product.badge && (
                              <span className="px-2.5 py-1 bg-[#daeaaa] text-[#161f00] font-grotesk text-[10px] font-bold uppercase tracking-widest rounded-lg backdrop-blur-sm shadow-2xs">
                                {product.badge}
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-black/60 text-white font-grotesk text-[10px] uppercase tracking-wider rounded-md backdrop-blur-sm">
                              {getCategoryLabel(product.categoryId, product.categoryName)}
                            </span>
                          </div>

                          {/* Badge Esgotado / Pausado */}
                          {!isAvailable && (
                            <div className="absolute top-3 right-3">
                              <span className="px-2.5 py-1 bg-rose-600 text-white font-grotesk text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm">
                                Pausado
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Conteúdo do Card */}
                        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                          <div>
                            <div className="flex items-baseline justify-between gap-3">
                              <h3 className="font-grotesk text-base sm:text-lg font-bold text-[#132512] tracking-tight group-hover:text-[#283b26] transition-colors leading-snug">
                                {product.name}
                              </h3>
                              <div className="text-right shrink-0">
                                {hasOptions && (
                                  <span className="text-[10px] font-grotesk uppercase tracking-wider text-[#747870] block">
                                    A partir de
                                  </span>
                                )}
                                <span className="font-grotesk text-base sm:text-lg font-bold text-[#132512] whitespace-nowrap">
                                  {formatCurrency(startingPrice)}
                                </span>
                              </div>
                            </div>

                            <p className="font-manrope text-xs sm:text-sm text-[#434841] mt-1.5 leading-relaxed line-clamp-2">
                              {product.description || 'Sem descrição cadastrada.'}
                            </p>

                            {/* Pílulas de Doses / Opções se houver */}
                            {hasOptions && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {product.options.map((opt) => (
                                  <span
                                    key={opt.name}
                                    className="px-2 py-0.5 rounded-md bg-[#f5f3ef] border border-[#e4e2de] text-[10px] font-grotesk font-semibold text-[#132512]"
                                  >
                                    {opt.name}: {formatCurrency(opt.price)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Rodapé do Card com Ações Administrativas */}
                          <div className="pt-3 border-t border-[#efeeea] flex items-center justify-between gap-2">
                            {/* Toggle de Disponibilidade */}
                            <button
                              type="button"
                              onClick={() => toggleProductAvailability(product.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-grotesk font-bold cursor-pointer transition border ${
                                isAvailable
                                  ? 'bg-[#daeaaa] text-[#161f00] border-[#becd90] hover:bg-[#becd90]'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Alternar se o item aparece para o cliente"
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isAvailable ? 'bg-[#566431]' : 'bg-rose-600'
                                }`}
                              ></span>
                              <span>{isAvailable ? 'Ativo na Loja' : 'Pausado'}</span>
                            </button>

                            {/* Ações de Edição e Exclusão */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(product)}
                                className="w-8 h-8 rounded-xl bg-[#f5f3ef] hover:bg-[#efeeea] border border-[#e4e2de] flex items-center justify-center text-[#434841] hover:text-[#132512] transition cursor-pointer"
                                title="Editar produto"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/60 flex items-center justify-center text-rose-700 transition cursor-pointer"
                                title="Remover produto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              ABA 2: GESTÃO DE PEDIDOS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'orders' && (
            <div className="pt-6 space-y-6">
              {/* Header de Pedidos & Ações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#efeeea]">
                <div>
                  <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870]">
                    Controle de Comandas & Mesas
                  </span>
                  <h2 className="font-grotesk text-xl sm:text-2xl font-semibold text-[#132512] tracking-tight">
                    Gestão de Pedidos
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-[#283b26] hover:bg-[#132512] text-white font-grotesk text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Relatório em PDF</span>
                  </button>
                </div>
              </div>

              {/* Painel com Métricas Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#efeeea] shadow-2xs">
                  <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870] block">
                    Total Pedidos
                  </span>
                  <span className="font-grotesk text-2xl font-bold text-[#132512] mt-1 block">
                    {orders.length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#efeeea] shadow-2xs">
                  <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870] block">
                    Pendentes
                  </span>
                  <span className="font-grotesk text-2xl font-bold text-amber-600 mt-1 block">
                    {pendingOrdersCount}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#efeeea] shadow-2xs">
                  <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870] block">
                    Faturamento Entregue
                  </span>
                  <span className="font-grotesk text-2xl font-bold text-[#566431] mt-1 block">
                    {formatCurrency(totalRevenueAllTime)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#efeeea] shadow-2xs">
                  <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870] block">
                    Concluídos
                  </span>
                  <span className="font-grotesk text-2xl font-bold text-[#132512] mt-1 block">
                    {completedOrdersList.length}
                  </span>
                </div>
              </div>

              {/* Filtro por Status do Pedido */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: `Todos (${orders.length})` },
                  { id: 'pendente', label: `Pendentes (${pendingOrdersCount})` },
                  { id: 'em_preparo', label: 'Em Preparo' },
                  { id: 'entregue', label: 'Entregues' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setOrderFilter(st.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-grotesk text-xs uppercase tracking-wider font-semibold transition cursor-pointer whitespace-nowrap ${
                      orderFilter === st.id
                        ? 'bg-[#283b26] text-white shadow-xs'
                        : 'bg-white text-[#434841] border border-[#e4e2de] hover:border-[#283b26]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Lista de Pedidos */}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#efeeea] p-8">
                  <ClipboardList className="w-10 h-10 text-[#747870] mx-auto mb-3" />
                  <h3 className="font-grotesk font-bold text-base text-[#132512]">Nenhum pedido neste filtro</h3>
                  <p className="font-manrope text-xs text-[#747870] mt-1">
                    Novos pedidos enviados pelos clientes aparecerão aqui em tempo real.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOrders.map((order) => {
                    const statusColors = {
                      pendente: 'bg-amber-100 text-amber-900 border-amber-200',
                      em_preparo: 'bg-sky-100 text-sky-900 border-sky-200',
                      entregue: 'bg-[#daeaaa] text-[#161f00] border-[#becd90]',
                    };

                    const statusLabels = {
                      pendente: 'Pendente',
                      em_preparo: 'Em Preparo',
                      entregue: 'Entregue / Concluído',
                    };

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-[#efeeea] shadow-xs p-5 flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#efeeea]">
                            <div>
                              <span className="font-grotesk text-xs font-bold text-[#747870]">
                                #{order.id?.slice(-6) || 'PEDIDO'}
                              </span>
                              <h3 className="font-grotesk text-base font-bold text-[#132512]">
                                {order.customerName}
                              </h3>
                              <span className="font-manrope text-xs text-[#747870]">
                                {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-grotesk font-bold uppercase tracking-wider border ${
                                  statusColors[order.status] || 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {statusLabels[order.status] || order.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id, order.customerName)}
                                className="p-1.5 rounded-lg text-[#747870] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition cursor-pointer"
                                title="Excluir este pedido"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Itens do Pedido */}
                          <div className="py-3 space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs font-manrope">
                                <span className="text-[#132512]">
                                  <strong className="font-grotesk">{item.quantity}x</strong> {item.name}
                                </span>
                                <span className="font-grotesk font-semibold text-[#132512]">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}

                            {order.notes && (
                              <div className="p-2.5 bg-[#f5f3ef] rounded-xl text-[11px] text-[#434841] italic mt-2 border border-[#e4e2de]">
                                Obs: {order.notes}
                              </div>
                            )}
                          </div>

                          {/* Total e Pagamento */}
                          <div className="pt-3 border-t border-[#efeeea] flex items-center justify-between text-xs">
                            <span className="text-[#747870]">
                              Forma: <strong className="text-[#132512] font-grotesk uppercase">{order.paymentMethod || 'Pix'}</strong>
                            </span>
                            <span className="font-grotesk text-lg font-bold text-[#132512]">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </div>

                        {/* Ações do Pedido */}
                        <div className="pt-3 border-t border-[#efeeea] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCallCustomer(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-grotesk font-bold transition cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.id, order.customerName)}
                              className="p-2 rounded-xl text-[#747870] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 border border-transparent hover:border-[#ffdad6] transition cursor-pointer"
                              title="Excluir este pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {order.status === 'pendente' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(order.id, 'em_preparo')}
                                className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-grotesk font-bold transition cursor-pointer"
                              >
                                Preparar
                              </button>
                            )}

                            {order.status !== 'entregue' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(order.id, 'entregue')}
                                className="px-3 py-2 rounded-xl bg-[#283b26] hover:bg-[#132512] text-white text-xs font-grotesk font-bold transition cursor-pointer"
                              >
                                Finalizar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              ABA 3: DADOS DA LOJA & WHATSAPP
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="pt-6 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl border border-[#efeeea] p-6 shadow-xs space-y-6">
                <div>
                  <span className="font-grotesk text-[10px] uppercase tracking-widest text-[#747870]">
                    Configurações & Canal de Atendimento
                  </span>
                  <h2 className="font-grotesk text-xl font-bold text-[#132512] tracking-tight">
                    Dados do Estabelecimento
                  </h2>
                  <p className="font-manrope text-xs text-[#747870] mt-1">
                    Essas informações são exibidas no topo do cardápio e usadas para o envio dos pedidos via WhatsApp.
                  </p>
                </div>

                <form onSubmit={handleSaveStore} className="space-y-4 text-xs font-manrope">
                  <div>
                    <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                      Nome da Loja
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-[#132512]"
                    />
                  </div>

                  <div>
                    <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                      Subtítulo / Slogan
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk text-[#132512]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                        WhatsApp de Pedidos (DDD + Número)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                        placeholder="Ex.: 44999102232"
                        className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk text-[#132512]"
                      />
                    </div>

                    <div>
                      <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                        Chave Pix da Loja (CNPJ / Telefone)
                      </label>
                      <input
                        type="text"
                        value={formData.pixKey}
                        onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk text-[#132512]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                      Endereço da Loja / Arena
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk text-[#132512]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                        Tempo Médio de Preparo
                      </label>
                      <input
                        type="text"
                        value={formData.estimatedTime}
                        onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                        placeholder="Ex.: 25-40 min"
                        className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk text-[#132512]"
                      />
                    </div>

                    <div>
                      <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                        Taxa de Entrega (R$)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.deliveryFee}
                        onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk text-[#132512]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1">
                      Horário de Funcionamento
                    </label>
                    <input
                      type="text"
                      value={formData.openingHours}
                      onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk text-[#132512]"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#efeeea] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onResetStoreInfo && onResetStoreInfo()}
                      className="px-4 py-2.5 rounded-xl border border-[#e4e2de] text-[#747870] hover:text-[#132512] font-grotesk text-xs uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Restaurar Padrão
                    </button>

                    <button
                      type="submit"
                      className="bg-[#283b26] hover:bg-[#132512] text-white font-grotesk text-xs uppercase tracking-wider font-semibold py-2.5 px-6 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════
          MODAL: ADICIONAR NOVO PRODUTO (AMPLO E LEGÍVEL)
      ══════════════════════════════════════════════════════════ */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAddProductOpen(false)} />

          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#e4e2de] shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="p-5 sm:p-6 border-b border-[#efeeea] flex items-center justify-between bg-[#fbf9f5] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#daeaaa] text-[#161f00] rounded-2xl">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-grotesk text-xl sm:text-2xl font-bold text-[#132512]">Cadastrar Novo Item</h3>
                  <p className="font-manrope text-xs sm:text-sm text-[#747870]">Adicione um prato, porção ou bebida ao cardápio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="p-2 text-[#747870] hover:text-[#132512] rounded-2xl hover:bg-[#efeeea] transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulário com Rolagem e Layout Amplo */}
            <form onSubmit={handleCreateProduct} className="p-6 sm:p-8 space-y-6 text-sm font-manrope overflow-y-auto flex-1">
              {/* Área de Foto do Produto */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#fbf9f5] border border-[#e4e2de] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#283b26]" />
                    <span>Foto do Produto</span>
                  </label>
                  {newProduct.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewProduct({ ...newProduct, imageUrl: '' })}
                      className="text-xs font-grotesk font-semibold text-[#ba1a1a] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Pré-visualização */}
                  <div className="sm:col-span-5 relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-[#c4c8bf] bg-[#f5f3ef] flex flex-col items-center justify-center">
                    {newProduct.imageUrl ? (
                      <img
                        src={newProduct.imageUrl}
                        alt="Pré-visualização do produto"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    ) : (
                      <label
                        htmlFor="add-product-photo-file"
                        className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#eae8e4] transition text-center"
                      >
                        <div className="p-3 bg-white rounded-full text-[#4f644c] shadow-xs mb-2">
                          <Camera className="w-6 h-6 stroke-[2]" />
                        </div>
                        <span className="font-grotesk text-xs font-bold text-[#132512]">Nenhuma foto selecionada</span>
                        <span className="font-manrope text-[11px] text-[#747870] mt-0.5">Clique para escolher do aparelho</span>
                      </label>
                    )}
                  </div>

                  {/* Ações de Foto */}
                  <div className="sm:col-span-7 flex flex-col justify-center space-y-3">
                    <div>
                      <input
                        id="add-product-photo-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, false)}
                      />
                      <label
                        htmlFor="add-product-photo-file"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 rounded-xl bg-[#283b26] hover:bg-[#132512] text-white font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <span>{newProduct.imageUrl ? 'Trocar Foto do Aparelho' : 'Adicionar Foto do Aparelho'}</span>
                      </label>
                      <p className="text-[11px] text-[#747870] mt-1.5 font-manrope">
                        Suporta fotos tiradas na câmera ou arquivos da galeria (JPG, PNG, WebP).
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#e4e2de]/80">
                      <label className="block font-grotesk text-[11px] font-bold uppercase text-[#747870] mb-1">
                        Ou informe o link / URL da foto:
                      </label>
                      <input
                        type="url"
                        value={newProduct.imageUrl}
                        onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                        placeholder="https://exemplo.com/foto.jpg (opcional)"
                        className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-white focus:border-[#283b26] outline-none text-[#132512] font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Principais do Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome do Produto */}
                <div className="md:col-span-2">
                  <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Ex.: Iscas de Tilápia Crocantes"
                    className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-sm sm:text-base text-[#132512]"
                  />
                </div>

                {/* Grupo / Categoria */}
                <div>
                  <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
                    Grupo / Categoria *
                  </label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isDest = val === 'destilados';
                      setNewProduct({
                        ...newProduct,
                        categoryId: val,
                        hasOptions: isDest ? true : newProduct.hasOptions,
                        options: isDest && (!newProduct.options || newProduct.options.length === 0)
                          ? [
                              { name: '1 Dose', price: '' },
                              { name: '2 Doses', price: '' },
                              { name: 'Garrafa', price: '' },
                            ]
                          : newProduct.options,
                      });
                    }}
                    className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-sm sm:text-base text-[#132512]"
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
                      className="w-full mt-2.5 p-3 rounded-xl border border-[#e4e2de] bg-white focus:border-[#283b26] outline-none text-sm font-grotesk font-semibold text-[#132512]"
                    />
                  )}
                </div>

                {/* Opções de Doses & Garrafa (Destilados & Doses) */}
                {(newProduct.categoryId === 'destilados' || newProduct.hasOptions) ? (
                  <div className="md:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#f5f3ef] border border-[#e4e2de] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512]">
                          Doses & Garrafa (Valores do Item)
                        </h4>
                        <p className="font-manrope text-[11px] text-[#747870]">
                          Defina a quantidade de doses e o valor de cada uma e o valor da garrafa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddOptionNewProduct}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#283b26] hover:bg-[#132512] text-white text-xs font-grotesk font-bold transition cursor-pointer self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Opção/Dose</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {newProduct.options?.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-[#dedad2]">
                          <div className="flex-1">
                            <label className="block text-[10px] font-grotesk font-bold uppercase text-[#747870] mb-0.5">
                              Dose / Tamanho
                            </label>
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) => handleUpdateOptionNewProduct(idx, 'name', e.target.value)}
                              placeholder="Ex: 1 Dose, 2 Doses, Garrafa"
                              className="w-full p-2 text-xs font-grotesk font-semibold bg-[#fbf9f5] rounded-lg border border-[#e4e2de] focus:bg-white outline-none"
                              required
                            />
                          </div>
                          <div className="w-28 sm:w-36">
                            <label className="block text-[10px] font-grotesk font-bold uppercase text-[#747870] mb-0.5">
                              Valor (R$)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={opt.price}
                              onChange={(e) => handleUpdateOptionNewProduct(idx, 'price', e.target.value)}
                              placeholder="0.00"
                              className="w-full p-2 text-xs font-grotesk font-bold text-[#132512] bg-[#fbf9f5] rounded-lg border border-[#e4e2de] focus:bg-white outline-none"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionNewProduct(idx)}
                            className="p-2 text-[#747870] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition cursor-pointer mt-3"
                            title="Remover opção"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Valor Único (R$) para Itens Convencionais */
                  <div>
                    <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
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
                      className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-sm sm:text-base text-[#132512]"
                    />
                  </div>
                )}

                {/* Descrição dos Ingredientes / Porção */}
                <div className="md:col-span-2">
                  <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
                    Descrição dos Ingredientes / Porção
                  </label>
                  <textarea
                    rows={3}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Ex.: Empanado em farinha especial com raspas de limão e molho tártaro artesanal."
                    className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none resize-none text-sm sm:text-base text-[#132512]"
                  />
                </div>
              </div>

              {/* Rodapé com Botões de Ação */}
              <div className="pt-4 border-t border-[#efeeea] flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-5 py-3 rounded-xl border border-[#e4e2de] text-[#747870] hover:text-[#132512] font-grotesk text-xs sm:text-sm uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#efeeea] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPhotoLoading}
                  className="bg-[#283b26] hover:bg-[#132512] disabled:opacity-50 text-white font-grotesk text-xs sm:text-sm uppercase tracking-wider font-bold py-3 px-6 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Cadastrar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: EDITAR PRODUTO EXISTENTE (AMPLO E LEGÍVEL)
      ══════════════════════════════════════════════════════════ */}
      {isEditProductOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsEditProductOpen(false)} />

          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#e4e2de] shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="p-5 sm:p-6 border-b border-[#efeeea] flex items-center justify-between bg-[#fbf9f5] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#daeaaa] text-[#161f00] rounded-2xl">
                  <Pencil className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-grotesk text-xl sm:text-2xl font-bold text-[#132512]">Editar Produto</h3>
                  <p className="font-manrope text-xs sm:text-sm text-[#747870]">Altere as fotos, valor e dados deste item</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProductOpen(false)}
                className="p-2 text-[#747870] hover:text-[#132512] rounded-2xl hover:bg-[#efeeea] transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulário com Rolagem e Layout Amplo */}
            <form onSubmit={handleSaveEditedProduct} className="p-6 sm:p-8 space-y-6 text-sm font-manrope overflow-y-auto flex-1">
              {/* Área de Foto do Produto com Opção de Upload */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#fbf9f5] border border-[#e4e2de] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#283b26]" />
                    <span>Foto do Produto</span>
                  </label>
                  {editingProduct.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, imageUrl: '' })}
                      className="text-xs font-grotesk font-semibold text-[#ba1a1a] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Pré-visualização da Foto */}
                  <div className="sm:col-span-5 relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-[#c4c8bf] bg-[#f5f3ef] flex flex-col items-center justify-center">
                    {editingProduct.imageUrl ? (
                      <img
                        src={editingProduct.imageUrl}
                        alt={editingProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    ) : (
                      <label
                        htmlFor="edit-product-photo-file"
                        className="w-full h-full flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-[#eae8e4] transition text-center"
                      >
                        <div className="p-3 bg-white rounded-full text-[#4f644c] shadow-xs mb-2">
                          <Camera className="w-6 h-6 stroke-[2]" />
                        </div>
                        <span className="font-grotesk text-xs font-bold text-[#132512]">Nenhuma foto selecionada</span>
                        <span className="font-manrope text-[11px] text-[#747870] mt-0.5">Clique para escolher do aparelho</span>
                      </label>
                    )}
                  </div>

                  {/* Ações de Foto */}
                  <div className="sm:col-span-7 flex flex-col justify-center space-y-3">
                    <div>
                      <input
                        id="edit-product-photo-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, true)}
                      />
                      <label
                        htmlFor="edit-product-photo-file"
                        className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 rounded-xl bg-[#283b26] hover:bg-[#132512] text-white font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <span>{editingProduct.imageUrl ? 'Trocar Foto do Aparelho' : 'Adicionar Foto do Aparelho'}</span>
                      </label>
                      <p className="text-[11px] text-[#747870] mt-1.5 font-manrope">
                        Tire uma nova foto com a câmera ou escolha um arquivo da galeria.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#e4e2de]/80">
                      <label className="block font-grotesk text-[11px] font-bold uppercase text-[#747870] mb-1">
                        Ou informe o link / URL da foto:
                      </label>
                      <input
                        type="url"
                        value={editingProduct.imageUrl || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full p-2.5 rounded-xl border border-[#e4e2de] bg-white focus:border-[#283b26] outline-none text-[#132512] font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados Principais do Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome do Produto */}
                <div className="md:col-span-2">
                  <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-sm sm:text-base text-[#132512]"
                  />
                </div>

                {/* Grupo / Categoria */}
                <div>
                  <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
                    Grupo / Categoria *
                  </label>
                  <select
                    value={editingProduct.isCustomCategory ? 'custom' : editingProduct.categoryId}
                    onChange={(e) => {
                      const isCustom = e.target.value === 'custom';
                      const isDest = e.target.value === 'destilados';
                      setEditingProduct({
                        ...editingProduct,
                        isCustomCategory: isCustom,
                        categoryId: isCustom ? 'custom' : e.target.value,
                        hasOptions: isDest ? true : editingProduct.hasOptions,
                        options: isDest && (!editingProduct.options || editingProduct.options.length === 0)
                          ? [
                              { name: '1 Dose', price: String(editingProduct.price || '') },
                              { name: '2 Doses', price: '' },
                              { name: 'Garrafa', price: '' },
                            ]
                          : editingProduct.options,
                      });
                    }}
                    className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-sm sm:text-base text-[#132512]"
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
                      className="w-full mt-2.5 p-3 rounded-xl border border-[#e4e2de] bg-white focus:border-[#283b26] outline-none text-sm font-grotesk font-semibold text-[#132512]"
                    />
                  )}
                </div>

                {/* Opções de Doses & Garrafa (Destilados & Doses) */}
                {(editingProduct.categoryId === 'destilados' || editingProduct.hasOptions) ? (
                  <div className="md:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#f5f3ef] border border-[#e4e2de] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512]">
                          Doses & Garrafa (Valores do Item)
                        </h4>
                        <p className="font-manrope text-[11px] text-[#747870]">
                          Defina a quantidade de doses e o valor de cada uma e o valor da garrafa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddOptionEditProduct}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#283b26] hover:bg-[#132512] text-white text-xs font-grotesk font-bold transition cursor-pointer self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Opção/Dose</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {editingProduct.options?.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-[#dedad2]">
                          <div className="flex-1">
                            <label className="block text-[10px] font-grotesk font-bold uppercase text-[#747870] mb-0.5">
                              Dose / Tamanho
                            </label>
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) => handleUpdateOptionEditProduct(idx, 'name', e.target.value)}
                              placeholder="Ex: 1 Dose, 2 Doses, Garrafa"
                              className="w-full p-2 text-xs font-grotesk font-semibold bg-[#fbf9f5] rounded-lg border border-[#e4e2de] focus:bg-white outline-none"
                              required
                            />
                          </div>
                          <div className="w-28 sm:w-36">
                            <label className="block text-[10px] font-grotesk font-bold uppercase text-[#747870] mb-0.5">
                              Valor (R$)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={opt.price}
                              onChange={(e) => handleUpdateOptionEditProduct(idx, 'price', e.target.value)}
                              placeholder="0.00"
                              className="w-full p-2 text-xs font-grotesk font-bold text-[#132512] bg-[#fbf9f5] rounded-lg border border-[#e4e2de] focus:bg-white outline-none"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionEditProduct(idx)}
                            className="p-2 text-[#747870] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition cursor-pointer mt-3"
                            title="Remover opção"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Valor Único (R$) para Itens Convencionais */
                  <div>
                    <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-sm sm:text-base text-[#132512]"
                    />
                  </div>
                )}

                {/* Disponibilidade */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-[#fbf9f5] border border-[#e4e2de] cursor-pointer hover:bg-stone-50 transition">
                    <input
                      type="checkbox"
                      checked={editingProduct.isAvailable !== false}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isAvailable: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#283b26] accent-[#283b26] cursor-pointer"
                    />
                    <div>
                      <span className="font-grotesk text-xs sm:text-sm font-bold text-[#132512] block">
                        Item disponível para pedidos no cardápio
                      </span>
                      <span className="font-manrope text-[11px] text-[#747870] block">
                        Desmarque para pausar temporariamente as vendas deste item.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Descrição dos Ingredientes / Porção */}
                <div className="md:col-span-2">
                  <label className="block font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] mb-1.5">
                    Descrição dos Ingredientes / Porção
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-[#e4e2de] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] outline-none resize-none text-sm sm:text-base text-[#132512]"
                  />
                </div>
              </div>

              {/* Rodapé com Botões de Ação */}
              <div className="pt-4 border-t border-[#efeeea] flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditProductOpen(false)}
                  className="px-5 py-3 rounded-xl border border-[#e4e2de] text-[#747870] hover:text-[#132512] font-grotesk text-xs sm:text-sm uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#efeeea] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPhotoLoading}
                  className="bg-[#283b26] hover:bg-[#132512] disabled:opacity-50 text-white font-grotesk text-xs sm:text-sm uppercase tracking-wider font-bold py-3 px-6 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: RELATÓRIO PDF COM FILTRO DE DATA
      ══════════════════════════════════════════════════════════ */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsPdfModalOpen(false)} />

          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#e4e2de] shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#efeeea] flex items-center justify-between bg-[#fbf9f5]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#daeaaa] text-[#161f00] rounded-xl">
                  <FileText className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-grotesk text-base font-bold text-[#132512]">Relatório de Pedidos em PDF</h3>
                  <p className="font-manrope text-[11px] text-[#747870]">Selecione o período para impressão ou exportação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1.5 text-[#747870] hover:text-[#132512] rounded-xl hover:bg-[#efeeea] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-manrope">
              <div>
                <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-2">
                  Período do Relatório
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'today', label: 'Hoje' },
                    { id: 'yesterday', label: 'Ontem' },
                    { id: '7days', label: 'Últimos 7 dias' },
                    { id: 'thisMonth', label: 'Este Mês' },
                    { id: 'all', label: 'Todo Histórico' },
                    { id: 'custom', label: 'Personalizado' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPdfDatePreset(preset.id)}
                      className={`p-2 rounded-xl font-grotesk font-semibold text-xs border transition cursor-pointer text-center ${
                        pdfDatePreset === preset.id
                          ? 'bg-[#283b26] text-white border-[#283b26] shadow-xs'
                          : 'bg-[#f5f3ef] text-[#434841] border-[#e4e2de] hover:border-[#283b26]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {pdfDatePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#f5f3ef] rounded-xl border border-[#e4e2de]">
                  <div>
                    <label className="block font-grotesk text-[10px] font-bold uppercase text-[#132512] mb-1">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={pdfStartDate}
                      onChange={(e) => setPdfStartDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#e4e2de] bg-white text-xs font-grotesk text-[#132512]"
                    />
                  </div>
                  <div>
                    <label className="block font-grotesk text-[10px] font-bold uppercase text-[#132512] mb-1">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={pdfEndDate}
                      onChange={(e) => setPdfEndDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#e4e2de] bg-white text-xs font-grotesk text-[#132512]"
                    />
                  </div>
                </div>
              )}

              {/* Resumo do Período */}
              <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#e4e2de] space-y-2">
                <span className="font-grotesk text-[10px] font-bold uppercase tracking-wider text-[#747870] block">
                  Resumo do Período Selecionado
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#434841] font-manrope">Período:</span>
                  <span className="font-grotesk font-bold text-[#132512]">{pdfPeriodLabel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#434841] font-manrope">Pedidos Concluídos:</span>
                  <span className="font-grotesk font-bold text-[#132512]">{pdfFilteredOrders.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#434841] font-manrope">Faturamento:</span>
                  <span className="font-grotesk font-bold text-[#566431]">{formatCurrency(pdfTotalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#434841] font-manrope">Ticket Médio:</span>
                  <span className="font-grotesk font-bold text-[#132512]">{formatCurrency(pdfAverageTicket)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#efeeea] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#e4e2de] text-[#747870] hover:text-[#132512] font-grotesk text-xs uppercase tracking-wider font-semibold cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    generateCompletedOrdersPdf({
                      completedOrders: pdfFilteredOrders,
                      storeInfo,
                      periodLabel: pdfPeriodLabel,
                    });
                  }}
                  disabled={pdfFilteredOrders.length === 0}
                  className="bg-[#283b26] hover:bg-[#132512] disabled:opacity-40 text-white font-grotesk text-xs uppercase tracking-wider font-semibold py-2 px-4 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Imprimir / Gerar PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
