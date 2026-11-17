# Prior art — Fe Builders Challenge 2026

Fetched 2026-11-17 via `gh search repos`, `gh search code`, `gh api` and clones of `fe-lang/*`. One-liners are each repo's own GitHub description, quoted as published. I did **not** audit the code of community entries; status and quality are unverified. GitHub search only sees **public** repos that mention the event or Fe in their name or description, so private, unannounced or Zulip-only entries are invisible (gap).

## 1. Other entries in THIS contest (public, found 2026-11-17)

| Repo | Created | License | Self-description | Starting point it overlaps |
|---|---|---|---|---|
| [rajeshmullippa-collab/fe-lmsr](https://github.com/rajeshmullippa-collab/fe-lmsr) | 2026-11-03 | MIT | "LMSR (Hanson) prediction-market maker in Fe, built on core::fixed" | **Protocol** (market maker) + math |
| [Precision2025/tradeproof-fe-builders-challenge-2026](https://github.com/Precision2025/tradeproof-fe-builders-challenge-2026) | 2026-11-11 | Apache-2.0 | "Fe milestone approval and escrow prototype" | **Protocol** (escrow) |
| [criticalsilence/fekitty](https://github.com/criticalsilence/fekitty) | 2026-11-11 | MIT | "Trustless, goal-based community money pots written in Fe 26.5" | **Protocol** (crowdfunding) |
| [mubudot/leash](https://github.com/mubudot/leash) | 2026-11-05 | MIT | "Type-safe spend limits for AI agents in Fe: a policy library and reference ETH vault" | Protocol / agent safety |
| [Abdul99090/fe-spendguard](https://github.com/Abdul99090/fe-spendguard) | 2026-11-13 | — | "a small, auditable Fe smart contract giving AI agents scoped spending power: per-session caps, allowlisted targets, automatic expiry" | Agent safety (same niche as leash) |
| [EfeDurmaz16/WeiBudget](https://github.com/EfeDurmaz16/WeiBudget) | 2026-11-15 | — | "A revocable daily wei allowance for an agent, written in Fe." | Agent safety (3rd in this niche) |
| [PugarHuda/fevm-replay](https://github.com/PugarHuda/fevm-replay) | 2026-11-12 | Apache-2.0 | "Replay Ethereum mainnet transactions in fevm … shadow-replay Fe ports of Solidity contracts against real traffic" | Protocol port (USDC proxy) + tooling; already filed upstream issue #2002 |
| [ridakalam52-design/fe-fixedpoint](https://github.com/ridakalam52-design/fe-fixedpoint) | 2026-11-03 | — | "Rounding-aware fixed-point & WAD/RAY math for Fe, differential-tested against Solady, OpenZeppelin and PRBMath" | Math |
| [Velixxyz/fe-math-merkle-library](https://github.com/Velixxyz/fe-math-merkle-library) | 2026-11-16 | — | "OpenZeppelin-compatible Merkle multiproofs + standard leaf encodings, and rounding-to-nearest / aggregation / growth math over core::fixed" | Math / stdlib |
| [Alexandros-Christou/checked-units](https://github.com/Alexandros-Christou/checked-units) | 2026-11-03 | — | "Fe library for typed unsigned quantities, checked arithmetic and explicit rounding." | Math / library |
| [jaooli-cyber/FeCheck](https://github.com/jaooli-cyber/FeCheck) | 2026-11-03 | Apache-2.0 | "Deterministic property testing, replay, and counterexample shrinking for Fe" | Tooling (fills the "no fuzzing" gap) |
| [ace-coderr/fissure](https://github.com/ace-coderr/fissure) | 2026-11-09 | Apache-2.0 | "Stateful invariant testing for Fe, written in Fe." | Tooling (same gap) |
| [jaooli-cyber/outcomebatch](https://github.com/jaooli-cyber/outcomebatch) | 2026-11-03 | — | "Bounded diagnostic batch execution for adversarial EVM calls, written in Fe" | Tooling |
| [ProMartY/carrylog](https://github.com/ProMartY/carrylog) | 2026-11-08 | — | "An append-only journal and inclusion proofs for release artifact digests, written in Fe." | Surprise / supply-chain |
| [shuaoo-create/prooftrail-fe](https://github.com/shuaoo-create/prooftrail-fe) | 2026-11-13 | — | "Versioned AI disclosure commitments in Fe — append-only salted hashes with per-author finalization." | Surprise |

(License "—" = not checked. The starter fork count was 0, so entrants clone rather than fork.)

**White-space signal for the primary target.** Searches for auction, governance, vote, DAO, order book, exchange, AMM, DEX, lending, batch/Dutch/Vickrey/sealed-bid, quadratic and conviction (by repo description, plus `gh search code` for `auction extension:fe` and `orderbook extension:fe`) found **no 2026 contest entry implementing an auction, a governance mechanism or an exchange/order book.** The nearest protocol entries are an LMSR market maker, two escrow/crowdfunding contracts, and a crowded agent-spend-limit niche (leash, spendguard, WeiBudget). The math-library and testing-tool niches already have 3–4 entries each. Caveats: code search indexes new repos with a lag, and private or unannounced entries are invisible.

## 2. Fe-team showcases and reference code (judges Grant Wuerker and Micah Scopes are on this team)

| Repo | Updated | License | What it is | Relevance / caveat |
|---|---|---|---|---|
| [fe-lang/rosetta](https://github.com/fe-lang/rosetta) | 2026-06 | none | "Side-by-side Fe and Solidity implementations … verified by Foundry fuzz tests": erc20, 512-bit mulDiv, merkle, **constant-product AMM**, **escrow with typed state machine**, **governance** (token + propose/vote/delegate/execute, "vs Solidity Diamond"), Plonk/Halo2 verifiers, Poseidon | The closest prior art to "Rethink a protocol". The governance example is a plain token-weighted majority with block-number windows. **Pre-26.5 syntax** (reads `Address.inner`), so it won't compile on 26.6. No license, so don't copy. An entry must go clearly beyond it. |
| [fe-lang/fevm](https://github.com/fe-lang/fevm) | 2026-11-16 | Apache-2.0 | "an EVM written in Fe … compiled to native code"; passes 14,640 Osaka and 16,883 Amsterdam state tests | Flagship native Fe. The bar for "serious Fe". |
| [fe-lang/json](https://github.com/fe-lang/json), [fe-lang/lutz](https://github.com/fe-lang/lutz) (TOML), [fe-lang/keccak](https://github.com/fe-lang/keccak), [fe-lang/swisstable](https://github.com/fe-lang/swisstable), [fe-lang/eisenbote](https://github.com/fe-lang/eisenbote) (towncrier port) | 2026-11 | mixed | Native Fe libraries and tools | `json` needs a `master` compiler. Shows the team's taste for well-tested native libraries. |
| [fe-lang/uniswap-v3-core-fe](https://github.com/fe-lang/uniswap-v3-core-fe) | 2026-09-27 | BUSL-1.1 (Uniswap) | Fe port of Uniswap v3 core (pool, factory, tick math, oracle; Hardhat tests; `arithmetic = "unchecked"`) | Pre-26.5. Uses mock-time pool contracts for time-dependent tests. BUSL: **don't reuse code.** |
| [fe-lang/bountiful](https://github.com/fe-lang/bountiful) | 2026-06 | — | "Get paid to break things" (bug-bounty contracts) | Security-minded Fe examples |
| fe-lang.org guide examples | 2026-11 (targets 26.6) | Apache-2.0 | ERC20 "CoolCoin", ERC721, deposit contract, **DEX quote** (pricing only, "not a deployable exchange"), **voting ballot** (one-address-one-vote, deadline) | The canonical style. A protocol entry should visibly exceed these minimal examples. |

## 3. Past Fe hackathon winners (Devconnect Istanbul, Nov 2023 — old Fe v0 syntax)

Source: `fe-lang/blog` `announcement-of-hackathon-winners.md` (2023-11-19). Prizes were ETH. Two tracks: library and application.

| Place | Project | One-liner (blog) | Repo |
|---|---|---|---|
| Library 1st | Fixed Point Library | fixed-point numbers and math for Fe | [bilgin-kocak/felang-fixedpoint](https://github.com/bilgin-kocak/felang-fixedpoint) |
| Library 2nd | p256verifier | secp256r1 signature verifier | [0xnonso/p256-verifier-fe](https://github.com/0xnonso/p256-verifier-fe) |
| Library 3rd | Account Storage with Efficient Sparse Merkle Trees | SMT inclusion/exclusion proofs | [kevincharm/account_kv_storage_fe](https://github.com/kevincharm/account_kv_storage_fe) |
| App 1st | Tic tac toe | game in Fe with a Python frontend | [grey220022/Fehackathon](https://github.com/grey220022/Fehackathon) |
| App 2nd | Fecret Santa | chained onchain gift exchange (ERC721/1155) | [clemlak/fe-hackathon](https://github.com/clemlak/fe-hackathon) |
| App 3rd | go do it | "A commitment device to help you achieve your goals" | [gin/go-do-it](https://github.com/gin/go-do-it) |

The same era produced [cburgdorf/simple_dao](https://github.com/cburgdorf/simple_dao) (2023): a token-weighted multisig DAO in Fe, deployed to mainnet as a bug bounty (blog post 2023-11-08). Governance has been done in Fe before; an entry needs a new mechanism angle.

## 4. Other Fe-language prior art (older or academic)

- [blockchain-unica/rosetta-smart-contracts](https://github.com/blockchain-unica/rosetta-smart-contracts) (Apache-2.0, updated 2026-07) — a chrestomathy with a Fe **auction** (`contracts/auction/ethereum/fe/src/main.fe`), old syntax.
- `simple_open_auction.fe` demo fixture in old Fe forks (e.g. [myweber-org/fe](https://github.com/myweber-org/fe) `crates/test-files/fixtures/demos/`) — v0 era.
- [teattyteati/fe-smart-contracts-benchmark](https://github.com/teattyteati/fe-smart-contracts-benchmark) (2025, thesis benchmark incl. auction) — old syntax, no license.

So a plain open or English auction in Fe is old news. Novelty has to come from the mechanism or from Fe-specific expression.

## 5. Judges' own work (taste only, shallow)

- **Philogy — Plank** ([plankevm.github.io](https://plankevm.github.io); GitHub org [plankevm](https://github.com/plankevm): `plank-monorepo` "The home of the Plank Compiler and Sensei IR", `plankified-univ3`). A competing EVM language: Philogy will judge language-level expressiveness and EVM-level efficiency critically.
- **jistro — EVVM** ([EVVM-org](https://github.com/EVVM-org)): "virtual blockchain" toolkit; repos include `fisher` and `scaffold-evvm`. Interest: off-chain-signed transactions executed by "fishers", Solidity + TS tooling.
- **Austin Griffith — BuidlGuidl / Scaffold-ETH 2** ([scaffold-eth](https://github.com/scaffold-eth): `scaffold-eth-2`, `se-2-challenges` "SpeedRunEthereum challenges"). Values runnable, teachable builds.
- **Marius van der Wijden** (Geth; testing and fuzzing focus) and **Rahul Kothari** (EF dev tooling): both reward real tests and tooling quality.
