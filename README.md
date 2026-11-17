# btc-race-20261117-entry
[![make.fun - btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/Iruwae/btc-race-20261117-entry/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/Iruwae/btc-race-20261117-entry/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

A long-only, integer-only cbBTC breakout runner. Buy when the close exceeds the previous 32 bars' highest high, provided their mean true range is at least 6 bps of the current close. Use available cash within the weight cap, one position at a time.

The actual filled position cost anchors a 1% stop, the 0.8% profit trigger, and a +1.5% take-profit. Once triggered, exit on a 20-bps retreat from the best close since entry; once the position is up 1%, the trail tightens to 10 bps. A confirmed exit starts a 15-observed-bar cooldown. A 12% equity drawdown permanently halts entries and requests liquidation. Exits retry until confirmed; every order has a 100-bps slippage cap. Stops are next-open orders, not guaranteed fill prices.

Unlike the reference, there is no 30-bar channel exit or fixed profit sale. The strategy uses only past and current bars, never future prices, timestamps as a schedule, randomness, network access, or wall-clock time. The vendored SDK handles hello, batch replies, order identifiers, and done.

## Local comparisons

Same published 1,440-bar dev window, including fees, slippage, impact and final liquidation:

| Variant | Net PnL (USDC) |
| --- | ---: |
| Original reference | -53.065403 |
| Initial runner, 30-bps trail | +15.838129 |
| Restored 30-bar exit, 40-bps trail | -8.170743 |
| No channel exit, 40-bps trail | +14.110708 |
| No volatility filter, 30-bps trail | -11.121262 |
| Final runner | +24.292841 |

Final: 4 filled orders (2 completed round trips), zero rejections, maximum drawdown 0.9799685%, and +22.658130 USDC with doubled fees. Two replay action logs matched byte for byte. One dev day is limited evidence, not a guarantee of unseen performance.

## Run it

Use Node with native TypeScript stripping and feed the replay protocol on stdin:

```sh
node /bot/main.ts
```

From the kit directory:

```sh
node cli/makefun.mjs grade-local --kit . --bot /path/to/btc-race-20261117-entry --driver process
```

The grader uses committed files by default; add `--worktree` while iterating. This build environment required a temporary external Node child-process I/O adapter; no adapter is shipped in the bot. Local Node v24.22.1 and process-driver result hashes differ from the server's Node v26.13.1/container hashes. Local grading without a transcript bundle does not establish transcript or prize eligibility.

MIT licensed. [Join make.fun](https://make.fun/?ref=817k0hr2).
