import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sun,
  Contrast,
  RefreshCw,
  Crop,
  FlipHorizontal,
  Move,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Sliders,
} from 'lucide-react';
import { compressCanvasToTargetWebP } from '../utils/cloudSync';

/**
 * Renderiza um fundo desfocado profissional usando algoritmo de multi-pass downscale/upscale.
 * 100% compativel com todos os navegadores e celulares (nao depende de suporte ao ctx.filter).
 */
function drawBlurredBackground(ctx, img, targetWidth, targetHeight, blurIntensity) {
  // Preenche base neutra escura
  ctx.fillStyle = '#132512';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  if (!img || blurIntensity <= 0) return;

  // Multi-pass downscale bilinear
  const factor = Math.max(14, Math.min(55, Math.round(blurIntensity * 1.4)));
  const tinyW = Math.max(8, Math.round(targetWidth / factor));
  const tinyH = Math.max(6, Math.round(targetHeight / factor));

  const offscreen = document.createElement('canvas');
  offscreen.width = tinyW;
  offscreen.height = tinyH;
  const offCtx = offscreen.getContext('2d');
  if (offCtx) {
    offCtx.imageSmoothingEnabled = true;
    offCtx.drawImage(img, 0, 0, tinyW, tinyH);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    try {
      ctx.filter = `blur(${Math.min(10, blurIntensity / 3)}px) brightness(55%)`;
    } catch (e) {}
    ctx.drawImage(offscreen, -20, -20, targetWidth + 40, targetHeight + 40);

    // Escurece suavemente o fundo para garantir destaque ao prato da frente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.restore();
  }
}

export function ProductPhotoEditor({ isOpen, imageUrl, onClose, onSave }) {
  // Ajustes de Tamanho e Posição
  const [zoom, setZoom] = useState(1); // 0.3x a 3.0x (30% a 300%)
  const [fitMode, setFitMode] = useState('cover'); // 'cover' | 'contain'
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [panX, setPanX] = useState(0); // -60% a +60%
  const [panY, setPanY] = useState(0); // -60% a +60%
  const [bgStyle, setBgStyle] = useState('dark'); // 'dark' | 'light' | 'blur' (fundo escuro por padrão, sem duplicar foto)
  const [blurIntensity, setBlurIntensity] = useState(25); // 5 a 50px

  // Ajustes Fotográficos
  const [brightness, setBrightness] = useState(100); // 60 a 140
  const [contrast, setContrast] = useState(100); // 60 a 140
  const [saturation, setSaturation] = useState(100); // 50 a 150
  const [flipH, setFlipH] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados de Arraste Interativo no Canvas
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });

  const previewCanvasRef = useRef(null);
  const imageObjRef = useRef(null);
  const containerRef = useRef(null);

  // Carrega a imagem no objeto HTML Image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      renderCanvas();
    };
    img.src = imageUrl;

    // Reset de ajustes ao abrir nova imagem: mantém imagem única e limpa por padrão
    setZoom(1);
    setFitMode('cover');
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setBgStyle('dark');
    setBlurIntensity(25);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFlipH(false);
  }, [isOpen, imageUrl]);

  // Renderiza o canvas principal
  const renderCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolução padrão do cardápio em formato proporcional 16:10 (960 x 600)
    const targetWidth = 960;
    const targetHeight = 600;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // 1. Fundo do Quadro (quando a foto for reduzida ou tiver margens)
    if (bgStyle === 'blur') {
      drawBlurredBackground(ctx, img, targetWidth, targetHeight, blurIntensity);
    } else if (bgStyle === 'light') {
      ctx.fillStyle = '#f5f3ef';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      ctx.fillStyle = '#132512';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // 2. Desenho da foto principal com filtros e transformações
    ctx.save();

    // Filtros fotográficos (Brilho, Contraste e Saturação)
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Move a origem para o centro do quadro
    ctx.translate(targetWidth / 2, targetHeight / 2);

    // Rotação em radianos
    ctx.rotate((rotation * Math.PI) / 180);

    // Espelhamento horizontal
    ctx.scale(flipH ? -1 : 1, 1);

    // Dimensões espaciais de acordo com o ângulo de rotação
    const isRotated90or270 = rotation % 180 !== 0;
    const drawWidthSpace = isRotated90or270 ? targetHeight : targetWidth;
    const drawHeightSpace = isRotated90or270 ? targetWidth : targetHeight;

    // Escala base:
    // 'contain': foto inteira cabe dentro do quadro sem cortes
    // 'cover': preenche toda a área 16:10 sem bordas
    let scaleBase = 1;
    if (fitMode === 'contain') {
      scaleBase = Math.min(drawWidthSpace / img.width, drawHeightSpace / img.height);
    } else {
      scaleBase = Math.max(drawWidthSpace / img.width, drawHeightSpace / img.height);
    }

    const finalWidth = img.width * scaleBase * zoom;
    const finalHeight = img.height * scaleBase * zoom;

    // Deslocamento de enquadramento (Pan X e Pan Y)
    const offsetX = (panX / 100) * targetWidth;
    const offsetY = (panY / 100) * targetHeight;

    ctx.drawImage(
      img,
      -finalWidth / 2 + (flipH ? -offsetX : offsetX),
      -finalHeight / 2 + offsetY,
      finalWidth,
      finalHeight
    );

    ctx.restore();
  }, [zoom, fitMode, rotation, panX, panY, bgStyle, blurIntensity, brightness, contrast, saturation, flipH]);

  // Redesenha sempre que qualquer parâmetro sofrer alteração
  useEffect(() => {
    if (imageObjRef.current && isOpen) {
      renderCanvas();
    }
  }, [renderCanvas, isOpen]);

  // Rotações
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Ajustes rápidos de tamanho
  const handleFitContain = () => {
    setFitMode('contain');
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleFitCover = () => {
    setFitMode('cover');
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleZoomInStep = () => {
    setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)));
  };

  const handleZoomOutStep = () => {
    setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)));
  };

  const handleCenterPosition = () => {
    setPanX(0);
    setPanY(0);
  };

  const handleReset = () => {
    setZoom(1);
    setFitMode('cover');
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setBgStyle('dark');
    setBlurIntensity(25);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFlipH(false);
  };

  // Interação de Arraste Direto no Canvas com Mouse
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: panX,
      initialPanY: panY,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

    const newX = Math.max(-60, Math.min(60, dragStartRef.current.initialPanX + deltaX));
    const newY = Math.max(-60, Math.min(60, dragStartRef.current.initialPanY + deltaY));

    setPanX(Math.round(newX));
    setPanY(Math.round(newY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Interação de Arraste com Toque (Mobile / Tablets)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        initialPanX: panX,
        initialPanY: panY,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const container = containerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    const deltaX = ((touch.clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaY = ((touch.clientY - dragStartRef.current.y) / rect.height) * 100;

    const newX = Math.max(-60, Math.min(60, dragStartRef.current.initialPanX + deltaX));
    const newY = Math.max(-60, Math.min(60, dragStartRef.current.initialPanY + deltaY));

    setPanX(Math.round(newX));
    setPanY(Math.round(newY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom pelo scroll do mouse no canvas
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    setZoom((z) => Math.min(3, Math.max(0.3, +(z + delta).toFixed(2))));
  };

  // Aplicação e exportação da imagem final garantindo formato WebP e <= 400 KB
  const handleApply = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    try {
      setIsProcessing(true);
      const editedDataUrl = compressCanvasToTargetWebP(canvas, 400);
      onSave(editedDataUrl);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar imagem editada:', e);
      alert('Não foi possível salvar a imagem editada. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#e4e2de] shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[94vh] animate-in zoom-in-95 duration-200">
        {/* Cabeçalho do Editor */}
        <div className="p-4 sm:p-5 border-b border-[#efeeea] flex items-center justify-between bg-[#fbf9f5] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#daeaaa] text-[#161f00]">
              <Crop className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-grotesk text-base sm:text-lg font-bold text-[#132512]">
                Editar e Ajustar Foto do Prato
              </h3>
              <p className="font-manrope text-xs text-[#747870]">
                Ajuste o tamanho, enquadramento e posição no formato do cardápio (16:10)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#747870] hover:text-[#132512] rounded-xl hover:bg-[#efeeea] transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Pré-visualização e Controles */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 font-manrope">
          {/* Área de Visualização do Enquadramento 16:10 com Suporte a Arraste */}
          <div className="space-y-1.5">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className={`relative w-full aspect-[16/10] bg-[#1b1c1a] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-[#283b26]/25 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              title="Clique e arraste com o mouse para posicionar a foto livremente"
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Linhas Guia Sutis de Terços */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Badges Informativos sobre o Enquadramento */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                <span className="px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px] backdrop-blur-xs">
                  Proporção 16:10 Oficial
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#daeaaa]/90 text-[#161f00] font-grotesk font-bold text-[10px] backdrop-blur-xs">
                  Tamanho: {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/60 text-white font-manrope text-[10px] pointer-events-none backdrop-blur-xs">
                Arraste para posicionar ou use o scroll para zoom
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#747870] px-1">
              <span>Dica: você pode clicar na foto e arrastar para mover o prato.</span>
              {(panX !== 0 || panY !== 0) && (
                <button
                  type="button"
                  onClick={handleCenterPosition}
                  className="font-grotesk font-bold text-[#283b26] hover:underline cursor-pointer"
                >
                  Centralizar Posição
                </button>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              CONTROLES DE TAMANHO DA FOTO (ZOOM & ESCALA)
          ══════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-[#fbf9f5] rounded-2xl border border-[#e4e2de] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-[#283b26]" />
                  <span>Ajustar Tamanho da Foto</span>
                </label>
                <p className="font-manrope text-[11px] text-[#747870]">
                  Aumente ou reduza a escala da foto para caber o prato inteiro ou preencher a tela.
                </p>
              </div>

              {/* Botões Rápidos de Encaixe de Tamanho */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFitContain}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-grotesk font-bold transition cursor-pointer shadow-2xs ${
                    fitMode === 'contain' && zoom === 1
                      ? 'bg-[#283b26] text-white border-[#132512]'
                      : 'bg-white hover:bg-[#efeeea] text-[#132512] border-[#c4c8bf]'
                  }`}
                  title="Reduz a foto para que ela caiba 100% inteira sem nenhum corte"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Caber Toda a Foto</span>
                </button>

                <button
                  type="button"
                  onClick={handleFitCover}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-grotesk font-bold transition cursor-pointer shadow-2xs ${
                    fitMode === 'cover' && zoom === 1
                      ? 'bg-[#283b26] text-white border-[#132512]'
                      : 'bg-white hover:bg-[#efeeea] text-[#132512] border-[#c4c8bf]'
                  }`}
                  title="Expande a foto para preencher o quadro 16:10 completamente"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Preencher Quadro</span>
                </button>
              </div>
            </div>

            {/* Slider de Tamanho com Botões - e + */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleZoomOutStep}
                className="p-2 rounded-xl bg-white border border-[#e4e2de] hover:border-[#283b26] text-[#132512] font-bold text-sm cursor-pointer shadow-2xs transition"
                title="Diminuir tamanho da foto"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs font-grotesk font-bold text-[#132512]">
                  <span>Escala da Imagem</span>
                  <span className="font-mono text-[#283b26] bg-[#daeaaa] px-2 py-0.5 rounded-md">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => {
                    setZoom(parseFloat(e.target.value));
                  }}
                  className="w-full accent-[#283b26] cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleZoomInStep}
                className="p-2 rounded-xl bg-white border border-[#e4e2de] hover:border-[#283b26] text-[#132512] font-bold text-sm cursor-pointer shadow-2xs transition"
                title="Aumentar tamanho da foto"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              FUNDO DA IMAGEM E REGULAGEM DE DESFOQUE
          ══════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-[#fbf9f5] rounded-2xl border border-[#e4e2de] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#283b26]" />
                  <span>Fundo da Imagem e Desfoque</span>
                </label>
                <p className="font-manrope text-[11px] text-[#747870]">
                  Escolha o acabamento das bordas quando a foto for reduzida ou reposicionada.
                </p>
              </div>

              {/* Botões de Seleção do Modo de Fundo */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'dark', label: 'Fundo Escuro (Padrão)' },
                  { id: 'light', label: 'Fundo Claro' },
                  { id: 'blur', label: 'Desfocado da Foto' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBgStyle(bg.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-grotesk font-bold transition cursor-pointer shadow-2xs ${
                      bgStyle === bg.id
                        ? 'bg-[#283b26] text-white border border-[#132512]'
                        : 'bg-white hover:bg-[#efeeea] text-[#132512] border border-[#c4c8bf]'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Painel em Destaque: Regulagem de Desfoque quando 'Desfocado da Foto' estiver ativo */}
            {bgStyle === 'blur' ? (
              <div className="p-3.5 bg-white rounded-xl border-2 border-[#becd90] space-y-2.5 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-grotesk font-bold text-[#132512] flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#283b26]" />
                    <span>Regulagem do Desfoque do Fundo</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#161f00] bg-[#daeaaa] px-2.5 py-0.5 rounded-md">
                    {blurIntensity}px
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={blurIntensity}
                  onChange={(e) => setBlurIntensity(parseInt(e.target.value, 10))}
                  className="w-full accent-[#283b26] cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-[#747870]">
                  <span>Desfoque Suave (5px)</span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Suave', val: 12 },
                      { label: 'Médio', val: 25 },
                      { label: 'Intenso', val: 45 },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setBlurIntensity(preset.val)}
                        className={`px-2 py-0.5 rounded text-[10px] font-grotesk font-bold transition cursor-pointer ${
                          blurIntensity === preset.val
                            ? 'bg-[#283b26] text-white'
                            : 'bg-[#f5f3ef] hover:bg-[#e4e2de] text-[#132512]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <span>Desfoque Máximo (50px)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-white/70 rounded-xl border border-[#e4e2de] text-[11px] text-[#747870]">
                <span>Modo atual: <strong>{bgStyle === 'light' ? 'Fundo Claro' : 'Fundo Escuro (Sem duplicar foto)'}</strong></span>
                <button
                  type="button"
                  onClick={() => setBgStyle('blur')}
                  className="text-[#283b26] font-grotesk font-bold hover:underline cursor-pointer"
                >
                  Ativar Desfoque da Foto
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════
              POSICIONAMENTO PRECISO (HORIZONTAL E VERTICAL)
          ══════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-[#fbf9f5] rounded-2xl border border-[#e4e2de] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-grotesk text-xs sm:text-sm font-bold uppercase tracking-wider text-[#132512] flex items-center gap-2">
                <Move className="w-4 h-4 text-[#283b26]" />
                <span>Posição da Foto (Enquadramento)</span>
              </label>
              {(panX !== 0 || panY !== 0) && (
                <button
                  type="button"
                  onClick={handleCenterPosition}
                  className="text-xs font-grotesk font-bold text-[#566431] hover:underline cursor-pointer"
                >
                  Centralizar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Posição Horizontal (Pan X) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-grotesk font-semibold text-[#434841]">
                  <span>Esquerda / Direita</span>
                  <span className="font-mono text-[#132512]">{panX > 0 ? `+${panX}%` : `${panX}%`}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={panX}
                  onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                  className="w-full accent-[#283b26] cursor-pointer"
                />
              </div>

              {/* Posição Vertical (Pan Y) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-grotesk font-semibold text-[#434841]">
                  <span>Cima / Baixo</span>
                  <span className="font-mono text-[#132512]">{panY > 0 ? `+${panY}%` : `${panY}%`}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={panY}
                  onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                  className="w-full accent-[#283b26] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              AÇÕES RÁPIDAS (GIRAR, INVERTER, RESETAR)
          ══════════════════════════════════════════════════════════ */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de]">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#e4e2de] hover:border-[#283b26] text-xs font-grotesk font-semibold text-[#132512] transition cursor-pointer shadow-2xs"
                title="Girar 90 graus para a esquerda"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Girar Esquerda</span>
              </button>

              <button
                type="button"
                onClick={handleRotateRight}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#e4e2de] hover:border-[#283b26] text-xs font-grotesk font-semibold text-[#132512] transition cursor-pointer shadow-2xs"
                title="Girar 90 graus para a direita"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Girar Direita</span>
              </button>

              <button
                type="button"
                onClick={() => setFlipH(!flipH)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-grotesk font-semibold transition cursor-pointer shadow-2xs ${
                  flipH
                    ? 'bg-[#daeaaa] border-[#283b26] text-[#161f00]'
                    : 'bg-white border-[#e4e2de] text-[#132512]'
                }`}
                title="Espelhar foto horizontalmente"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Inverter</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-grotesk font-semibold text-[#747870] hover:text-[#132512] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════
              ILUMINAÇÃO E CORES (BRILHO, CONTRASTE, SATURAÇÃO)
          ══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Brilho */}
            <div className="p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de] space-y-1">
              <div className="flex items-center justify-between text-xs font-grotesk font-bold text-[#132512]">
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-[#283b26]" />
                  <span>Brilho</span>
                </span>
                <span>{brightness}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="140"
                step="2"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-[#283b26] cursor-pointer"
              />
            </div>

            {/* Contraste */}
            <div className="p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de] space-y-1">
              <div className="flex items-center justify-between text-xs font-grotesk font-bold text-[#132512]">
                <span className="flex items-center gap-1">
                  <Contrast className="w-3.5 h-3.5 text-[#283b26]" />
                  <span>Contraste</span>
                </span>
                <span>{contrast}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="140"
                step="2"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                className="w-full accent-[#283b26] cursor-pointer"
              />
            </div>

            {/* Saturação */}
            <div className="p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de] space-y-1">
              <div className="flex items-center justify-between text-xs font-grotesk font-bold text-[#132512]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#283b26]" />
                  <span>Cores</span>
                </span>
                <span>{saturation}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                step="2"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                className="w-full accent-[#283b26] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-4 sm:p-5 border-t border-[#efeeea] flex items-center justify-end gap-3 bg-[#fbf9f5] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#e4e2de] text-[#747870] hover:text-[#132512] font-grotesk text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#efeeea] transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#283b26] hover:bg-[#132512] text-white font-grotesk text-xs uppercase tracking-wider font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isProcessing ? 'Salvando...' : 'Aplicar Tamanho e Salvar Foto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
