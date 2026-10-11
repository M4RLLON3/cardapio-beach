import React from 'react';
import { Tag, X, Ban } from 'lucide-react';
import { BADGE_ICONS, ProductBadgeIcon } from './ProductBadgeIcon';

const PRESET_BADGES = [
  { label: 'Beach Tennis', badge: 'Beach Tennis', icon: 'raquete' },
  { label: 'Mais Pedido', badge: 'Mais Pedido', icon: 'coracao' },
  { label: 'Serve 2 a 3', badge: 'Serve 2 a 3', icon: 'pessoas' },
  { label: 'Vegetariano', badge: 'Vegetariano', icon: 'folha' },
  { label: 'Preparo ~30 min', badge: 'Preparo ~30 min', icon: 'relogio' },
  { label: 'Porção', badge: 'Porção Unidades', icon: 'porcao' },
  { label: 'Arena Beach', badge: 'Arena Beach', icon: 'arena' },
];

export function BadgeSelectorField({
  badge = '',
  badgeIcon = '',
  onBadgeChange,
  onBadgeIconChange,
}) {
  const currentBadge = badge || '';
  const currentIcon = badgeIcon || '';

  const handleSelectPreset = (preset) => {
    onBadgeChange(preset.badge);
    onBadgeIconChange(preset.icon);
  };

  const handleClearBadge = () => {
    onBadgeChange('');
    onBadgeIconChange('');
  };

  return (
    <div className="md:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#fbf9f5] border border-[#e4e2de] space-y-4">
      {/* Título da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#daeaaa] text-[#161f00]">
            <Tag className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <label className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] block">
              Selo de Destaque do Item (Span & Ícone)
            </label>
            <span className="font-manrope text-[11px] text-[#747870] block">
              Adicione uma etiqueta estilizada que aparece no canto da foto do produto.
            </span>
          </div>
        </div>

        {currentBadge && (
          <button
            type="button"
            onClick={handleClearBadge}
            className="inline-flex items-center gap-1 text-xs font-grotesk font-semibold text-[#ba1a1a] hover:underline self-start sm:self-auto cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remover Selo</span>
          </button>
        )}
      </div>

      {/* Sugestões Rápidas */}
      <div>
        <span className="block font-grotesk text-[10px] font-bold uppercase tracking-wider text-[#747870] mb-2">
          Sugestões Prontas:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_BADGES.map((preset) => {
            const isSelected = currentBadge === preset.badge;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-grotesk font-medium transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#daeaaa] border-[#283b26] text-[#161f00] font-bold shadow-2xs'
                    : 'bg-white border-[#e4e2de] text-[#434841] hover:bg-[#eae8e4] hover:text-[#132512]'
                }`}
              >
                <ProductBadgeIcon iconKey={preset.icon} className="w-3 h-3 stroke-current" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campo de Texto Personalizado do Selo */}
      <div>
        <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-1.5">
          Texto do Selo (Span)
        </label>
        <input
          type="text"
          value={currentBadge}
          onChange={(e) => onBadgeChange(e.target.value)}
          placeholder="Ex.: Mais Pedido, Exclusivo Beach, Novidade... (ou deixe vazio para sem selo)"
          className="w-full p-3 rounded-xl border border-[#e4e2de] bg-white focus:border-[#283b26] outline-none font-grotesk font-semibold text-xs sm:text-sm text-[#132512]"
        />
      </div>

      {/* Seletor de Ícones Oficiais */}
      <div>
        <label className="block font-grotesk text-[11px] font-bold uppercase tracking-wider text-[#132512] mb-2">
          Ícone do Selo (Exibido na frente do texto)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Opção: Sem Ícone */}
          <button
            type="button"
            onClick={() => onBadgeIconChange('')}
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
              !currentIcon
                ? 'bg-[#daeaaa] border-[#283b26] text-[#161f00] font-bold shadow-2xs'
                : 'bg-white border-[#e4e2de] text-[#747870] hover:bg-stone-50'
            }`}
          >
            <Ban className="w-4 h-4 shrink-0" />
            <span className="font-grotesk text-xs truncate">Sem Ícone</span>
          </button>

          {/* As 7 opções oficiais de ícones */}
          {BADGE_ICONS.map((item) => {
            const isSelected = currentIcon === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onBadgeIconChange(item.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#daeaaa] border-[#283b26] text-[#161f00] font-bold shadow-2xs'
                    : 'bg-white border-[#e4e2de] text-[#434841] hover:bg-stone-50 hover:text-[#132512]'
                }`}
                title={item.name}
              >
                <div className="shrink-0">
                  {item.svg('w-4 h-4 stroke-current')}
                </div>
                <span className="font-grotesk text-xs truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pré-visualização ao Vivo do Selo */}
      <div className="p-3 bg-white rounded-xl border border-[#dedad2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="font-grotesk text-[10px] font-bold uppercase tracking-wider text-[#747870]">
          Pré-visualização do Selo no Cardápio:
        </span>
        <div>
          {currentBadge ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#daeaaa] text-[#161f00] font-grotesk text-xs font-bold uppercase tracking-widest rounded-lg shadow-2xs">
              <ProductBadgeIcon iconKey={currentIcon} className="w-3.5 h-3.5 stroke-[#161f00]" />
              <span>{currentBadge}</span>
            </span>
          ) : (
            <span className="font-manrope text-xs text-[#747870] italic">
              Nenhum selo ativo (foto sem etiqueta)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
