
import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  initialValue?: string;
  borderColorClass?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, initialValue, borderColorClass = 'border-gray-300' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const lastValueRef = useRef<string | undefined>(undefined);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Sync image loading
  useEffect(() => {
    if (initialValue === lastValueRef.current) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (initialValue && initialValue !== '') {
          const img = new Image();
          img.src = initialValue;
          img.onload = () => {
            bgImageRef.current = img;
            ctx.drawImage(img, 0, 0);
          };
        } else {
          bgImageRef.current = null;
        }
      }
    }
    lastValueRef.current = initialValue;
  }, [initialValue]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawAllStrokes = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    
    // If we have an initial value background image but no strokes yet, 
    // we need to keep drawing that image as the base layer.
    // However, usually we want to "flatten" into strokes or just use the image as base.
    if (bgImageRef.current && strokesRef.current.length === 0 && currentStrokeRef.current.length === 0) {
      ctx.drawImage(bgImageRef.current, 0, 0);
    }

    const drawStroke = (points: Point[]) => {
      if (points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }

      const lastIndex = points.length - 1;
      ctx.quadraticCurveTo(
        points[lastIndex - 1].x,
        points[lastIndex - 1].y,
        points[lastIndex].x,
        points[lastIndex].y
      );
      ctx.stroke();
    };

    // Style for ink
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.shadowBlur = 0.5;
    ctx.shadowColor = 'rgba(30, 41, 59, 0.2)';

    strokesRef.current.forEach(stroke => drawStroke(stroke.points));
    if (currentStrokeRef.current.length > 0) {
      drawStroke(currentStrokeRef.current);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    currentStrokeRef.current = [pos];
    if ('touches' in e) e.preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    currentStrokeRef.current.push(pos);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      drawAllStrokes(ctx);
    }
    if ('touches' in e) e.preventDefault();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentStrokeRef.current.length > 0) {
        strokesRef.current.push({ points: [...currentStrokeRef.current] });
        currentStrokeRef.current = [];
      }
      const dataUrl = canvasRef.current?.toDataURL();
      if (dataUrl) {
        lastValueRef.current = dataUrl;
        onSave(dataUrl);
      }
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokesRef.current = [];
        currentStrokeRef.current = [];
        lastValueRef.current = '';
        bgImageRef.current = null;
        onSave('');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className={`relative border-2 ${isDrawing ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-dashed ' + borderColorClass} rounded-[2.5rem] bg-white overflow-hidden transition-all duration-300 shadow-xl group h-[220px]`}>
        <div className="absolute top-4 left-6 flex items-center gap-2 pointer-events-none">
          <PenTool size={14} className="text-indigo-500" />
          <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">
            Ruang Tandatangan Digital
          </span>
        </div>
        
        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none', width: '100%', height: '100%' }}
          className="cursor-crosshair block"
        />
        
        <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="text-[9px] font-black text-gray-400 bg-white/90 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm uppercase tracking-widest">
             Sokongan Multi-Strok Aktif
           </span>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={clear}
          className="group flex items-center gap-2 px-8 py-3 bg-white hover:bg-red-600 text-red-600 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md border border-red-100 hover:border-red-600"
        >
          <RotateCcw size={14} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
          Padam & Tanda Semula
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
