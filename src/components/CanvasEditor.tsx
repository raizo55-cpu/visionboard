// @ts-nocheck
/* eslint-disable */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Rect, Group } from 'react-konva';
import useImage from 'use-image';
import { useBoardStore } from '@/store/useBoardStore';
import { CanvasItem } from '@/types';

// Custom Image Component to handle loading via useImage hook
const URLImage = ({ item, isSelected, onSelect, onChange }: { item: CanvasItem; isSelected: boolean; onSelect: () => void; onChange: (newAttrs: any) => void }) => {
  const [img] = useImage(item.src || '');
  const shapeRef = useRef<any>();
  const trRef = useRef<any>();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const isPolaroid = item.frameStyle === 'polaroid';
  const paddingXY = isPolaroid ? 12 : 0;
  const paddingBottom = isPolaroid ? 40 : 0;

  return (
    <React.Fragment>
      <Group
        x={item.x}
        y={item.y}
        rotation={item.rotation}
        draggable
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          // Scale based on the original item width, not the group bounding box, so padding remains constant
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, (item.width || 100) * scaleX),
            height: Math.max(5, (item.height || 100) * scaleY),
            rotation: node.rotation(),
          });
        }}
      >
        {isPolaroid && (
          <Rect
            x={0}
            y={0}
            width={(item.width || 100) + paddingXY * 2}
            height={(item.height || 100) + paddingXY + paddingBottom}
            fill="#ffffff"
            shadowColor="rgba(0,0,0,0.5)"
            shadowBlur={8}
            shadowOffsetX={2}
            shadowOffsetY={4}
            cornerRadius={2}
          />
        )}
        <KonvaImage
          image={img}
          x={paddingXY}
          y={paddingXY}
          width={item.width}
          height={item.height}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

// Background Image Component
const BackgroundImage = ({ src, width, height }: { src: string, width: number, height: number }) => {
  const [img] = useImage(src);
  if (!img) return null;
  
  // Calculate aspect ratio to cover the screen (like object-fit: cover)
  const scale = Math.max(width / img.width, height / img.height);
  const imgWidth = img.width * scale;
  const imgHeight = img.height * scale;
  const x = (width - imgWidth) / 2;
  const y = (height - imgHeight) / 2;

  return (
    <KonvaImage
      image={img}
      x={x}
      y={y}
      width={imgWidth}
      height={imgHeight}
      listening={false}
    />
  );
};

// Custom Text Component
const EditableText = ({ item, isSelected, onSelect, onChange }: { item: CanvasItem; isSelected: boolean; onSelect: () => void; onChange: (newAttrs: any) => void }) => {
  const shapeRef = useRef<any>();
  const trRef = useRef<any>();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaText
        text={item.text}
        x={item.x}
        y={item.y}
        fontSize={item.fontSize || 24}
        fontFamily={item.fontFamily || 'Inter'}
        fill={item.fill || '#ffffff'}
        rotation={item.rotation}
        draggable
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            fontSize: Math.max(12, (item.fontSize || 24) * scaleX),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default function CanvasEditor({ stageRef }: { stageRef: React.RefObject<any> }) {
  const { boards, activeBoardId, activeItemId, setActiveItem, updateItem } = useBoardStore();
  
  const [size, setSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeBoard = boards.find(b => b.id === activeBoardId);

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const checkDeselect = (e: any) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    const clickedOnBackground = e.target.name() === 'background';
    if (clickedOnEmpty || clickedOnBackground) {
      setActiveItem(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid deleting when user is typing in an input field (like color picker)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeItemId) {
        const board = boards.find(b => b.id === activeBoardId);
        if(board) {
            useBoardStore.getState().deleteItem(activeItemId);
            setActiveItem(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItemId, activeBoardId, boards]);

  if (!activeBoard) return <div className="flex-1 flex items-center justify-center">Board not found</div>;

  // Sort by zIndex to render properly
  const sortedItems = [...activeBoard.items].sort((a, b) => a.zIndex - b.zIndex);

  const handleStageDblClick = () => {
    if (activeItemId) {
      const item = activeBoard.items.find((i: CanvasItem) => i.id === activeItemId);
      if (item && item.type === 'text') {
        const newText = window.prompt('テキストを入力:', item.text);
        if (newText !== null) {
          updateItem(activeItemId, { text: newText });
        }
      }
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-zinc-950 overflow-hidden" ref={containerRef}>
      <Stage
        width={size.width}
        height={size.height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
        onDblClick={handleStageDblClick}
        onDblTap={handleStageDblClick}
        ref={stageRef as any}
      >
        <Layer>
          {/* Background Rect to ensure export has solid background */}
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={activeBoard.backgroundColor || '#09090b'}
            listening={false} // Don't catch pointer events, allow checkDeselect on stage to work
          />
          {/* Background Image if exists */}
          {activeBoard.backgroundImage && (
            <BackgroundImage 
              src={activeBoard.backgroundImage} 
              width={size.width} 
              height={size.height} 
            />
          )}

          {sortedItems.map((item) => {
            if (item.type === 'image') {
              return (
                <URLImage
                  key={item.id}
                  item={item}
                  isSelected={item.id === activeItemId}
                  onSelect={() => setActiveItem(item.id)}
                  onChange={(newAttrs) => updateItem(item.id, newAttrs)}
                />
              );
            }
            if (item.type === 'text') {
              return (
                <EditableText
                  key={item.id}
                  item={item}
                  isSelected={item.id === activeItemId}
                  onSelect={() => setActiveItem(item.id)}
                  onChange={(newAttrs) => updateItem(item.id, newAttrs)}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
