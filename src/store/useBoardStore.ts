import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Board, CanvasItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface BoardState {
  boards: Board[];
  activeBoardId: string | null;
  activeItemId: string | null;
  addBoard: (name: string, affirmation: string) => void;
  deleteBoard: (id: string) => void;
  setActiveBoard: (id: string | null) => void;
  setActiveItem: (id: string | null) => void;
  updateBoardSettings: (id: string, updates: Partial<Board>) => void;
  
  // Canvas operations for active board
  addItem: (item: Omit<CanvasItem, 'id' | 'zIndex'>) => void;
  updateItem: (itemId: string, updates: Partial<CanvasItem>) => void;
  deleteItem: (itemId: string) => void;
  reorderItems: (itemId: string, direction: 'up' | 'down' | 'front' | 'back') => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: null,
      activeItemId: null,

      addBoard: (name, affirmation) => set((state) => {
        const newBoard: Board = {
          id: uuidv4(),
          name,
          affirmation,
          backgroundColor: '#09090b',
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return {
          boards: [...state.boards, newBoard],
          activeBoardId: newBoard.id, // Auto switch to new board
        };
      }),

      deleteBoard: (id) => set((state) => ({
        boards: state.boards.filter(b => b.id !== id),
        activeBoardId: state.activeBoardId === id ? null : state.activeBoardId
      })),

      setActiveBoard: (id) => set({ activeBoardId: id, activeItemId: null }),
      
      setActiveItem: (id) => set({ activeItemId: id }),

      updateBoardSettings: (id, updates) => set((state) => ({
        boards: state.boards.map(b => b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b)
      })),

      addItem: (itemData) => set((state) => {
        const board = state.boards.find(b => b.id === state.activeBoardId);
        if (!board) return state;

        const maxZ = board.items.reduce((max, item) => Math.max(max, item.zIndex), 0);
        
        const newItem: CanvasItem = {
          ...itemData,
          id: uuidv4(),
          zIndex: maxZ + 1,
        };
        
        return {
          boards: state.boards.map(b => 
            b.id === state.activeBoardId 
              ? { ...b, items: [...b.items, newItem], updatedAt: Date.now() } 
              : b
          )
        };
      }),

      updateItem: (itemId, updates) => set((state) => {
        const boardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
        if (boardIndex === -1) return state;

        const boards = [...state.boards];
        const board = { ...boards[boardIndex] };
        
        board.items = board.items.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        );
        board.updatedAt = Date.now();
        boards[boardIndex] = board;

        return { boards };
      }),

      deleteItem: (itemId) => set((state) => {
        const boardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
        if (boardIndex === -1) return state;

        const boards = [...state.boards];
        const board = { ...boards[boardIndex] };
        
        board.items = board.items.filter(item => item.id !== itemId);
        board.updatedAt = Date.now();
        boards[boardIndex] = board;

        return { 
          boards,
          activeItemId: state.activeItemId === itemId ? null : state.activeItemId 
        };
      }),

      reorderItems: (itemId, direction) => set((state) => {
        const boardIndex = state.boards.findIndex(b => b.id === state.activeBoardId);
        if (boardIndex === -1) return state;

        const boards = [...state.boards];
        const board = { ...boards[boardIndex] };
        
        // Custom logic for zIndex reordering here.
        // For simplicity in MVP, we can just bump it.
        const item = board.items.find(i => i.id === itemId);
        if(!item) return state;

        const maxZ = Math.max(...board.items.map(i => i.zIndex));
        const minZ = Math.min(...board.items.map(i => i.zIndex));

        let newZ = item.zIndex;
        if(direction === 'up') newZ = item.zIndex + 1;
        if(direction === 'down') newZ = item.zIndex - 1;
        if(direction === 'front') newZ = maxZ + 1;
        if(direction === 'back') newZ = minZ - 1;

        board.items = board.items.map(i => i.id === itemId ? { ...i, zIndex: newZ } : i);
        boards[boardIndex] = board;

        return { boards };
      }),
    }),
    {
      name: 'visionflow-storage', // key in local storage
    }
  )
);
