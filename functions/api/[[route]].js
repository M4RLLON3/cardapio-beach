export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB || env.cardapio_d1;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  function errorJson(message, status = 400) {
    return json({ success: false, error: message }, status);
  }

  if (!db) {
    return errorJson('Banco de dados D1 do cardapio nao configurado ou indisponivel.', 500);
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const resource = (pathParts[0] || '').toLowerCase();
  const subResource = (pathParts[1] || '').toLowerCase();
  const method = request.method.toUpperCase();

  let body = null;
  if (method === 'POST' || method === 'PUT') {
    try {
      body = await request.json();
    } catch (e) {
      body = null;
    }
  }

  const arenaId = Number(url.searchParams.get('arena_id') || (body && body.arenaId) || 2);

  // Health check
  if (resource === 'health') {
    return json({ status: 'ok', serverless: true, provider: 'Cloudflare Pages Functions + D1 Dedicado' });
  }

  // ROTA: /api/cardapio/pedidos
  if (resource === 'cardapio' && subResource === 'pedidos') {
    if (method === 'GET') {
      try {
        const { results } = await db.prepare(
          'SELECT id, arena_id, cliente_nome, cliente_telefone, tipo_entrega, total, status, dados_json, criado_em FROM cardapio_pedidos WHERE arena_id = ? ORDER BY criado_em DESC LIMIT 150'
        ).bind(arenaId).all();

        const parsedOrders = (results || []).map((row) => {
          try {
            const parsed = JSON.parse(row.dados_json || '{}');
            return {
              ...parsed,
              id: row.id,
              customerName: row.cliente_nome || parsed.customerName,
              customerPhone: row.cliente_telefone || parsed.customerPhone,
              deliveryType: row.tipo_entrega || parsed.deliveryType,
              total: row.total !== null ? row.total : parsed.total,
              status: row.status || parsed.status || 'pendente',
              createdAt: row.criado_em || parsed.createdAt,
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean);

        return json({ success: true, arenaId, pedidos: parsedOrders });
      } catch (err) {
        return errorJson('Erro ao buscar pedidos no D1 dedicado: ' + err.message, 500);
      }
    }

    if (method === 'POST') {
      const order = body?.order || body;
      if (!order || !order.id) {
        return errorJson('Dados do pedido invalidos ou ID ausente.');
      }

      const orderId = String(order.id);
      const customerName = order.customerName || order.nome || 'Cliente';
      const customerPhone = order.customerPhone || order.telefone || '';
      const deliveryType = order.deliveryType || 'delivery';
      const total = typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0;
      const status = order.status || 'pendente';
      const dadosJson = JSON.stringify(order);

      try {
        await db.prepare(`
          INSERT INTO cardapio_pedidos (id, arena_id, cliente_nome, cliente_telefone, tipo_entrega, total, status, dados_json, criado_em)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            dados_json = excluded.dados_json
        `).bind(
          orderId,
          arenaId,
          customerName,
          customerPhone,
          deliveryType,
          total,
          status,
          dadosJson
        ).run();

        return json({
          success: true,
          message: 'Pedido gravado no D1 com sucesso!',
          pedidoId: orderId,
          arenaId,
        });
      } catch (err) {
        return errorJson('Erro ao salvar pedido no D1: ' + err.message, 500);
      }
    }

    if (method === 'PUT') {
      const { orderId, status, order } = body || {};
      const targetId = String(orderId || (order && order.id) || '');
      if (!targetId) return errorJson('ID do pedido nao informado para atualizacao.');

      const dadosJson = order ? JSON.stringify(order) : null;
      try {
        await db.prepare(`
          UPDATE cardapio_pedidos
          SET status = COALESCE(?, status),
              dados_json = COALESCE(?, dados_json)
          WHERE id = ? AND arena_id = ?
        `).bind(status || null, dadosJson, targetId, arenaId).run();

        return json({ success: true, message: 'Status do pedido atualizado.' });
      } catch (err) {
        return errorJson('Erro ao atualizar status do pedido: ' + err.message, 500);
      }
    }

    if (method === 'DELETE') {
      const targetId = String(body?.orderId || url.searchParams.get('order_id') || '');
      if (!targetId) return errorJson('ID do pedido nao informado para exclusao.');

      try {
        await db.prepare('DELETE FROM cardapio_pedidos WHERE id = ? AND arena_id = ?').bind(targetId, arenaId).run();
        return json({ success: true, message: 'Pedido excluido com sucesso.' });
      } catch (err) {
        return errorJson('Erro ao excluir pedido: ' + err.message, 500);
      }
    }
  }

  // ROTA PRINCIPAL: /api/cardapio
  if (resource === 'cardapio') {
    if (method === 'GET') {
      try {
        const { results } = await db.prepare(
          'SELECT store_config, produtos, categorias_excluidas, atualizado_em FROM cardapio_lojas WHERE arena_id = ?'
        ).bind(arenaId).all();

        let pedidos = [];
        try {
          const { results: ordersRes } = await db.prepare(
            'SELECT dados_json, status, id, criado_em FROM cardapio_pedidos WHERE arena_id = ? ORDER BY criado_em DESC LIMIT 150'
          ).bind(arenaId).all();

          pedidos = (ordersRes || []).map((row) => {
            try {
              const p = JSON.parse(row.dados_json || '{}');
              return { ...p, id: row.id, status: row.status || p.status, createdAt: row.criado_em };
            } catch (e) {
              return null;
            }
          }).filter(Boolean);
        } catch (e) {}

        if (results && results.length > 0) {
          const row = results[0];
          return json({
            success: true,
            arenaId,
            storeConfig: row.store_config ? JSON.parse(row.store_config) : null,
            produtos: row.produtos ? JSON.parse(row.produtos) : null,
            pedidos,
            categoriasExcluidas: row.categorias_excluidas ? JSON.parse(row.categorias_excluidas) : [],
            atualizadoEm: row.atualizado_em,
          });
        }

        return json({
          success: true,
          arenaId,
          notFound: true,
          storeConfig: null,
          produtos: null,
          pedidos,
          categoriasExcluidas: [],
        });
      } catch (err) {
        return errorJson('Erro ao carregar cardapio do D1: ' + err.message, 500);
      }
    }

    if (method === 'POST' || method === 'PUT') {
      const { storeConfig, produtos, categoriasExcluidas } = body || {};

      const storeConfigStr = storeConfig !== undefined ? JSON.stringify(storeConfig) : null;
      const produtosStr = produtos !== undefined ? JSON.stringify(produtos) : null;
      const categoriasExcluidasStr = categoriasExcluidas !== undefined ? JSON.stringify(categoriasExcluidas) : null;

      try {
        await db.prepare(`
          INSERT INTO cardapio_lojas (arena_id, store_config, produtos, categorias_excluidas, atualizado_em)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(arena_id) DO UPDATE SET
            store_config = COALESCE(?, cardapio_lojas.store_config),
            produtos = COALESCE(?, cardapio_lojas.produtos),
            categorias_excluidas = COALESCE(?, cardapio_lojas.categorias_excluidas),
            atualizado_em = CURRENT_TIMESTAMP
        `).bind(
          arenaId,
          storeConfigStr,
          produtosStr,
          categoriasExcluidasStr,
          storeConfigStr,
          produtosStr,
          categoriasExcluidasStr
        ).run();

        return json({
          success: true,
          message: 'Cardapio sincronizado no D1 dedicado com sucesso!',
          arenaId,
          atualizadoEm: new Date().toISOString(),
        });
      } catch (err) {
        return errorJson('Erro ao gravar cardapio no D1: ' + err.message, 500);
      }
    }
  }

  // Proxy transparente para rotas de autenticacao de arena
  if (resource === 'arena') {
    try {
      const targetUrl = `https://beach-tennis-app.pages.dev/api/${pathParts.join('/')}${url.search}`;
      const proxyRes = await fetch(targetUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const proxyData = await proxyRes.json();
      return json(proxyData, proxyRes.status);
    } catch (err) {
      return errorJson('Erro ao autenticar: ' + err.message, 502);
    }
  }

  return errorJson(`Rota /api/${pathParts.join('/')} nao encontrada.`, 404);
}
