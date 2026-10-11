/**
 * Sistema de Notificação Sonora e Desktop de Novos Pedidos
 * Beach House Sports N' Bar
 * 
 * Utiliza a Web Audio API para tocar um aviso sonoro (chime / sino de pedidos)
 * diretamente nas caixas de som / fones do computador com zero latência e sem dependência
 * de arquivos externos de áudio. Também dispara a API de Notificações nativas do computador/Windows.
 */

const ORDER_SOUND_ENABLED_KEY = 'beach_house_order_sound_enabled';
const BROADCAST_CHANNEL_NAME = 'beach_house_orders_broadcast_v1';

let audioContextInstance = null;

/**
 * Obtém ou inicializa a instância do AudioContext
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContextInstance) {
    audioContextInstance = new AudioContextClass();
  }

  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume().catch(() => {});
  }

  return audioContextInstance;
}

/**
 * Desbloqueia o AudioContext na primeira interação do usuário (clique ou toque)
 * para cumprir as políticas de autoplay dos navegadores.
 */
export function unlockAudioOnFirstInteraction() {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      }).catch(() => {});
    } else {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    }
  };

  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
}

/**
 * Sintetiza uma nota musical com envelope suave (senoide harmônica de sino)
 */
function playTone(ctx, freq, startTime, duration, volume = 0.35) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    // Ataque rápido e brilhante (20ms)
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.001), startTime + 0.02);
    // Decaimento suave e natural
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch (err) {
    console.warn('Erro ao sintetizar tom:', err);
  }
}

/**
 * Toca uma nota de sino com harmônico superior para dar corpo metálico agradável
 */
function playBellNote(ctx, freq, startTime, duration = 0.4, volume = 0.4) {
  // Tom fundamental
  playTone(ctx, freq, startTime, duration, volume);
  // Primeiro harmônico suave (oitava acima)
  playTone(ctx, freq * 2, startTime, duration * 0.7, volume * 0.3);
}

/**
 * Toca o aviso sonoro de novo pedido no computador (Campainha de Pedidos)
 */
export function playOrderNotificationSound() {
  if (typeof window === 'undefined') return;

  // Verifica se o som está ativado pelo lojista
  const isEnabled = isOrderSoundEnabled();
  if (!isEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playSequence = () => {
      const now = ctx.currentTime + 0.05;

      // ── Frase 1: Acorde alegre ascendente (D5 -> F#5 -> A5 -> D6) ──
      playBellNote(ctx, 587.33, now + 0.00, 0.28, 0.38); // D5
      playBellNote(ctx, 739.99, now + 0.12, 0.28, 0.38); // F#5
      playBellNote(ctx, 880.00, now + 0.24, 0.32, 0.42); // A5
      playBellNote(ctx, 1174.66, now + 0.36, 0.65, 0.48); // D6

      // ── Frase 2 (após 520ms): Segundo aviso mais incisivo para não passar despercebido no barulho ──
      const t2 = now + 0.52;
      playBellNote(ctx, 880.00, t2 + 0.00, 0.25, 0.38); // A5
      playBellNote(ctx, 1174.66, t2 + 0.12, 0.28, 0.44); // D6
      playBellNote(ctx, 1479.98, t2 + 0.24, 0.75, 0.52); // F#6
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(playSequence).catch(() => {});
    } else {
      playSequence();
    }

    // Suporte adicional para vibração em dispositivos móveis/tablets
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 350]);
      } catch {}
    }
  } catch (err) {
    console.warn('Erro ao reproduzir som de notificação:', err);
  }
}

/**
 * Consulta se o som está habilitado (padrão é ativado)
 */
export function isOrderSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(ORDER_SOUND_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Alterna a preferência de som do lojista
 */
export function setOrderSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDER_SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
    // Se ativou, destrava o áudio imediatamente
    if (enabled) {
      getAudioContext();
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Solicita autorização de notificação do sistema operacional / navegador
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * Dispara notificação nativa do Windows / Computador
 */
export function showOrderDesktopNotification(order) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const orderNum = order?.id ? `#${String(order.id).slice(-4)}` : '';
    const customer = order?.customerName || 'Novo Cliente';
    const totalFormatted = order?.total
      ? `R$ ${Number(order.total).toFixed(2).replace('.', ',')}`
      : '';
    const itemsCount = order?.items?.length
      ? `${order.items.length} ${order.items.length === 1 ? 'item' : 'itens'}`
      : '';

    const bodyText = [
      `Cliente: ${customer}`,
      itemsCount,
      totalFormatted ? `Total: ${totalFormatted}` : '',
      'Clique para abrir o painel e preparar o pedido.',
    ]
      .filter(Boolean)
      .join(' • ');

    const notification = new Notification(`Novo Pedido Recebido ${orderNum}!`, {
      body: bodyText,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `beach-order-${order?.id || Date.now()}`,
      renotify: true,
      requireInteraction: true,
    });

    notification.onclick = () => {
      try {
        window.focus();
        if (window.location.hash !== '#admin') {
          window.location.hash = 'admin';
        }
      } catch {}
      notification.close();
    };
  } catch (err) {
    console.warn('Erro ao emitir notificação desktop:', err);
  }
}

/**
 * Notifica o sistema de que um novo pedido foi criado (comunicação entre abas)
 */
export function broadcastNewOrder(order) {
  if (typeof window === 'undefined') return;

  // 1. Dispara evento customizado na própria janela
  try {
    window.dispatchEvent(
      new CustomEvent('beach_house_new_order_event', { detail: order })
    );
  } catch {}

  // 2. Transmite para outras abas abertas pelo BroadcastChannel
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'NEW_ORDER', order });
      setTimeout(() => channel.close(), 1000);
    }
  } catch {}
}

/**
 * Assina para escutar novos pedidos vindos de qualquer aba ou do checkout
 */
export function subscribeToNewOrders(onNewOrderCallback) {
  if (typeof window === 'undefined') return () => {};

  // Listener local de evento customizado
  const handleLocalEvent = (e) => {
    if (e.detail) {
      onNewOrderCallback(e.detail);
    }
  };
  window.addEventListener('beach_house_new_order_event', handleLocalEvent);

  // Listener do BroadcastChannel (outras abas)
  let channel = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER' && event.data.order) {
          onNewOrderCallback(event.data.order);
        }
      };
    } catch {}
  }

  return () => {
    window.removeEventListener('beach_house_new_order_event', handleLocalEvent);
    if (channel) {
      channel.close();
    }
  };
}
