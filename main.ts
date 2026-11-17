// Volatility-gated Donchian runner. Prices, returns and sizing use integers.
import { runBars, BPS, type OrderInput } from './vendor/makefun-bars.ts';

const ENTRY = 60;
const ATR_MIN_BPS = 5n;
const ARM_BPS = 80n;
const TRAIL_BPS = 30n;
const STOP_BPS = 100n;
const COOLDOWN = 15;
const history: { high: bigint; low: bigint; tr: bigint }[] = [];
let previous: bigint | null = null;
let best = 0n;
let armed = false;
let wasHeld = false;
let cooldown = 0;
let peak = 0n;
let halted = false;
let exiting = false;
const abs = (x: bigint): bigint => x < 0n ? -x : x;

await runBars({
  onBatch(state, batch): OrderInput[] {
    const held = state.positions.get('CBBTC');
    const owns = held !== undefined && held.qty > 0n;
    if (wasHeld && !owns) { cooldown = COOLDOWN; best = 0n; armed = false; exiting = false; }
    wasHeld = owns;
    if (state.equity > peak) peak = state.equity;
    if (state.equity * BPS < peak * 8800n) halted = true;

    const bar = batch.bars.find(b => b.symbol === 'CBBTC');
    if (!bar) return [];
    const close = BigInt(bar.c);
    const high = BigInt(bar.h);
    const low = BigInt(bar.l);
    const ready = history.length >= ENTRY;
    let ceiling = 0n;
    let trSum = 0n;
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      if (h.high > ceiling) ceiling = h.high;
      trSum += h.tr;
    }
    let tr = high - low;
    if (previous !== null) {
      const up = abs(high - previous), down = abs(low - previous);
      if (up > tr) tr = up;
      if (down > tr) tr = down;
    }
    history.push({ high, low, tr });
    if (history.length > ENTRY) history.shift();
    previous = close;
    const waiting = cooldown > 0;
    if (waiting) cooldown--;
    if (state.warmingUp) return [];

    if (owns) {
      // Cost includes actual entry fees and impact, unlike the signal close.
      const value = state.value('CBBTC', held.qty);
      if (close > best) best = close;
      if (value * BPS >= held.cost * (BPS + ARM_BPS)) armed = true;
      const stop = value * BPS <= held.cost * (BPS - STOP_BPS);
      const trail = armed && close * BPS <= best * (BPS - TRAIL_BPS);
      // A tight channel exit cut recovering trends in the dev comparison.
      // Use the cost-based stop before arming, then the price-based trail.
      if (halted || stop || trail) exiting = true;
      if (exiting) {
        // Remain in exit mode on rejected sells; account confirms completion.
        return [{ side: 'sell', symbol: 'CBBTC', qty: held.qty, max_slippage_bps: 100 }];
      }
      return [];
    }
    if (halted || waiting || !ready || close <= ceiling) return [];
    if (trSum * BPS < close * BigInt(ENTRY) * ATR_MIN_BPS) return [];
    if (state.hello.caps.max_open_positions < 1 || state.hello.caps.max_orders_per_bar < 1) return [];
    let spend = state.weightRoom('CBBTC');
    if (spend > state.cash) spend = state.cash;
    if (spend < BigInt(state.hello.fees.min_notional_quote_units)) return [];
    return [{ side: 'buy', symbol: 'CBBTC', notional_quote_units: spend, max_slippage_bps: 100 }];
  },
});
