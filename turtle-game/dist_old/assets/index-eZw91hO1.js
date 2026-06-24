(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function t(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(n){if(n.ep)return;n.ep=!0;const a=t(n);fetch(n.href,a)}})();const F={normal:{name:"Normal Market",initialPrice:590,initialVIX:15,volatility:.008,trend:2e-4,description:"Standard market conditions with moderate volatility"},bullish:{name:"Bull Run",initialPrice:590,initialVIX:12,volatility:.006,trend:.001,description:"Low volatility, steady upward trend"},bearish:{name:"Bear Market",initialPrice:590,initialVIX:25,volatility:.015,trend:-5e-4,description:"Higher volatility with declining prices"},choppy:{name:"Choppy Market",initialPrice:590,initialVIX:20,volatility:.012,trend:0,description:"High volatility with no clear direction"},crash:{name:"Market Crash",initialPrice:590,initialVIX:35,volatility:.025,trend:-.002,description:"Extreme volatility and declining prices"},deathSpiral:{name:"Death Spiral",initialPrice:590,initialVIX:28,volatility:.018,trend:-.001,description:"Slow grind down with periodic spikes"}};function E(){let s=0,e=0;for(;s===0;)s=Math.random();for(;e===0;)e=Math.random();return Math.sqrt(-2*Math.log(s))*Math.cos(2*Math.PI*e)}function V(s,e,t){const i=E(),n=t+e*i,a=s*(1+n);return Math.max(a,1)}function R(s,e){let t;if(e<0){const p=Math.abs(e);let h;p<.004?h=6:p<.01?h=8:h=10,t=p*h}else t=-Math.abs(e)*3;const a=(17-s)/s*.08,r=E()*.02,c=t+a+r,o=s*(1+c);return Math.max(10,Math.min(o,80))}function D(s,e){const i=V(s,e,0),n=e*.6,a=s*n*Math.abs(E()),l=i>s;let r,c;return l?(r=Math.max(s,i)+a*.5,c=Math.min(s,i)-a*.3):(r=Math.max(s,i)+a*.3,c=Math.min(s,i)-a*.5),{time:Date.now(),open:s,high:Math.max(r,s,i),low:Math.min(c,s,i),close:i,volume:Math.floor(1e8+Math.random()*5e7)}}function W(s){return F[s]||F.normal}function z(s,e=30){const t=[];let i=s.initialPrice;for(let n=0;n<e;n++){const a=D(i,s.volatility);t.push({...a,time:Date.now()-(e-n)*864e5}),i=a.close}return t}function N(s="normal"){const e=W(s),t=z(e,30);return{spyPrice:t[t.length-1].close,vix:e.initialVIX,day:0,candles:t,scenario:e}}function H(s){const e=V(s.spyPrice,s.scenario.volatility,s.scenario.trend),t=(e-s.spyPrice)/s.spyPrice,i=R(s.vix,t),n=D(s.spyPrice,s.scenario.volatility);return n.time=Date.now()+s.day*864e5,n.close=e,{spyPrice:e,vix:i,day:s.day+1,candles:[...s.candles.slice(-50),n],scenario:s.scenario}}function _(s,e,t){return t?Math.max(0,s-e)*100:Math.max(0,e-s)*100}function q(s){if(s<=90)return 450*Math.sqrt(s/7);{const t=450*Math.sqrt(12.857142857142858),n=(s-90)*21.91;return t+n}}function j(s,e,t){const n=Math.abs(s-e)/s;let a;const l=n*100;if(l<.1?a=1:l<.2?a=1-(l-.1)*.4:l<.35?a=.96-(l-.2)*.8:l<.5?a=.84-(l-.35)*1.2:a=Math.max(.3,.66-(l-.5)*.8),t<90)return a;if(t<300){const r=(t-90)/210,c=.15+(.7-.15)*r;return Math.max(a,c)}else return Math.max(a,.7)}function Y(s){return s>=7?1:s>=5?.9:s>=3?.75:s>=1?.6:s>0?.35:0}function X(s,e,t){const n=Math.pow(s/15,1.3),a=Math.min(n,5),r=(e/t-1)*100;if(r>=15)return 1+(a-1)*.05;if(r>=10){const o=.85+(r-10)/5*.1;return 1+(a-1)*(1-o)}else if(r>=5){const o=.6+(r-5)/5*.25;return 1+(a-1)*(1-o)}else if(r>=2){const o=.3+(r-2)/3*.3;return 1+(a-1)*(1-o)}return a}function G(s,e,t,i){const a=(s/e-1)*100;let l;return a>=20?l=.98+(Math.min(a,40)-20)/20*.01:a>=15?l=.95+(a-15)/5*.03:a>=10?l=.9+(a-10)/5*.05:a>=5?l=.8+(a-5)/5*.1:a>=2?l=.65+(a-2)/3*.15:a>=-2?l=.5+a/2*.15:a>=-5?l=.3+(a+5)/3*.05:a>=-10?l=.15+(a+10)/5*.15:l=.02+Math.max(0,(a+20)/10*.13),l=Math.max(.01,Math.min(.99,l)),i?l:-l}function U(s,e){if(e===0)return-s;let t;return e<=7?t=.14:e<=30?t=.05:t=.02,-s*t}function K(s,e){const t=(s-e)/s*100;return Math.abs(t)<=.5?"ATM":t>0?`${Math.abs(t).toFixed(1)}% ITM`:`${Math.abs(t).toFixed(1)}% OTM`}function P(s){const{stockPrice:e,strike:t,dte:i,vix:n,isCall:a}=s;if(!isFinite(e)||!isFinite(t)||!isFinite(i)||!isFinite(n))throw console.error("Invalid option pricing inputs:",s),new Error(`Invalid pricing inputs: stockPrice=${e}, strike=${t}, dte=${i}, vix=${n}`);const l=_(e,t,a),r=q(i),c=j(e,t,i),o=Y(i),p=X(n,e,t),h=r*c*o*p;if(!isFinite(h))throw console.error("NaN in extrinsic calculation:",{basePremium:r,moneynessMultiplier:c,timeMultiplier:o,volatilityMultiplier:p,params:s}),new Error("Extrinsic value calculation resulted in NaN");const u=l+h,f=G(e,t,i,a),x=U(h,i),d=(e-t)/e*100,m=K(e,t);return{intrinsic:Math.round(l),extrinsic:Math.round(h),total:Math.round(u),delta:Math.round(f*1e3)/1e3,theta:Math.round(x*100)/100,moneyness:Math.round(d*10)/10,moneynessLabel:m}}function Z(s){return s>=15?.95:s>=10?.9+(s-10)/5*.05:s>=5?.75+(s-5)/5*.15:s>=1?.6+(s-1)/4*.15:s>=0||s>=-1?.52+s*.08:s>=-5?.44+(s+1)/4*.14:Math.max(.1,.3+(s+5)/5*.2)}function B(s="normal"){const t=N(s);return{cash:25e3,initialCash:25e3,market:t,leaps:null,shortCall:null,realizedPnL:0,unrealizedPnL:0,weeklyPnL:0,totalTrades:0,winningTrades:0,leapsWeekStartValue:null,shortCallWeekStartValue:null,isPlaying:!1,gameSpeed:1,currentWeek:1,priceHistory:[t.spyPrice],pnlHistory:[0]}}function J(s,e){switch(e.type){case"START_GAME":return{...s,isPlaying:!0};case"PAUSE_GAME":return{...s,isPlaying:!1};case"SET_SPEED":return{...s,gameSpeed:e.payload};case"ADVANCE_DAY":{const t=H(s.market),i=Math.floor(t.day/7)+1,n=i!==s.currentWeek;let a=s.leapsWeekStartValue,l=s.shortCallWeekStartValue;n&&(s.leaps&&(a=s.leaps.currentValue),s.shortCall&&(l=s.shortCall.currentValue));let r=0,c=s.leaps,o=s.shortCall;if(s.leaps){const u=Math.max(0,s.leaps.dte-1),f=s.leaps.currentValue,d=(t.spyPrice-s.leaps.lastStockPrice)*s.leaps.delta*100,m=s.leaps.theta*1,v=f+d+m,g=Math.max(0,s.leaps.extrinsic+m),b=(t.spyPrice-s.leaps.strike)/t.spyPrice*100,$=Z(b),k=u>0?-g/u:0,S=v-f;r+=S,c={...s.leaps,dte:u,currentValue:v,delta:$,theta:k,premium:v,extrinsic:g,lastStockPrice:t.spyPrice},u<=0&&console.warn("LEAPS expired at DTE 0")}if(s.shortCall){const u=Math.max(0,s.shortCall.dte-1),f=s.shortCall.currentValue,x=P({stockPrice:t.spyPrice,strike:s.shortCall.strike,dte:u,vix:t.vix,isCall:!0});let d=x.total;u<=0&&(t.spyPrice>s.shortCall.strike?(d=Math.max(0,t.spyPrice-s.shortCall.strike)*100,console.warn("Short call expired ITM - assignment at intrinsic value")):(d=0,console.log("Short call expired OTM - full profit captured")));const m=f-d;r+=m,o={...s.shortCall,dte:u,currentValue:d,delta:u<=0?d>0?1:0:x.delta,theta:u<=0?0:x.theta}}const p=n?0:s.weeklyPnL+r,h=s.unrealizedPnL+r;return{...s,market:t,unrealizedPnL:h,weeklyPnL:p,currentWeek:i,priceHistory:[...s.priceHistory.slice(-100),t.spyPrice],pnlHistory:[...s.pnlHistory.slice(-100),h],leaps:c,shortCall:o,leapsWeekStartValue:a,shortCallWeekStartValue:l}}case"BUY_LEAPS":{const{strike:t,premium:i,delta:n,theta:a,dte:l}=e.payload,r=Math.max(0,s.market.spyPrice-t)*100,c=i-r,o={type:"leaps",quantity:1,costBasis:i,currentValue:i,strike:t,dte:l,delta:n,theta:a,premium:i,extrinsic:c,lastStockPrice:s.market.spyPrice};return{...s,cash:s.cash-i,leaps:o,leapsWeekStartValue:i,totalTrades:s.totalTrades+1}}case"SELL_SHORT_CALL":{const{strike:t,premium:i,dte:n}=e.payload,a={type:"short-call",quantity:-1,costBasis:-i,currentValue:i,strike:t,dte:n,premium:i};return{...s,cash:s.cash+i,shortCall:a,shortCallWeekStartValue:i,totalTrades:s.totalTrades+1}}case"CLOSE_LEAPS":{if(!s.leaps)return s;const t=s.leaps.currentValue-s.leaps.costBasis,i=t>0;return{...s,cash:s.cash+s.leaps.currentValue,leaps:null,leapsWeekStartValue:null,realizedPnL:s.realizedPnL+t,unrealizedPnL:s.unrealizedPnL-(s.leaps.currentValue-s.leaps.costBasis),winningTrades:i?s.winningTrades+1:s.winningTrades}}case"BUY_BACK_CALL":{if(!s.shortCall)return s;const t=s.shortCall.costBasis+s.shortCall.premium-e.payload.cost,i=t>0;return{...s,cash:s.cash-e.payload.cost,shortCall:null,shortCallWeekStartValue:null,realizedPnL:s.realizedPnL+t,winningTrades:i?s.winningTrades+1:s.winningTrades}}case"ROLL_LEAPS":{if(!s.leaps)return s;const{newStrike:t,newPremium:i,newDelta:n,newTheta:a,newDte:l,cost:r}=e.payload,c=s.leaps.currentValue-s.leaps.costBasis,o=Math.max(0,s.market.spyPrice-t)*100,p=i-o,h={type:"leaps",quantity:1,costBasis:i,currentValue:i,strike:t,dte:l,delta:n,theta:a,premium:i,extrinsic:p,lastStockPrice:s.market.spyPrice};return{...s,cash:s.cash+s.leaps.currentValue-r,leaps:h,leapsWeekStartValue:i,realizedPnL:s.realizedPnL+c,totalTrades:s.totalTrades+1}}case"ROLL_SHORT_CALL":{if(!s.shortCall)return s;const{newStrike:t,newPremium:i,newDte:n,cost:a}=e.payload,l=s.shortCall.costBasis+s.shortCall.premium,r={type:"short-call",quantity:-1,costBasis:-i,currentValue:i,strike:t,dte:n,premium:i};return{...s,cash:s.cash-a+i,shortCall:r,shortCallWeekStartValue:i,realizedPnL:s.realizedPnL+l,totalTrades:s.totalTrades+1}}case"RESET_GAME":return B(e.payload);default:return s}}class Q{state;listeners=new Set;intervalId=null;intervalMs=1e3;constructor(e="normal"){this.state=B(e)}getState(){return this.state}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notify(){this.listeners.forEach(e=>e(this.state))}dispatch(e){this.state=J(this.state,e),this.notify(),e.type==="START_GAME"?this.startAutoAdvance():e.type==="PAUSE_GAME"?this.stopAutoAdvance():e.type==="SET_SPEED"&&this.state.isPlaying&&(this.stopAutoAdvance(),this.startAutoAdvance())}setInterval(e){this.intervalMs=e,this.state.isPlaying&&(this.stopAutoAdvance(),this.startAutoAdvance())}startAutoAdvance(){this.stopAutoAdvance(),this.intervalId=window.setInterval(()=>{this.dispatch({type:"ADVANCE_DAY"})},this.intervalMs)}stopAutoAdvance(){this.intervalId!==null&&(clearInterval(this.intervalId),this.intervalId=null)}start(){this.dispatch({type:"START_GAME"})}pause(){this.dispatch({type:"PAUSE_GAME"})}setSpeed(e){this.dispatch({type:"SET_SPEED",payload:e})}reset(e="normal"){this.dispatch({type:"RESET_GAME",payload:e})}advanceDay(){this.dispatch({type:"ADVANCE_DAY"})}}function A(s,e,t){return P({stockPrice:e,strike:s.strike,dte:Math.max(0,s.dte),vix:t,isCall:!0}).total}function I(s,e,t){return P({stockPrice:e,strike:s.strike,dte:Math.max(0,s.dte),vix:t,isCall:!0}).total}function O(s,e,t){const i=A(s,e,t);return{unrealizedPnL:i-s.costBasis,currentValue:i}}function M(s,e,t){const i=I(s,e,t);return{unrealizedPnL:s.premium-i,currentValue:i}}function ee(s,e){return e>s.strike}function te(s){const{cash:e,leaps:t,shortCall:i,realizedPnL:n,unrealizedPnL:a,weeklyPnL:l,initialCash:r,market:c}=s;let o=0,p=0,h=0,u=0;t&&(o=A(t,c.spyPrice,c.vix),p=o-t.costBasis),i&&(h=I(i,c.spyPrice,c.vix),u=i.premium-h);const f=e+o-h,x=f-r,d=x/r*100,m=l/r*100;let v=0,g=0;return t&&(v+=t.delta*100,g+=t.theta),i&&(v+=(i.delta||0)*-100,g+=(i.theta||0)*-1),{totalAccountValue:f,totalPnL:x,totalPnLPercent:d,realizedPnL:n,unrealizedPnL:a,leapsPnL:p,shortCallPnL:u,weeklyPnL:l,weeklyPnLPercent:m,portfolioDelta:v,portfolioTheta:g}}function se(s){const{leaps:e,shortCall:t,initialCash:i,market:n}=s;let a=0;return e&&(a+=A(e,n.spyPrice,n.vix)),t&&(a-=t.premium),a/i*100}function ie(s,e){let t;return e<20?t=50:e<30?t=70:e<40?t=80:t=85,s>80?{isSafe:!1,warning:"⚠️ OVERLEVERAGED! Close positions immediately!",maxAllowed:t}:s>t?{isSafe:!1,warning:`⚠️ High deployment! Max recommended: ${t}%`,maxAllowed:t}:{isSafe:!0,warning:null,maxAllowed:t}}function y(s){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(s)}function ae(s){return`${s>=0?"+":""}${s.toFixed(2)}%`}function C(s){return s>0?"text-green-500":s<0?"text-red-500":"text-gray-400"}class ne{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e}=this.props,t=te(e),i=se(e),n=ie(i,e.market.vix);this.container.innerHTML=`
      <div class="card mb-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Logo/Title -->
          <div class="flex items-center gap-3">
            <div class="text-3xl">🐢</div>
            <div>
              <h1 class="text-xl font-bold text-matrix-green">Turtle Trading Game</h1>
              <p class="text-xs text-gray-500">Poor Man's Covered Call Simulator</p>
            </div>
          </div>
          
          <!-- Account Value -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Net Account Value</div>
            <div class="text-2xl font-bold font-mono">${y(t.totalAccountValue)}</div>
          </div>
          
          <!-- Total P&L -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Total P&L</div>
            <div class="text-2xl font-bold font-mono ${C(t.totalPnL)}">
              ${t.totalPnL>=0?"+":""}${y(t.totalPnL)}
              <span class="text-sm">(${ae(t.totalPnLPercent)})</span>
            </div>
          </div>
          
          <!-- Weekly P&L -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Weekly P&L</div>
            <div class="text-xl font-bold font-mono ${C(t.weeklyPnL)}">
              ${t.weeklyPnL>=0?"+":""}${y(t.weeklyPnL)}
            </div>
          </div>
          
          <!-- Capital Deployment -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Capital Deployed</div>
            <div class="text-xl font-bold font-mono ${n.isSafe?"text-blue-400":"text-red-400 animate-pulse"}">
              ${i.toFixed(1)}%
            </div>
            ${n.warning?`
              <div class="text-xs text-red-400 font-bold">${n.warning}</div>
            `:`
              <div class="text-xs text-gray-500">Max: ${n.maxAllowed}%</div>
            `}
          </div>
        </div>
        
        <!-- Portfolio Greeks -->
        <div class="mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-xs text-gray-500">Portfolio Delta</div>
            <div class="text-lg font-mono ${t.portfolioDelta>0?"text-green-400":"text-red-400"}">
              ${t.portfolioDelta>0?"+":""}${t.portfolioDelta.toFixed(0)}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Portfolio Theta</div>
            <div class="text-lg font-mono ${t.portfolioTheta>0?"text-green-400":"text-red-400"}">
              ${t.portfolioTheta>0?"+":""}${y(t.portfolioTheta)}/day
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Cash Available</div>
            <div class="text-lg font-mono text-blue-400">${y(e.cash)}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Realized P&L</div>
            <div class="text-lg font-mono ${C(e.realizedPnL)}">
              ${e.realizedPnL>=0?"+":""}${y(e.realizedPnL)}
            </div>
          </div>
        </div>
      </div>
    `}}class le{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e,gameMode:t,onStart:i,onPause:n,onModeChange:a,onReset:l,onScenarioChange:r}=this.props,{isPlaying:c,market:o,currentWeek:p}=e,h=o.day%5,f=["Mon","Tue","Wed","Thu","Fri"][h],x=h===4;this.container.innerHTML=`
      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Play Controls -->
          <div class="flex items-center gap-2">
            ${c?`
              <button id="pause-btn" class="btn-warning flex items-center gap-2">
                <span>⏸</span> Pause
              </button>
            `:`
              <button id="start-btn" class="btn-primary flex items-center gap-2">
                <span>▶</span> Start
              </button>
            `}
            
            <button id="reset-btn" class="btn-secondary text-sm">
              ↺ Reset
            </button>
          </div>
          
          <!-- Mode Selection -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Mode:</span>
            <div class="flex bg-gray-800 rounded-lg p-1">
              <button class="mode-btn px-4 py-2 rounded text-sm font-medium transition-colors ${t==="slow"?"bg-blue-600 text-white":"text-gray-400 hover:text-white"}"
                      data-mode="slow">
                🐢 Slow
              </button>
              <button class="mode-btn px-4 py-2 rounded text-sm font-medium transition-colors ${t==="1x"?"bg-blue-600 text-white":"text-gray-400 hover:text-white"}"
                      data-mode="1x">
                ⚡ 1x
              </button>
              <button class="mode-btn px-4 py-2 rounded text-sm font-medium transition-colors ${t==="auto"?"bg-green-600 text-white":"text-gray-400 hover:text-white"}"
                      data-mode="auto">
                🤖 Auto
              </button>
            </div>
          </div>
          
          <!-- Day Counter -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Day ${o.day+1}</div>
            <div class="text-lg font-bold ${x?"text-yellow-400 animate-pulse":"text-matrix-green"}">
              ${f}
              ${x?" 🎉":""}
            </div>
            <div class="text-xs text-gray-500">Week ${p}</div>
          </div>
          
          <!-- Scenario Selector -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Scenario:</span>
            <select id="scenario-select" class="bg-gray-800 text-white text-sm rounded px-3 py-2 border border-gray-700">
              <option value="normal" ${o.scenario.name==="Normal Market"?"selected":""}>Normal Market</option>
              <option value="bullish" ${o.scenario.name==="Bull Run"?"selected":""}>Bull Run</option>
              <option value="bearish" ${o.scenario.name==="Bear Market"?"selected":""}>Bear Market</option>
              <option value="choppy" ${o.scenario.name==="Choppy Market"?"selected":""}>Choppy Market</option>
              <option value="crash" ${o.scenario.name==="Market Crash"?"selected":""}>Market Crash</option>
            </select>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Week Progress (Trading Days)</span>
            <span>${h+1}/5 days</span>
          </div>
          <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 ${x?"to-yellow-400":"to-matrix-green"} transition-all duration-300"
                 style="width: ${(h+1)/5*100}%"></div>
          </div>
        </div>
        
        <!-- Market Info -->
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div class="flex justify-between bg-gray-800/50 p-2 rounded">
            <span class="text-gray-400">SPY Price:</span>
            <span class="font-mono font-bold">$${o.spyPrice.toFixed(2)}</span>
          </div>
          <div class="flex justify-between bg-gray-800/50 p-2 rounded">
            <span class="text-gray-400">VIX:</span>
            <span class="font-mono font-bold ${this.getVIXColorClass(o.vix)}">${o.vix.toFixed(2)}</span>
          </div>
        </div>
        
        <!-- Auto Mode Rules Display -->
        ${t==="auto"?`
          <div class="mt-4 p-3 bg-green-900/20 border border-green-700 rounded">
            <div class="text-xs text-green-400 font-bold mb-1">🤖 Auto Mode Active</div>
            <div class="text-xs text-gray-400">
              ${this.getAutoModeRule(o.vix)}
            </div>
          </div>
        `:""}
      </div>
    `,this.attachEventListeners(i,n,a,l,r)}attachEventListeners(e,t,i,n,a){const l=this.container.querySelector("#start-btn"),r=this.container.querySelector("#pause-btn"),c=this.container.querySelector("#reset-btn"),o=this.container.querySelectorAll(".mode-btn"),p=this.container.querySelector("#scenario-select");l&&l.addEventListener("click",e),r&&r.addEventListener("click",t),c&&c.addEventListener("click",n),o.forEach(h=>{h.addEventListener("click",()=>{const u=h.getAttribute("data-mode");i(u)})}),p&&p.addEventListener("change",()=>{a(p.value)})}getVIXColorClass(e){return e<20?"text-green-400":e<30?"text-yellow-400":"text-red-400"}getAutoModeRule(e){return e<20?"VIX < 20: Selling $3 OTM calls":e<30?"VIX 20-30: Selling ATM calls":e<40?"VIX 30-40: Selling $2 ITM calls":"VIX 40+: STOPPED - Too volatile"}}class re{container;canvas;ctx;candles=[];width=0;height=0;padding={top:20,right:50,bottom:30,left:10};constructor(e){this.container=e,this.canvas=document.createElement("canvas"),this.canvas.className="w-full h-full",this.container.appendChild(this.canvas);const t=this.canvas.getContext("2d");if(!t)throw new Error("Could not get canvas context");this.ctx=t,this.resize(),window.addEventListener("resize",()=>this.resize())}resize(){const e=this.container.getBoundingClientRect();this.width=e.width,this.height=e.height;const t=window.devicePixelRatio||1;this.canvas.width=this.width*t,this.canvas.height=this.height*t,this.canvas.style.width=`${this.width}px`,this.canvas.style.height=`${this.height}px`,this.ctx.scale(t,t),this.render()}updateCandles(e){this.candles=e,this.render()}render(){if(this.candles.length===0)return;const{ctx:e,width:t,height:i,padding:n}=this;e.clearRect(0,0,t,i);let a=1/0,l=-1/0;for(const x of this.candles)a=Math.min(a,x.low),l=Math.max(l,x.high);const r=l-a;a-=r*.05,l+=r*.05;const c=t-n.left-n.right,o=i-n.top-n.bottom,p=x=>n.top+o-(x-a)/(l-a)*o,h=x=>{const d=c/this.candles.length;return n.left+x*d+d/2};e.strokeStyle="#374151",e.lineWidth=1,e.setLineDash([2,2]);const u=(l-a)/5;e.fillStyle="#9CA3AF",e.font="10px sans-serif",e.textAlign="right";for(let x=0;x<=5;x++){const d=a+u*x,m=p(d);e.beginPath(),e.moveTo(n.left,m),e.lineTo(t-n.right,m),e.stroke(),e.fillText(d.toFixed(2),t-5,m+3)}e.setLineDash([]);const f=c/this.candles.length*.7;for(let x=0;x<this.candles.length;x++){const d=this.candles[x],m=h(x),v=d.close>=d.open,g=d.isHistorical===!0;let b;g?b=v?"#9CA3AF":"#6B7280":b=v?"#22C55E":"#EF4444";const $=p(d.open),k=p(d.close),S=p(d.high),w=p(d.low);e.strokeStyle=b,e.lineWidth=1,e.beginPath(),e.moveTo(m,S),e.lineTo(m,w),e.stroke();const L=Math.min($,k),T=Math.max(Math.abs($-k),1);v&&!g?(e.strokeStyle=b,e.lineWidth=1.5,e.strokeRect(m-f/2,L,f,T)):(e.fillStyle=b,e.fillRect(m-f/2,L,f,T))}if(this.candles.length>0){const x=this.candles[this.candles.length-1],d=p(x.close);e.strokeStyle="#3B82F6",e.lineWidth=2,e.setLineDash([5,5]),e.beginPath(),e.moveTo(n.left,d),e.lineTo(t-n.right,d),e.stroke(),e.setLineDash([]),e.fillStyle="#3B82F6",e.font="bold 11px sans-serif",e.textAlign="left",e.fillText(x.close.toFixed(2),t-n.right+5,d+3)}}destroy(){window.removeEventListener("resize",()=>this.resize()),this.canvas.remove()}}class oe{container;props;strikes=[];currentMode="weekly";sortOrder="asc";constructor(e,t){this.container=e,this.props=t,this.currentMode=t.mode||"weekly",this.render()}update(e){this.props=e,e.mode&&(this.currentMode=e.mode),this.render()}setMode(e){this.currentMode=e,this.render()}generateStrikes(){const{stockPrice:e}=this.props;if(this.currentMode==="leaps"){this.strikes=[];const i=Math.round(e/5)*5,n=Math.round(e*.7/5)*5;for(let a=n;a<=i;a+=5)this.strikes.push(a)}else{const n=Math.round(e/1)*1;this.strikes=[];for(let a=-10;a<=10;a++)this.strikes.push(n+a*1)}}calculateBidAsk(e){const t=.05+this.props.vix/100*.1,i=e.total*t;return{bid:Math.max(0,e.total-i/2),ask:e.total+i/2}}render(){this.generateStrikes();const{stockPrice:e,vix:t,selectedStrike:i}=this.props,n=Math.round(e/5)*5,a=this.currentMode==="leaps"?365:7,l=this.currentMode==="leaps",r=this.strikes.map(o=>{const p=P({stockPrice:e,strike:o,dte:a,vix:t,isCall:!0}),{bid:h,ask:u}=this.calculateBidAsk(p),f=Math.abs(o-n)<2.5,x=o<e,d=o>e,m=e-o;return{strike:o,bid:h,ask:u,price:p,isATM:f,isITM:x,isOTM:d,itmAmount:m}}),c=this.sortOrder==="asc"?r.sort((o,p)=>o.strike-p.strike):r.sort((o,p)=>p.strike-o.strike);this.container.innerHTML=`
      <div class="h-full flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold text-matrix-green">Options Chain</h3>
          <div class="text-sm">
            <span class="text-gray-400">VIX:</span>
            <span class="font-bold ${this.getVIXColorClass(t)}">${t.toFixed(2)}</span>
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="flex bg-gray-800 rounded p-1 mb-3">
          <button id="mode-weekly" class="flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${l?"text-gray-400 hover:text-white":"bg-matrix-green text-black"}">
            Weekly (7 DTE)
          </button>
          <button id="mode-leaps" class="flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${l?"bg-matrix-green text-black":"text-gray-400 hover:text-white"}">
            LEAPS (365 DTE)
          </button>
        </div>

        <div class="text-xs text-center text-gray-400 mb-2">
          ${l?`SPY: <span class="font-bold text-white">$${e.toFixed(2)}</span><span class="ml-2 text-gray-500">|</span><span class="ml-2 text-blue-400">365 DTE</span><span class="ml-2 text-gray-500">|</span><span class="ml-2 text-green-400">80-100 Delta</span>`:`SPY: <span class="font-bold text-white">$${e.toFixed(2)}</span><span class="ml-2 text-gray-500">|</span><span class="ml-2 text-green-400">▼ ITM</span><span class="ml-2 text-yellow-400">ATM</span><span class="ml-2 text-red-400">OTM ▲</span>`}
        </div>

        <div class="flex-1 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-900">
              <tr class="text-gray-400 border-b border-gray-700">
                <th class="text-left py-2 px-2">Bid</th>
                <th class="text-left py-2 px-2">Ask</th>
                <th class="text-center py-2 px-2">
                  <button id="sort-toggle" class="hover:text-white transition-colors cursor-pointer">
                    Strike ${this.sortOrder==="asc"?"↑":"↓"}
                  </button>
                </th>
                ${l?'<th class="text-right py-2 px-2">ITM $</th>':""}
                <th class="text-right py-2 px-2">Delta</th>
              </tr>
            </thead>
            <tbody>
              ${c.map(({strike:o,bid:p,ask:h,price:u,isATM:f,isITM:x,isOTM:d,itmAmount:m})=>{const g=o===i?"bg-blue-900/30 border-l-4 border-blue-500":f&&!l?"bg-yellow-900/20 border-l-4 border-yellow-500":l&&u.delta>=.8&&u.delta<=.95?"bg-green-900/20 border-l-4 border-green-500":"hover:bg-gray-800";let b="",$="";l?(b=`$${o}`,$=u.delta>=.8?"text-green-400 font-bold":"text-gray-400"):x?(b=`▼ ${o}`,$="text-green-400 font-bold"):f?(b=`◆ ${o}`,$="text-yellow-400 font-bold"):(b=`▲ ${o}`,$="text-red-400 font-bold");const k=Math.round(u.delta*100);return`
                  <tr class="cursor-pointer transition-colors ${g} border-b border-gray-800"
                      data-strike="${o}">
                    <td class="py-2 px-2 text-green-400">${this.formatPrice(p)}</td>
                    <td class="py-2 px-2 text-red-400">${this.formatPrice(h)}</td>
                    <td class="py-2 px-2 text-center ${$}">${b}</td>
                    ${l?`<td class="py-2 px-2 text-right text-green-400">+$${m.toFixed(0)}</td>`:""}
                    <td class="py-2 px-2 text-right ${k>=80?"text-green-400 font-bold":"text-gray-400"}">${k}</td>
                  </tr>
                `}).join("")}
            </tbody>
          </table>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          ${l?`<div class="flex justify-between">
                <span><span class="text-green-400 font-bold">80-95 Delta</span> = Recommended LEAPS</span>
                <span><span class="text-gray-400">365 DTE</span> = 1 Year Expiration</span>
              </div>`:`<div class="flex justify-between">
                <span><span class="text-green-400 font-bold">▼ ITM</span> = In The Money</span>
                <span><span class="text-yellow-400 font-bold">◆ ATM</span> = At The Money</span>
                <span><span class="text-red-400 font-bold">OTM ▲</span> = Out of The Money</span>
              </div>`}
        </div>
      </div>
   `,this.attachEventListeners()}attachEventListeners(){const e=this.container.querySelectorAll("tbody tr"),t=this.currentMode==="leaps"?365:7;e.forEach(l=>{l.addEventListener("click",()=>{const r=parseFloat(l.getAttribute("data-strike")||"0"),c=P({stockPrice:this.props.stockPrice,strike:r,dte:t,vix:this.props.vix,isCall:!0});this.props.onSelectStrike(r,c)})});const i=this.container.querySelector("#sort-toggle");i&&i.addEventListener("click",l=>{l.stopPropagation(),this.sortOrder=this.sortOrder==="asc"?"desc":"asc",this.render()});const n=this.container.querySelector("#mode-weekly"),a=this.container.querySelector("#mode-leaps");n&&n.addEventListener("click",()=>{this.currentMode="weekly",this.props.onModeChange&&this.props.onModeChange("weekly"),this.render()}),a&&a.addEventListener("click",()=>{this.currentMode="leaps",this.props.onModeChange&&this.props.onModeChange("leaps"),this.render()})}formatPrice(e){return e<100?`$${e.toFixed(2)}`:`$${Math.round(e).toLocaleString()}`}getVIXColorClass(e){return e<15?"text-green-400":e<25?"text-yellow-400":"text-red-400"}}class ce{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e,onBuyLEAPS:t,onRollLEAPS:i,onCloseLEAPS:n}=this.props,{leaps:a,market:l}=e;if(!a){this.renderEmptyState(t);return}const{unrealizedPnL:r,currentValue:c}=O(a,l.spyPrice,l.vix),o=P({stockPrice:l.spyPrice,strike:a.strike,dte:a.dte,vix:l.vix,isCall:!0}),p=o.delta<.72;this.container.innerHTML=`
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-matrix-green">LEAPS</h3>
          <span class="px-2 py-1 rounded text-xs font-bold ${p?"bg-red-900 text-red-200":"bg-green-900/50 text-green-300"}">
            ${p?"ROLL SOON":"HEALTHY"}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Strike:</span>
            <span class="font-bold">$${a.strike}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Delta:</span>
            <span class="font-bold ${o.delta<.7?"text-red-400":"text-blue-400"}">
              ${(o.delta*100).toFixed(1)}%
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Theta:</span>
            <span class="font-bold text-red-400">${y(o.theta)}/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Value:</span>
            <span class="font-bold">${y(c)}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-700">
            <span class="text-gray-400 font-bold">P&L:</span>
            <span class="font-bold ${C(r)}">
              ${r>=0?"+":""}${y(r)}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mt-4">
          <button id="roll-leaps-btn" class="btn-secondary text-sm py-2">
            Roll
          </button>
          <button id="close-leaps-btn" class="btn-danger text-sm py-2">
            Sell to Close
          </button>
        </div>
      </div>
    `,this.attachEventListeners(i,n)}renderEmptyState(e){this.container.innerHTML=`
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50 text-center">
        <h3 class="text-xl font-bold text-gray-400 mb-2">LEAPS</h3>
        <p class="text-sm text-gray-500 mb-3">No position</p>
        <button id="buy-leaps-btn" class="btn-primary w-full">
          Buy LEAPS
        </button>
      </div>
    `;const t=this.container.querySelector("#buy-leaps-btn");t&&t.addEventListener("click",e)}attachEventListeners(e,t){const i=this.container.querySelector("#roll-leaps-btn"),n=this.container.querySelector("#close-leaps-btn");i&&i.addEventListener("click",e),n&&n.addEventListener("click",t)}}class de{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e,onSellCall:t,onRollCall:i,onBuyBackCall:n}=this.props,{shortCall:a,market:l}=e;if(!a){this.renderEmptyState(t,l.vix);return}const{unrealizedPnL:r,currentValue:c}=M(a,l.spyPrice,l.vix),o=ee(a,l.spyPrice),p=o&&a.dte<=1,h=a.strike+a.premium/100;this.container.innerHTML=`
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-orange-400">SHORT</h3>
          <span class="px-2 py-1 rounded text-xs font-bold ${p?"bg-red-900 text-red-200 animate-pulse":o?"bg-orange-900/50 text-orange-300":"bg-green-900/50 text-green-300"}">
            ${p?"ASSIGNMENT RISK":o?"ITM":"OTM"}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Strike:</span>
            <span class="font-bold">$${a.strike}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Breakeven:</span>
            <span class="font-bold">$${h.toFixed(2)} (${l.spyPrice>h?"-$"+(l.spyPrice-h).toFixed(2):"+$"+(h-l.spyPrice).toFixed(2)})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Delta:</span>
            <span class="font-bold">${a.delta?(a.delta*100).toFixed(0):"-"}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Theta:</span>
            <span class="font-bold text-green-400">${a.theta?"+"+y(Math.abs(a.theta)):"-"}/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Value:</span>
            <span class="font-bold">${y(c)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Time to expiry:</span>
            <span class="font-bold ${a.dte<=2?"text-red-400":""}">
              ${a.dte} days
            </span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-700">
            <div class="flex items-center gap-1">
              <span class="text-gray-400 font-bold">P&L:</span>
              <button id="pnl-help-btn" class="text-blue-400 hover:text-blue-300 text-xs font-bold w-5 h-5 rounded-full border border-blue-400 flex items-center justify-center">?</button>
            </div>
            <span class="font-bold ${C(r)}">
              ${r>=0?"+":""}${y(r)}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mt-4">
          <button id="roll-call-btn" class="btn-secondary text-sm py-2">
            Roll
          </button>
          <button id="buyback-btn" class="${p?"btn-danger":"btn-warning"} text-sm py-2">
            Buy to Close
          </button>
        </div>
      </div>
    `,this.attachEventListeners(i,n)}renderEmptyState(e,t){let i;t<20?i="Sell ATM call for maximum premium":t<30?i="Sell $5 ITM for protection":i="Sell $10 ITM or wait for lower VIX",this.container.innerHTML=`
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50 text-center">
        <h3 class="text-xl font-bold text-gray-400 mb-2">SHORT</h3>
        <p class="text-sm text-gray-500 mb-2">No position</p>
        <div class="text-xs text-gray-400 mb-3">
          Current VIX: <span class="font-bold ${this.getVIXColorClass(t)}">${t.toFixed(1)}</span>
        </div>
        <p class="text-xs text-orange-300 mb-3">${i}</p>
        <button id="sell-call-btn" class="btn-primary w-full">
          Sell Call
        </button>
      </div>
    `;const n=this.container.querySelector("#sell-call-btn");n&&n.addEventListener("click",e)}attachEventListeners(e,t){const i=this.container.querySelector("#roll-call-btn"),n=this.container.querySelector("#buyback-btn"),a=this.container.querySelector("#pnl-help-btn");i&&i.addEventListener("click",e),n&&n.addEventListener("click",t),a&&a.addEventListener("click",l=>{l.stopPropagation(),this.showPnLExplanation()})}showPnLExplanation(){const{shortCall:e,market:t}=this.props.state;if(!e)return;const{unrealizedPnL:i,currentValue:n}=M(e,t.spyPrice,t.vix),a=e.strike,l=e.premium/100,r=a+l,c=t.spyPrice,o=Math.max(0,c-a),p=`
      <div id="pnl-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
        <div class="bg-gray-900 border-2 border-blue-500 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-blue-400">Short Call P&L Explained</h3>
            <button id="close-modal-btn" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          <div class="space-y-4">
            <!-- Current Position Info -->
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-sm font-bold text-orange-400 mb-2">Your Position:</div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-gray-400">Strike:</span> <span class="font-bold">$${a}</span></div>
                <div><span class="text-gray-400">Premium Collected:</span> <span class="font-bold text-green-400">$${e.premium.toFixed(0)} ($${l.toFixed(2)}/share)</span></div>
                <div><span class="text-gray-400">Current Price:</span> <span class="font-bold">$${c.toFixed(2)}</span></div>
                <div><span class="text-gray-400">Current P&L:</span> <span class="font-bold ${C(i)}">${i>=0?"+":""}$${i.toFixed(0)}</span></div>
              </div>
            </div>

            <!-- Visual Diagram -->
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-sm font-bold text-blue-400 mb-3">Payoff Diagram:</div>
              <div class="relative h-48 bg-gray-900 rounded border border-gray-700 p-4">
                <!-- Y-axis (P&L) -->
                <div class="absolute left-2 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                  <div>+$${e.premium.toFixed(0)}</div>
                  <div class="text-gray-400 font-bold">$0</div>
                  <div>-$${(o*100).toFixed(0)}</div>
                </div>

                <!-- Graph area -->
                <svg class="w-full h-full" viewBox="0 0 400 160" style="margin-left: 30px;">
                  <!-- Breakeven line -->
                  <line x1="200" y1="0" x2="200" y2="160" stroke="#666" stroke-width="1" stroke-dasharray="2,2" />
                  <text x="200" y="155" fill="#888" font-size="10" text-anchor="middle">Breakeven: $${r.toFixed(2)}</text>

                  <!-- Max profit zone (OTM) -->
                  <rect x="0" y="20" width="200" height="8" fill="#22c55e" opacity="0.3" />
                  <text x="100" y="15" fill="#22c55e" font-size="10" text-anchor="middle">Max Profit Zone</text>
                  <line x1="0" y1="24" x2="200" y2="24" stroke="#22c55e" stroke-width="3" />

                  <!-- Buffer zone (strike to breakeven) -->
                  <rect x="180" y="20" width="40" height="50" fill="#eab308" opacity="0.2" />
                  <text x="200" y="50" fill="#eab308" font-size="9" text-anchor="middle">Premium</text>
                  <text x="200" y="60" fill="#eab308" font-size="9" text-anchor="middle">Buffer</text>
                  <line x1="200" y1="24" x2="220" y2="70" stroke="#eab308" stroke-width="3" />

                  <!-- Loss zone (ITM beyond breakeven) -->
                  <rect x="220" y="70" width="180" height="60" fill="#ef4444" opacity="0.2" />
                  <text x="310" y="95" fill="#ef4444" font-size="10" text-anchor="middle">Loss Zone</text>
                  <text x="310" y="107" fill="#ef4444" font-size="9" text-anchor="middle">-$100 per $1 move</text>
                  <line x1="220" y1="70" x2="400" y2="130" stroke="#ef4444" stroke-width="3" />

                  <!-- Current price marker -->
                  ${c>r?`
                    <circle cx="${Math.min(220+(c-r)*50,380)}" cy="${Math.min(70+(c-r)*50*.6,125)}" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${Math.min(220+(c-r)*50,380)}" y="${Math.min(70+(c-r)*50*.6-10,115)}" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  `:c>=a?`
                    <circle cx="${180+(c-a)/l*40}" cy="${24+(c-a)/l*46}" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${180+(c-a)/l*40}" y="${24+(c-a)/l*46-10}" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  `:`
                    <circle cx="${Math.max(10,Math.min(180,c/a*180))}" cy="24" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${Math.max(10,Math.min(180,c/a*180))}" y="15" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  `}

                  <!-- X-axis labels -->
                  <text x="0" y="145" fill="#888" font-size="10">$${(a-10).toFixed(0)}</text>
                  <text x="180" y="145" fill="#888" font-size="10">Strike: $${a}</text>
                  <text x="370" y="145" fill="#888" font-size="10" text-anchor="end">$${(r+5).toFixed(0)}+</text>
                </svg>
              </div>
            </div>

            <!-- Explanation -->
            <div class="bg-blue-900/20 border border-blue-700 p-4 rounded-lg text-sm">
              <div class="font-bold text-blue-400 mb-2">How It Works:</div>
              <div class="space-y-2 text-gray-300">
                <p><span class="text-green-400 font-bold">1. Premium Buffer:</span> You collected $${e.premium.toFixed(0)} upfront. This is your profit cushion!</p>
                <p><span class="text-yellow-400 font-bold">2. Breakeven Point:</span> Strike ($${a}) + Premium ($${l.toFixed(2)}) = $${r.toFixed(2)}</p>
                <p><span class="text-red-400 font-bold">3. Beyond Breakeven:</span> For every $1 the stock moves above $${r.toFixed(2)}, you lose $100 (because 1 contract = 100 shares).</p>
                ${c>r?`
                  <div class="mt-3 p-2 bg-red-900/30 rounded">
                    <p class="font-bold text-red-300">Current Calculation:</p>
                    <p class="text-xs font-mono">ITM Amount: $${c.toFixed(2)} - $${a} = $${o.toFixed(2)}</p>
                    <p class="text-xs font-mono">Option Value: $${o.toFixed(2)} × 100 = $${(o*100).toFixed(0)}</p>
                    <p class="text-xs font-mono">Your P&L: $${e.premium.toFixed(0)} (premium) - $${n.toFixed(0)} (current value) = ${i>=0?"+":""}$${i.toFixed(0)}</p>
                  </div>
                `:`
                  <div class="mt-3 p-2 bg-green-900/30 rounded">
                    <p class="font-bold text-green-300">You're in the profit zone!</p>
                    <p class="text-xs">The option is ${c>=a?"slightly ITM but still within your premium buffer":"out of the money, losing value due to time decay"}.</p>
                  </div>
                `}
              </div>
            </div>

            <button id="got-it-btn" class="btn-primary w-full py-3">
              Got it! 👍
            </button>
          </div>
        </div>
      </div>
    `,h=document.createElement("div");h.innerHTML=p,document.body.appendChild(h);const u=h.querySelector("#close-modal-btn"),f=h.querySelector("#got-it-btn"),x=h.querySelector("#pnl-modal"),d=()=>{h.remove()};u&&u.addEventListener("click",d),f&&f.addEventListener("click",d),x&&x.addEventListener("click",m=>{m.target===x&&d()})}getVIXColorClass(e){return e<15?"text-green-400":e<25?"text-yellow-400":"text-red-400"}}class pe{container;store;unsubscribe=null;gameMode="1x";isFridaySplashOpen=!1;lastSplashWeek=-1;optionsChainMode="weekly";accountHeader=null;gameControls=null;candlestickChart=null;optionsChain=null;leapsPanel=null;shortCallPanel=null;headerEl;controlsEl;chartEl;chainEl;splashEl=null;constructor(e){this.container=e,this.store=new Q("normal"),this.createLayout(),this.initializeComponents(),this.unsubscribe=this.store.subscribe(t=>{this.handleStateUpdate(t)}),this.handleStateUpdate(this.store.getState())}createLayout(){this.container.innerHTML=`
      <div class="min-h-screen bg-game-bg px-6 py-4">
        <!-- Simplified Header -->
        <div class="flex justify-between items-center mb-4">
          <div id="game-header" class="flex-grow"></div>
          <button
            id="open-montecarlo-btn"
            class="btn btn-primary ml-4"
          >
            📊 Monte Carlo Simulator
          </button>
        </div>

        <!-- Controls -->
        <div id="game-controls" class="mb-4"></div>

        <!-- Main Grid: 3 equal columns -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- Left: Options Chain (3 cols) -->
          <div id="options-chain" class="lg:col-span-3 h-[600px]"></div>

          <!-- Center: Chart (6 cols) -->
          <div id="chart-container" class="lg:col-span-6 h-[600px]"></div>

          <!-- Right: Positions Stack (3 cols) -->
          <div class="lg:col-span-3 flex flex-col gap-4">
            <div id="leaps-panel" class="flex-shrink-0"></div>
            <div id="shortcall-panel" class="flex-shrink-0"></div>
          </div>
        </div>

        <!-- Splash Screen Container -->
        <div id="splash-container"></div>
      </div>
    `,this.headerEl=this.container.querySelector("#game-header"),this.controlsEl=this.container.querySelector("#game-controls"),this.chainEl=this.container.querySelector("#options-chain"),this.chartEl=this.container.querySelector("#chart-container"),this.splashEl=this.container.querySelector("#splash-container"),this.container.querySelector("#open-montecarlo-btn")?.addEventListener("click",()=>{window.open("/montecarlo.html","_blank")})}initializeComponents(){const e=this.store.getState();this.accountHeader=new ne(this.headerEl,{state:e}),this.gameControls=new le(this.controlsEl,{state:e,gameMode:this.gameMode,onStart:()=>this.store.start(),onPause:()=>this.store.pause(),onModeChange:n=>this.handleModeChange(n),onReset:()=>this.store.reset(),onScenarioChange:n=>this.store.reset(n)}),this.candlestickChart=new re(this.chartEl),this.optionsChain=new oe(this.chainEl,{stockPrice:e.market.spyPrice,vix:e.market.vix,onSelectStrike:(n,a)=>this.handleStrikeSelection(n,a),mode:this.optionsChainMode,onModeChange:n=>{this.optionsChainMode=n}});const t=this.container.querySelector("#leaps-panel");this.leapsPanel=new ce(t,{state:e,onBuyLEAPS:()=>this.openBuyLEAPSDialog(),onRollLEAPS:()=>this.openRollLEAPSDialog(),onCloseLEAPS:()=>this.closeLEAPS()});const i=this.container.querySelector("#shortcall-panel");this.shortCallPanel=new de(i,{state:e,onSellCall:()=>this.openSellCallDialog(),onRollCall:()=>this.openRollCallDialog(),onBuyBackCall:()=>this.buyBackCall()})}handleStateUpdate(e){const t=e.market.day%5,i=t===4,n=Math.floor(e.market.day/5)+1;i&&console.log("🎉 FRIDAY DETECTED!",{day:e.market.day,tradingDay:t,currentWeek:n,isFridaySplashOpen:this.isFridaySplashOpen,lastSplashWeek:this.lastSplashWeek,shouldShow:!this.isFridaySplashOpen&&n!==this.lastSplashWeek&&e.market.day>0}),i&&!this.isFridaySplashOpen&&n!==this.lastSplashWeek&&e.market.day>0&&(console.log("📊 SHOWING FRIDAY SPLASH"),this.lastSplashWeek=n,this.showFridaySplash(e),this.store.pause()),this.updateComponents(e),this.gameMode==="auto"&&e.isPlaying&&!this.isFridaySplashOpen&&this.executeAutoTradeRules(e)}handleModeChange(e){switch(this.gameMode=e,e){case"slow":this.store.setInterval(3e3);break;case"1x":case"auto":this.store.setInterval(1e3);break}this.updateComponents(this.store.getState())}executeAutoTradeRules(e){const{vix:t}=e.market,{leaps:i,shortCall:n}=e;if(i&&!n&&t<40){let a=0;t<20?a=3:t<30?a=0:t<40&&(a=-2);const l=Math.round((e.market.spyPrice+a)/5)*5,r=P({stockPrice:e.market.spyPrice,strike:l,dte:5,vix:t,isCall:!0});this.store.dispatch({type:"SELL_SHORT_CALL",payload:{strike:l,premium:r.total,dte:5}})}}showFridaySplash(e){console.log("🚨 showFridaySplash() called");try{this.isFridaySplashOpen=!0;const{leaps:t,shortCall:i}=e,n=Math.floor(e.market.day/5)+1;console.log("📊 Splash data:",{leaps:!!t,shortCall:!!i,weekNumber:n});let a=0,l="",r=0,c=0;const o=e.market.spyPrice,p=e.priceHistory,h=p.length>=5?p[p.length-5]:p[0],u=o-h,f=u/h*100;if(i&&e.shortCallWeekStartValue!==null){const{currentValue:d}=M(i,e.market.spyPrice,e.market.vix);a=e.shortCallWeekStartValue-d,console.log("📊 SHORT CALL P&L CALCULATION:"),console.log("  Premium collected:",i.premium),console.log("  Week start value:",e.shortCallWeekStartValue),console.log("  Current value:",d),console.log("  DTE:",i.dte),console.log("  Strike:",i.strike),console.log("  SPY Price:",e.market.spyPrice),console.log("  Is ITM?",e.market.spyPrice>i.strike),console.log("  Weekly P&L:",a),console.log("  Expected (if opened this week):",i.premium-d),e.market.spyPrice>i.strike?l="ITM (In The Money)":l="OTM (Out of The Money) - Full Profit!"}if(t&&e.leapsWeekStartValue!==null){const{currentValue:d}=O(t,e.market.spyPrice,e.market.vix);r=d-e.leapsWeekStartValue,console.log("📊 LEAPS P&L CALCULATION:"),console.log("  Cost basis:",t.costBasis),console.log("  Week start value:",e.leapsWeekStartValue),console.log("  Current value:",d),console.log("  Delta:",t.delta),console.log("  Theta:",t.theta),console.log("  DTE:",t.dte),console.log("  Strike:",t.strike),console.log("  SPY Price:",e.market.spyPrice),console.log("  Weekly P&L:",r),console.log("  Stock movement:",u),console.log("  Expected from delta:",u*t.delta*100)}c=a+r,console.log(`
═══════════════════════════════════════════════════════════════
WEEK ${n} COMPLETE
═══════════════════════════════════════════════════════════════
Market:     $${h.toFixed(2)} → $${o.toFixed(2)} (${f>=0?"+":""}${f.toFixed(2)}%, ${u>=0?"+":""}$${u.toFixed(2)})
LEAPS P&L:  ${r>=0?"+":""}$${r.toFixed(2)}
Short P&L:  ${a>=0?"+":""}$${a.toFixed(2)}
Total P&L:  ${c>=0?"+":""}$${c.toFixed(2)}
Account:    $${(e.cash+(t?.currentValue||0)-(i?.currentValue||0)).toFixed(2)}
═══════════════════════════════════════════════════════════════
    `);const x=`
      <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="friday-splash">
        <div class="bg-gray-900 border-2 border-matrix-green rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div class="text-center mb-4">
            <div class="text-4xl mb-1">🎉</div>
            <h2 class="text-2xl font-bold text-matrix-green">Week ${n} Complete!</h2>
            <p class="text-sm text-gray-400">Friday Market Close</p>
          </div>

          <!-- Market Summary -->
          <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/50 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-400 mb-1">SPY Weekly Movement</div>
                <div class="text-2xl font-bold">
                  <span class="text-gray-300">$${h.toFixed(2)}</span>
                  <span class="text-gray-500 mx-2">→</span>
                  <span class="text-white">$${o.toFixed(2)}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-400 mb-1">Change</div>
                <div class="text-2xl font-bold ${u>=0?"text-green-400":"text-red-400"}">
                  ${u>=0?"+":""}$${u.toFixed(2)}
                </div>
                <div class="text-sm font-mono ${u>=0?"text-green-400":"text-red-400"}">
                  ${f>=0?"+":""}${f.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <!-- DIAGNOSTIC INFO -->
          <div class="bg-red-900/30 border border-red-500 p-3 rounded text-xs font-mono mb-4">
            <div class="font-bold text-red-400 mb-2">🔍 DIAGNOSTIC INFO:</div>
            ${i?`
              <div class="mb-2">
                <div class="text-yellow-400 font-bold">Short Call:</div>
                <div>Premium collected: $${i.premium.toFixed(2)}</div>
                <div>Week start value: $${e.shortCallWeekStartValue?.toFixed(2)||"NULL"}</div>
                <div>Current value: $${i.currentValue.toFixed(2)}</div>
                <div>DTE: ${i.dte}</div>
                <div>Calculated P&L: ${e.shortCallWeekStartValue?(e.shortCallWeekStartValue-i.currentValue).toFixed(2):"N/A"}</div>
                <div>Expected (if opened Mon): $${(i.premium-i.currentValue).toFixed(2)}</div>
              </div>
            `:""}
            ${t?`
              <div>
                <div class="text-yellow-400 font-bold">LEAPS:</div>
                <div>Cost basis: $${(t.costBasis||0).toFixed(2)}</div>
                <div>Week start value: $${e.leapsWeekStartValue?.toFixed(2)||"NULL"}</div>
                <div>Current value: $${(t.currentValue||0).toFixed(2)}</div>
                <div>Delta: ${(t.delta||0).toFixed(3)}</div>
                <div>Calculated P&L: ${e.leapsWeekStartValue?((t.currentValue||0)-e.leapsWeekStartValue).toFixed(2):"N/A"}</div>
                <div>Expected from delta: $${(u*(t.delta||0)*100).toFixed(2)}</div>
                <div>Expected from theta: $${((t.theta||0)*7).toFixed(2)}</div>
                <div>Expected total: $${(u*(t.delta||0)*100+(t.theta||0)*7).toFixed(2)}</div>
              </div>
            `:""}
          </div>

          <div class="space-y-3 mb-4">
            <!-- Short Call Result -->
            ${i?`
              <div class="bg-gray-800 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-orange-400">Short Call Result</span>
                  <span class="text-sm ${e.market.spyPrice>i.strike?"text-red-400":"text-green-400"}">${l}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span class="text-gray-400">Strike:</span>
                    <span class="ml-2 font-mono">$${i.strike}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Premium:</span>
                    <span class="ml-2 font-mono text-green-400">+${y(i.premium)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Close Price:</span>
                    <span class="ml-2 font-mono">$${e.market.spyPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">P&L:</span>
                    <span class="ml-2 font-mono ${C(a)}">${a>=0?"+":""}${y(a)}</span>
                  </div>
                </div>
                ${(()=>{const d=i.premium/100,m=i.strike+d,v=Math.max(0,e.market.spyPrice-i.strike),g=e.market.spyPrice>=i.strike&&e.market.spyPrice<=m,b=g?(e.market.spyPrice-i.strike)/d*100:0,$=e.market.spyPrice>m;return`
                    <div class="bg-gray-900/50 border border-gray-600 p-2 rounded text-[11px] mb-3">
                      <div class="font-bold text-blue-400 mb-1.5 text-xs">💡 P&L Visualization:</div>

                      <!-- Visual Bar Graph -->
                      <div class="relative h-8 bg-gray-800 rounded-lg overflow-hidden mb-1 border border-gray-700">
                        <!-- OTM Zone (Green) - Left of strike -->
                        <div class="absolute left-0 top-0 bottom-0 bg-green-600/40 border-r-2 border-green-400"
                             style="width: 40%">
                        </div>

                        <!-- Premium Buffer Zone (Yellow) - Strike to breakeven -->
                        <div class="absolute bg-yellow-600/40 top-0 bottom-0 border-r-2 border-yellow-400"
                             style="left: 40%; width: 30%">
                        </div>

                        <!-- Loss Zone (Red) - Beyond breakeven -->
                        <div class="absolute right-0 top-0 bottom-0 bg-red-600/40"
                             style="width: 30%">
                        </div>

                        <!-- "You are here" marker -->
                        ${(()=>{let k=0,S="green-300";if($){const w=e.market.spyPrice-m,L=d*2;k=70+Math.min(w/L*30,29),S="red-300"}else if(g)k=40+b/100*30,S="yellow-300";else{const w=Math.abs(e.market.spyPrice-i.strike),L=i.strike*.05;k=Math.max(5,40-w/L*35),S="green-300"}return`
                            <div class="absolute top-1/2 -translate-y-1/2 text-${S} font-bold text-xs whitespace-nowrap" style="left: ${k}%">
                              ↓
                            </div>
                          `})()}

                        <!-- Zone labels -->
                        <div class="absolute left-2 top-1 text-[9px] text-green-300 font-bold">OTM</div>
                        <div class="absolute right-2 top-1 text-[9px] text-red-300 font-bold">ITM</div>
                      </div>

                      <!-- Price scale below bar -->
                      <div class="relative h-6 mb-1">
                        <!-- Strike marker -->
                        <div class="absolute" style="left: 40%; transform: translateX(-50%)">
                          <div class="text-[9px] text-yellow-400 font-bold text-center">Strike</div>
                          <div class="text-[9px] text-yellow-400 text-center">$${i.strike}</div>
                        </div>

                        <!-- Breakeven marker -->
                        <div class="absolute" style="left: 70%; transform: translateX(-50%)">
                          <div class="text-[9px] text-orange-400 font-bold text-center">Break</div>
                          <div class="text-[9px] text-orange-400 text-center">$${m.toFixed(2)}</div>
                        </div>

                        <!-- Current price marker -->
                        ${(()=>{let k=0;if($){const S=e.market.spyPrice-m,w=d*2;k=70+Math.min(S/w*30,29)}else if(g)k=40+b/100*30;else{const S=Math.abs(e.market.spyPrice-i.strike),w=i.strike*.05;k=Math.max(5,40-S/w*35)}return`
                            <div class="absolute" style="left: ${k}%; transform: translateX(-50%)">
                              <div class="text-[9px] text-blue-400 font-bold text-center">You</div>
                              <div class="text-[9px] text-blue-400 text-center">$${e.market.spyPrice.toFixed(2)}</div>
                            </div>
                          `})()}
                      </div>

                      <div class="text-gray-300 space-y-1">
                        ${$?`
                          <div class="text-red-300">
                            <span class="font-bold">Beyond breakeven:</span> Stock at $${e.market.spyPrice.toFixed(2)}, losing $100 per $1 move
                          </div>
                          <div class="font-mono text-xs bg-gray-800 p-1 rounded">
                            $${i.premium.toFixed(0)} premium - $${(v*100).toFixed(0)} ITM value = ${a>=0?"+":""}$${a.toFixed(0)}
                          </div>
                        `:g?`
                          <div class="text-yellow-300">
                            <span class="font-bold">In buffer zone:</span> ${((1-b/100)*100).toFixed(0)}% of $${i.premium.toFixed(0)} buffer remaining
                          </div>
                        `:`
                          <div class="text-green-300">
                            <span class="font-bold">Profit zone:</span> Keep full $${i.premium.toFixed(0)} premium!
                          </div>
                        `}
                      </div>
                    </div>
                  `})()}
                <button id="roll-short-call-btn" class="btn-secondary px-4 py-2 text-sm w-full">
                  Roll Short Call to Next Week
                </button>
                <p class="text-xs text-gray-400 mt-2 text-center">Extend your covered call position for another week</p>
              </div>
            `:`
              <div class="bg-gray-800/50 p-4 rounded-lg">
                <div class="text-center text-gray-400 mb-3">No short call position this week</div>
                ${t?`
                  <button id="sell-call-from-splash-btn" class="btn-warning px-4 py-2 text-sm w-full">
                    Sell Short Call for Next Week
                  </button>
                `:`
                  <div class="text-xs text-gray-500 text-center">Buy LEAPS first to sell covered calls</div>
                `}
              </div>
            `}
            
            <!-- LEAPS Result -->
            ${t?`
              <div class="bg-gray-800 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-matrix-green">LEAPS Result</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span class="text-gray-400">Strike:</span>
                    <span class="ml-2 font-mono">$${t.strike}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">DTE Remaining:</span>
                    <span class="ml-2 font-mono">${t.dte}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Current Value:</span>
                    <span class="ml-2 font-mono">${y(t.currentValue||t.premium)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Weekly P&L:</span>
                    <span class="ml-2 font-mono ${C(r)}">${r>=0?"+":""}${y(r)}</span>
                  </div>
                </div>

                ${(()=>{const d=P({stockPrice:o,strike:t.strike,dte:t.dte,vix:e.market.vix,isCall:!0}),m=u*d.delta*100,v=t.theta*7;return`
                    <div class="bg-gray-900/50 border border-gray-600 p-2 rounded text-[11px]">
                      <div class="font-bold text-blue-400 mb-1.5 text-xs">💡 LEAPS P&L Calculation:</div>

                      <div class="space-y-1.5 text-gray-300">
                        <div class="font-mono text-[10px] bg-gray-800 p-1.5 rounded space-y-0.5">
                          <div class="flex justify-between">
                            <span class="text-gray-400">Stock Impact:</span>
                            <span class="${m>=0?"text-green-400":"text-red-400"}">${u>=0?"+":""}$${u.toFixed(2)} × ${(d.delta*100).toFixed(0)}% = ${m>=0?"+":""}$${m.toFixed(0)}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-400">Time Decay (7d):</span>
                            <span class="text-red-400">${t.theta.toFixed(2)}/day × 7 = ${v>=0?"+":""}$${v.toFixed(0)}</span>
                          </div>
                          <div class="flex justify-between pt-1 border-t border-gray-700">
                            <span class="font-bold">Actual Weekly P&L:</span>
                            <span class="${C(r)} font-bold">${r>=0?"+":""}$${r.toFixed(0)}</span>
                          </div>
                        </div>
                        <div class="text-[9px] text-gray-500 mt-1">
                          Note: VIX changes and delta shifts affect actual P&L
                        </div>
                      </div>
                    </div>
                  `})()}
              </div>
            `:`
              <div class="bg-gray-800/50 p-4 rounded-lg">
                <div class="text-center text-gray-400 mb-3">No LEAPS position</div>
                <button id="buy-leaps-from-splash-btn" class="btn-primary px-4 py-2 text-sm w-full">
                  Buy LEAPS to Start Strategy
                </button>
              </div>
            `}
            
            <!-- Total -->
            <div class="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border border-gray-600">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold">Weekly Total P&L</span>
                <span class="text-2xl font-bold font-mono ${C(c)}">${c>=0?"+":""}${y(c)}</span>
              </div>
            </div>
            
            <!-- Account Value -->
            <div class="p-4 bg-blue-900/20 rounded-lg">
              <div class="text-gray-400 text-sm text-center mb-2">Total Account Value</div>
              <div class="text-3xl font-bold font-mono text-white text-center mb-3">${y(e.cash+(t?.currentValue||t?.premium||0)-(i?.currentValue||0))}</div>

              <!-- Account Breakdown -->
              <div class="text-[10px] font-mono bg-gray-800/50 p-2 rounded space-y-0.5">
                <div class="flex justify-between">
                  <span class="text-gray-400">Cash:</span>
                  <span class="text-white">${y(e.cash)}</span>
                </div>
                ${t?`
                  <div class="flex justify-between">
                    <span class="text-gray-400">+ LEAPS value:</span>
                    <span class="text-green-400">+${y(t.currentValue||t.premium)}</span>
                  </div>
                `:""}
                ${i?`
                  <div class="flex justify-between">
                    <span class="text-gray-400">- Short call value:</span>
                    <span class="text-red-400">-${y(i.currentValue)}</span>
                  </div>
                `:""}
                <div class="flex justify-between pt-1 border-t border-gray-700 text-white font-bold">
                  <span>Total:</span>
                  <span>${y(e.cash+(t?.currentValue||t?.premium||0)-(i?.currentValue||0))}</span>
                </div>
              </div>

              <div class="text-[9px] text-gray-500 text-center mt-2">
                Starting balance: $${e.initialCash.toLocaleString()} | Total profit: ${y(e.cash+(t?.currentValue||t?.premium||0)-(i?.currentValue||0)-e.initialCash)}
              </div>
            </div>
          </div>
          
          <div class="text-center">
            <button id="close-splash-btn" class="btn-primary px-8 py-3 text-lg w-full">
              Continue to Next Week →
            </button>
          </div>
        </div>
      </div>
    `;if(console.log("🎯 Rendering splash, splashEl exists?",!!this.splashEl),this.splashEl){console.log("✅ Setting splash HTML"),this.splashEl.innerHTML=x,console.log("✅ Splash HTML set, length:",x.length);const d=this.splashEl.querySelector("#close-splash-btn");d&&d.addEventListener("click",()=>{this.closeFridaySplash(e)});const m=this.splashEl.querySelector("#roll-short-call-btn");m&&m.addEventListener("click",()=>{this.handleRollFromSplash(e)});const v=this.splashEl.querySelector("#buy-leaps-from-splash-btn");v&&v.addEventListener("click",()=>{this.isFridaySplashOpen=!1,this.splashEl&&(this.splashEl.innerHTML=""),this.openBuyLEAPSDialog()});const g=this.splashEl.querySelector("#sell-call-from-splash-btn");g&&g.addEventListener("click",()=>{this.isFridaySplashOpen=!1,this.splashEl&&(this.splashEl.innerHTML=""),this.openSellCallDialog()})}}catch(t){throw console.error("❌ ERROR in showFridaySplash:",t),this.isFridaySplashOpen=!1,t}}closeFridaySplash(e){this.isFridaySplashOpen=!1,e.shortCall&&(e.market.spyPrice>e.shortCall.strike?(this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:e.shortCall.currentValue}}),console.log("Short call expired ITM - assigned (position closed)")):(this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:0}}),console.log("Short call expired OTM - full profit captured"))),this.splashEl&&(this.splashEl.innerHTML="")}handleRollFromSplash(e){if(!e.shortCall)return;const t=e.shortCall.currentValue,i=e.market.vix;let n;i<20?n="VIX < 20: Consider ATM or slightly OTM strikes":i<30?n="VIX 20-30: Consider ATM or $5 ITM strikes":n="VIX > 30: Consider $10+ ITM strikes for protection",confirm(`Roll Short Call?

This will:
1. Close your current $${e.shortCall.strike} call for $${t.toFixed(0)}
2. Open the Options Chain for you to select a new strike

${n}

Ready to select a new strike?`)&&(this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:t}}),this.isFridaySplashOpen=!1,this.splashEl&&(this.splashEl.innerHTML=""),this.optionsChainMode="weekly",this.optionsChain?.setMode("weekly"),setTimeout(()=>{alert(`Select New Strike from Options Chain

Your old position has been closed.

Now click any strike in the Weekly options chain (left side) to sell a new covered call for next week.

${n}`)},100))}updateComponents(e){this.accountHeader?.update({state:e}),this.gameControls?.update({state:e,gameMode:this.gameMode,onStart:()=>this.store.start(),onPause:()=>this.store.pause(),onModeChange:t=>this.handleModeChange(t),onReset:()=>this.store.reset(),onScenarioChange:t=>this.store.reset(t)}),this.candlestickChart?.updateCandles(e.market.candles),this.optionsChain?.update({stockPrice:e.market.spyPrice,vix:e.market.vix,onSelectStrike:(t,i)=>this.handleStrikeSelection(t,i),selectedStrike:e.shortCall?.strike,mode:this.optionsChainMode,onModeChange:t=>{this.optionsChainMode=t}}),this.leapsPanel?.update({state:e,onBuyLEAPS:()=>this.openBuyLEAPSDialog(),onRollLEAPS:()=>this.openRollLEAPSDialog(),onCloseLEAPS:()=>this.closeLEAPS()}),this.shortCallPanel?.update({state:e,onSellCall:()=>this.openSellCallDialog(),onRollCall:()=>this.openRollCallDialog(),onBuyBackCall:()=>this.buyBackCall()})}handleStrikeSelection(e,t){const i=this.store.getState();if(this.optionsChainMode==="leaps"&&!i.leaps){const n=i.market.spyPrice-e;confirm(`Buy LEAPS Call Option?

Strike: $${e}
ITM Amount: $${n>0?"+":""}${n.toFixed(2)}
DTE: 365 days (1 year)
Delta: ${(t.delta*100).toFixed(1)}%
Theta: $${t.theta.toFixed(2)}/day
Cost: $${t.total.toLocaleString()}

Cash available: $${i.cash.toLocaleString()}

Click OK to purchase this LEAPS option.`)&&this.store.dispatch({type:"BUY_LEAPS",payload:{strike:e,premium:t.total,delta:t.delta,theta:t.theta,dte:365}})}else if(!i.leaps)alert("Please switch to LEAPS mode and click a strike to purchase a LEAPS option first.");else if(!i.shortCall&&this.optionsChainMode==="weekly"){const n=e>i.market.spyPrice?"OTM":e===Math.round(i.market.spyPrice/5)*5?"ATM":"ITM";confirm(`Sell Weekly Call Option?

Strike: $${e} (${n})
DTE: 5 days (to Friday)
Premium Collected: $${t.total.toLocaleString()}
Delta: ${(t.delta*100).toFixed(1)}%

This creates a covered call position against your LEAPS.

Click OK to sell this call.`)&&this.sellCall(e,t)}else i.shortCall||(alert("You have a LEAPS position. Switch to Weekly mode to sell short calls."),this.optionsChainMode="weekly",this.optionsChain?.setMode("weekly"))}openBuyLEAPSDialog(){this.optionsChainMode="leaps",this.optionsChain?.setMode("leaps"),alert(`Buy LEAPS - Select from Options Chain

The Options Chain is now in LEAPS mode (365 DTE).

Click on any strike in the chain to select it.
Look for strikes with 80-100 delta (highlighted in green).`)}openSellCallDialog(){const e=this.store.getState();if(!e.leaps){alert(`You need to buy LEAPS first!

Switch to LEAPS mode and click a strike to purchase a LEAPS option.`);return}this.optionsChainMode="weekly",this.optionsChain?.setMode("weekly");let t="";e.market.vix<20?t="VIX < 20: Consider ATM or slightly OTM for more premium":e.market.vix<30?t="VIX 20-30: Consider ATM strikes for balanced risk/reward":t="VIX > 30: Consider ITM strikes for more protection",alert(`Sell Short Call - Select from Options Chain

The Options Chain is now in Weekly mode (7 DTE).

Click on any strike to sell a covered call.

Current VIX: ${e.market.vix.toFixed(1)}
${t}

▼ ITM (green) = More premium, less risk
◆ ATM (yellow) = Balanced
▲ OTM (red) = Less premium, more upside`)}sellCall(e,t){this.store.dispatch({type:"SELL_SHORT_CALL",payload:{strike:e,premium:t.total,dte:5}})}openRollLEAPSDialog(){const e=this.store.getState();if(!e.leaps)return;const t=Math.round(e.market.spyPrice*.85/5)*5,i=P({stockPrice:e.market.spyPrice,strike:t,dte:365,vix:e.market.vix,isCall:!0});confirm(`Roll LEAPS?

Close current position and open new LEAPS:
New Strike: $${t}
New DTE: 365 days (1 year)
New Delta: ${(i.delta*100).toFixed(1)}%
New Cost: $${i.total.toLocaleString()}

This will realize any P&L on current position.`)&&this.store.dispatch({type:"ROLL_LEAPS",payload:{newStrike:t,newPremium:i.total,newDelta:i.delta,newTheta:i.theta,newDte:365,cost:i.total}})}openRollCallDialog(){const e=this.store.getState();if(!e.shortCall)return;let t=e.shortCall.strike;e.market.vix>25&&(t=Math.round((t-5)/5)*5);const i=P({stockPrice:e.market.spyPrice,strike:t,dte:5,vix:e.market.vix,isCall:!0});confirm(`Roll Short Call?

Buy back current call and sell new call:
New Strike: $${t}
New DTE: 5 days
New Premium: $${i.total.toLocaleString()}

Any profit/loss on current call will be realized.`)&&this.store.dispatch({type:"ROLL_SHORT_CALL",payload:{newStrike:t,newPremium:i.total,newDte:5,cost:0}})}closeLEAPS(){if(!this.store.getState().leaps)return;confirm("Close LEAPS position? This will realize all P&L.")&&this.store.dispatch({type:"CLOSE_LEAPS"})}buyBackCall(){const e=this.store.getState();if(!e.shortCall)return;const t=P({stockPrice:e.market.spyPrice,strike:e.shortCall.strike,dte:e.shortCall.dte,vix:e.market.vix,isCall:!0});confirm(`Buy back call option?

Cost to close: $${t.total.toLocaleString()}
Original credit: $${e.shortCall.premium.toLocaleString()}
P&L: $${(e.shortCall.premium-t.total).toLocaleString()}`)&&this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:t.total}})}destroy(){this.unsubscribe&&this.unsubscribe(),this.candlestickChart?.destroy()}}const he=document.querySelector("#app"),ue=new pe(he);window.addEventListener("beforeunload",()=>{ue.destroy()});
