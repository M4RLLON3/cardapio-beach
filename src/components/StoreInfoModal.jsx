import React, { useState } from 'react';
import { X, Store, Phone, MapPin, Clock, DollarSign, Save, RotateCcw } from 'lucide-react';
import { formatCurrency, formatPhone } from '../utils/formatters';

export function StoreInfoModal({ isOpen, onClose, storeInfo, onUpdateStoreInfo, onResetStoreInfo }) {
  const [formData, setFormData] = useState({
    name: storeInfo.name,
    whatsappNumber: storeInfo.whatsappNumber,
    pixKey: storeInfo.pixKey,
    deliveryFee: storeInfo.deliveryFee,
    isOpen: storeInfo.isOpen,
    address: storeInfo.address,
  });

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'settings'

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateStoreInfo({
      ...storeInfo,
      ...formData,
      deliveryFee: parseFloat(formData.deliveryFee) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-100 text-primary-700 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{storeInfo.name}</h2>
              <p className="text-xs text-slate-500">Informações e Configurações da Loja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 px-5 pt-2 bg-slate-50/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-primary-600 text-primary-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sobre o Estabelecimento
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ajustar WhatsApp & Dados (Config)
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-4 text-xs sm:text-sm text-slate-700">
          {activeTab === 'info' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-900">Endereço da Loja</span>
                  <span className="text-slate-500 text-xs">{storeInfo.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-900">Horário de Atendimento</span>
                  <span className="text-slate-500 text-xs">{storeInfo.openingHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-900">WhatsApp Oficial de Pedidos</span>
                  <span className="text-slate-700 font-mono text-xs font-semibold">
                    {formatPhone(storeInfo.whatsappNumber)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <span className="font-bold text-emerald-900 block text-xs">Chave Pix Cadastrada</span>
                <span className="font-mono text-xs text-emerald-800 select-all font-semibold">
                  {storeInfo.pixKey}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs leading-relaxed">
                <strong>Dica de Teste:</strong> Você pode alterar o número do WhatsApp abaixo para o seu próprio número de celular (com DDD, ex.: <code>5511999999999</code>) para testar os pedidos recebidos em tempo real!
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nome do Estabelecimento
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Número do WhatsApp (com 55 + DDD)
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="5511999999999"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Taxa de Entrega (R$)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Status da Loja
                  </label>
                  <select
                    value={formData.isOpen ? 'open' : 'closed'}
                    onChange={(e) => setFormData({ ...formData, isOpen: e.target.value === 'open' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="open">Aberto (Aceitando)</option>
                    <option value="closed">Fechado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Endereço do Local
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onResetStoreInfo}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar Padrão
                </button>

                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
