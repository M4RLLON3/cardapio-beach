import { formatCurrency, formatPhone } from './formatters';

/**
 * Gera um relatório profissional em PDF dos pedidos finalizados
 * usando a API nativa de impressão/salvar em PDF do navegador com layout A4
 */
export function generateCompletedOrdersPdf({ completedOrders, storeInfo, periodLabel = 'Todo o Histórico' }) {
  if (!completedOrders || completedOrders.length === 0) {
    alert('Não há pedidos finalizados no período selecionado para gerar o relatório.');
    return;
  }

  // Estatísticas do Relatório
  const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = completedOrders.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const deliveryCount = completedOrders.filter((o) => o.orderType === 'delivery').length;
  const pickupCount = completedOrders.filter((o) => o.orderType === 'pickup').length;

  const paymentStats = completedOrders.reduce((acc, order) => {
    const method = order.paymentMethod || 'outro';
    acc[method] = (acc[method] || 0) + (order.total || 0);
    return acc;
  }, {});

  const emissionDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentMethodLabels = {
    pix: 'Pix',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    cash: 'Dinheiro',
  };

  // Cria a janela de impressão
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para gerar o relatório em PDF.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Pedidos Finalizados - Beach House</title>
      <style>
        @page {
          size: A4;
          margin: 14mm 12mm 14mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #2C3E18;
          background: #ffffff;
          margin: 0;
          padding: 20px;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #4A692D;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: #4A692D;
          margin: 0;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.25em;
          color: #4A692D;
          margin: 2px 0 0 0;
        }
        .report-meta {
          text-align: right;
          font-size: 10px;
          color: #666;
        }
        .report-title {
          font-size: 14px;
          font-weight: 800;
          color: #2C3E18;
          margin: 0 0 4px 0;
        }
        
        /* Cards de KPIs */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .kpi-card {
          background: #F5F2EB;
          border: 1px solid #DDD7C4;
          border-radius: 8px;
          padding: 10px;
        }
        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 3px;
        }
        .kpi-value {
          font-size: 15px;
          font-weight: 900;
          color: #4A692D;
        }
        .kpi-sub {
          font-size: 9px;
          color: #888;
          margin-top: 2px;
        }

        /* Tabela de Pedidos */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 10px;
        }
        th {
          background: #4A692D;
          color: #ffffff;
          font-weight: 800;
          text-align: left;
          padding: 7px 8px;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        th:last-child, td:last-child {
          text-align: right;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #E5E1D3;
          vertical-align: top;
        }
        tr:nth-child(even) td {
          background-color: #FAF8F2;
        }
        .order-id {
          font-family: monospace;
          font-weight: 800;
          color: #4A692D;
        }
        .order-time {
          font-size: 9px;
          color: #777;
        }
        .client-name {
          font-weight: 700;
          color: #2C3E18;
        }
        .client-phone {
          font-size: 9px;
          color: #666;
        }
        .items-list {
          margin: 0;
          padding-left: 12px;
          font-size: 9.5px;
        }
        .badge {
          display: inline-block;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 8.5px;
          font-weight: 700;
          background: #EAF0DF;
          color: #3A5323;
        }
        .footer {
          border-top: 1px solid #DDD7C4;
          padding-top: 10px;
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #888;
        }
        .no-print-bar {
          background: #2C3E18;
          color: #fff;
          padding: 10px 16px;
          margin-bottom: 16px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-print {
          background: #4A692D;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 800;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-print:hover {
          background: #3A5323;
        }
        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      
      <!-- Barra superior no navegador para facilitar impressão / salvar PDF -->
      <div class="no-print-bar">
        <span>Visualização do Relatório Oficial de Pedidos Finalizados</span>
        <button class="btn-print" onclick="window.print()">Salvar como PDF / Imprimir</button>
      </div>

      <!-- Cabeçalho Oficial -->
      <div class="header">
        <div>
          <h1 class="brand-title">Beach House</h1>
          <p class="brand-sub">Sports N' Bar</p>
        </div>
        <div class="report-meta">
          <div class="report-title">Relatório de Pedidos Finalizados</div>
          <div>Período: <strong>${periodLabel}</strong></div>
          <div>Emissão: <strong>${emissionDate}</strong></div>
          <div>Estabelecimento: ${storeInfo.name}</div>
        </div>
      </div>

      <!-- Resumo Executivo (KPIs) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Faturamento Total</div>
          <div class="kpi-value">${formatCurrency(totalRevenue)}</div>
          <div class="kpi-sub">Soma dos pedidos concluídos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total de Pedidos</div>
          <div class="kpi-value">${totalOrders}</div>
          <div class="kpi-sub">${deliveryCount} Delivery • ${pickupCount} Balcão</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ticket Médio</div>
          <div class="kpi-value">${formatCurrency(averageTicket)}</div>
          <div class="kpi-sub">Média por pedido</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Formas de Pagamento</div>
          <div class="kpi-sub" style="margin-top: 4px; line-height: 1.3;">
            Pix: ${formatCurrency(paymentStats.pix || 0)}<br>
            Cartão: ${formatCurrency((paymentStats.credit || 0) + (paymentStats.debit || 0))}<br>
            Dinheiro: ${formatCurrency(paymentStats.cash || 0)}
          </div>
        </div>
      </div>

      <!-- Tabela Detalhada de Pedidos -->
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Pedido</th>
            <th style="width: 140px;">Cliente</th>
            <th style="width: 130px;">Modalidade / Pagamento</th>
            <th>Itens Solicitados</th>
            <th style="width: 80px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${completedOrders
            .map((order) => {
              const orderDate = new Date(order.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isDelivery = order.orderType === 'delivery';
              const paymentName = paymentMethodLabels[order.paymentMethod] || order.paymentMethod || 'Pix';

              const itemsHtml = (order.items || [])
                .map((i) => `<li>${i.quantity}x ${i.product.name}${i.notes ? ` <em>(${i.notes})</em>` : ''}</li>`)
                .join('');

              return `
                <tr>
                  <td>
                    <span class="order-id">#${order.id}</span>
                    <div class="order-time">${orderDate}</div>
                  </td>
                  <td>
                    <div class="client-name">${order.customerName}</div>
                    <div class="client-phone">${formatPhone(order.customerPhone)}</div>
                  </td>
                  <td>
                    <span class="badge">${isDelivery ? 'Delivery' : 'Retirada'}</span>
                    <div style="margin-top: 3px; font-weight: 600;">${paymentName}</div>
                    ${
                      isDelivery && order.address
                        ? `<div style="font-size: 8.5px; color: #777; margin-top: 2px;">${order.address.neighborhood || ''}</div>`
                        : ''
                    }
                  </td>
                  <td>
                    <ul class="items-list">${itemsHtml}</ul>
                    ${order.generalNotes ? `<div style="font-size: 8.5px; color: #666; margin-top: 3px;"><em>Obs: ${order.generalNotes}</em></div>` : ''}
                  </td>
                  <td>
                    <strong style="color: #4A692D; font-size: 11px;">${formatCurrency(order.total)}</strong>
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      <!-- Rodapé do Relatório -->
      <div class="footer">
        <div>Relatório emitido pelo sistema Cardápio Digital • Beach House Sports N' Bar</div>
        <div>Página 1 de 1</div>
      </div>

      <script>
        // Dispara automaticamente a caixa de impressão/salvar como PDF
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
