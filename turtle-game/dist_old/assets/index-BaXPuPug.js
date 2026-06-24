(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function t(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(n){if(n.ep)return;n.ep=!0;const a=t(n);fetch(n.href,a)}})();const I={normal:{name:"Normal Market",initialPrice:590,initialVIX:15,volatility:.008,trend:2e-4,description:"Standard market conditions with moderate volatility"},bullish:{name:"Bull Run",initialPrice:590,initialVIX:12,volatility:.006,trend:.001,description:"Low volatility, steady upward trend"},bearish:{name:"Bear Market",initialPrice:590,initialVIX:25,volatility:.015,trend:-5e-4,description:"Higher volatility with declining prices"},choppy:{name:"Choppy Market",initialPrice:590,initialVIX:20,volatility:.012,trend:0,description:"High volatility with no clear direction"},crash:{name:"Market Crash",initialPrice:590,initialVIX:35,volatility:.025,trend:-.002,description:"Extreme volatility and declining prices"},deathSpiral:{name:"Death Spiral",initialPrice:590,initialVIX:28,volatility:.018,trend:-.001,description:"Slow grind down with periodic spikes"}};function E(){let s=0,e=0;for(;s===0;)s=Math.random();for(;e===0;)e=Math.random();return Math.sqrt(-2*Math.log(s))*Math.cos(2*Math.PI*e)}function D(s,e,t){const i=E(),n=t+e*i,a=s*(1+n);return Math.max(a,1)}function N(s,e){let t;if(e<0){const p=Math.abs(e);let d;p<.004?d=6:p<.01?d=8:d=10,t=p*d}else t=-Math.abs(e)*3;const a=(17-s)/s*.08,o=E()*.02,r=t+a+o,c=s*(1+r);return Math.max(10,Math.min(c,80))}function B(s,e){const i=D(s,e,0),n=e*.6,a=s*n*Math.abs(E()),l=i>s;let o,r;return l?(o=Math.max(s,i)+a*.5,r=Math.min(s,i)-a*.3):(o=Math.max(s,i)+a*.3,r=Math.min(s,i)-a*.5),{time:Date.now(),open:s,high:Math.max(o,s,i),low:Math.min(r,s,i),close:i,volume:Math.floor(1e8+Math.random()*5e7)}}function _(s){return I[s]||I.normal}function X(s,e=6,t=.008){const i=[];let n=s;for(let a=0;a<e;a++){const l=(Math.random()*5-2)/100,o=n/(1+l),r=n,c=Math.abs(l)+.01,p=Math.max(o,r)*(1+c*.5),d=Math.min(o,r)*(1-c*.5);i.unshift({time:Date.now()-(e-a)*6048e5,open:o,high:p,low:d,close:r,isHistorical:!0}),n=o}return i}function Y(s,e,t=6){const i=[];let n=s;for(let a=0;a<t;a++){const l=e[e.length-1-a];if(!l)break;const o=(l.close-l.open)/l.open;let r;o<0?r=Math.abs(o)*(4+Math.random()*4):r=-o*(1.5+Math.random()*2),r+=(Math.random()-.5)*.1;const c=n/(1+r),p=n,d=Math.abs(r)+.05,h=Math.max(c,p)*(1+d*.8),f=Math.min(c,p)*(1-d*.5);i.unshift({time:l.time,open:Math.max(10,c),high:Math.max(10,h),low:Math.max(10,f),close:Math.max(10,p),isHistorical:!0}),n=c}return i}function q(s="normal"){const e=_(s),t=6,i=e.initialPrice,n=X(i,t,e.volatility),a=e.initialVIX,l=Y(a,n,t),o=B(i,e.volatility);o.time=Date.now(),o.open=i,o.close=i,o.high=i*1.002,o.low=i*.998;const r=[...n,o],c={time:Date.now(),open:a,high:a*1.02,low:a*.98,close:a},p=[...l,c];return{spyPrice:i,vix:a,day:0,candles:r,vixCandles:p,scenario:e}}function j(s){const e=D(s.spyPrice,s.scenario.volatility,s.scenario.trend),t=(e-s.spyPrice)/s.spyPrice,i=N(s.vix,t),n=B(s.spyPrice,s.scenario.volatility);n.time=Date.now()+s.day*864e5,n.close=e;const a=i-s.vix,l=Math.abs(a)/s.vix+.02,o={time:Date.now()+s.day*864e5,open:s.vix,high:Math.max(s.vix,i)*(1+l*.3),low:Math.min(s.vix,i)*(1-l*.2),close:i};return{spyPrice:e,vix:i,day:s.day+1,candles:[...s.candles.slice(-50),n],vixCandles:[...s.vixCandles.slice(-50),o],scenario:s.scenario}}function G(s,e,t){return t?Math.max(0,s-e)*100:Math.max(0,e-s)*100}function U(s){if(s<=90)return 450*Math.sqrt(s/7);{const t=450*Math.sqrt(12.857142857142858),n=(s-90)*21.91;return t+n}}function K(s,e,t){const n=Math.abs(s-e)/s;let a;const l=n*100;if(l<.1?a=1:l<.2?a=1-(l-.1)*.4:l<.35?a=.96-(l-.2)*.8:l<.5?a=.84-(l-.35)*1.2:a=Math.max(.3,.66-(l-.5)*.8),t<90)return a;if(t<300){const o=(t-90)/210,r=.15+(.7-.15)*o;return Math.max(a,r)}else return Math.max(a,.7)}function Z(s){return s>=7?1:s>=5?.9:s>=3?.75:s>=1?.6:s>0?.35:0}function J(s,e,t){const n=Math.pow(s/15,1.3),a=Math.min(n,5),o=(e/t-1)*100;if(o>=15)return 1+(a-1)*.05;if(o>=10){const c=.85+(o-10)/5*.1;return 1+(a-1)*(1-c)}else if(o>=5){const c=.6+(o-5)/5*.25;return 1+(a-1)*(1-c)}else if(o>=2){const c=.3+(o-2)/3*.3;return 1+(a-1)*(1-c)}return a}function Q(s,e,t,i){const a=(s/e-1)*100;let l;return a>=20?l=.98+(Math.min(a,40)-20)/20*.01:a>=15?l=.95+(a-15)/5*.03:a>=10?l=.9+(a-10)/5*.05:a>=5?l=.8+(a-5)/5*.1:a>=2?l=.65+(a-2)/3*.15:a>=-2?l=.5+a/2*.15:a>=-5?l=.3+(a+5)/3*.05:a>=-10?l=.15+(a+10)/5*.15:l=.02+Math.max(0,(a+20)/10*.13),l=Math.max(.01,Math.min(.99,l)),i?l:-l}function ee(s,e){if(e===0)return-s;let t;return e<=7?t=.14:e<=30?t=.05:t=.02,-s*t}function te(s,e){const t=(s-e)/s*100;return Math.abs(t)<=.5?"ATM":t>0?`${Math.abs(t).toFixed(1)}% ITM`:`${Math.abs(t).toFixed(1)}% OTM`}function C(s){const{stockPrice:e,strike:t,dte:i,vix:n,isCall:a}=s;if(!isFinite(e)||!isFinite(t)||!isFinite(i)||!isFinite(n))throw console.error("Invalid option pricing inputs:",s),new Error(`Invalid pricing inputs: stockPrice=${e}, strike=${t}, dte=${i}, vix=${n}`);const l=G(e,t,a),o=U(i),r=K(e,t,i),c=Z(i),p=J(n,e,t),d=o*r*c*p;if(!isFinite(d))throw console.error("NaN in extrinsic calculation:",{basePremium:o,moneynessMultiplier:r,timeMultiplier:c,volatilityMultiplier:p,params:s}),new Error("Extrinsic value calculation resulted in NaN");const h=l+d,f=Q(e,t,i,a),v=ee(d,i),x=(e-t)/e*100,y=te(e,t);return{intrinsic:Math.round(l),extrinsic:Math.round(d),total:Math.round(h),delta:Math.round(f*1e3)/1e3,theta:Math.round(v*100)/100,moneyness:Math.round(x*10)/10,moneynessLabel:y}}function se(s){return s>=15?.95:s>=10?.9+(s-10)/5*.05:s>=5?.75+(s-5)/5*.15:s>=1?.6+(s-1)/4*.15:s>=0||s>=-1?.52+s*.08:s>=-5?.44+(s+1)/4*.14:Math.max(.1,.3+(s+5)/5*.2)}function R(s="normal"){const t=q(s);return{cash:25e3,initialCash:25e3,market:t,leaps:null,shortCall:null,realizedPnL:0,unrealizedPnL:0,weeklyPnL:0,totalTrades:0,winningTrades:0,leapsWeekStartValue:null,shortCallWeekStartValue:null,isPlaying:!1,gameSpeed:1,currentWeek:1,priceHistory:[t.spyPrice],pnlHistory:[0]}}function ie(s,e){switch(e.type){case"START_GAME":return{...s,isPlaying:!0};case"PAUSE_GAME":return{...s,isPlaying:!1};case"SET_SPEED":return{...s,gameSpeed:e.payload};case"UPDATE_MARKET_PRICE":{const{spyPrice:t,vix:i}=e.payload;return{...s,market:{...s.market,spyPrice:t,vix:i??s.market.vix},priceHistory:[...s.priceHistory.slice(-100),t]}}case"ADVANCE_DAY":{const t=j(s.market),i=Math.floor(t.day/7)+1,n=i!==s.currentWeek;let a=s.leapsWeekStartValue,l=s.shortCallWeekStartValue;n&&(s.leaps&&(a=s.leaps.currentValue),s.shortCall&&(l=s.shortCall.currentValue));let o=0,r=s.leaps,c=s.shortCall;if(s.leaps){const h=Math.max(0,s.leaps.dte-1),f=s.leaps.currentValue,x=(t.spyPrice-s.leaps.lastStockPrice)*s.leaps.delta*100,y=s.leaps.theta*1,S=f+x+y,m=Math.max(0,s.leaps.extrinsic+y),u=(t.spyPrice-s.leaps.strike)/t.spyPrice*100,g=se(u),b=h>0?-m/h:0,P=S-f;o+=P,r={...s.leaps,dte:h,currentValue:S,delta:g,theta:b,premium:S,extrinsic:m,lastStockPrice:t.spyPrice},h<=0&&console.warn("LEAPS expired at DTE 0")}if(s.shortCall){const h=Math.max(0,s.shortCall.dte-1),f=s.shortCall.currentValue,v=C({stockPrice:t.spyPrice,strike:s.shortCall.strike,dte:h,vix:t.vix,isCall:!0});let x=v.total;h<=0&&(t.spyPrice>s.shortCall.strike?(x=Math.max(0,t.spyPrice-s.shortCall.strike)*100,console.warn("Short call expired ITM - assignment at intrinsic value")):(x=0,console.log("Short call expired OTM - full profit captured")));const y=f-x;o+=y,c={...s.shortCall,dte:h,currentValue:x,delta:h<=0?x>0?1:0:v.delta,theta:h<=0?0:v.theta}}const p=n?0:s.weeklyPnL+o,d=s.unrealizedPnL+o;return{...s,market:t,unrealizedPnL:d,weeklyPnL:p,currentWeek:i,priceHistory:[...s.priceHistory.slice(-100),t.spyPrice],pnlHistory:[...s.pnlHistory.slice(-100),d],leaps:r,shortCall:c,leapsWeekStartValue:a,shortCallWeekStartValue:l}}case"BUY_LEAPS":{const{strike:t,premium:i,delta:n,theta:a,dte:l}=e.payload,o=Math.max(0,s.market.spyPrice-t)*100,r=i-o,c={type:"leaps",quantity:1,costBasis:i,currentValue:i,strike:t,dte:l,delta:n,theta:a,premium:i,extrinsic:r,lastStockPrice:s.market.spyPrice};return{...s,cash:s.cash-i,leaps:c,leapsWeekStartValue:i,totalTrades:s.totalTrades+1}}case"SELL_SHORT_CALL":{const{strike:t,premium:i,dte:n}=e.payload,a={type:"short-call",quantity:-1,costBasis:-i,currentValue:i,strike:t,dte:n,premium:i};return{...s,cash:s.cash+i,shortCall:a,shortCallWeekStartValue:i,totalTrades:s.totalTrades+1}}case"CLOSE_LEAPS":{if(!s.leaps)return s;const t=s.leaps.currentValue-s.leaps.costBasis,i=t>0;return{...s,cash:s.cash+s.leaps.currentValue,leaps:null,leapsWeekStartValue:null,realizedPnL:s.realizedPnL+t,unrealizedPnL:s.unrealizedPnL-(s.leaps.currentValue-s.leaps.costBasis),winningTrades:i?s.winningTrades+1:s.winningTrades}}case"BUY_BACK_CALL":{if(!s.shortCall)return s;const t=s.shortCall.costBasis+s.shortCall.premium-e.payload.cost,i=t>0;return{...s,cash:s.cash-e.payload.cost,shortCall:null,shortCallWeekStartValue:null,realizedPnL:s.realizedPnL+t,winningTrades:i?s.winningTrades+1:s.winningTrades}}case"ROLL_LEAPS":{if(!s.leaps)return s;const{newStrike:t,newPremium:i,newDelta:n,newTheta:a,newDte:l,cost:o}=e.payload,r=s.leaps.currentValue-s.leaps.costBasis,c=Math.max(0,s.market.spyPrice-t)*100,p=i-c,d={type:"leaps",quantity:1,costBasis:i,currentValue:i,strike:t,dte:l,delta:n,theta:a,premium:i,extrinsic:p,lastStockPrice:s.market.spyPrice};return{...s,cash:s.cash+s.leaps.currentValue-o,leaps:d,leapsWeekStartValue:i,realizedPnL:s.realizedPnL+r,totalTrades:s.totalTrades+1}}case"ROLL_SHORT_CALL":{if(!s.shortCall)return s;const{newStrike:t,newPremium:i,newDte:n,cost:a}=e.payload,l=s.shortCall.costBasis+s.shortCall.premium,o={type:"short-call",quantity:-1,costBasis:-i,currentValue:i,strike:t,dte:n,premium:i};return{...s,cash:s.cash-a+i,shortCall:o,shortCallWeekStartValue:i,realizedPnL:s.realizedPnL+l,totalTrades:s.totalTrades+1}}case"RESET_GAME":return R(e.payload);default:return s}}class ae{state;listeners=new Set;intervalId=null;intervalMs=1e3;constructor(e="normal"){this.state=R(e)}getState(){return this.state}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}notify(){this.listeners.forEach(e=>e(this.state))}dispatch(e){this.state=ie(this.state,e),this.notify(),e.type==="START_GAME"?this.startAutoAdvance():e.type==="PAUSE_GAME"?this.stopAutoAdvance():e.type==="SET_SPEED"&&this.state.isPlaying&&(this.stopAutoAdvance(),this.startAutoAdvance())}setInterval(e){this.intervalMs=e,this.state.isPlaying&&(this.stopAutoAdvance(),this.startAutoAdvance())}startAutoAdvance(){this.stopAutoAdvance(),this.intervalId=window.setInterval(()=>{this.dispatch({type:"ADVANCE_DAY"})},this.intervalMs)}stopAutoAdvance(){this.intervalId!==null&&(clearInterval(this.intervalId),this.intervalId=null)}start(){this.dispatch({type:"START_GAME"})}pause(){this.dispatch({type:"PAUSE_GAME"})}setSpeed(e){this.dispatch({type:"SET_SPEED",payload:e})}reset(e="normal"){this.dispatch({type:"RESET_GAME",payload:e})}advanceDay(){this.dispatch({type:"ADVANCE_DAY"})}updateMarketPrice(e,t){this.dispatch({type:"UPDATE_MARKET_PRICE",payload:{spyPrice:e,vix:t}})}}function A(s,e,t){return C({stockPrice:e,strike:s.strike,dte:Math.max(0,s.dte),vix:t,isCall:!0}).total}function O(s,e,t){return C({stockPrice:e,strike:s.strike,dte:Math.max(0,s.dte),vix:t,isCall:!0}).total}function W(s,e,t){const i=A(s,e,t);return{unrealizedPnL:i-s.costBasis,currentValue:i}}function M(s,e,t){const i=O(s,e,t);return{unrealizedPnL:s.premium-i,currentValue:i}}function ne(s,e){return e>s.strike}function le(s){const{cash:e,leaps:t,shortCall:i,realizedPnL:n,unrealizedPnL:a,weeklyPnL:l,initialCash:o,market:r}=s;let c=0,p=0,d=0,h=0;t&&(c=A(t,r.spyPrice,r.vix),p=c-t.costBasis),i&&(d=O(i,r.spyPrice,r.vix),h=i.premium-d);const f=e+c-d,v=f-o,x=v/o*100,y=l/o*100;let S=0,m=0;return t&&(S+=t.delta*100,m+=t.theta),i&&(S+=(i.delta||0)*-100,m+=(i.theta||0)*-1),{totalAccountValue:f,totalPnL:v,totalPnLPercent:x,realizedPnL:n,unrealizedPnL:a,leapsPnL:p,shortCallPnL:h,weeklyPnL:l,weeklyPnLPercent:y,portfolioDelta:S,portfolioTheta:m}}function oe(s){const{leaps:e,shortCall:t,initialCash:i,market:n}=s;let a=0;return e&&(a+=A(e,n.spyPrice,n.vix)),t&&(a-=t.premium),a/i*100}function re(s,e){let t;return e<20?t=50:e<30?t=70:e<40?t=80:t=85,s>80?{isSafe:!1,warning:"⚠️ OVERLEVERAGED! Close positions immediately!",maxAllowed:t}:s>t?{isSafe:!1,warning:`⚠️ High deployment! Max recommended: ${t}%`,maxAllowed:t}:{isSafe:!0,warning:null,maxAllowed:t}}function k(s){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(s)}function ce(s){return`${s>=0?"+":""}${s.toFixed(2)}%`}function w(s){return s>0?"text-green-500":s<0?"text-red-500":"text-gray-400"}class de{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e}=this.props,t=le(e),i=oe(e),n=re(i,e.market.vix);this.container.innerHTML=`
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
            <div class="text-2xl font-bold font-mono">${k(t.totalAccountValue)}</div>
          </div>
          
          <!-- Total P&L -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Total P&L</div>
            <div class="text-2xl font-bold font-mono ${w(t.totalPnL)}">
              ${t.totalPnL>=0?"+":""}${k(t.totalPnL)}
              <span class="text-sm">(${ce(t.totalPnLPercent)})</span>
            </div>
          </div>
          
          <!-- Weekly P&L -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Weekly P&L</div>
            <div class="text-xl font-bold font-mono ${w(t.weeklyPnL)}">
              ${t.weeklyPnL>=0?"+":""}${k(t.weeklyPnL)}
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
              ${t.portfolioTheta>0?"+":""}${k(t.portfolioTheta)}/day
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Cash Available</div>
            <div class="text-lg font-mono text-blue-400">${k(e.cash)}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Realized P&L</div>
            <div class="text-lg font-mono ${w(e.realizedPnL)}">
              ${e.realizedPnL>=0?"+":""}${k(e.realizedPnL)}
            </div>
          </div>
        </div>
      </div>
    `}}class pe{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e,gameMode:t,onStart:i,onPause:n,onModeChange:a,onReset:l,onScenarioChange:o,onLoadPrice:r,isLoadingPrice:c}=this.props,{isPlaying:p,market:d,currentWeek:h}=e,f=d.day%5,x=["Mon","Tue","Wed","Thu","Fri"][f],y=f===4;this.container.innerHTML=`
      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Play Controls -->
          <div class="flex items-center gap-2">
            ${p?`
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
            <div class="text-sm text-gray-400">Day ${d.day+1}</div>
            <div class="text-lg font-bold ${y?"text-yellow-400 animate-pulse":"text-matrix-green"}">
              ${x}
              ${y?" 🎉":""}
            </div>
            <div class="text-xs text-gray-500">Week ${h}</div>
          </div>
          
          <!-- Scenario Selector -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Scenario:</span>
            <select id="scenario-select" class="bg-gray-800 text-white text-sm rounded px-3 py-2 border border-gray-700">
              <option value="normal" ${d.scenario.name==="Normal Market"?"selected":""}>Normal Market</option>
              <option value="bullish" ${d.scenario.name==="Bull Run"?"selected":""}>Bull Run</option>
              <option value="bearish" ${d.scenario.name==="Bear Market"?"selected":""}>Bear Market</option>
              <option value="choppy" ${d.scenario.name==="Choppy Market"?"selected":""}>Choppy Market</option>
              <option value="crash" ${d.scenario.name==="Market Crash"?"selected":""}>Market Crash</option>
            </select>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Week Progress (Trading Days)</span>
            <span>${f+1}/5 days</span>
          </div>
          <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 ${y?"to-yellow-400":"to-matrix-green"} transition-all duration-300"
                 style="width: ${(f+1)/5*100}%"></div>
          </div>
        </div>
        
        <!-- Market Info -->
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded">
            <span class="text-gray-400">SPY Price:</span>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold">$${d.spyPrice.toFixed(2)}</span>
              <button 
                id="load-price-btn" 
                class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors ${c?"opacity-50 cursor-not-allowed":""}"
                ${c?"disabled":""}
                title="Load/Update stock price"
              >
                ${c?"⏳":"🔄"}
              </button>
            </div>
          </div>
          <div class="flex justify-between items-center bg-gray-800/50 p-2 rounded">
            <span class="text-gray-400">VIX:</span>
            <span class="font-mono font-bold ${this.getVIXColorClass(d.vix)}">${d.vix.toFixed(2)}</span>
          </div>
        </div>
        
        <!-- Auto Mode Rules Display -->
        ${t==="auto"?`
          <div class="mt-4 p-3 bg-green-900/20 border border-green-700 rounded">
            <div class="text-xs text-green-400 font-bold mb-1">🤖 Auto Mode Active</div>
            <div class="text-xs text-gray-400">
              ${this.getAutoModeRule(d.vix)}
            </div>
          </div>
        `:""}
      </div>
    `,this.attachEventListeners(i,n,a,l,o,r)}attachEventListeners(e,t,i,n,a,l){const o=this.container.querySelector("#start-btn"),r=this.container.querySelector("#pause-btn"),c=this.container.querySelector("#reset-btn"),p=this.container.querySelector("#load-price-btn"),d=this.container.querySelectorAll(".mode-btn"),h=this.container.querySelector("#scenario-select");o&&o.addEventListener("click",e),r&&r.addEventListener("click",t),c&&c.addEventListener("click",n),p&&l&&p.addEventListener("click",l),d.forEach(f=>{f.addEventListener("click",()=>{const v=f.getAttribute("data-mode");i(v)})}),h&&h.addEventListener("change",()=>{a(h.value)})}getVIXColorClass(e){return e<20?"text-green-400":e<30?"text-yellow-400":"text-red-400"}getAutoModeRule(e){return e<20?"VIX < 20: Selling $3 OTM calls":e<30?"VIX 20-30: Selling ATM calls":e<40?"VIX 30-40: Selling $2 ITM calls":"VIX 40+: STOPPED - Too volatile"}}class he{container;canvas;ctx;candles=[];vixCandles=[];width=0;height=0;padding={top:20,right:60,bottom:30,left:10};constructor(e){this.container=e,this.canvas=document.createElement("canvas"),this.canvas.className="w-full h-full",this.container.appendChild(this.canvas);const t=this.canvas.getContext("2d");if(!t)throw new Error("Could not get canvas context");this.ctx=t,this.resize(),window.addEventListener("resize",()=>this.resize())}resize(){const e=this.container.getBoundingClientRect();this.width=e.width,this.height=e.height;const t=window.devicePixelRatio||1;this.canvas.width=this.width*t,this.canvas.height=this.height*t,this.canvas.style.width=`${this.width}px`,this.canvas.style.height=`${this.height}px`,this.ctx.scale(t,t),this.render()}updateCandles(e,t){this.candles=e,t&&(this.vixCandles=t),this.render()}render(){if(this.candles.length===0)return;const{ctx:e,width:t,height:i,padding:n}=this;e.clearRect(0,0,t,i);let a=1/0,l=-1/0;for(const m of this.candles)a=Math.min(a,m.low),l=Math.max(l,m.high);const o=l-a;a-=o*.05,l+=o*.05;let r=1/0,c=-1/0;for(const m of this.vixCandles)r=Math.min(r,m.low),c=Math.max(c,m.high);const p=c-r;r-=p*.1,c+=p*.1;const d=t-n.left-n.right,h=i-n.top-n.bottom,f=m=>n.top+h-(m-a)/(l-a)*h,v=m=>n.top+h-(m-r)/(c-r)*h,x=m=>{const u=d/this.candles.length;return n.left+m*u+u/2};e.strokeStyle="#374151",e.lineWidth=1,e.setLineDash([2,2]);const y=(l-a)/5;e.fillStyle="#9CA3AF",e.font="10px sans-serif",e.textAlign="right";for(let m=0;m<=5;m++){const u=a+y*m,g=f(u);e.beginPath(),e.moveTo(n.left,g),e.lineTo(t-n.right,g),e.stroke(),e.fillText(u.toFixed(2),t-n.right-5,g+3)}if(e.setLineDash([]),this.vixCandles.length>0){e.strokeStyle="#A855F7",e.lineWidth=2,e.beginPath();for(let u=0;u<this.vixCandles.length;u++){const g=this.vixCandles[u],b=x(u),P=v(g.close);u===0?e.moveTo(b,P):e.lineTo(b,P)}e.stroke(),e.fillStyle="#A855F7";for(let u=0;u<this.vixCandles.length;u++){const g=this.vixCandles[u],b=x(u),P=v(g.close);e.beginPath(),e.arc(b,P,3,0,Math.PI*2),e.fill()}e.fillStyle="#A855F7",e.textAlign="left",e.font="bold 10px sans-serif";const m=(c-r)/5;for(let u=0;u<=5;u++){const g=r+m*u,b=v(g);e.fillText(g.toFixed(1),t-n.right+5,b+3)}e.fillText("VIX →",t-n.right+5,n.top-5)}const S=d/this.candles.length*.7;for(let m=0;m<this.candles.length;m++){const u=this.candles[m],g=x(m),b=u.close>=u.open,P=u.isHistorical===!0;let $;P?$=b?"#9CA3AF":"#6B7280":$=b?"#22C55E":"#EF4444";const L=f(u.open),T=f(u.close),z=f(u.high),H=f(u.low);e.strokeStyle=$,e.lineWidth=1,e.beginPath(),e.moveTo(g,z),e.lineTo(g,H),e.stroke();const F=Math.min(L,T),V=Math.max(Math.abs(L-T),1);b&&!P?(e.strokeStyle=$,e.lineWidth=1.5,e.strokeRect(g-S/2,F,S,V)):(e.fillStyle=$,e.fillRect(g-S/2,F,S,V))}if(this.candles.length>0){const m=this.candles[this.candles.length-1],u=f(m.close);e.strokeStyle="#3B82F6",e.lineWidth=2,e.setLineDash([5,5]),e.beginPath(),e.moveTo(n.left,u),e.lineTo(t-n.right,u),e.stroke(),e.setLineDash([]),e.fillStyle="#3B82F6",e.font="bold 11px sans-serif",e.textAlign="right",e.fillText(m.close.toFixed(2),t-n.right-5,u-8)}e.font="11px sans-serif",e.textAlign="left",e.fillStyle="#22C55E",e.fillRect(n.left,5,12,12),e.fillStyle="#9CA3AF",e.fillText("SPY",n.left+16,15),e.fillStyle="#A855F7",e.fillRect(n.left+50,10,20,3),e.beginPath(),e.arc(n.left+60,11.5,3,0,Math.PI*2),e.fill(),e.fillStyle="#9CA3AF",e.fillText("VIX",n.left+74,15)}destroy(){window.removeEventListener("resize",()=>this.resize()),this.canvas.remove()}}class ue{container;props;strikes=[];currentMode="weekly";sortOrder="asc";constructor(e,t){this.container=e,this.props=t,this.currentMode=t.mode||"weekly",this.render()}update(e){this.props=e,e.mode&&(this.currentMode=e.mode),this.render()}setMode(e){this.currentMode=e,this.render()}generateStrikes(){const{stockPrice:e}=this.props;if(this.currentMode==="leaps"){this.strikes=[];const i=Math.round(e/5)*5,n=Math.round(e*.7/5)*5;for(let a=n;a<=i;a+=5)this.strikes.push(a)}else{const n=Math.round(e/1)*1;this.strikes=[];for(let a=-10;a<=10;a++)this.strikes.push(n+a*1)}}calculateBidAsk(e){const t=.05+this.props.vix/100*.1,i=e.total*t;return{bid:Math.max(0,e.total-i/2),ask:e.total+i/2}}render(){this.generateStrikes();const{stockPrice:e,vix:t,selectedStrike:i}=this.props,n=Math.round(e/5)*5,a=this.currentMode==="leaps"?365:7,l=this.currentMode==="leaps",o=this.strikes.map(c=>{const p=C({stockPrice:e,strike:c,dte:a,vix:t,isCall:!0}),{bid:d,ask:h}=this.calculateBidAsk(p),f=Math.abs(c-n)<2.5,v=c<e,x=c>e,y=e-c;return{strike:c,bid:d,ask:h,price:p,isATM:f,isITM:v,isOTM:x,itmAmount:y}}),r=this.sortOrder==="asc"?o.sort((c,p)=>c.strike-p.strike):o.sort((c,p)=>p.strike-c.strike);this.container.innerHTML=`
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
              ${r.map(({strike:c,bid:p,ask:d,price:h,isATM:f,isITM:v,isOTM:x,itmAmount:y})=>{const m=c===i?"bg-blue-900/30 border-l-4 border-blue-500":f&&!l?"bg-yellow-900/20 border-l-4 border-yellow-500":l&&h.delta>=.8&&h.delta<=.95?"bg-green-900/20 border-l-4 border-green-500":"hover:bg-gray-800";let u="",g="";l?(u=`$${c}`,g=h.delta>=.8?"text-green-400 font-bold":"text-gray-400"):v?(u=`▼ ${c}`,g="text-green-400 font-bold"):f?(u=`◆ ${c}`,g="text-yellow-400 font-bold"):(u=`▲ ${c}`,g="text-red-400 font-bold");const b=Math.round(h.delta*100);return`
                  <tr class="cursor-pointer transition-colors ${m} border-b border-gray-800"
                      data-strike="${c}">
                    <td class="py-2 px-2 text-green-400">${this.formatPrice(p)}</td>
                    <td class="py-2 px-2 text-red-400">${this.formatPrice(d)}</td>
                    <td class="py-2 px-2 text-center ${g}">${u}</td>
                    ${l?`<td class="py-2 px-2 text-right text-green-400">+$${y.toFixed(0)}</td>`:""}
                    <td class="py-2 px-2 text-right ${b>=80?"text-green-400 font-bold":"text-gray-400"}">${b}</td>
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
   `,this.attachEventListeners()}attachEventListeners(){const e=this.container.querySelectorAll("tbody tr"),t=this.currentMode==="leaps"?365:7;e.forEach(l=>{l.addEventListener("click",()=>{const o=parseFloat(l.getAttribute("data-strike")||"0"),r=C({stockPrice:this.props.stockPrice,strike:o,dte:t,vix:this.props.vix,isCall:!0});this.props.onSelectStrike(o,r)})});const i=this.container.querySelector("#sort-toggle");i&&i.addEventListener("click",l=>{l.stopPropagation(),this.sortOrder=this.sortOrder==="asc"?"desc":"asc",this.render()});const n=this.container.querySelector("#mode-weekly"),a=this.container.querySelector("#mode-leaps");n&&n.addEventListener("click",()=>{this.currentMode="weekly",this.props.onModeChange&&this.props.onModeChange("weekly"),this.render()}),a&&a.addEventListener("click",()=>{this.currentMode="leaps",this.props.onModeChange&&this.props.onModeChange("leaps"),this.render()})}formatPrice(e){return e<100?`$${e.toFixed(2)}`:`$${Math.round(e).toLocaleString()}`}getVIXColorClass(e){return e<15?"text-green-400":e<25?"text-yellow-400":"text-red-400"}}class xe{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e,onBuyLEAPS:t,onRollLEAPS:i,onCloseLEAPS:n}=this.props,{leaps:a,market:l}=e;if(!a){this.renderEmptyState(t);return}const{unrealizedPnL:o,currentValue:r}=W(a,l.spyPrice,l.vix),c=C({stockPrice:l.spyPrice,strike:a.strike,dte:a.dte,vix:l.vix,isCall:!0}),p=c.delta<.72;this.container.innerHTML=`
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
            <span class="font-bold ${c.delta<.7?"text-red-400":"text-blue-400"}">
              ${(c.delta*100).toFixed(1)}%
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Theta:</span>
            <span class="font-bold text-red-400">${k(c.theta)}/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Value:</span>
            <span class="font-bold">${k(r)}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-700">
            <span class="text-gray-400 font-bold">P&L:</span>
            <span class="font-bold ${w(o)}">
              ${o>=0?"+":""}${k(o)}
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
    `;const t=this.container.querySelector("#buy-leaps-btn");t&&t.addEventListener("click",e)}attachEventListeners(e,t){const i=this.container.querySelector("#roll-leaps-btn"),n=this.container.querySelector("#close-leaps-btn");i&&i.addEventListener("click",e),n&&n.addEventListener("click",t)}}class me{container;props;constructor(e,t){this.container=e,this.props=t,this.render()}update(e){this.props=e,this.render()}render(){const{state:e,onSellCall:t,onRollCall:i,onBuyBackCall:n}=this.props,{shortCall:a,market:l}=e;if(!a){this.renderEmptyState(t,l.vix);return}const{unrealizedPnL:o,currentValue:r}=M(a,l.spyPrice,l.vix),c=ne(a,l.spyPrice),p=c&&a.dte<=1,d=a.strike+a.premium/100;this.container.innerHTML=`
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-orange-400">SHORT</h3>
          <span class="px-2 py-1 rounded text-xs font-bold ${p?"bg-red-900 text-red-200 animate-pulse":c?"bg-orange-900/50 text-orange-300":"bg-green-900/50 text-green-300"}">
            ${p?"ASSIGNMENT RISK":c?"ITM":"OTM"}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Strike:</span>
            <span class="font-bold">$${a.strike}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Breakeven:</span>
            <span class="font-bold">$${d.toFixed(2)} (${l.spyPrice>d?"-$"+(l.spyPrice-d).toFixed(2):"+$"+(d-l.spyPrice).toFixed(2)})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Delta:</span>
            <span class="font-bold">${a.delta?(a.delta*100).toFixed(0):"-"}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Theta:</span>
            <span class="font-bold text-green-400">${a.theta?"+"+k(Math.abs(a.theta)):"-"}/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Value:</span>
            <span class="font-bold">${k(r)}</span>
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
            <span class="font-bold ${w(o)}">
              ${o>=0?"+":""}${k(o)}
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
    `;const n=this.container.querySelector("#sell-call-btn");n&&n.addEventListener("click",e)}attachEventListeners(e,t){const i=this.container.querySelector("#roll-call-btn"),n=this.container.querySelector("#buyback-btn"),a=this.container.querySelector("#pnl-help-btn");i&&i.addEventListener("click",e),n&&n.addEventListener("click",t),a&&a.addEventListener("click",l=>{l.stopPropagation(),this.showPnLExplanation()})}showPnLExplanation(){const{shortCall:e,market:t}=this.props.state;if(!e)return;const{unrealizedPnL:i,currentValue:n}=M(e,t.spyPrice,t.vix),a=e.strike,l=e.premium/100,o=a+l,r=t.spyPrice,c=Math.max(0,r-a),p=`
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
                <div><span class="text-gray-400">Current Price:</span> <span class="font-bold">$${r.toFixed(2)}</span></div>
                <div><span class="text-gray-400">Current P&L:</span> <span class="font-bold ${w(i)}">${i>=0?"+":""}$${i.toFixed(0)}</span></div>
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
                  <div>-$${(c*100).toFixed(0)}</div>
                </div>

                <!-- Graph area -->
                <svg class="w-full h-full" viewBox="0 0 400 160" style="margin-left: 30px;">
                  <!-- Breakeven line -->
                  <line x1="200" y1="0" x2="200" y2="160" stroke="#666" stroke-width="1" stroke-dasharray="2,2" />
                  <text x="200" y="155" fill="#888" font-size="10" text-anchor="middle">Breakeven: $${o.toFixed(2)}</text>

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
                  ${r>o?`
                    <circle cx="${Math.min(220+(r-o)*50,380)}" cy="${Math.min(70+(r-o)*50*.6,125)}" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${Math.min(220+(r-o)*50,380)}" y="${Math.min(70+(r-o)*50*.6-10,115)}" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  `:r>=a?`
                    <circle cx="${180+(r-a)/l*40}" cy="${24+(r-a)/l*46}" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${180+(r-a)/l*40}" y="${24+(r-a)/l*46-10}" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  `:`
                    <circle cx="${Math.max(10,Math.min(180,r/a*180))}" cy="24" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${Math.max(10,Math.min(180,r/a*180))}" y="15" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  `}

                  <!-- X-axis labels -->
                  <text x="0" y="145" fill="#888" font-size="10">$${(a-10).toFixed(0)}</text>
                  <text x="180" y="145" fill="#888" font-size="10">Strike: $${a}</text>
                  <text x="370" y="145" fill="#888" font-size="10" text-anchor="end">$${(o+5).toFixed(0)}+</text>
                </svg>
              </div>
            </div>

            <!-- Explanation -->
            <div class="bg-blue-900/20 border border-blue-700 p-4 rounded-lg text-sm">
              <div class="font-bold text-blue-400 mb-2">How It Works:</div>
              <div class="space-y-2 text-gray-300">
                <p><span class="text-green-400 font-bold">1. Premium Buffer:</span> You collected $${e.premium.toFixed(0)} upfront. This is your profit cushion!</p>
                <p><span class="text-yellow-400 font-bold">2. Breakeven Point:</span> Strike ($${a}) + Premium ($${l.toFixed(2)}) = $${o.toFixed(2)}</p>
                <p><span class="text-red-400 font-bold">3. Beyond Breakeven:</span> For every $1 the stock moves above $${o.toFixed(2)}, you lose $100 (because 1 contract = 100 shares).</p>
                ${r>o?`
                  <div class="mt-3 p-2 bg-red-900/30 rounded">
                    <p class="font-bold text-red-300">Current Calculation:</p>
                    <p class="text-xs font-mono">ITM Amount: $${r.toFixed(2)} - $${a} = $${c.toFixed(2)}</p>
                    <p class="text-xs font-mono">Option Value: $${c.toFixed(2)} × 100 = $${(c*100).toFixed(0)}</p>
                    <p class="text-xs font-mono">Your P&L: $${e.premium.toFixed(0)} (premium) - $${n.toFixed(0)} (current value) = ${i>=0?"+":""}$${i.toFixed(0)}</p>
                  </div>
                `:`
                  <div class="mt-3 p-2 bg-green-900/30 rounded">
                    <p class="font-bold text-green-300">You're in the profit zone!</p>
                    <p class="text-xs">The option is ${r>=a?"slightly ITM but still within your premium buffer":"out of the money, losing value due to time decay"}.</p>
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
    `,d=document.createElement("div");d.innerHTML=p,document.body.appendChild(d);const h=d.querySelector("#close-modal-btn"),f=d.querySelector("#got-it-btn"),v=d.querySelector("#pnl-modal"),x=()=>{d.remove()};h&&h.addEventListener("click",x),f&&f.addEventListener("click",x),v&&v.addEventListener("click",y=>{y.target===v&&x()})}getVIXColorClass(e){return e<15?"text-green-400":e<25?"text-yellow-400":"text-red-400"}}const fe={useRealApi:!1};function ye(){const e=(Math.random()-.5)*10,t=590+e,i=15+Math.random()*10;return{spy:{symbol:"SPY",price:t,change:e,changePercent:e/590*100,timestamp:Date.now()},vix:{price:i,change:(Math.random()-.5)*2,changePercent:(Math.random()-.5)*10}}}async function ve(){return new Promise(s=>{setTimeout(()=>{s(ye())},500)})}function ge(){return fe.useRealApi}function be(){return{configured:ge(),mode:"demo"}}class ke{container;store;unsubscribe=null;gameMode="1x";isFridaySplashOpen=!1;lastSplashWeek=-1;optionsChainMode="weekly";isLoadingPrice=!1;accountHeader=null;gameControls=null;candlestickChart=null;optionsChain=null;leapsPanel=null;shortCallPanel=null;headerEl;controlsEl;chartEl;chainEl;splashEl=null;constructor(e){this.container=e,this.store=new ae("normal"),this.createLayout(),this.initializeComponents(),this.unsubscribe=this.store.subscribe(t=>{this.handleStateUpdate(t)}),this.handleStateUpdate(this.store.getState())}createLayout(){this.container.innerHTML=`
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
    `,this.headerEl=this.container.querySelector("#game-header"),this.controlsEl=this.container.querySelector("#game-controls"),this.chainEl=this.container.querySelector("#options-chain"),this.chartEl=this.container.querySelector("#chart-container"),this.splashEl=this.container.querySelector("#splash-container"),this.container.querySelector("#open-montecarlo-btn")?.addEventListener("click",()=>{window.open("/montecarlo.html","_blank")})}initializeComponents(){const e=this.store.getState();this.accountHeader=new de(this.headerEl,{state:e}),this.gameControls=new pe(this.controlsEl,{state:e,gameMode:this.gameMode,onStart:()=>this.store.start(),onPause:()=>this.store.pause(),onModeChange:n=>this.handleModeChange(n),onReset:()=>this.store.reset(),onScenarioChange:n=>this.store.reset(n),onLoadPrice:()=>this.handleLoadPrice(),isLoadingPrice:this.isLoadingPrice}),this.candlestickChart=new he(this.chartEl),this.optionsChain=new ue(this.chainEl,{stockPrice:e.market.spyPrice,vix:e.market.vix,onSelectStrike:(n,a)=>this.handleStrikeSelection(n,a),mode:this.optionsChainMode,onModeChange:n=>{this.optionsChainMode=n}});const t=this.container.querySelector("#leaps-panel");this.leapsPanel=new xe(t,{state:e,onBuyLEAPS:()=>this.openBuyLEAPSDialog(),onRollLEAPS:()=>this.openRollLEAPSDialog(),onCloseLEAPS:()=>this.closeLEAPS()});const i=this.container.querySelector("#shortcall-panel");this.shortCallPanel=new me(i,{state:e,onSellCall:()=>this.openSellCallDialog(),onRollCall:()=>this.openRollCallDialog(),onBuyBackCall:()=>this.buyBackCall()})}handleStateUpdate(e){const t=e.market.day%5,i=t===4,n=Math.floor(e.market.day/5)+1;i&&console.log("🎉 FRIDAY DETECTED!",{day:e.market.day,tradingDay:t,currentWeek:n,isFridaySplashOpen:this.isFridaySplashOpen,lastSplashWeek:this.lastSplashWeek,shouldShow:!this.isFridaySplashOpen&&n!==this.lastSplashWeek&&e.market.day>0}),i&&!this.isFridaySplashOpen&&n!==this.lastSplashWeek&&e.market.day>0&&(console.log("📊 SHOWING FRIDAY SPLASH"),this.lastSplashWeek=n,this.showFridaySplash(e),this.store.pause()),this.updateComponents(e),this.gameMode==="auto"&&e.isPlaying&&!this.isFridaySplashOpen&&this.executeAutoTradeRules(e)}handleModeChange(e){switch(this.gameMode=e,e){case"slow":this.store.setInterval(3e3);break;case"1x":case"auto":this.store.setInterval(1e3);break}this.updateComponents(this.store.getState())}async handleLoadPrice(){if(!this.isLoadingPrice){this.isLoadingPrice=!0,this.updateComponents(this.store.getState());try{const e=await ve(),t=be();this.store.updateMarketPrice(e.spy.price,e.vix.price);const i=t.mode==="live"?"Live":"Demo";console.log(`${i} price loaded: SPY $${e.spy.price.toFixed(2)}, VIX ${e.vix.price.toFixed(2)}`)}catch(e){console.error("Failed to load price:",e),alert("Failed to load price. Please try again or check console for details.")}finally{this.isLoadingPrice=!1,this.updateComponents(this.store.getState())}}}executeAutoTradeRules(e){const{vix:t}=e.market,{leaps:i,shortCall:n}=e;if(i&&!n&&t<40){let a=0;t<20?a=3:t<30?a=0:t<40&&(a=-2);const l=Math.round((e.market.spyPrice+a)/5)*5,o=C({stockPrice:e.market.spyPrice,strike:l,dte:5,vix:t,isCall:!0});this.store.dispatch({type:"SELL_SHORT_CALL",payload:{strike:l,premium:o.total,dte:5}})}}showFridaySplash(e){console.log("🚨 showFridaySplash() called");try{this.isFridaySplashOpen=!0;const{leaps:t,shortCall:i}=e,n=Math.floor(e.market.day/5)+1;console.log("📊 Splash data:",{leaps:!!t,shortCall:!!i,weekNumber:n});let a=0,l="",o=0,r=0;const c=e.market.spyPrice,p=e.priceHistory,d=p.length>=5?p[p.length-5]:p[0],h=c-d,f=h/d*100;if(i&&e.shortCallWeekStartValue!==null){const{currentValue:x}=M(i,e.market.spyPrice,e.market.vix);a=e.shortCallWeekStartValue-x,console.log("📊 SHORT CALL P&L CALCULATION:"),console.log("  Premium collected:",i.premium),console.log("  Week start value:",e.shortCallWeekStartValue),console.log("  Current value:",x),console.log("  DTE:",i.dte),console.log("  Strike:",i.strike),console.log("  SPY Price:",e.market.spyPrice),console.log("  Is ITM?",e.market.spyPrice>i.strike),console.log("  Weekly P&L:",a),console.log("  Expected (if opened this week):",i.premium-x),e.market.spyPrice>i.strike?l="ITM (In The Money)":l="OTM (Out of The Money) - Full Profit!"}if(t&&e.leapsWeekStartValue!==null){const{currentValue:x}=W(t,e.market.spyPrice,e.market.vix);o=x-e.leapsWeekStartValue,console.log("📊 LEAPS P&L CALCULATION:"),console.log("  Cost basis:",t.costBasis),console.log("  Week start value:",e.leapsWeekStartValue),console.log("  Current value:",x),console.log("  Delta:",t.delta),console.log("  Theta:",t.theta),console.log("  DTE:",t.dte),console.log("  Strike:",t.strike),console.log("  SPY Price:",e.market.spyPrice),console.log("  Weekly P&L:",o),console.log("  Stock movement:",h),console.log("  Expected from delta:",h*t.delta*100)}r=a+o,console.log(`
═══════════════════════════════════════════════════════════════
WEEK ${n} COMPLETE
═══════════════════════════════════════════════════════════════
Market:     $${d.toFixed(2)} → $${c.toFixed(2)} (${f>=0?"+":""}${f.toFixed(2)}%, ${h>=0?"+":""}$${h.toFixed(2)})
LEAPS P&L:  ${o>=0?"+":""}$${o.toFixed(2)}
Short P&L:  ${a>=0?"+":""}$${a.toFixed(2)}
Total P&L:  ${r>=0?"+":""}$${r.toFixed(2)}
Account:    $${(e.cash+(t?.currentValue||0)-(i?.currentValue||0)).toFixed(2)}
═══════════════════════════════════════════════════════════════
    `);const v=`
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
                  <span class="text-gray-300">$${d.toFixed(2)}</span>
                  <span class="text-gray-500 mx-2">→</span>
                  <span class="text-white">$${c.toFixed(2)}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-400 mb-1">Change</div>
                <div class="text-2xl font-bold ${h>=0?"text-green-400":"text-red-400"}">
                  ${h>=0?"+":""}$${h.toFixed(2)}
                </div>
                <div class="text-sm font-mono ${h>=0?"text-green-400":"text-red-400"}">
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
                <div>Expected from delta: $${(h*(t.delta||0)*100).toFixed(2)}</div>
                <div>Expected from theta: $${((t.theta||0)*7).toFixed(2)}</div>
                <div>Expected total: $${(h*(t.delta||0)*100+(t.theta||0)*7).toFixed(2)}</div>
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
                    <span class="ml-2 font-mono text-green-400">+${k(i.premium)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Close Price:</span>
                    <span class="ml-2 font-mono">$${e.market.spyPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">P&L:</span>
                    <span class="ml-2 font-mono ${w(a)}">${a>=0?"+":""}${k(a)}</span>
                  </div>
                </div>
                ${(()=>{const x=i.premium/100,y=i.strike+x,S=Math.max(0,e.market.spyPrice-i.strike),m=e.market.spyPrice>=i.strike&&e.market.spyPrice<=y,u=m?(e.market.spyPrice-i.strike)/x*100:0,g=e.market.spyPrice>y;return`
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
                        ${(()=>{let b=0,P="green-300";if(g){const $=e.market.spyPrice-y,L=x*2;b=70+Math.min($/L*30,29),P="red-300"}else if(m)b=40+u/100*30,P="yellow-300";else{const $=Math.abs(e.market.spyPrice-i.strike),L=i.strike*.05;b=Math.max(5,40-$/L*35),P="green-300"}return`
                            <div class="absolute top-1/2 -translate-y-1/2 text-${P} font-bold text-xs whitespace-nowrap" style="left: ${b}%">
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
                          <div class="text-[9px] text-orange-400 text-center">$${y.toFixed(2)}</div>
                        </div>

                        <!-- Current price marker -->
                        ${(()=>{let b=0;if(g){const P=e.market.spyPrice-y,$=x*2;b=70+Math.min(P/$*30,29)}else if(m)b=40+u/100*30;else{const P=Math.abs(e.market.spyPrice-i.strike),$=i.strike*.05;b=Math.max(5,40-P/$*35)}return`
                            <div class="absolute" style="left: ${b}%; transform: translateX(-50%)">
                              <div class="text-[9px] text-blue-400 font-bold text-center">You</div>
                              <div class="text-[9px] text-blue-400 text-center">$${e.market.spyPrice.toFixed(2)}</div>
                            </div>
                          `})()}
                      </div>

                      <div class="text-gray-300 space-y-1">
                        ${g?`
                          <div class="text-red-300">
                            <span class="font-bold">Beyond breakeven:</span> Stock at $${e.market.spyPrice.toFixed(2)}, losing $100 per $1 move
                          </div>
                          <div class="font-mono text-xs bg-gray-800 p-1 rounded">
                            $${i.premium.toFixed(0)} premium - $${(S*100).toFixed(0)} ITM value = ${a>=0?"+":""}$${a.toFixed(0)}
                          </div>
                        `:m?`
                          <div class="text-yellow-300">
                            <span class="font-bold">In buffer zone:</span> ${((1-u/100)*100).toFixed(0)}% of $${i.premium.toFixed(0)} buffer remaining
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
                    <span class="ml-2 font-mono">${k(t.currentValue||t.premium)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Weekly P&L:</span>
                    <span class="ml-2 font-mono ${w(o)}">${o>=0?"+":""}${k(o)}</span>
                  </div>
                </div>

                ${(()=>{const x=C({stockPrice:c,strike:t.strike,dte:t.dte,vix:e.market.vix,isCall:!0}),y=h*x.delta*100,S=t.theta*7;return`
                    <div class="bg-gray-900/50 border border-gray-600 p-2 rounded text-[11px]">
                      <div class="font-bold text-blue-400 mb-1.5 text-xs">💡 LEAPS P&L Calculation:</div>

                      <div class="space-y-1.5 text-gray-300">
                        <div class="font-mono text-[10px] bg-gray-800 p-1.5 rounded space-y-0.5">
                          <div class="flex justify-between">
                            <span class="text-gray-400">Stock Impact:</span>
                            <span class="${y>=0?"text-green-400":"text-red-400"}">${h>=0?"+":""}$${h.toFixed(2)} × ${(x.delta*100).toFixed(0)}% = ${y>=0?"+":""}$${y.toFixed(0)}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-400">Time Decay (7d):</span>
                            <span class="text-red-400">${t.theta.toFixed(2)}/day × 7 = ${S>=0?"+":""}$${S.toFixed(0)}</span>
                          </div>
                          <div class="flex justify-between pt-1 border-t border-gray-700">
                            <span class="font-bold">Actual Weekly P&L:</span>
                            <span class="${w(o)} font-bold">${o>=0?"+":""}$${o.toFixed(0)}</span>
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
                <span class="text-2xl font-bold font-mono ${w(r)}">${r>=0?"+":""}${k(r)}</span>
              </div>
            </div>
            
            <!-- Account Value -->
            <div class="p-4 bg-blue-900/20 rounded-lg">
              <div class="text-gray-400 text-sm text-center mb-2">Total Account Value</div>
              <div class="text-3xl font-bold font-mono text-white text-center mb-3">${k(e.cash+(t?.currentValue||t?.premium||0)-(i?.currentValue||0))}</div>

              <!-- Account Breakdown -->
              <div class="text-[10px] font-mono bg-gray-800/50 p-2 rounded space-y-0.5">
                <div class="flex justify-between">
                  <span class="text-gray-400">Cash:</span>
                  <span class="text-white">${k(e.cash)}</span>
                </div>
                ${t?`
                  <div class="flex justify-between">
                    <span class="text-gray-400">+ LEAPS value:</span>
                    <span class="text-green-400">+${k(t.currentValue||t.premium)}</span>
                  </div>
                `:""}
                ${i?`
                  <div class="flex justify-between">
                    <span class="text-gray-400">- Short call value:</span>
                    <span class="text-red-400">-${k(i.currentValue)}</span>
                  </div>
                `:""}
                <div class="flex justify-between pt-1 border-t border-gray-700 text-white font-bold">
                  <span>Total:</span>
                  <span>${k(e.cash+(t?.currentValue||t?.premium||0)-(i?.currentValue||0))}</span>
                </div>
              </div>

              <div class="text-[9px] text-gray-500 text-center mt-2">
                Starting balance: $${e.initialCash.toLocaleString()} | Total profit: ${k(e.cash+(t?.currentValue||t?.premium||0)-(i?.currentValue||0)-e.initialCash)}
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
    `;if(console.log("🎯 Rendering splash, splashEl exists?",!!this.splashEl),this.splashEl){console.log("✅ Setting splash HTML"),this.splashEl.innerHTML=v,console.log("✅ Splash HTML set, length:",v.length);const x=this.splashEl.querySelector("#close-splash-btn");x&&x.addEventListener("click",()=>{this.closeFridaySplash(e)});const y=this.splashEl.querySelector("#roll-short-call-btn");y&&y.addEventListener("click",()=>{this.handleRollFromSplash(e)});const S=this.splashEl.querySelector("#buy-leaps-from-splash-btn");S&&S.addEventListener("click",()=>{this.isFridaySplashOpen=!1,this.splashEl&&(this.splashEl.innerHTML=""),this.openBuyLEAPSDialog()});const m=this.splashEl.querySelector("#sell-call-from-splash-btn");m&&m.addEventListener("click",()=>{this.isFridaySplashOpen=!1,this.splashEl&&(this.splashEl.innerHTML=""),this.openSellCallDialog()})}}catch(t){throw console.error("❌ ERROR in showFridaySplash:",t),this.isFridaySplashOpen=!1,t}}closeFridaySplash(e){this.isFridaySplashOpen=!1,e.shortCall&&(e.market.spyPrice>e.shortCall.strike?(this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:e.shortCall.currentValue}}),console.log("Short call expired ITM - assigned (position closed)")):(this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:0}}),console.log("Short call expired OTM - full profit captured"))),this.splashEl&&(this.splashEl.innerHTML="")}handleRollFromSplash(e){if(!e.shortCall)return;const t=e.shortCall.currentValue,i=e.market.vix;let n;i<20?n="VIX < 20: Consider ATM or slightly OTM strikes":i<30?n="VIX 20-30: Consider ATM or $5 ITM strikes":n="VIX > 30: Consider $10+ ITM strikes for protection",confirm(`Roll Short Call?

This will:
1. Close your current $${e.shortCall.strike} call for $${t.toFixed(0)}
2. Open the Options Chain for you to select a new strike

${n}

Ready to select a new strike?`)&&(this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:t}}),this.isFridaySplashOpen=!1,this.splashEl&&(this.splashEl.innerHTML=""),this.optionsChainMode="weekly",this.optionsChain?.setMode("weekly"),setTimeout(()=>{alert(`Select New Strike from Options Chain

Your old position has been closed.

Now click any strike in the Weekly options chain (left side) to sell a new covered call for next week.

${n}`)},100))}updateComponents(e){this.accountHeader?.update({state:e}),this.gameControls?.update({state:e,gameMode:this.gameMode,onStart:()=>this.store.start(),onPause:()=>this.store.pause(),onModeChange:t=>this.handleModeChange(t),onReset:()=>this.store.reset(),onScenarioChange:t=>this.store.reset(t),onLoadPrice:()=>this.handleLoadPrice(),isLoadingPrice:this.isLoadingPrice}),this.candlestickChart?.updateCandles(e.market.candles,e.market.vixCandles),this.optionsChain?.update({stockPrice:e.market.spyPrice,vix:e.market.vix,onSelectStrike:(t,i)=>this.handleStrikeSelection(t,i),selectedStrike:e.shortCall?.strike,mode:this.optionsChainMode,onModeChange:t=>{this.optionsChainMode=t}}),this.leapsPanel?.update({state:e,onBuyLEAPS:()=>this.openBuyLEAPSDialog(),onRollLEAPS:()=>this.openRollLEAPSDialog(),onCloseLEAPS:()=>this.closeLEAPS()}),this.shortCallPanel?.update({state:e,onSellCall:()=>this.openSellCallDialog(),onRollCall:()=>this.openRollCallDialog(),onBuyBackCall:()=>this.buyBackCall()})}handleStrikeSelection(e,t){const i=this.store.getState();if(this.optionsChainMode==="leaps"&&!i.leaps){const n=i.market.spyPrice-e;confirm(`Buy LEAPS Call Option?

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
▲ OTM (red) = Less premium, more upside`)}sellCall(e,t){this.store.dispatch({type:"SELL_SHORT_CALL",payload:{strike:e,premium:t.total,dte:5}})}openRollLEAPSDialog(){const e=this.store.getState();if(!e.leaps)return;const t=Math.round(e.market.spyPrice*.85/5)*5,i=C({stockPrice:e.market.spyPrice,strike:t,dte:365,vix:e.market.vix,isCall:!0});confirm(`Roll LEAPS?

Close current position and open new LEAPS:
New Strike: $${t}
New DTE: 365 days (1 year)
New Delta: ${(i.delta*100).toFixed(1)}%
New Cost: $${i.total.toLocaleString()}

This will realize any P&L on current position.`)&&this.store.dispatch({type:"ROLL_LEAPS",payload:{newStrike:t,newPremium:i.total,newDelta:i.delta,newTheta:i.theta,newDte:365,cost:i.total}})}openRollCallDialog(){const e=this.store.getState();if(!e.shortCall)return;let t=e.shortCall.strike;e.market.vix>25&&(t=Math.round((t-5)/5)*5);const i=C({stockPrice:e.market.spyPrice,strike:t,dte:5,vix:e.market.vix,isCall:!0});confirm(`Roll Short Call?

Buy back current call and sell new call:
New Strike: $${t}
New DTE: 5 days
New Premium: $${i.total.toLocaleString()}

Any profit/loss on current call will be realized.`)&&this.store.dispatch({type:"ROLL_SHORT_CALL",payload:{newStrike:t,newPremium:i.total,newDte:5,cost:0}})}closeLEAPS(){if(!this.store.getState().leaps)return;confirm("Close LEAPS position? This will realize all P&L.")&&this.store.dispatch({type:"CLOSE_LEAPS"})}buyBackCall(){const e=this.store.getState();if(!e.shortCall)return;const t=C({stockPrice:e.market.spyPrice,strike:e.shortCall.strike,dte:e.shortCall.dte,vix:e.market.vix,isCall:!0});confirm(`Buy back call option?

Cost to close: $${t.total.toLocaleString()}
Original credit: $${e.shortCall.premium.toLocaleString()}
P&L: $${(e.shortCall.premium-t.total).toLocaleString()}`)&&this.store.dispatch({type:"BUY_BACK_CALL",payload:{cost:t.total}})}destroy(){this.unsubscribe&&this.unsubscribe(),this.candlestickChart?.destroy()}}const Se=document.querySelector("#app"),Pe=new ke(Se);window.addEventListener("beforeunload",()=>{Pe.destroy()});
