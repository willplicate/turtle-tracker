📚 Tutorial 1: Shares vs LEAPS Comparison                                                                          
                                                                                                                     
  Overall Goal: Teach delta as "number of shares controlled"                                                         
                                                                                                                     
  ---                                                                                                                
  Screen 1: Own Shares                                                                                               
                                                                                                                     
  Learning: Simple ownership baseline                                                                                
                                                                                                                     
  Layout:                                                                                                            
  ┌─────────────────────────────────────────────────┐                                                                
  │  Tutorial 1: Shares vs LEAPS (Step 1 of 4)    │                                                                  
  │  Understanding Share Ownership                  │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
  ┌─────────────────────────────────────────────────┐                                                                
  │  YOUR PORTFOLIO                                 │                                                                
  │                                                  │                                                               
  │  Capital: $50,150                               │                                                                
  │  Shares Owned: [====85====] (slider 1-100)     │                                                                 
  │                                                  │                                                               
  │  SPY Price: $590                                │                                                                
  │  Total Cost: $50,150                            │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
                   [▶ ADVANCE 7 DAYS]                                                                                
                                                                                                                     
  ┌─────────────────────────────────────────────────┐                                                                
  │  RESULT (appears after clicking button)         │                                                                
  │                                                  │                                                               
  │  7 Days Later...                                │                                                                
  │  SPY: $590 → $595 (+$5)                        │                                                                 
  │                                                  │                                                               
  │  Your 85 shares:                                │                                                                
  │  $50,150 → $50,575                             │                                                                 
  │                                                  │                                                               
  │  Gain: +$425 ✓                                 │                                                                 
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
  💡 Simple: When SPY moves $5, you make $5 × 85 shares = $425                                                       
                                                                                                                     
                      [NEXT →]                                                                                       
                                                                                                                     
  Interactions:                                                                                                      
  - Slider to adjust share count (live updates total cost)                                                           
  - Button advances time & shows result                                                                              
  - Next button proceeds to Screen 2                                                                                 
                                                                                                                     
  ---                                                                                                                
  Screen 2: Swap for LEAPS                                                                                           
                                                                                                                     
  Learning: Same exposure, less capital, but costs theta                                                             
                                                                                                                     
  Layout:                                                                                                            
  ┌─────────────────────────────────────────────────┐                                                                
  │  Tutorial 1: Shares vs LEAPS (Step 2 of 4)    │                                                                  
  │  Introducing LEAPS                              │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
  ┌─────────────────────────────────────────────────┐                                                                
  │  YOUR 85 SHARES                                 │                                                                
  │  Cost: $50,150                                  │                                                                
  │  Ties up all your capital!                      │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
         [SWAP 85 SHARES → 85-DELTA LEAPS]                                                                           
                                                                                                                     
  ┌─────────────────────────────────────────────────┐                                                                
  │  AFTER SWAP (appears after clicking)            │                                                                
  │                                                  │                                                               
  │  LEAPS Position:                                │                                                                
  │  Strike: $510 (13% ITM)                        │                                                                 
  │  Cost: $12,900 ✓ (vs $50,150 for shares!)     │                                                                  
  │  Delta: 85% (controls 85 shares)               │                                                                 
  │  Theta: -$2/day (time decay cost)              │                                                                 
  │  DTE: 120 days                                  │                                                                
  │                                                  │                                                               
  │  Capital Freed: $37,250                         │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
                   [▶ ADVANCE 7 DAYS]                                                                                
                                                                                                                     
  ┌─────────────────────────────────────────────────┐                                                                
  │  RESULT (appears after clicking)                │                                                                
  │                                                  │                                                               
  │  7 Days Later: SPY $595 (+$5)                  │                                                                 
  │                                                  │                                                               
  │  BREAKDOWN:                                     │                                                                
  │  Delta Gain: $5 × 0.85 × 100 = +$425 ✓        │                                                                  
  │  (Same as shares!)                              │                                                                
  │                                                  │                                                               
  │  Theta Cost: -$2/day × 7 = -$14                │                                                                 
  │  (Your "rental fee")                            │                                                                
  │                                                  │                                                               
  │  Net Gain: +$411                                │                                                                
  │  LEAPS Value: $12,900 → $13,311                │                                                                 
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
  💡 Same upside as shares, costs $2/day to hold                                                                     
                                                                                                                     
                      [NEXT →]                                                                                       
                                                                                                                     
  Interactions:                                                                                                      
  - Button swaps shares for LEAPS                                                                                    
  - Advance button runs 7-day simulation                                                                             
  - Shows side-by-side breakdown                                                                                     
                                                                                                                     
  ---                                                                                                                
  Screen 3: Time Costs Money                                                                                         
                                                                                                                     
  Learning: Longer DTE = lower daily theta, but higher upfront cost                                                  
                                                                                                                     
  Layout:                                                                                                            
  ┌─────────────────────────────────────────────────┐                                                                
  │  Tutorial 1: Shares vs LEAPS (Step 3 of 4)    │                                                                  
  │  The Time/Cost Trade-off                        │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
  Compare two LEAPS with same delta (85%):                                                                           
                                                                                                                     
  ┌──────────────────┬──────────────────────────────┐                                                                
  │  SHORT-TERM      │  LONG-TERM                   │                                                                
  │  LEAPS           │  LEAPS                       │                                                                
  ├──────────────────┼──────────────────────────────┤                                                                
  │  30 DTE          │  120 DTE                     │                                                                
  │  Theta: -$8/day  │  Theta: -$2/day              │                                                                
  │  Cost: $10,200   │  Cost: $12,900               │                                                                
  │                  │                              │                                                                
  │  Weekly cost:    │  Weekly cost:                │                                                                
  │  $56             │  $14                         │                                                                
  └──────────────────┴──────────────────────────────┘                                                                
                                                                                                                     
           [====●====] DTE Slider (30-365)                                                                           
                  120 days                                                                                           
                                                                                                                     
  ┌─────────────────────────────────────────────────┐                                                                
  │  AS YOU MOVE THE SLIDER:                        │                                                                
  │                                                  │                                                               
  │  DTE: 120 days                                  │                                                                
  │  Upfront Cost: $12,900                          │                                                                
  │  Daily Theta: -$2.00                            │                                                                
  │  7-Day Total: -$14.00                           │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
  💡 Further out in time = cheaper per day, but higher upfront cost                                                  
     Turtle Strategy uses 120+ DTE to minimize daily bleed                                                           
                                                                                                                     
                      [NEXT →]                                                                                       
                                                                                                                     
  Interactions:                                                                                                      
  - Interactive slider changes DTE (30-365)                                                                          
  - Live updates cost, theta, 7-day total                                                                            
  - Visual comparison updates dynamically                                                                            
                                                                                                                     
  ---                                                                                                                
  Screen 4: The Trade-off                                                                                            
                                                                                                                     
  Learning: LEAPS = same exposure with 75% less capital, but theta is the cost                                       
                                                                                                                     
  Layout:                                                                                                            
  ┌─────────────────────────────────────────────────┐                                                                
  │  Tutorial 1: Shares vs LEAPS (Step 4 of 4)    │                                                                  
  │  Final Comparison: 30-Day Simulation            │                                                                
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
                 [RUN 30-DAY TEST]                                                                                   
                                                                                                                     
  ┌────────────────────┬─────────────────────────────┐                                                               
  │  85 SHARES         │  85-DELTA LEAPS             │                                                               
  │  Capital: $50,150  │  Capital: $12,900           │                                                               
  ├────────────────────┼─────────────────────────────┤                                                               
  │  UP SCENARIO       │                             │                                                               
  │  SPY +$10          │  SPY +$10                   │                                                               
  │  Gain: +$850 ✓     │  Delta: +$850               │                                                               
  │                    │  Theta: -$60                │                                                               
  │                    │  Net: +$790 ✓               │                                                               
  ├────────────────────┼─────────────────────────────┤                                                               
  │  DOWN SCENARIO     │                             │                                                               
  │  SPY -$10          │  SPY -$10                   │                                                               
  │  Loss: -$850       │  Delta: -$850               │                                                               
  │                    │  Theta: -$60                │                                                               
  │                    │  Net: -$910                 │                                                               
  └────────────────────┴─────────────────────────────┘                                                               
                                                                                                                     
  ┌─────────────────────────────────────────────────┐                                                                
  │  BONUS: CASH OPPORTUNITY                        │                                                                
  │                                                  │                                                               
  │  Freed Capital: $37,250                         │                                                                
  │  Earning 4.5% APY = ~$125/month                │                                                                 
  └─────────────────────────────────────────────────┘                                                                
                                                                                                                     
  💡 LEAPS gives you same exposure with 75% less capital.                                                            
     Theta cost ($60/month) is your "rental fee" for leverage.                                                       
     You keep $37k working elsewhere!                                                                                
                                                                                                                     
                [COMPLETE TUTORIAL →]                                                                                
                                                                                                                     
  Interactions:                                                                                                      
  - Button runs both scenarios simultaneously                                                                        
  - Animates results appearing                                                                                       
  - Shows comparison clearly                                                                                         
  - Completes tutorial                                                                                               
                                                                                                                     
  ---                                                                                                                
  🎨 Design Notes                                                                                                    
                                                                                                                     
  Color Scheme (per spec):                                                                                           
  - Background: Dark (#0b0f0f)                                                                                       
  - Green accents: #00FF41 (positive values)                                                                         
  - Red: #ef4444 (negative/warnings)                                                                                 
  - Monospace font for numbers                                                                                       
                                                                                                                     
  Visual Elements:                                                                                                   
  - Progress dots: "Step 2 of 4"                                                                                     
  - Card-based panels with subtle shadows                                                                            
  - Smooth transitions between states                                                                                
  - Clear visual hierarchy                                                                                           
                                                                                                                     
  Flow:                                                                                                              
  1. Screen 1: Understand shares (baseline)                                                                          
  2. Screen 2: Swap to LEAPS (aha! moment)                                                                           
  3. Screen 3: Explore time trade-off (interactive)                                                                  
  4. Screen 4: Compare scenarios (conclusion)                                                                        
                                                     