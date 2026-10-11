export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export function cleanPhone(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * Mensagem gerada pela loja para enviar ao cliente para confirmação do pedido
 */
export function buildStoreToCustomerMessage({ order, storeInfo }) {
  const isDelivery = order.orderType === 'delivery';

  let msg = `*BEACH HOUSE SPORTS N' BAR*\n`;
  msg += `--------------------------------\n`;
  msg += `Olá, ${order.customerName.trim()}! Recebemos o seu pedido #${order.id}.\n\n`;

  msg += `*ITENS DO PEDIDO:*\n`;
  order.items.forEach((item) => {
    const itemPriceText = item.quantity > 1 
      ? `(${formatCurrency(item.product.price)} cada)` 
      : `(${formatCurrency(item.product.price)})`;
    msg += `• ${item.quantity}x ${item.product.name} ${itemPriceText}\n`;
    if (item.notes && item.notes.trim()) {
      msg += `  _Obs: ${item.notes.trim()}_\n`;
    }
  });

  msg += `\n--------------------------------\n`;
  msg += `*Subtotal:* ${formatCurrency(order.subtotal)}\n`;
  if (isDelivery && order.deliveryFee > 0) {
    msg += `*Taxa de Entrega:* ${formatCurrency(order.deliveryFee)}\n`;
    msg += `*Total Geral:* ${formatCurrency(order.total)}\n`;
  } else {
    msg += `*Total Geral:* ${formatCurrency(order.total)}\n`;
  }

  // Tipo de pedido
  if (isDelivery && order.address) {
    msg += `*Tipo:* Entrega (Delivery)\n`;
    const addressLine = `${order.address.street}, ${order.address.number}${
      order.address.complement ? ` - ${order.address.complement}` : ''
    }`;
    msg += `*Endereço:* ${addressLine} - ${order.address.neighborhood}\n`;
    if (order.address.reference && order.address.reference.trim()) {
      msg += `*Ponto de Referência:* ${order.address.reference.trim()}\n`;
    }
  } else {
    msg += `*Tipo:* Retirada no Balcão\n`;
  }

  // Forma de pagamento
  let paymentLabel = 'Pix';
  if (order.paymentMethod === 'credit') paymentLabel = 'Cartão de Crédito';
  else if (order.paymentMethod === 'debit') paymentLabel = 'Cartão de Débito';
  else if (order.paymentMethod === 'cash') paymentLabel = 'Dinheiro';
  else if (order.paymentMethod === 'pix') paymentLabel = 'Pix';

  msg += `*Forma de Pagamento:* ${paymentLabel}\n`;

  if (order.paymentMethod === 'cash' && order.changeFor) {
    msg += `*Troco para:* ${formatCurrency(parseFloat(order.changeFor))}\n`;
  }

  if (order.paymentMethod === 'pix' && storeInfo?.pixKey) {
    msg += `*Chave Pix da Loja:* ${storeInfo.pixKey}\n`;
  }

  if (order.generalNotes && order.generalNotes.trim()) {
    msg += `*Obs. do Pedido:* ${order.generalNotes.trim()}\n`;
  }

  msg += `--------------------------------\n`;
  msg += `Seu pedido foi registrado em nosso sistema. Podemos confirmar o início do preparo?`;

  return msg;
}

/**
 * Mensagem tradicional (cliente para a loja) mantida para compatibilidade
 */
export function buildWhatsAppMessage({ items, checkout, storeInfo, subtotal, deliveryFee, total }) {
  const isDelivery = checkout.orderType === 'delivery';

  let msg = `*NOVO PEDIDO RECEBIDO - BEACH HOUSE*\n`;
  msg += `--------------------------------\n`;
  msg += `*Cliente:* ${checkout.customerName.trim()}\n`;
  msg += `*Telefone:* ${formatPhone(checkout.customerPhone)}\n\n`;

  if (isDelivery) {
    msg += `*Tipo:* Entrega (Delivery)\n`;
    const addressLine = `${checkout.address.street}, ${checkout.address.number}${
      checkout.address.complement ? ` - ${checkout.address.complement}` : ''
    }`;
    msg += `*Endereço:* ${addressLine}\n`;
    msg += `*Bairro:* ${checkout.address.neighborhood}\n`;
    if (checkout.address.reference && checkout.address.reference.trim()) {
      msg += `*Ponto de Referência:* ${checkout.address.reference.trim()}\n`;
    }
  } else {
    msg += `*Tipo:* Retirada no Balcão\n`;
    if (storeInfo?.address) {
      msg += `*Local de Retirada:* ${storeInfo.address}\n`;
    }
  }

  msg += `\n--------------------------------\n`;
  msg += `*ITENS DO PEDIDO:*\n\n`;

  items.forEach((item) => {
    const itemPriceText = item.quantity > 1 
      ? `(${formatCurrency(item.product.price)} cada)` 
      : `(${formatCurrency(item.product.price)})`;
    msg += `• ${item.quantity}x ${item.product.name} ${itemPriceText}\n`;
    if (item.notes && item.notes.trim()) {
      msg += `  _Obs: ${item.notes.trim()}_\n`;
    }
  });

  msg += `\n--------------------------------\n`;
  msg += `*Subtotal:* ${formatCurrency(subtotal)}\n`;
  
  if (isDelivery && deliveryFee > 0) {
    msg += `*Taxa de Entrega:* ${formatCurrency(deliveryFee)}\n`;
    msg += `*Total Geral:* ${formatCurrency(total)}\n`;
  } else {
    msg += `*Total:* ${formatCurrency(total)}\n`;
  }

  let paymentLabel = 'Pix';
  if (checkout.paymentMethod === 'credit') paymentLabel = 'Cartão de Crédito (Levar Maquininha)';
  else if (checkout.paymentMethod === 'debit') paymentLabel = 'Cartão de Débito (Levar Maquininha)';
  else if (checkout.paymentMethod === 'cash') paymentLabel = 'Dinheiro';
  else if (checkout.paymentMethod === 'pix') paymentLabel = 'Pix';

  msg += `*Forma de Pagamento:* ${paymentLabel}\n`;

  if (checkout.paymentMethod === 'cash') {
    if (checkout.changeFor && parseFloat(checkout.changeFor) > 0) {
      msg += `*Troco para:* ${formatCurrency(parseFloat(checkout.changeFor))}\n`;
    } else {
      msg += `*Troco:* Não precisa de troco\n`;
    }
  }

  if (checkout.paymentMethod === 'pix' && storeInfo?.pixKey) {
    msg += `*Chave Pix da Loja:* ${storeInfo.pixKey}\n`;
  }

  if (checkout.generalNotes && checkout.generalNotes.trim()) {
    msg += `\n*Obs. do Pedido:* ${checkout.generalNotes.trim()}\n`;
  }

  msg += `--------------------------------\n`;
  msg += `Pedido enviado via Cardápio Digital - Beach House`;

  return msg;
}

/**
 * Gera URL oficial direta do WhatsApp para iniciar a conversa imediatamente
 */
export function generateWhatsAppUrl(phone, message) {
  const cleanNumber = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`;
}
