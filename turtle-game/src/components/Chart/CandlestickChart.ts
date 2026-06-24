// Candlestick Chart Component
// Displays price history using canvas rendering with VIX overlay

import type { Candle } from '../../lib/market/priceGenerator';

export class CandlestickChart {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private candles: Candle[] = [];
  private vixCandles: Candle[] = [];
  private width: number = 0;
  private height: number = 0;
  private padding = { top: 20, right: 60, bottom: 30, left: 10 };
  
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
  
  updateCandles(candles: Candle[], vixCandles?: Candle[]): void {
    this.candles = candles;
    if (vixCandles) {
      this.vixCandles = vixCandles;
    }
    this.render();
  }
  
  private render(): void {
    if (this.candles.length === 0) return;
    
    const { ctx, width, height, padding } = this;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate price range for SPY
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
    
    // Calculate VIX range
    let minVIX = Infinity;
    let maxVIX = -Infinity;
    
    for (const candle of this.vixCandles) {
      minVIX = Math.min(minVIX, candle.low);
      maxVIX = Math.max(maxVIX, candle.high);
    }
    
    // Add padding to VIX range
    const vixRange = maxVIX - minVIX;
    minVIX -= vixRange * 0.1;
    maxVIX += vixRange * 0.1;
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Helper functions for SPY (left axis)
    const priceToY = (price: number): number => {
      return padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
    };
    
    // Helper function for VIX (right axis)
    const vixToY = (vix: number): number => {
      return padding.top + chartHeight - ((vix - minVIX) / (maxVIX - minVIX)) * chartHeight;
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
      
      // SPY Price label (left side)
      ctx.fillText(price.toFixed(2), width - padding.right - 5, y + 3);
    }
    
    ctx.setLineDash([]);
    
    // Draw VIX line if we have VIX data
    if (this.vixCandles.length > 0) {
      ctx.strokeStyle = '#A855F7'; // Purple for VIX
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < this.vixCandles.length; i++) {
        const vixCandle = this.vixCandles[i];
        const x = indexToX(i);
        const y = vixToY(vixCandle.close);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Draw VIX dots at each data point
      ctx.fillStyle = '#A855F7';
      for (let i = 0; i < this.vixCandles.length; i++) {
        const vixCandle = this.vixCandles[i];
        const x = indexToX(i);
        const y = vixToY(vixCandle.close);
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw VIX axis labels (right side)
      ctx.fillStyle = '#A855F7';
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px sans-serif';
      
      const vixStep = (maxVIX - minVIX) / 5;
      for (let i = 0; i <= 5; i++) {
        const vix = minVIX + vixStep * i;
        const y = vixToY(vix);
        ctx.fillText(vix.toFixed(1), width - padding.right + 5, y + 3);
      }
      
      // VIX label
      ctx.fillText('VIX →', width - padding.right + 5, padding.top - 5);
    }
    
    // Draw SPY candles
    const candleWidth = (chartWidth / this.candles.length) * 0.7;

    for (let i = 0; i < this.candles.length; i++) {
      const candle = this.candles[i];
      const x = indexToX(i);

      const isGreen = candle.close >= candle.open;
      const isHistorical = candle.isHistorical === true;

      // Color: gray for historical, green/red for game candles
      let color: string;
      if (isHistorical) {
        color = isGreen ? '#9CA3AF' : '#6B7280'; // Gray shades
      } else {
        color = isGreen ? '#22C55E' : '#EF4444'; // Green/Red
      }

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
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(openY - closeY), 1);

      if (isGreen && !isHistorical) {
        // Game candle up: hollow (stroke only)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Down candles or historical: filled
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
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
      ctx.textAlign = 'right';
      ctx.fillText(lastCandle.close.toFixed(2), width - padding.right - 5, currentPriceY - 8);
    }
    
    // Draw legend
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    
    // SPY legend
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(padding.left, 5, 12, 12);
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('SPY', padding.left + 16, 15);
    
    // VIX legend
    ctx.fillStyle = '#A855F7';
    ctx.fillRect(padding.left + 50, 10, 20, 3);
    ctx.beginPath();
    ctx.arc(padding.left + 60, 11.5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('VIX', padding.left + 74, 15);
  }
  
  destroy(): void {
    window.removeEventListener('resize', () => this.resize());
    this.canvas.remove();
  }
}
