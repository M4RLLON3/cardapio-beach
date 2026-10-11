import React, { useState, useEffect } from 'react';
import {
  X,
  Bike,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  Send,
  ArrowLeft,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { formatCurrency, formatPhone, buildWhatsAppMessage, generateWhatsAppUrl } from '../utils/formatters';

const CUSTOMER_STORAGE_KEY = 'beach_house_customer_data_v1';

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  subtotal,
  deliveryFee,
  storeInfo,
  onOrderCompleted,
  onOrderSubmitted,
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'pickup'
  
  // Endereço
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState('pix'); // 'pix' | 'credit' | 'debit' | 'cash'
  const [changeFor, setChangeFor] = useState('');
  const [needsChange, setNeedsChange] = useState(false);

  // Observações gerais
  const [generalNotes, setGeneralNotes] = useState('');

  // Erros de validação
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  // Recupera dados salvos previamente do cliente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.customerName) setCustomerName(data.customerName);
        if (data.customerPhone) setCustomerPhone(data.customerPhone);
        if (data.orderType) setOrderType(data.orderType);
        if (data.address) {
          setStreet(data.address.street || '');
          setNumber(data.address.number || '');
          setNeighborhood(data.address.neighborhood || '');
          setComplement(data.address.complement || '');
          setReference(data.address.reference || '');
        }
      }
    } catch (e) {
      console.error('Erro ao ler dados salvos do cliente', e);
    }
  }, []);

  if (!isOpen) return null;

  const appliedDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;
  const total = subtotal + appliedDeliveryFee;

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCustomerPhone(raw);
  };

  const validateForm = () => {
    const errs = {};
    if (!customerName.trim()) {
      errs.customerName = 'Por favor, informe seu nome completo.';
    }
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      errs.customerPhone = 'Informe um WhatsApp com DDD válido.';
    }

    if (orderType === 'delivery') {
      if (!street.trim()) errs.street = 'Informe a rua / avenida.';
      if (!number.trim()) errs.number = 'Informe o número.';
      if (!neighborhood.trim()) errs.neighborhood = 'Informe o bairro.';
    }

    if (paymentMethod === 'cash' && needsChange) {
      const changeNum = parseFloat(changeFor.replace(',', '.'));
      if (!changeNum || changeNum <= total) {
        errs.changeFor = `O troco deve ser maior que o total (${formatCurrency(total)}).`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getCheckoutPayload = () => ({
    customerName,
    customerPhone,
    orderType,
    address: {
      street,
      number,
      neighborhood,
      complement,
      reference,
    },
    paymentMethod,
    changeFor: paymentMethod === 'cash' && needsChange ? changeFor : undefined,
    generalNotes,
  });

  const handleFinishOrder = () => {
    if (!validateForm()) return;

    try {
      localStorage.setItem(
        CUSTOMER_STORAGE_KEY,
        JSON.stringify({
          customerName,
          customerPhone,
          orderType,
          address: { street, number, neighborhood, complement, reference },
        })
      );
    } catch (e) {
      console.error(e);
    }

    const orderData = {
      id: `${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      status: 'pendente',
      customerName: customerName.trim(),
      customerPhone: customerPhone.replace(/\D/g, ''),
      orderType,
      address: orderType === 'delivery' ? { street, number, neighborhood, complement, reference } : null,
      paymentMethod,
      changeFor: paymentMethod === 'cash' && needsChange ? changeFor : undefined,
      generalNotes,
      items: [...items],
      subtotal,
      deliveryFee: appliedDeliveryFee,
      total,
    };

    if (onOrderSubmitted) {
      onOrderSubmitted(orderData);
    } else if (onOrderCompleted) {
      onOrderCompleted(orderData);
    }
  };

  const handleCopyMessage = () => {
    if (!validateForm()) return;
    const checkoutData = getCheckoutPayload();
    const message = buildWhatsAppMessage({
      items,
      checkout: checkoutData,
      storeInfo,
      subtotal,
      deliveryFee: appliedDeliveryFee,
      total,
    });

    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#FCFAF6] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[95vh] flex flex-col border-2 border-[#DDD7C4] animate-in zoom-in-95 duration-200">
        
        {/* Header do Checkout */}
        <div className="p-4 sm:p-5 border-b-2 border-[#DDD7C4] flex items-center justify-between bg-[#F5F2EB]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#2C3E18]/70 hover:text-[#2C3E18] hover:bg-[#ECE7D8] transition-colors sm:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#2C3E18]">
                Finalizar Pedido
              </h2>
              <p className="text-xs text-[#2C3E18]/65">
                Envio direto e formatado para o WhatsApp da loja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#2C3E18]/60 hover:text-[#2C3E18] rounded-lg hover:bg-[#ECE7D8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-[#2C3E18] text-xs sm:text-sm">
          
          {/* 1. SELEÇÃO DO TIPO DE PEDIDO */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[#2C3E18]">
              1. Modalidade de Recebimento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  orderType === 'delivery'
                    ? 'border-[#4A692D] bg-[#EAF0DF] text-[#2C3E18] shadow-sm font-black'
                    : 'border-[#DDD7C4] hover:border-[#4A692D]/40 bg-[#F5F2EB] text-[#2C3E18]/70 font-semibold'
                }`}
              >
                <Bike className="w-6 h-6 text-[#4A692D]" />
                <div>
                  <div className="text-xs sm:text-sm">Entrega (Delivery)</div>
                  <div className="text-[11px] text-[#2C3E18]/60 font-normal mt-0.5">
                    {deliveryFee > 0 ? `Taxa de ${formatCurrency(deliveryFee)}` : 'Frete Grátis'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  orderType === 'pickup'
                    ? 'border-[#4A692D] bg-[#EAF0DF] text-[#2C3E18] shadow-sm font-black'
                    : 'border-[#DDD7C4] hover:border-[#4A692D]/40 bg-[#F5F2EB] text-[#2C3E18]/70 font-semibold'
                }`}
              >
                <Store className="w-6 h-6 text-[#4A692D]" />
                <div>
                  <div className="text-xs sm:text-sm">Retirada no Balcão</div>
                  <div className="text-[11px] text-[#2C3E18]/60 font-normal mt-0.5">
                    Sem taxa de entrega
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. DADOS DO CLIENTE */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[#2C3E18]">
              2. Identificação do Cliente
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#2C3E18]/80 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex.: Lucas Silva"
                  className={`w-full p-3 rounded-xl border-2 text-xs sm:text-sm bg-[#F5F2EB] focus:bg-[#FCFAF6] focus:outline-none transition-all ${
                    errors.customerName
                      ? 'border-rose-400'
                      : 'border-[#DDD7C4] focus:border-[#4A692D]'
                  }`}
                />
                {errors.customerName && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1">
                    {errors.customerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2C3E18]/80 mb-1">
                  WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  value={formatPhone(customerPhone)}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  className={`w-full p-3 rounded-xl border-2 text-xs sm:text-sm bg-[#F5F2EB] focus:bg-[#FCFAF6] focus:outline-none transition-all ${
                    errors.customerPhone
                      ? 'border-rose-400'
                      : 'border-[#DDD7C4] focus:border-[#4A692D]'
                  }`}
                />
                {errors.customerPhone && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1">
                    {errors.customerPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 3. ENDEREÇO DE ENTREGA (SE DELIVERY) */}
          {orderType === 'delivery' && (
            <div className="bg-[#F5F2EB] p-4 rounded-2xl border-2 border-[#DDD7C4] space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-[#2C3E18]">
                3. Endereço de Entrega
              </label>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#2C3E18]/80 mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex.: Rua das Flores"
                    className={`w-full p-2.5 rounded-xl border-2 text-xs bg-[#FCFAF6] focus:outline-none ${
                      errors.street ? 'border-rose-400' : 'border-[#DDD7C4] focus:border-[#4A692D]'
                    }`}
                  />
                  {errors.street && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">{errors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2C3E18]/80 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className={`w-full p-2.5 rounded-xl border-2 text-xs bg-[#FCFAF6] focus:outline-none ${
                      errors.number ? 'border-rose-400' : 'border-[#DDD7C4] focus:border-[#4A692D]'
                    }`}
                  />
                  {errors.number && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">{errors.number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#2C3E18]/80 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex.: Centro"
                    className={`w-full p-2.5 rounded-xl border-2 text-xs bg-[#FCFAF6] focus:outline-none ${
                      errors.neighborhood ? 'border-rose-400' : 'border-[#DDD7C4] focus:border-[#4A692D]'
                    }`}
                  />
                  {errors.neighborhood && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">{errors.neighborhood}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#2C3E18]/80 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Ex.: Apto 42, Bloco B"
                    className="w-full p-2.5 rounded-xl border-2 border-[#DDD7C4] text-xs bg-[#FCFAF6] focus:outline-none focus:border-[#4A692D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#2C3E18]/80 mb-1">
                  Ponto de Referência
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex.: Próximo à quadra de areia..."
                  className="w-full p-2.5 rounded-xl border-2 border-[#DDD7C4] text-xs bg-[#FCFAF6] focus:outline-none focus:border-[#4A692D]"
                />
              </div>
            </div>
          )}

          {/* 4. FORMAS DE PAGAMENTO */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2 text-[#2C3E18]">
              {orderType === 'delivery' ? '4. Forma de Pagamento' : '3. Forma de Pagamento'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-[#4A692D] bg-[#EAF0DF] text-[#2C3E18] font-black'
                    : 'border-[#DDD7C4] text-[#2C3E18]/70 hover:border-[#4A692D]/40 font-semibold'
                }`}
              >
                <QrCode className="w-5 h-5 text-[#4A692D]" />
                <span className="text-xs">Pix</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-[#4A692D] bg-[#EAF0DF] text-[#2C3E18] font-black'
                    : 'border-[#DDD7C4] text-[#2C3E18]/70 hover:border-[#4A692D]/40 font-semibold'
                }`}
              >
                <CreditCard className="w-5 h-5 text-[#4A692D]" />
                <span className="text-xs">Cartão Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('debit')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'debit'
                    ? 'border-[#4A692D] bg-[#EAF0DF] text-[#2C3E18] font-black'
                    : 'border-[#DDD7C4] text-[#2C3E18]/70 hover:border-[#4A692D]/40 font-semibold'
                }`}
              >
                <CreditCard className="w-5 h-5 text-[#4A692D]" />
                <span className="text-xs">Cartão Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-[#4A692D] bg-[#EAF0DF] text-[#2C3E18] font-black'
                    : 'border-[#DDD7C4] text-[#2C3E18]/70 hover:border-[#4A692D]/40 font-semibold'
                }`}
              >
                <Banknote className="w-5 h-5 text-[#4A692D]" />
                <span className="text-xs">Dinheiro</span>
              </button>
            </div>

            {paymentMethod === 'pix' && storeInfo?.pixKey && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#EAF0DF] border-2 border-[#DDD7C4] text-xs text-[#2C3E18] flex items-center justify-between">
                <div>
                  <span className="font-extrabold block">Chave Pix da Loja:</span>
                  <span className="font-mono text-[11px] select-all font-bold">{storeInfo.pixKey}</span>
                </div>
                <span className="text-[10px] bg-[#4A692D] text-white px-2 py-0.5 rounded font-black">
                  No WhatsApp
                </span>
              </div>
            )}

            {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#F5F2EB] border-2 border-[#DDD7C4] text-xs text-[#2C3E18]">
                <span>O entregador levará a máquina de cartão na entrega.</span>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#F5F2EB] border-2 border-[#DDD7C4] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="needsChangeCheckbox"
                    checked={needsChange}
                    onChange={(e) => setNeedsChange(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4A692D] focus:ring-[#4A692D]"
                  />
                  <label htmlFor="needsChangeCheckbox" className="text-xs font-black cursor-pointer">
                    Precisa de troco para quanto?
                  </label>
                </div>

                {needsChange && (
                  <div>
                    <input
                      type="number"
                      step="any"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder={`Ex: 50, 100 (Total: ${formatCurrency(total)})`}
                      className={`w-full p-2.5 rounded-xl border-2 text-xs bg-[#FCFAF6] focus:outline-none ${
                        errors.changeFor
                          ? 'border-rose-400'
                          : 'border-[#DDD7C4] focus:border-[#4A692D]'
                      }`}
                    />
                    {errors.changeFor && (
                      <p className="text-[10px] text-rose-600 mt-1 font-bold">
                        {errors.changeFor}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. OBSERVAÇÕES GERAIS */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-[#2C3E18]">
              Observações Gerais do Pedido (Opcional)
            </label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ex.: Tocar o interfone 42, deixar na portaria..."
              className="w-full p-3 rounded-xl border-2 border-[#DDD7C4] bg-[#F5F2EB] focus:bg-[#FCFAF6] text-xs sm:text-sm focus:outline-none focus:border-[#4A692D] transition-all resize-none"
              maxLength={180}
            />
          </div>

          {/* RESUMO DOS VALORES */}
          <div className="bg-[#F5F2EB] p-4 rounded-2xl border-2 border-[#DDD7C4] space-y-2">
            <div className="flex justify-between text-xs text-[#2C3E18]/70 font-semibold">
              <span>Itens ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
              <span className="font-extrabold text-[#2C3E18]">{formatCurrency(subtotal)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-xs text-[#2C3E18]/70 font-semibold">
                <span>Taxa de Entrega</span>
                <span className="font-extrabold text-[#2C3E18]">
                  {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-[#2C3E18] pt-2 border-t-2 border-[#DDD7C4]">
              <span>Total a Pagar</span>
              <span className="text-[#4A692D] font-black">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="p-4 sm:p-5 bg-[#FCFAF6] border-t-2 border-[#DDD7C4] space-y-2.5">
          <button
            type="button"
            onClick={handleFinishOrder}
            className="w-full bg-[#4A692D] hover:bg-[#3A5323] active:scale-[0.98] text-[#FCFAF6] font-black py-3.5 px-4 rounded-xl shadow-lg shadow-[#4A692D]/25 transition-all flex items-center justify-center gap-2 text-sm sm:text-base group"
          >
            <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            <span>Concluir e Enviar Pedido para a Loja</span>
          </button>

          <div className="text-center text-[11px] text-[#2C3E18]/65 font-medium px-1">
            <span>A loja receberá seu pedido e entrará em contato via WhatsApp para confirmar o preparo.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
