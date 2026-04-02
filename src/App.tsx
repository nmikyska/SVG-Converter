/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Download, FileImage, FileCode, Check, RefreshCw, Copy, Trash2, Settings2 } from 'lucide-react';
import ImageTracer from 'imagetracerjs';
import confetti from 'canvas-confetti';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [colors, setColors] = useState(16);
  const [isSmoothing, setIsSmoothing] = useState(false);
  const [smoothRadius, setSmoothRadius] = useState(1);
  const [isSharpening, setIsSharpening] = useState(false);
  const [contrastAmount, setContrastAmount] = useState(150);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setSvg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setSvg(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const processImage = (imageSrc: string, blur: number, contrast: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Apply filters: Blur first to smooth, then Contrast to sharpen/crispen edges
          let filter = '';
          if (isSmoothing) filter += `blur(${blur}px) `;
          if (isSharpening) filter += `contrast(${contrast}%) `;
          
          ctx.filter = filter.trim() || 'none';
          ctx.drawImage(img, 0, 0);
          
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(imageSrc);
        }
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  const convertToSvg = async () => {
    if (!image) return;
    setIsConverting(true);

    try {
      let processingImage = image;
      
      if (isSmoothing || isSharpening) {
        processingImage = await processImage(image, smoothRadius, contrastAmount);
      }

      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 300));

      ImageTracer.imageToSVG(
        processingImage,
        (svgstr: string) => {
          setSvg(svgstr);
          setIsConverting(false);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
          });
        },
        { 
          numberofcolors: colors,
          viewbox: true,
          ltres: 1,
          qtres: 1,
          pathomit: 8,
          blurradius: isSmoothing ? smoothRadius : 0,
          blurdelta: 20
        }
      );
    } catch (error) {
      console.error('Conversion failed:', error);
      setIsConverting(false);
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted-image.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!svg) return;
    navigator.clipboard.writeText(svg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const reset = () => {
    setImage(null);
    setSvg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <RefreshCw size={18} className={isConverting ? "animate-spin" : ""} />
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight">Vectorize</h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            Turn Pixels into <span className="text-blue-600">Vectors</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-500 text-lg max-w-2xl mx-auto"
          >
            High-quality PNG to SVG conversion right in your browser. 
            Perfect for logos, icons, and illustrations.
          </motion.p>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload & Settings */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <Upload size={18} className="text-blue-600" />
                  Upload Image
                </h3>

                {!image ? (
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <FileImage size={24} className="text-neutral-400 group-hover:text-blue-500" />
                    </div>
                    <p className="font-medium text-neutral-900 mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-neutral-500 mb-4">PNG, JPG or WebP (max 5MB)</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage('https://picsum.photos/seed/vector/400/400');
                        setSvg(null);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                    >
                      Try Sample Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img 
                        src={image} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={reset}
                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          showSettings ? 'bg-blue-50 text-blue-600' : 'text-neutral-500 hover:bg-neutral-100'
                        }`}
                      >
                        <Settings2 size={16} />
                        Settings
                      </button>
                      <button 
                        onClick={convertToSvg}
                        disabled={isConverting}
                        className="flex-1 ml-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                      >
                        {isConverting ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={18} />
                            Convert to SVG
                          </>
                        )}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showSettings && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 border-t border-neutral-100 space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-neutral-700">Color Palette</label>
                                <span className="text-sm font-bold text-blue-600">{colors} colors</span>
                              </div>
                              <input 
                                type="range" 
                                min="2" 
                                max="64" 
                                value={colors}
                                onChange={(e) => setColors(parseInt(e.target.value))}
                                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                              <p className="text-[10px] text-neutral-400 mt-1">Higher values preserve more detail but increase file size.</p>
                            </div>

                            <div className="pt-4 border-t border-neutral-100">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-neutral-700">Smooth Edges</label>
                                  <span className="text-[10px] text-neutral-400">Reduces noise and jagged edges</span>
                                </div>
                                <button 
                                  onClick={() => setIsSmoothing(!isSmoothing)}
                                  className={`w-10 h-5 rounded-full transition-colors relative ${isSmoothing ? 'bg-blue-600' : 'bg-neutral-200'}`}
                                >
                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isSmoothing ? 'left-6' : 'left-1'}`}></div>
                                </button>
                              </div>

                              {isSmoothing && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-2"
                                >
                                  <div className="flex justify-between">
                                    <label className="text-xs font-medium text-neutral-500">Smoothing Radius</label>
                                    <span className="text-xs font-bold text-blue-600">{smoothRadius}px</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="1" 
                                    max="5" 
                                    step="0.5"
                                    value={smoothRadius}
                                    onChange={(e) => setSmoothRadius(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                  />
                                </motion.div>
                              )}
                            </div>

                            <div className="pt-4 border-t border-neutral-100">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-neutral-700">Sharpen Edges</label>
                                  <span className="text-[10px] text-neutral-400">Crispens edges via contrast</span>
                                </div>
                                <button 
                                  onClick={() => setIsSharpening(!isSharpening)}
                                  className={`w-10 h-5 rounded-full transition-colors relative ${isSharpening ? 'bg-blue-600' : 'bg-neutral-200'}`}
                                >
                                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isSharpening ? 'left-6' : 'left-1'}`}></div>
                                </button>
                              </div>

                              {isSharpening && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-2"
                                >
                                  <div className="flex justify-between">
                                    <label className="text-xs font-medium text-neutral-500">Contrast Intensity</label>
                                    <span className="text-xs font-bold text-blue-600">{contrastAmount}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="100" 
                                    max="300" 
                                    step="10"
                                    value={contrastAmount}
                                    onChange={(e) => setContrastAmount(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                  />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info Card */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-100">
              <h4 className="font-display font-bold text-lg mb-2">Why SVG?</h4>
              <p className="text-blue-100 text-sm leading-relaxed">
                SVGs are resolution-independent. They stay sharp at any size, 
                making them ideal for responsive web design and high-quality printing.
              </p>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-neutral-200 shadow-sm h-full flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <FileCode size={18} className="text-blue-600" />
                  Vector Result
                </h3>
                {svg && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      title="Copy SVG Code"
                    >
                      {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                      onClick={downloadSvg}
                      className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-800 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 p-8 flex items-center justify-center bg-neutral-50/50 relative overflow-hidden">
                {/* Checkerboard background for transparency */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                
                {!svg ? (
                  <div className="text-center max-w-xs">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center mx-auto mb-4">
                      <RefreshCw size={32} className="text-neutral-200" />
                    </div>
                    <p className="text-neutral-400 font-medium">
                      {isConverting ? 'Processing your image...' : 'Your vectorized result will appear here after conversion.'}
                    </p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                )}
              </div>

              {svg && (
                <div className="p-4 bg-neutral-50 border-t border-neutral-100">
                  <div className="flex items-center gap-4 text-xs text-neutral-500 font-medium">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Vectorized
                    </span>
                    <span>•</span>
                    <span>{svg.length.toLocaleString()} bytes</span>
                    <span>•</span>
                    <span>SVG 1.1</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-neutral-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-neutral-900 rounded flex items-center justify-center text-white">
              <RefreshCw size={12} />
            </div>
            <span className="font-display font-bold text-sm">Vectorize</span>
          </div>
          <p className="text-sm text-neutral-400">
            © 2026 Vectorize App. Built with Gemini and ImageTracer.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-neutral-400">
            <a href="#" className="hover:text-neutral-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
