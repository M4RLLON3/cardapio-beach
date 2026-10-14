import React, { useState } from 'react';
import {
  Lock,
  Building2,
  FileText,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { BeachHouseLogo } from './BeachHouseLogo';

const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('beachhouse') || window.location.hostname === 'localhost')
  ? '/api'
  : 'https://beachhousecardapio.pages.dev/api';

// Máscara e formatação de CNPJ: 00.000.000/0000-00
export function formatCNPJ(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// Máscara de Telefone: (00) 00000-0000
export function formatPhoneInput(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function AdminAuthView({ onLoginSuccess, onBackToMenu, onSyncStoreInfo }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login State (seguro, sem dados expostos)
  const [loginCnpj, setLoginCnpj] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [keepConnected, setKeepConnected] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginPendingAlert, setLoginPendingAlert] = useState(null);

  // Register State
  const [registerData, setRegisterData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: 'Boa Esperança',
    estado: 'PR',
    senha: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(null);

  // Submissão do Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginPendingAlert(null);

    const cnpjDigits = loginCnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      setLoginError('Por favor, informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('Por favor, informe sua senha de acesso.');
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/arena/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj: loginCnpj,
          senha: loginPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Credenciais inválidas.';
        if (errorMsg.toLowerCase().includes('análise') || errorMsg.toLowerCase().includes('aguarde')) {
          setLoginPendingAlert({
            title: 'Solicitação em Análise',
            message: errorMsg,
          });
        } else {
          setLoginError(errorMsg);
        }
        setLoginLoading(false);
        return;
      }

      // Login bem-sucedido
      const session = {
        token: data.token,
        arena: data.arena,
        status: data.status_aprovacao || 'aprovado',
        loggedAt: new Date().toISOString(),
        keepConnected,
      };

      if (keepConnected) {
        localStorage.setItem('beach_house_admin_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('beach_house_admin_session');
      }
      sessionStorage.setItem('beach_house_admin_session', JSON.stringify(session));

      if (onSyncStoreInfo && data.arena) {
        onSyncStoreInfo({
          name: data.arena.nome || undefined,
          address: data.arena.endereco || undefined,
          whatsappNumber: data.arena.whatsapp || data.arena.telefone || undefined,
        });
      }

      onLoginSuccess(session);
    } catch (err) {
      // Fallback offline caso o dispositivo esteja sem conexão mas com as credenciais padrão
      if (cnpjDigits === '60456569000198' && loginPassword.trim() === '4774') {
        const localSession = {
          token: 'offline-token-beach-house',
          arena: {
            id: 2,
            nome: 'Beach House',
            cnpj: '60.456.569/0001-98',
            endereco: 'Rua Silvio Ari Gasparelo, 301',
            status_aprovacao: 'aprovado',
          },
          status: 'aprovado',
          loggedAt: new Date().toISOString(),
          isOffline: true,
          keepConnected,
        };
        if (keepConnected) {
          localStorage.setItem('beach_house_admin_session', JSON.stringify(localSession));
        } else {
          localStorage.removeItem('beach_house_admin_session');
        }
        sessionStorage.setItem('beach_house_admin_session', JSON.stringify(localSession));
        onLoginSuccess(localSession);
      } else {
        setLoginError('Erro de conexão com o servidor do Beach Tennis. Verifique sua internet.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Submissão do Cadastro / Solicitação
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(null);

    if (!registerData.nome.trim() || registerData.nome.trim().length < 3) {
      setRegisterError('Informe o nome da sua Loja/Arena (mínimo 3 letras).');
      return;
    }

    const cnpjDigits = registerData.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) {
      setRegisterError('Informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (!registerData.senha.trim() || registerData.senha.trim().length < 4) {
      setRegisterError('A senha deve ter no mínimo 4 dígitos.');
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/arena/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: registerData.nome.trim(),
          cnpj: registerData.cnpj.trim(),
          telefone: registerData.telefone.replace(/\D/g, ''),
          email: registerData.email.trim(),
          endereco: registerData.endereco.trim(),
          cidade: registerData.cidade.trim(),
          estado: registerData.estado.trim(),
          senha: registerData.senha.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setRegisterError(data.error || 'Erro ao enviar solicitação.');
        setRegisterLoading(false);
        return;
      }

      setRegisterSuccess({
        nome: registerData.nome,
        cnpj: registerData.cnpj,
        message:
          data.message ||
          'Solicitação enviada com sucesso para o Administrador Geral do Beach Tennis Pro! Assim que o administrador aprovar no painel, seu acesso será liberado para cadastrar produtos e gerenciar pedidos.',
      });

      // Limpar formulário e preencher o login com os dados enviados
      setLoginCnpj(registerData.cnpj);
      setLoginPassword(registerData.senha);
    } catch (err) {
      setRegisterError('Erro de comunicação com o servidor do Beach Tennis: ' + err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#1E2B20] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Botão de Retornar ao Cardápio */}
      <div className="max-w-md w-full mx-auto mb-4">
        <button
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#315433] hover:text-[#233F25] px-3 py-1.5 rounded-full bg-[#EBF2EA] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Cardápio do Cliente</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-soft border border-[#EBE7DF] overflow-hidden">
        {/* Cabeçalho da Autenticação */}
        <div className="px-6 pt-6 pb-4 border-b border-[#EBE7DF] bg-gradient-to-b from-[#FAF8F3] to-white text-center">
          <div className="mb-2">
            <BeachHouseLogo size="normal" />
          </div>
          <p className="text-xs text-[#6A786D] mt-1">
            Painel Administrativo do Lojista integrado com Beach Tennis Pro
          </p>

          {/* Abas de Navegação */}
          <div className="flex bg-[#EBF2EA] p-1 rounded-2xl mt-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
                setRegisterError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'login'
                  ? 'bg-[#315433] text-white shadow-xs'
                  : 'text-[#315433] hover:text-[#233F25]'
              }`}
            >
              Entrar com CNPJ
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setLoginError('');
                setRegisterError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'register'
                  ? 'bg-[#315433] text-white shadow-xs'
                  : 'text-[#315433] hover:text-[#233F25]'
              }`}
            >
              Solicitar Acesso
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            {loginPendingAlert && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>{loginPendingAlert.title}</span>
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  {loginPendingAlert.message}
                </p>
                <div className="pt-1 text-[11px] text-amber-700 font-medium">
                  Assim que o Administrador Geral aprovar sua loja no painel central, você poderá acessar o catálogo.
                </div>
              </div>
            )}

            {/* Campo CNPJ */}
            <div>
              <label className="block text-xs font-bold text-[#1E2B20] mb-1.5">
                CNPJ da Loja / Arena
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A786D]">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0000-00"
                  value={loginCnpj}
                  onChange={(e) => setLoginCnpj(formatCNPJ(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs sm:text-sm font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-bold text-[#1E2B20] mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A786D]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Digite sua senha"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs sm:text-sm font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6A786D] hover:text-[#1E2B20]"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Opção Manter Conectado */}
            <div className="flex items-center justify-between p-3 bg-[#FAF8F3] rounded-2xl border border-[#EBE7DF]">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepConnected}
                  onChange={(e) => setKeepConnected(e.target.checked)}
                  className="w-4 h-4 rounded text-[#315433] accent-[#315433] cursor-pointer"
                />
                <span className="text-xs text-[#1E2B20] font-bold">
                  Manter conectado
                </span>
              </label>
              <span className="text-[11px] text-[#6A786D]">
                {keepConnected ? 'Salvo neste aparelho' : 'Desconecta ao fechar'}
              </span>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 bg-[#315433] hover:bg-[#233F25] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-soft transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando no Beach Tennis...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acessar Painel do Lojista</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Conteúdo da Aba: SOLICITAR ACESSO / CADASTRO */}
        {activeTab === 'register' && (
          <div className="p-6">
            {registerSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-sm text-[#1E2B20]">
                  Solicitação Enviada com Sucesso!
                </h3>
                <div className="p-3.5 rounded-2xl bg-[#EBF2EA] border border-[#DEEAD8] text-xs text-[#2D592C] text-left space-y-1.5">
                  <p className="font-bold">{registerSuccess.nome}</p>
                  <p className="text-[11px]">CNPJ: {registerSuccess.cnpj}</p>
                  <p className="text-[11px] leading-relaxed pt-1 border-t border-[#DEEAD8]/70">
                    {registerSuccess.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterSuccess(null);
                    setActiveTab('login');
                  }}
                  className="w-full py-2.5 px-4 bg-[#315433] hover:bg-[#233F25] text-white rounded-2xl text-xs font-bold shadow-soft transition"
                >
                  Ir para a Tela de Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <p className="text-xs text-[#6A786D] leading-relaxed">
                  Cadastre sua loja para enviar a solicitação diretamente à área de administração geral do <strong>Beach Tennis Pro</strong>.
                </p>

                {registerError && (
                  <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    <span>{registerError}</span>
                  </div>
                )}

                {/* Nome da Loja */}
                <div>
                  <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                    Nome da Loja / Arena *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A786D]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Beach House Sports N' Bar"
                      value={registerData.nome}
                      onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* CNPJ */}
                <div>
                  <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                    CNPJ *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A786D]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0000-00"
                      value={registerData.cnpj}
                      onChange={(e) => setRegisterData({ ...registerData, cnpj: formatCNPJ(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* WhatsApp & Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                      WhatsApp
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#6A786D]">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={registerData.telefone}
                        onChange={(e) => setRegisterData({ ...registerData, telefone: formatPhoneInput(e.target.value) })}
                        className="w-full pl-8 pr-2 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#6A786D]">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        placeholder="contato@loja.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="w-full pl-8 pr-2 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                    Endereço Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A786D]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Rua, Número, Bairro"
                      value={registerData.endereco}
                      onChange={(e) => setRegisterData({ ...registerData, endereco: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Cidade & Estado */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={registerData.cidade}
                      onChange={(e) => setRegisterData({ ...registerData, cidade: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={registerData.estado}
                      onChange={(e) => setRegisterData({ ...registerData, estado: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition uppercase text-center"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-xs font-bold text-[#1E2B20] mb-1">
                    Senha de Acesso *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6A786D]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 4 caracteres"
                      value={registerData.senha}
                      onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                      className="w-full pl-9 pr-10 py-2 bg-[#FAF8F3] border border-[#EBE7DF] rounded-2xl text-xs font-semibold text-[#1E2B20] focus:ring-2 focus:ring-[#315433] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6A786D] hover:text-[#1E2B20]"
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botão Enviar Solicitação */}
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full py-3 px-4 bg-[#315433] hover:bg-[#233F25] text-white rounded-2xl text-xs font-bold shadow-soft transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {registerLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enviando solicitação...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Solicitação para o Beach Tennis</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="max-w-md w-full mx-auto text-center mt-6 text-[11px] text-[#6A786D]">
        Integração Segura • Cloudflare Edge & D1 Database
      </div>
    </div>
  );
}
