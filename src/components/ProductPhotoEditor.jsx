import React, { useState, useRef, useEffect } from 'react';
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
  Sliders,
  Crop,
  FlipHorizontal,
  Move,
} from 'lucide-react';

export function ProductPhotoEditor({ isOpen, imageUrl, onClose, onSave }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [panX, setPanX] = useState(0); // em porcentagem (-50 a 50)
  const [panY, setPanY] = useState(0); // em porcentagem (-50 a 50)
  const [brightness, setBrightness] = useState(100); // 50 a 150
  const [contrast, setContrast] = useState(100); // 50 a 150
  const [saturation, setSaturation] = useState(100); // 50 a 150
  const [flipH, setFlipH] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const previewCanvasRef = useRef(null);
  const imageObjRef = useRef(null);

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

    // Reset de ajustes ao abrir nova imagem
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFlipH(false);
  }, [isOpen, imageUrl]);

  // Redesenha o canvas sempre que algum controle mudar
  useEffect(() => {
    if (imageObjRef.current && isOpen) {
      renderCanvas();
    }
  }, [zoom, rotation, panX, panY, brightness, contrast, saturation, flipH, isOpen]);

  const renderCanvas = () => {
    const canvas = previewCanvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolução de exportação padrão do cardápio em formato 16:10 (960 x 600)
    const targetWidth = 960;
    const targetHeight = 600;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Salva o estado do contexto
    ctx.save();

    // Aplica filtros fotográficos (Brilho, Contraste e Saturação)
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Move a origem para o centro do canvas
    ctx.translate(targetWidth / 2, targetHeight / 2);

    // Aplica rotação em radianos
    ctx.rotate((rotation * Math.PI) / 180);

    // Aplica espelhamento horizontal
    ctx.scale(flipH ? -1 : 1, 1);

    // Determina o tamanho base para cobrir a proporção 16:10 (efeito cover)
    const isRotated90or270 = rotation % 180 !== 0;
    const drawWidthSpace = isRotated90or270 ? targetHeight : targetWidth;
    const drawHeightSpace = isRotated90or270 ? targetWidth : targetHeight;

    const scaleBase = Math.max(drawWidthSpace / img.width, drawHeightSpace / img.height);
    const finalWidth = img.width * scaleBase * zoom;
    const finalHeight = img.height * scaleBase * zoom;

    // Deslocamento Pan (ajuste de enquadramento)
    const offsetX = (panX / 100) * targetWidth;
    const offsetY = (panY / 100) * targetHeight;

    // Desenha centralizado com o zoom e deslocamento
    ctx.drawImage(
      img,
      -finalWidth / 2 + (flipH ? -offsetX : offsetX),
      -finalHeight / 2 + offsetY,
      finalWidth,
      finalHeight
    );

    ctx.restore();
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFlipH(false);
  };

  const handleApply = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    try {
      setIsProcessing(true);
      const editedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
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

      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#e4e2de] shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[94vh] animate-in zoom-in-95 duration-200">
        {/* Cabeçalho do Editor */}
        <div className="p-4 sm:p-5 border-b border-[#efeeea] flex items-center justify-between bg-[#fbf9f5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#daeaaa] text-[#161f00]">
              <Crop className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-grotesk text-base sm:text-lg font-bold text-[#132512]">
                Editar Foto do Prato
              </h3>
              <p className="font-manrope text-xs text-[#747870]">
                Ajuste enquadramento, zoom e rotação no formato do cardápio (16:10)
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
          {/* Área de Visualização do Enquadramento 16:10 */}
          <div className="relative w-full aspect-[16/10] bg-[#1b1c1a] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-[#283b26]/20">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full object-cover"
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

            {/* Badge Indicador de Formato */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[10px]">
              Formato 16:10 do Cardápio
            </div>
          </div>

          {/* Barra de Ações Rápidas (Girar, Espelhar, Resetar) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de]">
            <div className="flex items-center gap-1.5">
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
              <span>Restaurar Original</span>
            </button>
          </div>

          {/* Sliders de Ajuste: Zoom e Posição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Zoom / Escala */}
            <div className="p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-grotesk font-bold text-[#132512]">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-[#283b26]" />
                  <span>Zoom / Enquadramento</span>
                </span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#283b26] cursor-pointer"
              />
            </div>

            {/* Posição Vertical (Pan Y) */}
            <div className="p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-grotesk font-bold text-[#132512]">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-[#283b26]" />
                  <span>Posição Vertical (Cima / Baixo)</span>
                </span>
                <span>{panY}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={panY}
                onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                className="w-full accent-[#283b26] cursor-pointer"
              />
            </div>

            {/* Brilho */}
            <div className="p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-grotesk font-bold text-[#132512]">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-[#283b26]" />
                  <span>Iluminação / Brilho</span>
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
            <div className="p-3 bg-[#fbf9f5] rounded-xl border border-[#e4e2de] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-grotesk font-bold text-[#132512]">
                <span className="flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5 text-[#283b26]" />
                  <span>Contraste / Cor</span>
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
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-4 sm:p-5 border-t border-[#efeeea] flex items-center justify-end gap-3 bg-[#fbf9f5]">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#283b26] hover:bg-[#132512] text-white font-grotesk text-xs uppercase tracking-wider font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isProcessing ? 'Salvando...' : 'Aplicar Edição na Foto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
