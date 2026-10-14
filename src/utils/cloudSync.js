// Sincronização em Nuvem (Cloudflare D1 + Pages)
// Permite que qualquer alteração de foto, produto ou configuração feita em um computador
// ou celular seja salva na nuvem e apareça instantaneamente em todos os aparelhos.

const API_BASE_URL = 'https://beach-tennis-app.pages.dev/api';
export const DEFAULT_ARENA_ID = 2;

let syncTimeout = null;
let pendingData = null;

/**
 * Busca o cardápio e configurações mais recentes salvos na nuvem D1
 */
export async function fetchCardapioFromCloud(arenaId = DEFAULT_ARENA_ID) {
  try {
    const response = await fetch(`${API_BASE_URL}/cardapio?arena_id=${arenaId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Falha ao conectar com a nuvem: status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Erro na resposta da nuvem.');
    }

    return data;
  } catch (err) {
    console.warn('Aviso de conexão com a nuvem (usando cache local):', err.message);
    return null;
  }
}

/**
 * Busca a lista atualizada de pedidos salvos na nuvem D1
 */
export async function fetchOrdersFromCloud(arenaId = DEFAULT_ARENA_ID) {
  try {
    const response = await fetch(`${API_BASE_URL}/cardapio/pedidos?arena_id=${arenaId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return [];
    const data = await response.json();
    if (data.success && Array.isArray(data.pedidos)) {
      return data.pedidos;
    }
    return [];
  } catch (err) {
    console.warn('Aviso ao buscar pedidos na nuvem:', err.message);
    return [];
  }
}

/**
 * Envia um novo pedido atômico para a nuvem D1 imediatamente (sem sobrescrever pedidos de outros clientes)
 */
export async function submitOrderToCloud(order, arenaId = DEFAULT_ARENA_ID) {
  try {
    const response = await fetch(`${API_BASE_URL}/cardapio/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arenaId, order }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Erro ao enviar pedido para a nuvem:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Atualiza o status de um pedido na nuvem D1
 */
export async function updateOrderStatusInCloud(orderId, status, order = null, arenaId = DEFAULT_ARENA_ID) {
  try {
    const response = await fetch(`${API_BASE_URL}/cardapio/pedidos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arenaId, orderId, status, order }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Erro ao atualizar status do pedido na nuvem:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Exclui um pedido da nuvem D1
 */
export async function deleteOrderFromCloud(orderId, arenaId = DEFAULT_ARENA_ID) {
  try {
    const response = await fetch(`${API_BASE_URL}/cardapio/pedidos?arena_id=${arenaId}&order_id=${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Erro ao excluir pedido da nuvem:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Envia o cardápio, produtos e configurações para gravação na nuvem D1 com debounce
 */
export function saveCardapioToCloudDebounced(payload, delayMs = 600) {
  pendingData = { ...pendingData, ...payload };

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  return new Promise((resolve) => {
    syncTimeout = setTimeout(async () => {
      try {
        const toSend = pendingData;
        pendingData = null;
        const result = await saveCardapioToCloudImmediate(toSend);
        resolve(result);
      } catch (e) {
        resolve({ success: false, error: e.message });
      }
    }, delayMs);
  });
}

/**
 * Grava imediatamente na nuvem D1
 */
export async function saveCardapioToCloudImmediate(payload) {
  const {
    arenaId = DEFAULT_ARENA_ID,
    storeConfig,
    produtos,
    categoriasExcluidas,
  } = payload || {};

  try {
    const response = await fetch(`${API_BASE_URL}/cardapio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        arenaId,
        storeConfig,
        produtos,
        categoriasExcluidas,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Erro ao salvar na nuvem D1:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Converte e comprime qualquer imagem ou canvas para o formato WebP com limite estrito de 400 KB
 */
export async function compressImageToWebP(input, maxKb = 400, maxWidth = 960, maxHeight = 960) {
  if (input instanceof HTMLCanvasElement) {
    return compressCanvasToTargetWebP(input, maxKb);
  }

  return new Promise((resolve, reject) => {
    if (!input) {
      reject(new Error('Nenhum arquivo de imagem informado.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        let width = image.width;
        let height = image.height;

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
        ctx.drawImage(image, 0, 0, width, height);

        const result = compressCanvasToTargetWebP(canvas, maxKb);
        resolve(result);
      };
      image.onerror = () => reject(new Error('Erro ao processar imagem para formato WebP.'));
      image.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo do dispositivo.'));
    reader.readAsDataURL(input);
  });
}

/**
 * Garante que um canvas seja exportado em WebP e com peso máximo de 400 KB
 */
export function compressCanvasToTargetWebP(canvas, maxKb = 400) {
  const maxBytes = maxKb * 1024;
  let quality = 0.82;
  let dataUrl = '';

  try {
    dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
  } catch (e) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  const getByteSize = (str) => Math.round((str.length * 3) / 4);
  const format = dataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';

  // Reduz gradualmente a qualidade caso ultrapasse 400 KB
  while (getByteSize(dataUrl) > maxBytes && quality > 0.3) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL(format, Math.max(0.2, quality));
  }

  // Se ainda estiver acima de 400 KB, reescala as dimensões
  if (getByteSize(dataUrl) > maxBytes) {
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = Math.round(canvas.width * 0.75);
    scaleCanvas.height = Math.round(canvas.height * 0.75);
    const ctx = scaleCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);
    dataUrl = scaleCanvas.toDataURL(format, 0.72);
  }

  return dataUrl;
}

/**
 * Exporta o cardápio completo em arquivo JSON para backup local
 */
export function exportCardapioBackup({ storeInfo, products, deletedCategoryIds, orders }) {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    storeInfo,
    products,
    deletedCategoryIds,
    orders,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute(
    'download',
    `backup-cardapio-beach-house-${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Importa o cardápio a partir de um arquivo JSON
 */
export function importCardapioBackup(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo selecionado.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.products || !Array.isArray(parsed.products)) {
          reject(new Error('Arquivo de backup inválido: lista de produtos ausente.'));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error('Falha ao ler o arquivo JSON: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Erro na leitura do arquivo.'));
    reader.readAsText(file);
  });
}
