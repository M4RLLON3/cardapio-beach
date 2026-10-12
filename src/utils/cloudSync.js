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
    pedidos,
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
        pedidos,
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
