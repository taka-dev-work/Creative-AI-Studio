import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TextProperties } from '../types';
import { PREVIEW_CANVAS_MAX_WIDTH } from '../constants';
import { ImageIcon } from './icons';

interface PreviewCanvasProps {
  imageSrc: string | null;
  textProps: TextProperties;
  onTextPropsChange: (updater: (prev: TextProperties) => TextProperties) => void;
  aspectRatio: number;
  isLoading: boolean;
  captionPlacement: 'top' | 'middle' | 'bottom' | null;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  imageSrc,
  textProps,
  onTextPropsChange,
  aspectRatio,
  isLoading,
  captionPlacement
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  const updateCanvasDimensions = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32; // Subtract padding
      const containerHeight = containerRef.current.clientHeight - 32;

      let width = Math.min(containerWidth, PREVIEW_CANVAS_MAX_WIDTH);
      let height = width / aspectRatio;

      if (height > containerHeight) {
          height = containerHeight;
          width = height * aspectRatio;
      }
      setCanvasSize({ width, height });
    }
  }, [aspectRatio]);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, [updateCanvasDimensions]);

  const getWrappedLines = useCallback((ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      const paragraphs = text.split('\n');
      const lines: string[] = [];
      paragraphs.forEach(p => {
          if (p === '') {
              lines.push('');
              return;
          }
          const words = p.split(' ');
          let currentLine = '';
          for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
              } else {
                  currentLine = testLine;
              }
          }
          lines.push(currentLine);
      });
      return lines;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#374151'; // gray-700
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (textProps.content) {
        ctx.font = `${textProps.fontSize}px ${textProps.fontFamily}`;
        ctx.fillStyle = textProps.color;
        ctx.textAlign = textProps.textAlign;
        ctx.textBaseline = 'top'; // Makes positioning from the top-left/top-center easier
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const maxWidth = canvas.width * 0.9;
        const lineHeight = textProps.fontSize * 1.2;
        const lines = getWrappedLines(ctx, textProps.content, maxWidth);
        
        lines.forEach((line, index) => {
            ctx.fillText(line, textProps.position.x, textProps.position.y + index * lineHeight);
        });
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        let maxLineWidth = 0;
        lines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
        });

        const textHeight = lines.length * lineHeight;
        
        let boxX;
        if (textProps.textAlign === 'center') {
            boxX = textProps.position.x - maxLineWidth / 2;
        } else if (textProps.textAlign === 'right') {
            boxX = textProps.position.x - maxLineWidth;
        } else {
            boxX = textProps.position.x;
        }

        const newBox = {
            x: boxX - 10,
            y: textProps.position.y - 10,
            width: maxLineWidth + 20,
            height: textHeight + 10,
        };
        
        if (JSON.stringify(newBox) !== JSON.stringify(textProps.box)) {
             onTextPropsChange(prev => ({ ...prev, box: newBox }));
        }

        if ((isHovering || isDragging) && textProps.box) {
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(textProps.box.x, textProps.box.y, textProps.box.width, textProps.box.height);
            ctx.setLineDash([]);
        }
    }
  }, [textProps, isHovering, isDragging, onTextPropsChange, getWrappedLines, canvasSize]);


  useEffect(() => {
    if (captionPlacement && canvasSize.width > 0 && textProps.content) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.font = `${textProps.fontSize}px ${textProps.fontFamily}`;
        
        const maxWidth = canvasSize.width * 0.9;
        const lines = getWrappedLines(ctx, textProps.content, maxWidth);
        
        const lineHeight = textProps.fontSize * 1.2;
        const textHeight = lines.length * lineHeight;

        let yPos;
        switch(captionPlacement) {
            case 'top': 
                yPos = canvasSize.height * 0.1; 
                break;
            case 'bottom': 
                yPos = canvasSize.height * 0.9 - textHeight; 
                break;
            case 'middle':
            default: 
                yPos = (canvasSize.height / 2) - (textHeight / 2);
        }

        onTextPropsChange(prev => ({
            ...prev,
            position: { x: canvasSize.width / 2, y: yPos }
        }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captionPlacement, canvasSize, textProps.content, textProps.fontSize, textProps.fontFamily]);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      img.onload = () => {
        imageRef.current = img;
        draw();
      };
    } else {
        imageRef.current = null;
        draw();
    }
  }, [imageSrc, draw]);

  useEffect(() => {
    draw();
  }, [textProps, canvasSize, draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !textProps.box) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= textProps.box.x && x <= textProps.box.x + textProps.box.width &&
        y >= textProps.box.y && y <= textProps.box.y + textProps.box.height) {
      setIsDragging(true);
      // Make drag relative to top-left of text box for consistent feel
      const relativeDragX = x - textProps.position.x;
      const relativeDragY = y - textProps.position.y;
      setDragStart({ x: relativeDragX, y: relativeDragY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      onTextPropsChange(prev => ({
        ...prev,
        position: { x: x - dragStart.x, y: y - dragStart.y },
      }));
    } else {
      if (textProps.box) {
        const isInside = x >= textProps.box.x && x <= textProps.box.x + textProps.box.width &&
                         y >= textProps.box.y && y <= textProps.box.y + textProps.box.height;
        if (isInside !== isHovering) {
            setIsHovering(isInside);
            canvasRef.current.style.cursor = isInside ? 'grab' : 'auto';
        }
      } else if (isHovering) {
        setIsHovering(false);
        canvasRef.current.style.cursor = 'auto';
      }
    }
  };

  const handleMouseUp = () => {
    if(isDragging) {
      setIsDragging(false);
      if (canvasRef.current) canvasRef.current.style.cursor = isHovering ? 'grab' : 'auto';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovering(false);
     if (canvasRef.current) canvasRef.current.style.cursor = 'auto';
  };

  useEffect(() => {
    if (canvasRef.current) {
        canvasRef.current.style.cursor = isDragging ? 'grabbing' : isHovering ? 'grab' : 'auto';
    }
  }, [isDragging, isHovering]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-900 p-4 relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity duration-300">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
          <p className="text-white mt-4 text-lg tracking-wider">Generating masterpiece...</p>
        </div>
      )}
      {!imageSrc && !isLoading && (
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-700 rounded-3xl bg-gray-800/30 w-full max-w-lg mx-6">
                <div className="bg-gray-800 p-4 rounded-full mb-4 ring-1 ring-gray-700">
                    <ImageIcon className="h-12 w-12 text-purple-400 opacity-80"/>
                </div>
                <p className="text-center font-bold text-xl text-gray-200">Your creation will appear here</p>
                <p className="text-gray-500 text-sm text-center mt-2 max-w-xs">
                    Configure your style, mood, and prompt on the left, then click Generate.
                </p>
            </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className={`bg-gray-700 rounded-lg shadow-2xl transition-opacity duration-300 ${!imageSrc ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default PreviewCanvas;