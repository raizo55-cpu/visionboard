// @ts-nocheck
/* eslint-disable */
'use client';

import dynamic from 'next/dynamic';
import { useBoardStore } from '@/store/useBoardStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Type, Download, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

// Dynamically import CanvasEditor to disable SSR for react-konva
const CanvasEditor = dynamic(() => import('@/components/CanvasEditor'), { ssr: false });

const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter (標準)' },
  { value: 'Noto Sans JP', label: 'ゴシック体' },
  { value: 'Noto Serif JP', label: '明朝体' },
  { value: 'Zen Maru Gothic', label: '丸ゴシック' },
];

export default function EditorPage() {
  const router = useRouter();
  const { boards, activeBoardId, activeItemId, addItem, updateItem, deleteBoard, updateBoardSettings } = useBoardStore();
  const [isClient, setIsClient] = useState(false);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    if (boards.length > 0 && !activeBoardId) {
      router.push('/');
    }
  }, [boards, activeBoardId, router]);

  const activeBoard = boards.find(b => b.id === activeBoardId);

  if (!isClient) return null;
  if (!activeBoard) return null;

  const activeItem = activeItemId ? activeBoard.items.find(i => i.id === activeItemId) : null;

  const handleAddText = () => {
    addItem({
      type: 'text',
      text: 'ダブルクリックして編集',
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2,
      width: 200,
      height: 50,
      rotation: 0,
      fill: '#ffffff',
      fontSize: 24,
    });
  };

  const processImageFile = async (file: File, maxWidth: number = 1000): Promise<{src: string, originalWidth: number, originalHeight: number}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || file.size > 500 * 1024) {
            if (width > maxWidth) {
              const ratio = maxWidth / width;
              width = maxWidth;
              height = height * ratio;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedSrc = canvas.toDataURL('image/webp', 0.7);
              resolve({ src: compressedSrc, originalWidth: width, originalHeight: height });
              return;
            }
          }
          resolve({ src, originalWidth: img.width, originalHeight: img.height });
        };
        img.onerror = reject;
        img.src = src;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { src, originalWidth, originalHeight } = await processImageFile(file);
        const scale = Math.min(1, 400 / originalWidth);
        addItem({
          type: 'image',
          src,
          x: window.innerWidth / 2 - (originalWidth * scale) / 2,
          y: window.innerHeight / 2 - (originalHeight * scale) / 2,
          width: originalWidth * scale,
          height: originalHeight * scale,
          rotation: 0,
          frameStyle: 'none',
        });
      } catch (err) {
        console.error('Failed to process image', err);
      }
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      try {
        const { src, originalWidth, originalHeight } = await processImageFile(file);
        const scale = Math.min(1, 400 / originalWidth);
        const imgWidth = originalWidth * scale;
        const imgHeight = originalHeight * scale;
        addItem({
          type: 'image',
          src,
          x: dropX - imgWidth / 2,
          y: dropY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          rotation: 0,
          frameStyle: 'none',
        });
      } catch (err) {
        console.error('Failed to process image drop', err);
      }
    }
  };

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { src } = await processImageFile(file, 2000); // Allow larger resolution for backgrounds
        updateBoardSettings(activeBoard.id, { backgroundImage: src });
      } catch (err) {
        console.error('Failed to process bg image', err);
      }
    }
    e.target.value = '';
  };

  const clearBackgroundImage = () => {
    updateBoardSettings(activeBoard.id, { backgroundImage: undefined });
  };

  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 }); // High res
      const link = document.createElement('a');
      link.download = `${activeBoard.name}-visionboard.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <header className="h-16 border-b border-zinc-800 glass flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-lg">{activeBoard.name}</h1>
            {activeBoard.affirmation && (
              <p className="text-xs text-slate-400">{activeBoard.affirmation}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
          >
            <Download size={16} />
            保存 (PNG)
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-16 md:w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center md:items-start shrink-0 z-10 py-4 gap-2">
          <div className="px-2 md:px-4 w-full">
            <p className="text-xs font-semibold text-slate-500 mb-2 hidden md:block uppercase tracking-wider">素材を追加</p>
            
            <label className="flex items-center justify-center md:justify-start gap-3 w-full p-3 hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors text-slate-300 hover:text-white">
              <ImageIcon size={20} />
              <span className="hidden md:inline text-sm font-medium">画像をアップロード</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            <button 
              onClick={handleAddText}
              className="flex items-center justify-center md:justify-start gap-3 w-full p-3 hover:bg-zinc-900 rounded-lg transition-colors text-slate-300 hover:text-white"
            >
              <Type size={20} />
              <span className="hidden md:inline text-sm font-medium">テキストを追加</span>
            </button>
          </div>

          <div className="px-2 md:px-4 w-full mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 mb-2 hidden md:block uppercase tracking-wider">背景設定</p>
            
            <div className="flex items-center justify-center md:justify-start gap-3 w-full p-3 hover:bg-zinc-900 rounded-lg transition-colors text-slate-300">
              <input 
                type="color" 
                value={activeBoard.backgroundColor || '#09090b'} 
                onChange={(e) => updateBoardSettings(activeBoard.id, { backgroundColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent shrink-0"
                title="背景色を変更"
              />
              <span className="hidden md:inline text-sm font-medium text-slate-300">背景色を変更</span>
            </div>

            <label className="flex items-center justify-center md:justify-start gap-3 w-full p-3 hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors text-slate-300 hover:text-white">
              <ImageIcon size={20} className="shrink-0" />
              <span className="hidden md:inline text-sm font-medium">背景画像を設定</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundImageUpload} />
            </label>

            {activeBoard.backgroundImage && (
              <button 
                onClick={clearBackgroundImage}
                className="flex items-center justify-center md:justify-start gap-3 w-full p-3 hover:bg-zinc-900 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <Trash2 size={16} className="shrink-0" />
                <span className="hidden md:inline text-xs font-medium">背景画像を解除</span>
              </button>
            )}
          </div>
          
          {/* Properties Panel for Selected Item */}
          {activeItem && (
            <div className="px-2 md:px-4 w-full mt-4 space-y-2 border-t border-zinc-800 pt-4">
              <p className="text-xs font-semibold text-slate-500 mb-2 hidden md:block uppercase tracking-wider">
                {activeItem.type === 'text' ? 'テキスト設定' : '画像設定'}
              </p>
              
              {activeItem.type === 'text' && (
                <div className="space-y-4 mb-4">
                  <div className="px-2">
                    <p className="text-xs text-slate-400 mb-1">テキストの内容</p>
                    <textarea 
                      value={activeItem.text || ''}
                      onChange={(e) => updateItem(activeItem.id, { text: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-3 w-full p-2 hover:bg-zinc-900 rounded-lg transition-colors text-slate-300">
                    <input 
                      type="color" 
                      value={activeItem.fill || '#ffffff'} 
                      onChange={(e) => updateItem(activeItem.id, { fill: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent shrink-0"
                      title="文字色を変更"
                    />
                    <span className="hidden md:inline text-sm font-medium text-slate-300">文字色を変更</span>
                  </div>

                  <div className="px-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">文字サイズ</span>
                      <span className="text-xs text-slate-300">{Math.round(activeItem.fontSize || 24)}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="12" 
                      max="120" 
                      value={activeItem.fontSize || 24} 
                      onChange={(e) => updateItem(activeItem.id, { fontSize: Number(e.target.value) })}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="px-2">
                    <p className="text-xs text-slate-400 mb-1">フォント</p>
                    <select
                      value={activeItem.fontFamily || 'Inter'}
                      onChange={(e) => updateItem(activeItem.id, { fontFamily: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 text-slate-300 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
                    >
                      {FONT_FAMILIES.map(font => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeItem.type === 'image' && (
                <div className="space-y-4 mb-4">
                  <div className="px-2">
                    <p className="text-xs text-slate-400 mb-2">フレームスタイル</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateItem(activeItem.id, { frameStyle: 'none' })}
                        className={`flex-1 p-2 text-xs font-medium rounded-lg transition-colors ${!activeItem.frameStyle || activeItem.frameStyle === 'none' ? 'bg-primary text-white' : 'bg-zinc-800 text-slate-400 hover:bg-zinc-700'}`}
                      >
                        標準
                      </button>
                      <button 
                        onClick={() => updateItem(activeItem.id, { frameStyle: 'polaroid' })}
                        className={`flex-1 p-2 text-xs font-medium rounded-lg transition-colors ${activeItem.frameStyle === 'polaroid' ? 'bg-primary text-white' : 'bg-zinc-800 text-slate-400 hover:bg-zinc-700'}`}
                      >
                        ポラロイド風
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Controls (Rotation) */}
              <div className="px-2 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400">回転</span>
                  <span className="text-xs text-slate-300">{Math.round(activeItem.rotation || 0)}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={activeItem.rotation || 0} 
                  onChange={(e) => updateItem(activeItem.id, { rotation: Number(e.target.value) })}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Layer controls */}
              <div className="flex gap-2 w-full px-1">
                <button 
                  onClick={() => useBoardStore.getState().reorderItems(activeItem.id, 'front')}
                  className="flex-1 flex flex-col items-center justify-center gap-1 p-2 hover:bg-zinc-900 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="最前面へ移動"
                >
                  <ArrowUpCircle size={18} />
                  <span className="text-[10px] hidden md:block">前面へ</span>
                </button>
                <button 
                  onClick={() => useBoardStore.getState().reorderItems(activeItem.id, 'back')}
                  className="flex-1 flex flex-col items-center justify-center gap-1 p-2 hover:bg-zinc-900 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="最背面へ移動"
                >
                  <ArrowDownCircle size={18} />
                  <span className="text-[10px] hidden md:block">背面へ</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto px-2 md:px-4 w-full mb-4">
             <button 
              onClick={() => {
                if(confirm('本当に削除しますか？')) {
                  deleteBoard(activeBoard.id);
                  router.push('/');
                }
              }}
              className="flex items-center justify-center md:justify-start gap-3 w-full p-3 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
              <span className="hidden md:inline text-sm font-medium">ボードを削除</span>
            </button>
          </div>
        </aside>

        {/* Canvas Area */}
        <main 
          className="flex-1 relative overflow-hidden bg-zinc-950"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CanvasEditor stageRef={stageRef} />
        </main>
      </div>
    </div>
  );
}
