// Candlestick Chart Component
// Displays price history using canvas rendering

import type { Candle } from '../../lib/market/priceGenerator';

export class CandlestickChart {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private candles: Candle[] = [];
  private width: number = 0;
  private height: number = 0;
  private padding = { top: 20, right: 50, bottom: 30, left: 10 };
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full';
    this.container.appendChild(this.canvas);
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;
    
    // Initial resize
    this.resize();
    
    // Handle resize
    window.addEventListener('resize', () => this.resize());
  }
  
  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.scale(dpr, dpr);
    this.render();
  }
  
  updateCandles(candles: Candle[]): void {
    this.candles = candles;
    this.render();
  }
  
  private render(): void {
    if (this.candles.length === 0) return;
    
    const { ctx, width, height, padding } = this;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    
    for (const candle of this.candles) {
      minPrice = Math.min(minPrice, candle.low);
      maxPrice = Math.max(maxPrice, candle.high);
    }
    
    // Add some padding to the price range
    const priceRange = maxPrice - minPrice;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Helper functions
    const priceToY = (price: number): number => {
      return padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    };
    
    const indexToX = (index: number): number => {
      const candleWidth = chartWidth / this.candles.length;
      return padding.left + index * candleWidth + candleWidth / 2;
    };
    
    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Horizontal grid lines (price levels)
    const priceStep = (maxPrice - minPrice) / 5;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + priceStep * i;
      const y = priceToY(price);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Price label
      ctx.fillText(price.toFixed(2), width - 5, y + 3);
    }
    
    ctx.setLineDash([]);
    
    // Draw candles
    const candleWidth = (chartWidth / this.candles.length) * 0.7;
    
    for (let i = 0; i < this.candles.length; i++) {
      const candle = this.candles[i];
      const x = indexToX(i);
      
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#22C55E' : '#EF4444';
      
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      
      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(openY - closeY), 1);
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    }
    
    // Draw current price line
    if (this.candles.length > 0) {
      const lastCandle = this.candles[this.candles.length - 1];
      const currentPriceY = priceToY(lastCandle.close);
      
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, currentPriceY);
      ctx.lineTo(width - padding.right, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Current price label
      ctx.fillStyle = '#3B82F6';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(lastCandle.close.toFixed(2), width - padding.right + 5, currentPriceY + 3);
    }
  }
  
  destroy(): void {
    window.removeEventListener('resize', () => this.resize());
    this.canvas.remove();
  }
}
