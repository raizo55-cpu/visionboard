export type ItemType = 'image' | 'text' | 'shape';

export interface CanvasItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  
  // Type specific properties
  src?: string; // For images
  text?: string; // For text
  fontSize?: number;
  fontFamily?: string;
  fill?: string; // Color
  frameStyle?: 'none' | 'polaroid'; // Image styling
}

export interface Board {
  id: string;
  name: string;
  affirmation: string;
  backgroundColor?: string;
  backgroundImage?: string;
  items: CanvasItem[];
  createdAt: number;
  updatedAt: number;
}
