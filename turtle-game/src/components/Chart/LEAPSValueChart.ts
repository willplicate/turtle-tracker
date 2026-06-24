// LEAPS Value Chart Component
// Displays LEAPS value over time using canvas rendering

export interface LEAPSValuePoint {
  day: number;
  value: number;
  date: Date;
}

export class LEAPSValueChart {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: LEAPSValuePoint[] = [];
  private width: number = 0;
  private height: number = 0;
  private padding = { top: 30, right: 20, bottom: 40, left: 60 };
  private costBasis: number = 0;
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full h-full flex flex-col';
    
    const title = document.createElement('div');
    title.className = 'text-xs font-bold text-gray-400 mb-1 px-1';
    title.textContent = 'LEAPS Value History';
    wrapper.appendChild(title);
    
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'flex-1 relative';
    
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full';
    canvasContainer.appendChild(this.canvas);
    wrapper.appendChild(canvasContainer);
    
    this.container.appendChild(wrapper);
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height - 20;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.scale(dpr, dpr);
    this.render();
  }
  
  updateData(data: LEAPSValuePoint[], costBasis: number): void {
    this.data = data;
    this.costBasis = costBasis;
    this.render();
  }
  
  private render(): void {
    if (this.data.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    const { ctx, width, height, padding } = this;
    ctx.clearRect(0, 0, width, height);
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    
    for (const point of this.data) {
      minValue = Math.min(minValue, point.value);
      maxValue = Math.max(maxValue, point.value);
    }
    
    minValue = Math.min(minValue, this.costBasis);
    maxValue = Math.max(maxValue, this.costBasis);
    
    const valueRange = maxValue - minValue;
    const paddingAmount = valueRange * 0.1 || maxValue * 0.05;
    minValue = Math.max(0, minValue - paddingAmount);
    maxValue = maxValue + paddingAmount;
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const valueToY = (value: number): number => {
      return padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    };
    
    const indexToX = (index: number): number => {
      const step = chartWidth / Math.max(this.data.length - 1, 1);
      return padding.left + index * step;
    };
    
    // Grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    const gridSteps = 4;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= gridSteps; i++) {
      const value = minValue + (maxValue - minValue) * (i / gridSteps);
      const y = valueToY(value);
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      ctx.fillText(`$${Math.round(value).toLocaleString()}`, padding.left - 5, y + 3);
    }
    
    ctx.setLineDash([]);
    
    // Cost basis line
    const costBasisY = valueToY(this.costBasis);
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(padding.left, costBasisY);
    ctx.lineTo(width - padding.right, costBasisY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Cost', width - padding.right + 3, costBasisY + 3);
    
    // Value line
    if (this.data.length > 1) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      const pnl = this.data[this.data.length - 1].value - this.costBasis;
      const lineColor = pnl >= 0 ? '#22C55E' : '#EF4444';
      gradient.addColorStop(0, pnl >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      // Area under line
      ctx.beginPath();
      ctx.moveTo(indexToX(0), valueToY(this.data[0].value));
      for (let i = 1; i < this.data.length; i++) {
        ctx.lineTo(indexToX(i), valueToY(this.data[i].value));
      }
      ctx.lineTo(indexToX(this.data.length - 1), padding.top + chartHeight);
      ctx.lineTo(indexToX(0), padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Line
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(indexToX(0), valueToY(this.data[0].value));
      for (let i = 1; i < this.data.length; i++) {
        ctx.lineTo(indexToX(i), valueToY(this.data[i].value));
      }
      ctx.stroke();
    }
    
    // Data points
    for (let i = 0; i < this.data.length; i++) {
      const x = indexToX(i);
      const y = valueToY(this.data[i].value);
      const isLast = i === this.data.length - 1;
      
      ctx.beginPath();
      ctx.arc(x, y, isLast ? 4 : 2, 0, Math.PI * 2);
      ctx.fillStyle = isLast ? '#22C55E' : '#9CA3AF';
      ctx.fill();
      
      if (isLast) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`$${Math.round(this.data[i].value).toLocaleString()}`, x, y - 10);
      }
    }
    
    // X-axis labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    if (this.data.length > 0) {
      const firstDay = this.data[0].day;
      const lastDay = this.data[this.data.length - 1].day;
      const midIndex = Math.floor(this.data.length / 2);
      
      ctx.fillText(`Day ${firstDay}`, indexToX(0), height - padding.bottom + 15);
      if (midIndex > 0 && midIndex < this.data.length - 1) {
        ctx.fillText(`Day ${this.data[midIndex].day}`, indexToX(midIndex), height - padding.bottom + 15);
      }
      ctx.fillText(`Day ${lastDay}`, indexToX(this.data.length - 1), height - padding.bottom + 15);
    }
    
    // P&L summary box
    if (this.data.length > 0) {
      const currentValue = this.data[this.data.length - 1].value;
      const totalPnL = currentValue - this.costBasis;
      const pnlPercent = (totalPnL / this.costBasis) * 100;
      const pnlColor = totalPnL >= 0 ? '#22C55E' : '#EF4444';
      
      const boxWidth = 100;
      const boxHeight = 24;
      const boxX = width - boxWidth - padding.right - 10;
      const boxY = 5;
      
      ctx.fillStyle = 'rgba(31, 41, 55, 0.9)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = pnlColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      ctx.fillStyle = pnlColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toFixed(0)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`,
        boxX + boxWidth / 2,
        boxY + 16
      );
    }
  }
  
  private renderEmptyState(): void {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No LEAPS value history', width / 2, height / 2);
  }
  
  destroy(): void {
    window.removeEventListener('resize', () => this.resize());
    this.canvas.remove();
  }
}
