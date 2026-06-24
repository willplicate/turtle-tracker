#!/usr/bin/env python3
"""Assembles turtle-game-v2.html from the original source file."""

import os

src = os.path.join(os.path.dirname(__file__), 'minimal-game-with-leaps-selector.html')
out = os.path.join(os.path.dirname(__file__), 'turtle-game-v2.html')

with open(src, 'r') as f:
    lines = f.readlines()

# Original body content: lines 131-839 (1-indexed) = indices 130:839
original_body = ''.join(lines[130:839])

# Script content (inner only, no <script> tags): lines 841-3116 (1-indexed) = indices 840:3116
original_script = ''.join(lines[840:3116])

HEAD = """\
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Turtle Trading Simulator</title>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
    <style>
        /* ===== CSS Variables ===== */
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f8f8;
            --bg-tertiary: #f0f0f0;
            --border: #e0e0e0;
            --border-strong: #cccccc;
            --text-primary: #1a1a1a;
            --text-secondary: #666666;
            --text-tertiary: #999999;
            --accent-blue: #378ADD;
            --accent-blue-light: #E6F1FB;
            --accent-blue-dark: #0C447C;
            --green: #3B6D11;
            --green-light: #EAF3DE;
            --green-border: #97C459;
            --red: #A32D2D;
            --red-light: #FCEBEB;
            --red-border: #F09595;
            --amber: #854F0B;
            --amber-light: #FAEEDA;
            --amber-border: #EF9F27;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'IBM Plex Sans', system-ui, sans-serif;
            font-size: 14px;
            color: var(--text-primary);
            background: var(--bg-primary);
            line-height: 1.5;
        }

        /* ===== Topbar ===== */
        #topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            height: 48px;
            border-bottom: 1px solid var(--border);
            background: var(--bg-primary);
            position: sticky;
            top: 0;
            z-index: 10;
        }
        #topbar-title { font-size: 14px; font-weight: 500; color: var(--text-primary); }
        #topbar-context { font-size: 12px; color: var(--text-secondary); font-family: 'IBM Plex Mono', monospace; }

        /* ===== Step bar ===== */
        #stepbar {
            display: flex;
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
            position: sticky;
            top: 48px;
            z-index: 9;
        }
        .step {
            flex: 1;
            padding: 10px 16px;
            font-size: 12px;
            color: var(--text-tertiary);
            border-right: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .step:last-child { border-right: none; }
        .step.active { color: var(--accent-blue); background: var(--bg-primary); font-weight: 500; }
        .step.completed { color: var(--green); }
        .step-num {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: 11px;
            font-weight: 500;
            background: var(--bg-tertiary);
            color: var(--text-tertiary);
            flex-shrink: 0;
        }
        .step.active .step-num { background: var(--accent-blue); color: white; }
        .step.completed .step-num { background: var(--green-light); color: var(--green); }

        /* ===== Layout ===== */
        #main-layout {
            display: flex;
            align-items: flex-start;
            min-height: calc(100vh - 97px);
        }
        #left-panel {
            flex: 1;
            padding: 24px;
            min-width: 0;
            border-right: 1px solid var(--border);
        }
        #right-panel {
            width: 280px;
            flex-shrink: 0;
            padding: 16px;
            background: var(--bg-secondary);
            min-height: calc(100vh - 97px);
            position: sticky;
            top: 97px;
            max-height: calc(100vh - 97px);
            overflow-y: auto;
        }

        /* ===== Typography ===== */
        h1 { display: none; }
        h2 { font-size: 16px; font-weight: 500; margin-bottom: 16px; color: var(--text-primary); }
        h3 { font-size: 13px; font-weight: 500; margin: 16px 0 8px; color: var(--text-primary); }
        h4 { font-size: 12px; font-weight: 500; margin: 12px 0 6px; color: var(--text-primary); }

        .section-label {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-tertiary);
            margin-bottom: 10px;
        }

        /* ===== Cards ===== */
        .card {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 14px 16px;
            margin-bottom: 10px;
        }
        .card-title {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-tertiary);
            margin-bottom: 10px;
        }

        /* ===== Override old .section ===== */
        .section {
            background: none;
            border: none;
            padding: 0;
            margin: 0;
        }

        /* ===== Buttons ===== */
        button, .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 9px 18px;
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 13px;
            font-weight: 500;
            border: 1px solid var(--border-strong);
            border-radius: 4px;
            cursor: pointer;
            background: var(--bg-secondary);
            color: var(--text-primary);
            margin: 4px 4px 4px 0;
        }
        button:hover { background: var(--bg-tertiary); }

        /* Primary blue buttons */
        #setup-btn, #buy-leaps-btn, #run-week-btn, #continue-btn,
        #execute-roll-btn, #execute-adjust-btn, #annual-report-continue-btn {
            background: var(--accent-blue);
            color: white;
            border-color: var(--accent-blue);
            font-size: 14px;
            padding: 11px 24px;
        }
        #setup-btn { width: 100%; margin-top: 20px; }
        #setup-btn:hover, #buy-leaps-btn:hover, #run-week-btn:hover,
        #continue-btn:hover, #execute-roll-btn:hover, #execute-adjust-btn:hover {
            background: var(--accent-blue-dark);
            border-color: var(--accent-blue-dark);
        }

        /* Danger button */
        #margin-call-reset-btn {
            background: var(--red);
            color: white;
            border-color: var(--red);
            font-size: 14px;
            padding: 11px 24px;
        }
        #annual-report-reset-btn {
            background: var(--accent-blue);
            color: white;
            border-color: var(--accent-blue);
            font-size: 14px;
            padding: 11px 24px;
        }
        #annual-report-continue-btn { background: var(--green); border-color: var(--green); }

        /* Adjust/roll highlight */
        #adjust-leaps-btn {
            background: var(--green-light);
            color: var(--green);
            border-color: var(--green-border);
        }

        /* ===== Tables ===== */
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
        th {
            text-align: left;
            padding: 7px 10px;
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
        }
        td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
        tr:last-child td { border-bottom: none; }

        /* ===== Utility classes ===== */
        .money { font-family: 'IBM Plex Mono', monospace; }
        .positive { color: var(--green); }
        .negative { color: var(--red); }
        .warning { color: var(--amber); }

        /* ===== VIX indicators ===== */
        .vix-indicator {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            font-family: 'IBM Plex Mono', monospace;
        }
        .vix-complacent { background: var(--bg-tertiary); color: var(--text-secondary); }
        .vix-normal { background: var(--green-light); color: var(--green); }
        .vix-elevated { background: var(--amber-light); color: var(--amber); }
        .vix-high { background: var(--red-light); color: var(--red); }
        .vix-panic { background: var(--red-light); color: var(--red); font-weight: 700; }

        /* ===== Form controls ===== */
        select {
            font-family: 'IBM Plex Sans', sans-serif;
            font-size: 13px;
            padding: 7px 10px;
            border: 1px solid var(--border-strong);
            border-radius: 4px;
            background: white;
            color: var(--text-primary);
        }
        input[type="range"] {
            width: 100%;
            accent-color: var(--accent-blue);
            margin: 8px 0;
        }
        input[type="number"], input[type="text"] {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 14px;
            padding: 7px 10px;
            border: 1px solid var(--border-strong);
            border-radius: 4px;
            color: var(--text-primary);
            width: 100%;
        }
        label { font-size: 13px; color: var(--text-primary); }

        /* ===== Highlight box (LEAPS preview) ===== */
        .highlight-box {
            background: var(--accent-blue-light);
            border: 1px solid var(--accent-blue);
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
        }
        .highlight-box h3 { color: var(--accent-blue-dark); margin-top: 0; }

        /* ===== Premium breakdown ===== */
        .premium-breakdown {
            background: var(--bg-secondary);
            border-left: 3px solid var(--accent-blue);
            padding: 10px 12px;
            margin: 10px 0;
            font-size: 13px;
            border-radius: 0 4px 4px 0;
        }

        /* ===== Charts ===== */
        canvas { display: block; width: 100%; }
        #chart-container, .chart-wrapper {
            border: 1px solid var(--border);
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 12px;
            background: white;
        }
        .chart-label {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--text-secondary);
            padding: 8px 12px 4px;
        }
        .charts-container { display: flex; flex-direction: column; gap: 10px; }

        /* ===== Mode toggle (old) ===== */
        .mode-toggle {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 16px;
        }
        .toggle-switch { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        /* ===== New: Ticker cards ===== */
        .ticker-cards { display: flex; gap: 10px; margin: 10px 0; }
        .ticker-card {
            flex: 1;
            padding: 12px 14px;
            border: 2px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            background: var(--bg-secondary);
            transition: border-color 0.1s, background 0.1s;
        }
        .ticker-card:hover { border-color: var(--border-strong); }
        .ticker-card.selected { border-color: var(--accent-blue); background: var(--accent-blue-light); }
        .ticker-card-symbol { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 500; }
        .ticker-card-name { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
        .ticker-card-price { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

        /* ===== New: Scenario cards ===== */
        .scenario-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
        .scenario-card {
            padding: 10px 12px;
            border: 2px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            background: var(--bg-secondary);
            transition: border-color 0.1s;
        }
        .scenario-card:hover { border-color: var(--border-strong); }
        .scenario-card.selected { border-color: var(--accent-blue); background: var(--accent-blue-light); }
        .scenario-card-name { font-size: 13px; font-weight: 500; }
        .scenario-badge {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 2px;
            font-size: 10px;
            font-weight: 500;
            margin-bottom: 2px;
        }
        .badge-recommended { background: #EDE9FE; color: #5B21B6; border: 1px solid #C4B5FD; }
        .badge-bull { background: var(--green-light); color: var(--green); border: 1px solid var(--green-border); }
        .badge-bear { background: var(--red-light); color: var(--red); border: 1px solid var(--red-border); }
        .badge-amber { background: var(--amber-light); color: var(--amber); border: 1px solid var(--amber-border); }

        /* ===== New: DTE cards ===== */
        .dte-cards { display: flex; gap: 8px; margin: 8px 0; }
        .dte-card {
            flex: 1;
            padding: 10px;
            border: 2px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            background: var(--bg-secondary);
            text-align: center;
        }
        .dte-card:hover { border-color: var(--border-strong); }
        .dte-card.selected { border-color: var(--accent-blue); background: var(--accent-blue-light); }
        .dte-card-days { font-family: 'IBM Plex Mono', monospace; font-size: 18px; font-weight: 500; }
        .dte-card-months { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }

        /* ===== New: Mode toggle bar ===== */
        .mode-toggle-bar {
            display: inline-flex;
            border: 1px solid var(--border-strong);
            border-radius: 4px;
            overflow: hidden;
            margin: 8px 0;
        }
        .mode-tab {
            padding: 8px 18px;
            font-size: 13px;
            font-family: 'IBM Plex Sans', sans-serif;
            cursor: pointer;
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border: none;
            border-right: 1px solid var(--border-strong);
        }
        .mode-tab:last-child { border-right: none; }
        .mode-tab.active { background: var(--accent-blue); color: white; font-weight: 500; }

        /* ===== New: Capital presets ===== */
        .capital-input-row { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
        .capital-prefix {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-secondary);
            background: var(--bg-tertiary);
            border: 1px solid var(--border-strong);
            border-right: none;
            padding: 7px 10px;
            border-radius: 4px 0 0 4px;
            white-space: nowrap;
        }
        .capital-input-row input[type="number"] {
            border-radius: 0 4px 4px 0;
            border-left: none;
        }
        .capital-presets { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .preset-btn {
            padding: 4px 10px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 12px;
            border: 1px solid var(--border-strong);
            border-radius: 3px;
            background: var(--bg-secondary);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.1s;
        }
        .preset-btn:hover, .preset-btn.active {
            background: var(--accent-blue-light);
            border-color: var(--accent-blue);
            color: var(--accent-blue-dark);
        }

        /* ===== New: Info bubble ===== */
        .info-bubble {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: var(--bg-tertiary);
            border: 1px solid var(--border-strong);
            font-size: 10px;
            color: var(--text-secondary);
            cursor: pointer;
            margin-left: 4px;
            vertical-align: middle;
        }
        .info-tooltip {
            display: none;
            background: white;
            border: 1px solid var(--border-strong);
            border-radius: 6px;
            padding: 10px 12px;
            font-size: 12px;
            color: var(--text-secondary);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-top: 6px;
            line-height: 1.5;
        }
        .info-tooltip.open { display: block; }

        /* ===== New: Allocation bar ===== */
        .alloc-bar {
            height: 6px;
            border-radius: 3px;
            background: var(--bg-tertiary);
            overflow: hidden;
            margin: 6px 0 10px;
        }
        .alloc-bar-fill { height: 100%; background: var(--accent-blue); border-radius: 3px; }

        /* ===== New: Rules engine ===== */
        .rules-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 10px 0;
        }
        .regime-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .regime-normal { background: var(--green-light); color: var(--green); }
        .regime-elevated { background: var(--amber-light); color: var(--amber); }
        .regime-high { background: var(--red-light); color: var(--red); }

        /* Toggle switch */
        .toggle-label { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
        .toggle-switch-new {
            position: relative;
            width: 36px;
            height: 20px;
        }
        .toggle-switch-new input { display: none; }
        .toggle-slider {
            position: absolute;
            inset: 0;
            background: var(--border-strong);
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .toggle-slider::before {
            content: '';
            position: absolute;
            width: 14px;
            height: 14px;
            left: 3px;
            top: 3px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s;
        }
        .toggle-switch-new input:checked + .toggle-slider { background: var(--accent-blue); }
        .toggle-switch-new input:checked + .toggle-slider::before { transform: translateX(16px); }

        #rules-signal-box {
            display: none;
            background: var(--accent-blue-light);
            border: 1px solid var(--accent-blue);
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 13px;
            margin: 8px 0;
        }
        #rules-signal-box.open { display: block; }

        /* ===== New: Outcome banner ===== */
        .outcome-banner {
            border-radius: 6px;
            padding: 14px 16px;
            margin-bottom: 14px;
        }
        .outcome-banner-title { font-size: 15px; font-weight: 500; margin-bottom: 3px; }
        .outcome-banner-desc { font-size: 12px; opacity: 0.85; }
        .outcome-green { background: var(--green-light); color: var(--green); border: 1px solid var(--green-border); }
        .outcome-amber { background: var(--amber-light); color: var(--amber); border: 1px solid var(--amber-border); }
        .outcome-blue { background: var(--accent-blue-light); color: var(--accent-blue-dark); border: 1px solid var(--accent-blue); }
        .outcome-red { background: var(--red-light); color: var(--red); border: 1px solid var(--red-border); }

        /* ===== New: Inline confirm ===== */
        .inline-confirm {
            background: var(--accent-blue-light);
            border: 1px solid var(--accent-blue);
            border-radius: 6px;
            padding: 12px 16px;
            margin: 12px 0;
            font-size: 13px;
            color: var(--accent-blue-dark);
        }

        /* ===== Right panel ===== */
        .rp-card {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
        }
        .rp-title {
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-tertiary);
            margin-bottom: 8px;
        }
        .rp-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 4px 0;
            border-bottom: 1px solid var(--border);
            font-size: 12px;
        }
        .rp-row:last-child { border-bottom: none; }
        .rp-key { color: var(--text-secondary); }
        .rp-val { font-family: 'IBM Plex Mono', monospace; color: var(--text-primary); }
        .rp-big { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 500; margin: 4px 0 8px; }
        .rp-sub { font-size: 11px; color: var(--text-secondary); }

        .health-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            padding: 4px 0;
        }
        .health-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .health-green .health-dot { background: var(--green); }
        .health-amber .health-dot { background: var(--amber); }
        .health-red .health-dot { background: var(--red); }

        /* Right panel sub-sections (show/hide per screen) */
        .rp-section { display: none; }
        .rp-section.active { display: block; }

        /* Progress bar */
        .prog-track { height: 5px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; margin: 6px 0; }
        .prog-fill { height: 100%; background: var(--accent-blue); border-radius: 3px; transition: width 0.3s; }

        /* Trade history */
        .trade-history-toggle {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            padding: 7px 12px;
            margin: 8px 0;
            cursor: pointer;
            border-radius: 4px;
            font-size: 12px;
            user-select: none;
            color: var(--text-secondary);
        }
        .trade-history-content {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--border);
            padding: 8px 10px;
            background: white;
            border-radius: 0 0 4px 4px;
            font-size: 12px;
        }

        /* Margin call / annual report */
        #margin-call-screen h2 { color: var(--red); }
        #annual-report-screen h2 { color: var(--green); }

        /* Strike table row highlights */
        .strike-row-selected td { background: var(--accent-blue-light); }
        .strike-row-suggested td:first-child { border-left: 2px solid var(--accent-blue); }

        /* Health alert banners */
        .health-alert {
            border-radius: 6px;
            padding: 10px 12px;
            font-size: 13px;
            margin: 10px 0;
            border-width: 1px;
            border-style: solid;
        }
        .health-alert-green { background: var(--green-light); color: var(--green); border-color: var(--green-border); }
        .health-alert-amber { background: var(--amber-light); color: var(--amber); border-color: var(--amber-border); }
        .health-alert-red { background: var(--red-light); color: var(--red); border-color: var(--red-border); }

        /* Old inline styles - override common ones */
        [style*="background: #e8f5e9"] { background: var(--green-light) !important; }
        [style*="background: #ffebee"] { background: var(--red-light) !important; }
        [style*="background: #fff3cd"] { background: var(--amber-light) !important; }
        [style*="background: #e3f2fd"] { background: var(--accent-blue-light) !important; }
        [style*="background: #f5f5f5"] { background: var(--bg-secondary) !important; }
        [style*="color: #2e7d32"] { color: var(--green) !important; }
        [style*="color: #c62828"] { color: var(--red) !important; }
        [style*="color: #d32f2f"] { color: var(--red) !important; }
        [style*="color: #e65100"] { color: var(--amber) !important; }
        [style*="color: #856404"] { color: var(--amber) !important; }
        [style*="color: #4caf50"] { color: var(--green) !important; }
    </style>
</head>
<body>

<!-- ===== TOPBAR ===== -->
<div id="topbar">
    <div id="topbar-title">Turtle trading simulator</div>
    <div id="topbar-context"></div>
</div>

<!-- ===== STEP BAR ===== -->
<div id="stepbar">
    <div class="step active" id="step-1">
        <span class="step-num">1</span> Setup
    </div>
    <div class="step" id="step-2">
        <span class="step-num">2</span> Buy LEAPS
    </div>
    <div class="step" id="step-3">
        <span class="step-num">3</span> Sell call
    </div>
    <div class="step" id="step-4">
        <span class="step-num">4</span> Results
    </div>
</div>

<!-- ===== MAIN LAYOUT ===== -->
<div id="main-layout">

  <!-- LEFT PANEL: all game screens -->
  <div id="left-panel">
"""

BODY_CLOSE = """
  </div><!-- /left-panel -->

  <!-- RIGHT PANEL: persistent summary -->
  <div id="right-panel">

    <!-- Screen 1: Session preview -->
    <div class="rp-section active" id="rp-setup">
      <div class="rp-card">
        <div class="rp-title">Session Preview</div>
        <div class="rp-row"><span class="rp-key">Starting capital</span><span class="rp-val" id="rp-capital">$20,000</span></div>
        <div class="rp-row"><span class="rp-key">Ticker</span><span class="rp-val" id="rp-ticker">SPY</span></div>
        <div class="rp-row"><span class="rp-key">Scenario</span><span class="rp-val" id="rp-scenario">Mystery</span></div>
        <div class="rp-row"><span class="rp-key">Pricing</span><span class="rp-val" id="rp-pricing">Simple</span></div>
      </div>
      <div class="rp-card" id="rp-leaps-est">
        <div class="rp-title">Estimated LEAPS Cost</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;" id="rp-leaps-desc">Select ticker &amp; scenario to see estimate.</div>
        <div class="rp-row"><span class="rp-key">1 contract (360d)</span><span class="rp-val" id="rp-est-cost">—</span></div>
        <div class="rp-row"><span class="rp-key">% of account</span><span class="rp-val" id="rp-est-pct">—</span></div>
        <div class="rp-row"><span class="rp-key">Cash remaining</span><span class="rp-val" id="rp-est-cash">—</span></div>
        <div class="alloc-bar"><div class="alloc-bar-fill" id="rp-alloc-bar" style="width:0%"></div></div>
        <div style="font-size:11px;color:var(--text-tertiary);">Recommended: keep 50%+ as cash reserve</div>
      </div>
      <div class="rp-card" id="rp-small-account-tip" style="display:none;background:var(--amber-light);border-color:var(--amber-border);">
        <div class="rp-title" style="color:var(--amber);">Small Account Tip</div>
        <div style="font-size:12px;color:var(--amber);">With under $10k, consider 1 IWM contract only. Never put more than 50% into the LEAPS — you need the reserve to roll during stress.</div>
      </div>
    </div>

    <!-- Screen 2: LEAPS preview -->
    <div class="rp-section" id="rp-leaps">
      <div class="rp-card" style="background:var(--accent-blue-light);border-color:var(--accent-blue);">
        <div class="rp-title" style="color:var(--accent-blue-dark);">Position Summary</div>
        <div class="rp-row"><span class="rp-key">Strike</span><span class="rp-val" id="rp2-strike">—</span></div>
        <div class="rp-row"><span class="rp-key">Expiry</span><span class="rp-val" id="rp2-expiry">—</span></div>
        <div class="rp-row"><span class="rp-key">Delta</span><span class="rp-val" id="rp2-delta">—</span></div>
        <div class="rp-row"><span class="rp-key">Theta / day</span><span class="rp-val" id="rp2-theta-day">—</span></div>
        <div class="rp-row"><span class="rp-key">Theta / week</span><span class="rp-val" id="rp2-theta-week">—</span></div>
        <div class="rp-row"><span class="rp-key">Cost per contract</span><span class="rp-val" id="rp2-cost-per">—</span></div>
        <div class="rp-row"><span class="rp-key">Total cost</span><span class="rp-val" id="rp2-cost-total">—</span></div>
      </div>
      <div class="rp-card">
        <div class="rp-title">Capital Allocation</div>
        <div class="rp-row"><span class="rp-key">Starting capital</span><span class="rp-val" id="rp2-cap">—</span></div>
        <div class="rp-row"><span class="rp-key">LEAPS cost</span><span class="rp-val" id="rp2-leaps-cost">—</span></div>
        <div class="rp-row"><span class="rp-key">Cash remaining</span><span class="rp-val" id="rp2-cash">—</span></div>
        <div class="alloc-bar"><div class="alloc-bar-fill" id="rp2-alloc" style="width:0%"></div></div>
        <div style="font-size:11px;color:var(--text-tertiary);">Rule: keep at least 50% of account as cash</div>
      </div>
      <div class="rp-card">
        <div class="rp-title">Weekly Cost to Own</div>
        <div class="rp-row"><span class="rp-key">Theta / week</span><span class="rp-val negative" id="rp2-wk-theta">—</span></div>
        <div class="rp-row"><span class="rp-key">Typical premium</span><span class="rp-val positive" id="rp2-wk-premium">—</span></div>
        <div class="rp-row"><span class="rp-key">Net weekly edge</span><span class="rp-val" id="rp2-wk-edge">—</span></div>
      </div>
    </div>

    <!-- Screen 3: Sell call -->
    <div class="rp-section" id="rp-sell">
      <div class="rp-card">
        <div class="rp-title">Your Position</div>
        <div class="rp-row"><span class="rp-key">LEAPS strike</span><span class="rp-val" id="rp3-strike">—</span></div>
        <div class="rp-row"><span class="rp-key">Expiry</span><span class="rp-val" id="rp3-expiry">—</span></div>
        <div class="rp-row"><span class="rp-key">Delta</span><span class="rp-val" id="rp3-delta">—</span></div>
        <div class="rp-row"><span class="rp-key">DTE</span><span class="rp-val" id="rp3-dte">—</span></div>
        <div class="rp-row"><span class="rp-key">LEAPS value</span><span class="rp-val" id="rp3-leaps-val">—</span></div>
        <div class="rp-row"><span class="rp-key">Cash reserve</span><span class="rp-val" id="rp3-cash">—</span></div>
        <div class="rp-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:6px;"><span class="rp-key" style="font-weight:500;">Total account</span><span class="rp-val" style="font-size:15px;" id="rp3-total">—</span></div>
      </div>
      <div class="rp-card">
        <div class="rp-title">Season Progress</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;" id="rp3-week-label">Week — of 52</div>
        <div class="prog-track"><div class="prog-fill" id="rp3-prog" style="width:0%"></div></div>
      </div>
      <div class="rp-card">
        <div class="rp-title">Running Totals</div>
        <div class="rp-big positive" id="rp3-account-big">—</div>
        <div class="rp-sub" id="rp3-since-start">— since start</div>
        <div style="margin-top:10px;">
          <div class="rp-row"><span class="rp-key">Premium collected</span><span class="rp-val positive" id="rp3-premium">—</span></div>
          <div class="rp-row"><span class="rp-key">LEAPS P&amp;L</span><span class="rp-val" id="rp3-leaps-pnl">—</span></div>
          <div class="rp-row"><span class="rp-key">Annualised return</span><span class="rp-val" id="rp3-annual">—</span></div>
          <div class="rp-row"><span class="rp-key">Weeks traded</span><span class="rp-val" id="rp3-weeks">—</span></div>
        </div>
      </div>
    </div>

    <!-- Screen 4: Results -->
    <div class="rp-section" id="rp-results">
      <div class="rp-card">
        <div class="rp-title">Running Totals</div>
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <div style="flex:1;background:var(--bg-secondary);border-radius:4px;padding:8px;text-align:center;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;">Avg / Week</div>
            <div class="money positive" style="font-size:14px;" id="rp4-avg-week">—</div>
          </div>
          <div style="flex:1;background:var(--bg-secondary);border-radius:4px;padding:8px;text-align:center;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;">Ann. Return</div>
            <div class="money" style="font-size:14px;" id="rp4-ann-ret">—</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <div style="flex:1;background:var(--bg-secondary);border-radius:4px;padding:8px;text-align:center;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;">Total Premium</div>
            <div class="money positive" style="font-size:14px;" id="rp4-total-prem">—</div>
          </div>
          <div style="flex:1;background:var(--bg-secondary);border-radius:4px;padding:8px;text-align:center;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;">Win Rate</div>
            <div class="money" style="font-size:14px;" id="rp4-win-rate">—</div>
          </div>
        </div>
      </div>
      <div class="rp-card">
        <div class="rp-title">Season Progress</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;" id="rp4-week-label">Week — of 52</div>
        <div class="prog-track"><div class="prog-fill" id="rp4-prog" style="width:0%"></div></div>
      </div>
      <div class="rp-card" id="rp4-health-card">
        <div class="rp-title">LEAPS Health</div>
        <div class="rp-row"><span class="rp-key">Delta</span><span class="rp-val" id="rp4-delta">—</span></div>
        <div class="rp-row"><span class="rp-key">DTE remaining</span><span class="rp-val" id="rp4-dte">—</span></div>
        <div class="rp-row"><span class="rp-key">Current value</span><span class="rp-val" id="rp4-leaps-val">—</span></div>
        <div class="rp-row"><span class="rp-key">vs cost basis</span><span class="rp-val" id="rp4-vs-cost">—</span></div>
      </div>
      <div class="rp-card">
        <div class="rp-title">Capital Position</div>
        <div class="rp-row"><span class="rp-key">LEAPS value</span><span class="rp-val" id="rp4-cap-leaps">—</span></div>
        <div class="rp-row"><span class="rp-key">Cash reserve</span><span class="rp-val" id="rp4-cap-cash">—</span></div>
        <div class="rp-row"><span class="rp-key">Total account</span><span class="rp-val" id="rp4-cap-total">—</span></div>
        <div class="rp-row"><span class="rp-key">Cash as % of acct</span><span class="rp-val" id="rp4-cash-pct">—</span></div>
      </div>
      <div class="rp-card" style="background:var(--bg-secondary);">
        <div class="rp-title">Next Week Signal</div>
        <div style="font-size:12px;color:var(--text-secondary);" id="rp4-next-signal">Run a week to see signal.</div>
      </div>
    </div>

  </div><!-- /right-panel -->

</div><!-- /main-layout -->
"""

NEW_JS = """
        // ===== NEW: EMA CALCULATION =====
        function calculateEMA(data, period) {
            if (data.length === 0) return [];
            const k = 2 / (period + 1);
            let ema = [data[0]];
            for (let i = 1; i < data.length; i++) {
                ema.push(data[i] * k + ema[i-1] * (1 - k));
            }
            return ema;
        }

        // ===== NEW: RULES ENGINE =====
        function getRulesSignal(vixHistory, vixEMA) {
            if (!vixHistory || vixHistory.length < 2) return null;
            const currentRVX = vixHistory[vixHistory.length - 1];
            const currentEMA = vixEMA[vixEMA.length - 1];
            const prevEMA = vixEMA[vixEMA.length - 2] || currentEMA;
            const emaFalling = currentEMA < prevEMA;

            const recentWindow = vixHistory.slice(-4);
            const recentPeak = Math.max(...recentWindow);
            const droppedFromPeak = recentPeak - currentRVX;

            if (droppedFromPeak >= 10 && emaFalling)
                return { action: 'Go uncovered', reason: 'RVX falling fast from recent peak — let the LEAPS run', type: 'blue' };
            if (currentRVX > 27 && !emaFalling)
                return { action: 'Sell ITM call', reason: 'Crisis regime — collect maximum premium', type: 'red' };
            if (currentRVX >= 22)
                return { action: 'Sell ATM call', reason: 'Elevated volatility — premium compensates for capped upside', type: 'amber' };
            return { action: 'Sell OTM call', reason: 'Calm regime — modest income, keep most upside', type: 'green' };
        }

        // ===== NEW: STEP BAR + TOPBAR UPDATER =====
        function setActiveStep(n) {
            for (let i = 1; i <= 4; i++) {
                const el = document.getElementById('step-' + i);
                if (!el) continue;
                el.classList.remove('active', 'completed');
                const num = el.querySelector('.step-num');
                if (i < n) {
                    el.classList.add('completed');
                    num.textContent = '✓';
                } else if (i === n) {
                    el.classList.add('active');
                    num.textContent = i;
                } else {
                    num.textContent = i;
                }
            }
            // Show the right right-panel section
            document.querySelectorAll('.rp-section').forEach(s => s.classList.remove('active'));
            const rpMap = { 1: 'rp-setup', 2: 'rp-leaps', 3: 'rp-sell', 4: 'rp-results' };
            const rpEl = document.getElementById(rpMap[n]);
            if (rpEl) rpEl.classList.add('active');
        }

        function updateTopbarContext(text) {
            const el = document.getElementById('topbar-context');
            if (el) el.textContent = text;
        }

        // ===== NEW: RIGHT PANEL UPDATERS =====
        function updateRpSetup() {
            const cap = parseInt(document.getElementById('capital-input')?.value || 20000);
            const ticker = document.getElementById('ticker-select')?.value || 'SPY';
            const scenario = document.getElementById('market-scenario')?.value || 'random';
            const mode = document.getElementById('mode-select')?.value === 'advanced' ? 'Advanced (VIX)' : 'Simple';
            const scenarioNames = {
                random:'Mystery', bull:'Bull market', 'moderate-bull':'Moderate bull',
                bear:'Bear market', 'moderate-bear':'Moderate bear',
                choppy:'Sideways chop', 'high-vol':'High volatility',
                crash:'Flash crash', 'bear-recovery':'V-shape recovery'
            };

            const fmt = n => '$' + Math.round(n).toLocaleString();
            const tickerPrice = selectedTicker ? selectedTicker.startingPrice : (ticker === 'IWM' ? 214 : 590);
            const strike = tickerPrice - 80;
            const estCost = createLEAPS(tickerPrice, strike, 360, 1).value;
            const pct = estCost / cap * 100;

            const capEl = document.getElementById('rp-capital');
            if (capEl) capEl.textContent = fmt(cap);
            const tkEl = document.getElementById('rp-ticker');
            if (tkEl) tkEl.textContent = ticker + ' · $' + tickerPrice;
            const scEl = document.getElementById('rp-scenario');
            if (scEl) scEl.textContent = scenarioNames[scenario] || scenario;
            const modeEl = document.getElementById('rp-pricing');
            if (modeEl) modeEl.textContent = mode;

            const costEl = document.getElementById('rp-est-cost');
            if (costEl) costEl.textContent = fmt(estCost);
            const pctEl = document.getElementById('rp-est-pct');
            if (pctEl) pctEl.textContent = pct.toFixed(0) + '%';
            const cashEl = document.getElementById('rp-est-cash');
            if (cashEl) cashEl.textContent = fmt(cap - estCost);
            const barEl = document.getElementById('rp-alloc-bar');
            if (barEl) barEl.style.width = Math.min(100, pct) + '%';

            const tipEl = document.getElementById('rp-small-account-tip');
            if (tipEl) tipEl.style.display = cap < 10000 ? 'block' : 'none';
        }

        function updateRpLeaps() {
            const p = document.getElementById('preview-strike');
            if (!p || !p.textContent || p.textContent === '-') return;
            const fmt = n => '$' + Math.round(n).toLocaleString();
            const get = id => document.getElementById(id)?.textContent || '—';
            const cap = parseInt(document.getElementById('capital-input')?.value || 20000);
            const totalCostRaw = parseFloat(get('preview-cost-total').replace(/,/g,'')) || 0;
            const thetaDay = parseFloat(get('preview-theta').replace(/,/g,'')) || 0;
            const thetaWeek = thetaDay * 7;
            const typicalPremium = thetaWeek * 1.3; // rough estimate

            const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
            set('rp2-strike', '$' + get('preview-strike'));
            // Expiry: approximate from DTE
            const dteVal = parseInt(document.querySelector('input[name="dte"]:checked')?.value || 360);
            const expiry = new Date(); expiry.setDate(expiry.getDate() + dteVal);
            set('rp2-expiry', expiry.toLocaleDateString('en-US',{month:'short',year:'numeric'}));
            set('rp2-delta', get('preview-delta'));
            set('rp2-theta-day', '-$' + get('preview-theta'));
            set('rp2-theta-week', '-$' + thetaWeek.toFixed(0));
            set('rp2-cost-per', '$' + get('preview-cost-per'));
            set('rp2-cost-total', '$' + get('preview-cost-total'));
            set('rp2-cap', fmt(cap));
            set('rp2-leaps-cost', '$' + get('preview-cost-total'));
            set('rp2-cash', fmt(cap - totalCostRaw));
            const allocPct = totalCostRaw / cap * 100;
            const allocBar = document.getElementById('rp2-alloc');
            if (allocBar) allocBar.style.width = Math.min(100, allocPct) + '%';
            set('rp2-wk-theta', '-$' + thetaWeek.toFixed(0));
            set('rp2-wk-premium', '~$' + typicalPremium.toFixed(0));
            const edge = typicalPremium - thetaWeek;
            const edgeEl = document.getElementById('rp2-wk-edge');
            if (edgeEl) {
                edgeEl.textContent = (edge >= 0 ? '+' : '') + '$' + edge.toFixed(0);
                edgeEl.className = 'rp-val ' + (edge >= 0 ? 'positive' : 'negative');
            }
        }

        function updateRpSell() {
            if (!cumulativeState || !cumulativeState.leapsPosition) return;
            const leaps = cumulativeState.leapsPosition;
            const cash = cumulativeState.currentBalance - leaps.value;
            const total = cumulativeState.currentBalance;
            const startCap = cumulativeState.totalStartingBalance;
            const week = typeof weekNumber !== 'undefined' ? weekNumber : 1;
            const fmt = n => '$' + Math.round(Math.abs(n)).toLocaleString();
            const fmtSigned = n => (n >= 0 ? '+' : '-') + fmt(n);

            const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
            set('rp3-strike', '$' + leaps.strike);
            const expEl = document.getElementById('rp3-expiry');
            if (expEl) {
                const ex = new Date(); ex.setDate(ex.getDate() + leaps.dte);
                expEl.textContent = 'Jun ' + ex.getFullYear();
            }
            set('rp3-delta', leaps.delta.toFixed(2));
            set('rp3-dte', leaps.dte + ' days');
            set('rp3-leaps-val', '$' + Math.round(leaps.value).toLocaleString());
            set('rp3-cash', '$' + Math.round(cash).toLocaleString());
            set('rp3-total', '$' + Math.round(total).toLocaleString());
            set('rp3-week-label', 'Week ' + week + ' of 52');
            const p3prog = document.getElementById('rp3-prog');
            if (p3prog) p3prog.style.width = (week / 52 * 100).toFixed(1) + '%';

            const totalChange = total - startCap;
            const bigEl = document.getElementById('rp3-account-big');
            if (bigEl) {
                bigEl.textContent = '$' + Math.round(total).toLocaleString();
                bigEl.className = 'rp-big ' + (totalChange >= 0 ? 'positive' : 'negative');
            }
            set('rp3-since-start', (totalChange >= 0 ? '+' : '') + '$' + Math.round(totalChange).toLocaleString() + ' since start');

            // Running totals from history
            const hist = cumulativeState.weekHistory || [];
            const totalPremium = cumulativeState.totalPremiumCollected || 0;
            const leapsPnl = leaps.value - leaps.costBasis;
            const annReturn = week > 0 ? ((total / startCap - 1) / week * 52 * 100) : 0;
            set('rp3-premium', '+$' + Math.round(totalPremium).toLocaleString());
            const lpEl = document.getElementById('rp3-leaps-pnl');
            if (lpEl) {
                lpEl.textContent = (leapsPnl >= 0 ? '+' : '') + '$' + Math.round(leapsPnl).toLocaleString();
                lpEl.className = 'rp-val ' + (leapsPnl >= 0 ? 'positive' : 'negative');
            }
            set('rp3-annual', annReturn.toFixed(1) + '%');
            set('rp3-weeks', week);

            updateTopbarContext('Week ' + week + ' of 52 | ' + (cumulativeState.ticker || 'SPY') + ' $' + cumulativeState.currentSPY.toFixed(2) + ' | RVX ' + vixSimulator.currentVix.toFixed(2));
        }

        function updateRpResults() {
            if (!cumulativeState || !cumulativeState.leapsPosition) return;
            const leaps = cumulativeState.leapsPosition;
            const cash = cumulativeState.currentBalance - leaps.value;
            const total = cumulativeState.currentBalance;
            const startCap = cumulativeState.totalStartingBalance;
            const week = typeof weekNumber !== 'undefined' ? weekNumber : 1;
            const hist = cumulativeState.weekHistory || [];
            const totalPremium = cumulativeState.totalPremiumCollected || 0;

            const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };

            // 4 stat cards
            const avgWeek = week > 0 ? (total - startCap) / week : 0;
            const annRet = week > 0 ? ((total / startCap - 1) / week * 52 * 100) : 0;
            const winWeeks = hist.filter(w => w.weeklyPnL > 0).length;
            const winRate = week > 0 ? (winWeeks / week * 100) : 0;
            set('rp4-avg-week', (avgWeek >= 0 ? '+' : '') + '$' + Math.abs(Math.round(avgWeek)).toLocaleString());
            set('rp4-ann-ret', annRet.toFixed(1) + '%');
            set('rp4-total-prem', '+$' + Math.round(totalPremium).toLocaleString());
            set('rp4-win-rate', winRate.toFixed(0) + '%');

            // Progress
            set('rp4-week-label', 'Week ' + week + ' of 52');
            const p4prog = document.getElementById('rp4-prog');
            if (p4prog) p4prog.style.width = (week / 52 * 100).toFixed(1) + '%';

            // LEAPS health
            const leapsPnl = leaps.value - leaps.costBasis;
            set('rp4-delta', leaps.delta.toFixed(2));
            set('rp4-dte', leaps.dte + ' days');
            set('rp4-leaps-val', '$' + Math.round(leaps.value).toLocaleString());
            const vcEl = document.getElementById('rp4-vs-cost');
            if (vcEl) {
                vcEl.textContent = (leapsPnl >= 0 ? '+' : '') + '$' + Math.round(leapsPnl).toLocaleString();
                vcEl.className = 'rp-val ' + (leapsPnl >= 0 ? 'positive' : 'negative');
            }
            const hCard = document.getElementById('rp4-health-card');
            if (hCard) {
                hCard.style.borderColor = leaps.delta >= 0.80 && leaps.dte >= 180 ? 'var(--green-border)'
                    : leaps.delta >= 0.72 && leaps.dte >= 150 ? 'var(--amber-border)' : 'var(--red-border)';
            }

            // Capital position
            set('rp4-cap-leaps', '$' + Math.round(leaps.value).toLocaleString());
            set('rp4-cap-cash', '$' + Math.round(cash).toLocaleString());
            set('rp4-cap-total', '$' + Math.round(total).toLocaleString());
            set('rp4-cash-pct', (cash / total * 100).toFixed(1) + '%');

            // Next week signal
            const sigEl = document.getElementById('rp4-next-signal');
            if (sigEl && vixSimulator) {
                const emaArr = calculateEMA(vixSimulator.vixHistory, 15);
                const sig = getRulesSignal(vixSimulator.vixHistory, emaArr);
                if (sig) sigEl.textContent = 'RVX ' + vixSimulator.currentVix.toFixed(1) + ' — regime suggests: ' + sig.action;
            }

            updateTopbarContext('Week ' + week + ' results | ' + (cumulativeState.ticker || 'SPY') + ' $' + cumulativeState.currentSPY.toFixed(2) + ' | RVX ' + vixSimulator.currentVix.toFixed(2));
        }

        // ===== NEW: CAPITAL INPUT + PRESETS =====
        // Insert capital input into Setup screen
        (function setupCapitalInput() {
            const initialState = document.getElementById('initial-state');
            if (!initialState) return;

            // Create capital section to prepend
            const capSection = document.createElement('div');
            capSection.style.cssText = 'margin-bottom:24px;';
            capSection.innerHTML = `
                <div class="section-label">Starting Capital</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">
                    How much are you starting with?
                    <span class="info-bubble" data-tip="capital">?</span>
                </div>
                <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:10px;">
                    The simulator will show how much LEAPS cost relative to your account.
                </div>
                <div class="capital-input-row">
                    <span class="capital-prefix">USD</span>
                    <input type="number" id="capital-input" value="20000" min="1000" step="1000">
                </div>
                <div class="capital-presets">
                    <button class="preset-btn" data-amount="5000">$5k</button>
                    <button class="preset-btn" data-amount="10000">$10k</button>
                    <button class="preset-btn active" data-amount="20000">$20k</button>
                    <button class="preset-btn" data-amount="50000">$50k</button>
                    <button class="preset-btn" data-amount="100000">$100k</button>
                </div>
                <div class="info-tooltip" id="tip-capital">
                    Your starting bankroll. A larger account allows more contracts and more cash cushion for rolling LEAPS during downturns.
                </div>
            `;
            initialState.insertBefore(capSection, initialState.firstChild);

            // Preset button logic
            capSection.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    capSection.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('capital-input').value = btn.dataset.amount;
                    updateRpSetup();
                });
            });
            document.getElementById('capital-input').addEventListener('input', () => {
                capSection.querySelectorAll('.preset-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.amount == document.getElementById('capital-input').value);
                });
                updateRpSetup();
            });
        })();

        // Wire setup-btn to update cumulativeState capital
        document.getElementById('setup-btn').addEventListener('click', function() {
            const cap = parseInt(document.getElementById('capital-input')?.value || 20000);
            cumulativeState.totalStartingBalance = cap;
            cumulativeState.currentBalance = cap;
            setActiveStep(2);
            setTimeout(updateRpLeaps, 50);
            updateTopbarContext((selectedTicker?.name || 'SPY') + ' $' + (selectedTicker?.startingPrice || 590) + ' | Capital $' + cap.toLocaleString());
        });

        // ===== NEW: TICKER CARDS =====
        (function setupTickerCards() {
            const initialState = document.getElementById('initial-state');
            if (!initialState) return;

            // Find the ticker select div and replace it
            const oldTickerDiv = initialState.querySelector('[style*="background: #e3f2fd"]');
            if (!oldTickerDiv) return;

            const newDiv = document.createElement('div');
            newDiv.style.cssText = 'margin-bottom:24px;';
            newDiv.innerHTML = `
                <div class="section-label">Underlying Ticker</div>
                <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:10px;">
                    Which ETF to trade LEAPS on. IWM is cheaper per contract, easier to start with smaller capital.
                </div>
                <div class="ticker-cards">
                    <div class="ticker-card selected" data-ticker="SPY">
                        <div class="ticker-card-symbol">SPY</div>
                        <div class="ticker-card-name">S&amp;P 500 ETF</div>
                        <div class="ticker-card-price">~$590 / share</div>
                    </div>
                    <div class="ticker-card" data-ticker="IWM">
                        <div class="ticker-card-symbol">IWM</div>
                        <div class="ticker-card-name">iShares Russell 2000 ETF</div>
                        <div class="ticker-card-price">~$214 / share</div>
                    </div>
                </div>
            `;
            oldTickerDiv.parentNode.insertBefore(newDiv, oldTickerDiv);
            oldTickerDiv.style.display = 'none';

            newDiv.querySelectorAll('.ticker-card').forEach(card => {
                card.addEventListener('click', () => {
                    newDiv.querySelectorAll('.ticker-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    const sel = document.getElementById('ticker-select');
                    if (sel) { sel.value = card.dataset.ticker; sel.dispatchEvent(new Event('change')); }
                    setTimeout(updateRpSetup, 50);
                });
            });
        })();

        // ===== NEW: SCENARIO CARDS =====
        (function setupScenarioCards() {
            const initialState = document.getElementById('initial-state');
            if (!initialState) return;

            const scenarioData = [
                { value: 'random', name: 'Mystery scenario', badge: 'Recommended', badgeClass: 'badge-recommended', desc: 'Hidden — use VIX to figure it out' },
                { value: 'bull', name: 'Bull market', badge: 'Bullish', badgeClass: 'badge-bull', desc: '+2% weekly drift, low volatility' },
                { value: 'bear', name: 'Bear market', badge: 'Bearish', badgeClass: 'badge-bear', desc: 'Slow grind down, elevated VIX' },
                { value: 'choppy', name: 'Sideways chop', badge: 'Choppy', badgeClass: 'badge-amber', desc: 'No clear trend, range-bound' },
                { value: 'crash', name: 'Flash crash', badge: 'Crisis', badgeClass: 'badge-bear', desc: '2020-style drop, VIX spikes to 80' },
                { value: 'bear-recovery', name: 'V-shape recovery', badge: 'Recovery', badgeClass: 'badge-bull', desc: 'Crash then sharp rally — hardest regime' },
            ];

            const oldScenDiv = initialState.querySelectorAll('[style*="background: #f5f5f5"]')[0];
            if (!oldScenDiv) return;

            const newDiv = document.createElement('div');
            newDiv.style.cssText = 'margin-bottom:24px;';
            newDiv.innerHTML = `
                <div class="section-label">Market Scenario</div>
                <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:10px;">
                    Pick a scenario or let the simulator surprise you. Use RVX to read the regime — just like the real strategy.
                </div>
                <div class="scenario-grid">
                    ${scenarioData.map(s => `
                        <div class="scenario-card${s.value === 'random' ? ' selected' : ''}" data-scenario="${s.value}">
                            <span class="scenario-badge ${s.badgeClass}">${s.badge}</span>
                            <div class="scenario-card-name">${s.name}</div>
                            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">${s.desc}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            oldScenDiv.parentNode.insertBefore(newDiv, oldScenDiv);
            oldScenDiv.style.display = 'none';

            newDiv.querySelectorAll('.scenario-card').forEach(card => {
                card.addEventListener('click', () => {
                    newDiv.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    const sel = document.getElementById('market-scenario');
                    if (sel) { sel.value = card.dataset.scenario; sel.dispatchEvent(new Event('change')); }
                    setTimeout(updateRpSetup, 50);
                });
            });
        })();

        // ===== NEW: PRICING MODE TOGGLE =====
        (function setupModeToggle() {
            const modeToggle = document.querySelector('.mode-toggle');
            if (!modeToggle) return;

            const newDiv = document.createElement('div');
            newDiv.style.cssText = 'margin-bottom:24px;';
            newDiv.innerHTML = `
                <div class="section-label">Pricing Model</div>
                <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:10px;" id="new-mode-desc">
                    Advanced mode shows how volatility affects option prices in real time. Recommended once you understand the basics.
                </div>
                <div class="mode-toggle-bar">
                    <button class="mode-tab active" data-mode="simple">Simple (no VIX)</button>
                    <button class="mode-tab" data-mode="advanced">Advanced (with VIX)</button>
                </div>
            `;
            modeToggle.parentNode.insertBefore(newDiv, modeToggle);
            modeToggle.style.display = 'none';

            newDiv.querySelectorAll('.mode-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    newDiv.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    const sel = document.getElementById('mode-select');
                    if (sel) { sel.value = tab.dataset.mode; sel.dispatchEvent(new Event('change')); }
                    setTimeout(updateRpSetup, 50);
                });
            });
        })();

        // ===== NEW: DTE CARDS =====
        (function setupDteCards() {
            // For the leaps-selector screen
            const leapsSel = document.getElementById('leaps-selector');
            if (!leapsSel) return;

            // Find the DTE radio section
            const dteSection = leapsSel.querySelector('h3:nth-of-type(3)');
            const radioContainer = leapsSel.querySelector('[style*="margin: 15px 0"]');
            if (!radioContainer) return;

            const newDiv = document.createElement('div');
            newDiv.style.cssText = 'margin:8px 0 16px;';
            newDiv.innerHTML = `
                <div class="dte-cards">
                    <div class="dte-card" data-dte="200">
                        <div class="dte-card-days">200d</div>
                        <div class="dte-card-months">~7 months</div>
                    </div>
                    <div class="dte-card selected" data-dte="360">
                        <div class="dte-card-days">360d</div>
                        <div class="dte-card-months">~12 months</div>
                    </div>
                    <div class="dte-card" data-dte="450">
                        <div class="dte-card-days">450d</div>
                        <div class="dte-card-months">~15 months</div>
                    </div>
                </div>
            `;
            radioContainer.parentNode.insertBefore(newDiv, radioContainer);
            radioContainer.style.display = 'none';

            newDiv.querySelectorAll('.dte-card').forEach(card => {
                card.addEventListener('click', () => {
                    newDiv.querySelectorAll('.dte-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    const radio = leapsSel.querySelector('input[name="dte"][value="' + card.dataset.dte + '"]');
                    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
                    setTimeout(updateRpLeaps, 50);
                });
            });
        })();

        // Hook LEAPS preview updates into right panel
        ['itm-slider', 'contracts-slider'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => setTimeout(updateRpLeaps, 50));
        });

        // Hook buy-leaps-btn to advance step
        document.getElementById('buy-leaps-btn').addEventListener('click', function() {
            setTimeout(() => { setActiveStep(3); updateRpSell(); }, 100);
        });

        // Hook run-week-btn to update right panel
        document.getElementById('run-week-btn').addEventListener('click', function() {
            setTimeout(() => { updateRpSell(); }, 200);
        });

        // Hook continue-btn
        document.getElementById('continue-btn').addEventListener('click', function() {
            setTimeout(() => { setActiveStep(3); updateRpSell(); }, 100);
        });

        // ===== NEW: INFO BUBBLES =====
        const infoBubbleData = {
            delta: 'How much the LEAPS moves per $1 move in the underlying. 0.84 means you capture 84% of the upside.',
            dte: 'Days to expiry. The more time remaining, the slower your theta decay. Roll before it drops below 180.',
            theta: 'The daily cost of holding the LEAPS. Ideally covered by premium you collect from selling calls.',
            itm: 'In the money — the strike is below the current price. Deeper ITM = higher delta = more expensive.',
            otm: 'Out of the money — the strike is above the current price. Cheaper premium, more upside room.',
            cash_reserve: 'The cash you keep back to fund LEAPS rolls during downturns. Rule: keep at least 50% of account as cash.',
            annualised: 'Your weekly average P&L extrapolated to a full year. Based on trades so far.',
            rvx: 'The volatility index for IWM. High RVX = fearful market = sell closer strikes. Low RVX = calm = sell further OTM.',
            ema: 'Exponential moving average. Shows the trend direction of RVX. Rising EMA = volatility increasing.',
            capital: 'Your starting bankroll. A larger account allows more contracts and more cash cushion for rolling.'
        };

        document.addEventListener('click', function(e) {
            const bubble = e.target.closest('.info-bubble');
            if (bubble) {
                const tipKey = bubble.dataset.tip;
                const existingTip = bubble.nextElementSibling;
                if (existingTip && existingTip.classList.contains('info-tooltip')) {
                    existingTip.classList.toggle('open');
                } else if (infoBubbleData[tipKey]) {
                    const tip = document.createElement('div');
                    tip.className = 'info-tooltip open';
                    tip.textContent = infoBubbleData[tipKey];
                    bubble.insertAdjacentElement('afterend', tip);
                }
                e.stopPropagation();
                return;
            }
            // Close all open tooltips on outside click
            document.querySelectorAll('.info-tooltip.open').forEach(t => t.classList.remove('open'));
        });

        // ===== NEW: RULES TOGGLE =====
        (function setupRulesToggle() {
            const strikeSelector = document.getElementById('strike-selector');
            if (!strikeSelector) return;

            const chartContainer = strikeSelector.querySelector('#chart-container');
            if (!chartContainer) return;

            // Insert regime badge + rules toggle below chart
            const rulesDiv = document.createElement('div');
            rulesDiv.innerHTML = `
                <div class="rules-row" style="margin-top:10px;">
                    <span id="regime-badge" class="regime-badge regime-normal">Normal</span>
                    <label class="toggle-label">
                        Rules
                        <span class="toggle-switch-new">
                            <input type="checkbox" id="rules-toggle">
                            <span class="toggle-slider"></span>
                        </span>
                    </label>
                </div>
                <div id="rules-signal-box">
                    <strong>Rules engine suggests:</strong> <span id="rules-signal-text">—</span><br>
                    <span style="font-size:11px;color:var(--text-secondary);" id="rules-signal-reason"></span>
                </div>
            `;
            chartContainer.insertAdjacentElement('afterend', rulesDiv);

            document.getElementById('rules-toggle').addEventListener('change', function() {
                const box = document.getElementById('rules-signal-box');
                if (!box) return;
                if (this.checked) {
                    box.classList.add('open');
                    updateRulesSignal();
                } else {
                    box.classList.remove('open');
                }
            });
        })();

        function updateRulesSignal() {
            if (!vixSimulator) return;
            const emaArr = calculateEMA(vixSimulator.vixHistory, 15);
            const sig = getRulesSignal(vixSimulator.vixHistory, emaArr);
            const badge = document.getElementById('regime-badge');
            const signalText = document.getElementById('rules-signal-text');
            const signalReason = document.getElementById('rules-signal-reason');

            if (badge && vixSimulator) {
                const vix = vixSimulator.currentVix;
                const ema = emaArr[emaArr.length - 1] || vix;
                const prevEma = emaArr[emaArr.length - 2] || ema;
                const emaDir = ema > prevEma ? 'rising' : 'falling';
                badge.textContent = vix > 27 ? 'High volatility' : vix > 22 ? 'Elevated volatility' : 'Normal volatility';
                badge.textContent += ' — RVX ' + vix.toFixed(2) + ', EMA ' + emaDir;
                badge.className = 'regime-badge ' + (vix > 27 ? 'regime-high' : vix > 22 ? 'regime-elevated' : 'regime-normal');
            }

            if (sig && signalText && signalReason) {
                signalText.textContent = sig.action;
                signalReason.textContent = sig.reason;
            }
        }

        // Update rules signal whenever strike-selector becomes visible
        const origRunWeek = document.getElementById('run-week-btn');
        if (origRunWeek) {
            origRunWeek.addEventListener('click', () => setTimeout(updateRulesSignal, 100));
        }

        // ===== NEW: SECTION LABELS for setup screen =====
        (function addSetupSectionLabels() {
            // The initial-state screen needs section labels added to existing h3s
            // Already handled by ticker/scenario/mode card setup above.
            // Also ensure the h1 in initial-state is hidden
            const h1 = document.querySelector('h1');
            if (h1) h1.style.display = 'none';
        })();

        // ===== NEW: LEAPS SCREEN SECTION LABELS =====
        (function styleLeapsScreen() {
            const leapsSel = document.getElementById('leaps-selector');
            if (!leapsSel) return;

            // Add info bubbles to key terms
            const h3s = leapsSel.querySelectorAll('h3');
            h3s.forEach(h => {
                if (h.textContent.includes('ITM')) {
                    h.innerHTML += ' <span class="info-bubble" data-tip="itm">?</span>';
                }
                if (h.textContent.includes('Contracts')) {
                    h.innerHTML += ' <span class="info-bubble" data-tip="delta">?</span>';
                }
            });

            // Replace delta/DTE alert divs with new styled alerts
            const oldAlerts = ['delta-alert-excellent','delta-alert-good','delta-alert-acceptable','delta-alert-warning','dte-alert-warning','dte-alert-danger'];
            oldAlerts.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                if (id.includes('excellent') || id.includes('good')) el.className = 'health-alert health-alert-green';
                else if (id.includes('acceptable') || id.includes('warning')) el.className = 'health-alert health-alert-amber';
                else if (id.includes('danger')) el.className = 'health-alert health-alert-red';
            });
        })();

        // ===== NEW: RESULTS SCREEN OUTCOME BANNER =====
        // Hook into the existing results display to add outcome banner
        const origContinueBtn = document.getElementById('continue-btn');
        // We intercept the display of #friday-results by watching for style changes
        const fridayResults = document.getElementById('friday-results');
        if (fridayResults) {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(m => {
                    if (m.attributeName === 'style' && fridayResults.style.display !== 'none') {
                        setActiveStep(4);
                        setTimeout(updateRpResults, 100);
                        addOutcomeBanner();
                    }
                });
            });
            observer.observe(fridayResults, { attributes: true });
        }

        function addOutcomeBanner() {
            // Check if banner already exists
            if (document.getElementById('outcome-banner-new')) return;

            // Determine outcome from existing content
            const weeklyPnlEl = document.getElementById('weekly-pnl');
            if (!weeklyPnlEl) return;
            const pnlText = weeklyPnlEl.textContent;
            const isPositive = !pnlText.includes('-');

            const banner = document.createElement('div');
            banner.id = 'outcome-banner-new';
            banner.className = 'outcome-banner ' + (isPositive ? 'outcome-green' : 'outcome-red');
            banner.innerHTML = `
                <div class="outcome-banner-title">${isPositive ? 'Good week — call expired worthless' : 'Tough week'}</div>
                <div class="outcome-banner-desc">${isPositive ? 'You kept the full premium.' : 'Review your P&L breakdown below.'}</div>
            `;

            const fridayEl = document.getElementById('friday-results');
            if (fridayEl && fridayEl.firstChild) {
                fridayEl.insertBefore(banner, fridayEl.firstChild);
            }
        }

        // ===== INIT =====
        // Initialize right panel on load
        updateRpSetup();

        // Listen to setup screen inputs for live right panel updates
        document.getElementById('market-scenario')?.addEventListener('change', () => setTimeout(updateRpSetup, 50));
        document.getElementById('ticker-select')?.addEventListener('change', () => setTimeout(updateRpSetup, 50));
        document.getElementById('mode-select')?.addEventListener('change', () => setTimeout(updateRpSetup, 50));

        // Style the back-to-start button
        const backBtn = document.getElementById('back-to-start-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => setActiveStep(1));
        }
        const cancelAdjBtn = document.getElementById('cancel-adjust-btn');
        if (cancelAdjBtn) {
            cancelAdjBtn.addEventListener('click', () => setActiveStep(4));
        }
        const cancelRollBtn = document.getElementById('cancel-roll-btn');
        if (cancelRollBtn) {
            cancelRollBtn.addEventListener('click', () => setActiveStep(3));
        }

        // Watch for roll-selector visibility
        const rollSel = document.getElementById('roll-selector');
        if (rollSel) {
            new MutationObserver(m => m.forEach(mut => {
                if (mut.attributeName === 'style' && rollSel.style.display !== 'none') {
                    setActiveStep(3);
                }
            })).observe(rollSel, { attributes: true });
        }

        // Watch for positions-state / strike-selector visibility (Screen 3)
        ['positions-state', 'strike-selector'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                new MutationObserver(m => m.forEach(mut => {
                    if (mut.attributeName === 'style' && el.style.display !== 'none') {
                        setActiveStep(3);
                        setTimeout(updateRpSell, 100);
                        setTimeout(updateRulesSignal, 150);
                    }
                })).observe(el, { attributes: true });
            }
        });

        // Watch for leaps-selector visibility (Screen 2)
        const leapsSelObs = document.getElementById('leaps-selector');
        if (leapsSelObs) {
            new MutationObserver(m => m.forEach(mut => {
                if (mut.attributeName === 'style' && leapsSelObs.style.display !== 'none') {
                    setActiveStep(2);
                    setTimeout(updateRpLeaps, 100);
                    updateTopbarContext((cumulativeState?.ticker || 'SPY') + ' $' + (cumulativeState?.currentSPY?.toFixed(2) || '—') + ' | Capital $' + (cumulativeState?.totalStartingBalance || 20000).toLocaleString());
                }
            })).observe(leapsSelObs, { attributes: true });
        }
"""

SCRIPT_CLOSE = """
    </script>
</body>
</html>
"""

result = (
    HEAD
    + original_body
    + BODY_CLOSE
    + '\n    <script type="module">\n'
    + original_script
    + NEW_JS
    + SCRIPT_CLOSE
)

with open(out, 'w') as f:
    f.write(result)

print(f"Done! Written {len(result):,} chars to {out}")
