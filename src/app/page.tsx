'use client';

import { useBoardStore } from '@/store/useBoardStore';
import { Plus, Layout, DownloadCloud, UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { boards, addBoard, setActiveBoard } = useBoardStore();
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardAffirmation, setNewBoardAffirmation] = useState('');
  const router = useRouter();

  // Next.js hydration fix for zustand persist
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    
    addBoard(newBoardName, newBoardAffirmation);
    // Zustand store auto sets active board. We will navigate to editor later.
    // For now, let's assume we navigate to /editor
    router.push('/editor');
  };

  const openBoard = (id: string) => {
    setActiveBoard(id);
    router.push('/editor');
  };

  const handleExportData = () => {
    const data = localStorage.getItem('visionflow-storage');
    if (!data) {
      alert('書き出すデータがありません。');
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          // Validate JSON broadly
          JSON.parse(content);
          localStorage.setItem('visionflow-storage', content);
          alert('データの復元が完了しました。画面を再読み込みします。');
          window.location.reload();
        } catch (err) {
          alert('ファイルの読み込みに失敗しました。正しいバックアップファイルを選択してください。');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <main className="flex-1 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vision Boards</h1>
            <p className="text-slate-400 mt-1">あなたの目標とビジョンを管理しましょう</p>
          </div>
          <div className="flex items-center gap-1 md:gap-3">
            <div className="flex items-center gap-1 md:gap-2 mr-2 md:mr-4 border-r border-zinc-800 pr-2 md:pr-4">
              <label 
                className="flex items-center gap-2 px-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-lg cursor-pointer transition-colors text-xs md:text-sm font-medium"
                title="別のPCからデータを引き継ぐ"
              >
                <DownloadCloud size={18} />
                <span className="hidden sm:inline">データ読込</span>
                <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
              </label>
              <button 
                onClick={handleExportData}
                className="flex items-center gap-2 px-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-lg transition-colors text-xs md:text-sm font-medium"
                title="今のデータを書き出す"
              >
                <UploadCloud size={18} />
                <span className="hidden sm:inline">データ書出</span>
              </button>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 md:gap-2 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 text-sm md:text-base"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">新規ボード</span>
            </button>
          </div>
        </header>

        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-zinc-800 rounded-2xl glass">
            <div className="p-4 bg-zinc-800/50 rounded-full mb-4">
              <Layout size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">まだボードがありません</h2>
            <p className="text-slate-400 max-w-md">
              新しいビジョンボードを作成して、アイデアやインスピレーションを集め始めましょう。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map(board => (
              <div 
                key={board.id}
                onClick={() => openBoard(board.id)}
                className="group cursor-pointer flex flex-col p-6 h-48 rounded-2xl glass hover:border-zinc-700 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{board.name}</h3>
                  {board.affirmation && (
                    <p className="text-sm text-slate-400 mt-2 line-clamp-2">"{board.affirmation}"</p>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  更新日: {new Date(board.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">新しいボードを作成</h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  ボード名 *
                </label>
                <input 
                  type="text" 
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  placeholder="例: 2024年の目標、健康習慣..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  アファメーション (中心となる言葉)
                </label>
                <input 
                  type="text" 
                  value={newBoardAffirmation}
                  onChange={e => setNewBoardAffirmation(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  placeholder="例: 毎日少しずつ成長する"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  type="submit"
                  disabled={!newBoardName.trim()}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  作成する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
