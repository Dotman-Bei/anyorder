# Seeds — the newest Fe surface area (input for idea-forge divergence, not an idea pick)

This augments the kit's `references/web3-seed-pack.md` with what is **new in Fe 26.5–26.6** (Oct 26 – Nov 10, 2026). These are the features least likely to appear in older Fe prior art and most likely to score on "Fe-specific value" (25%). Each row is a capability with its source, not a recommendation. Sources: CHANGELOG @ v26.6.0, the `fe-stdlib-index.md` entries, and the organisers' ideas post (2026-10-29).

| New capability (version) | What it gives a mechanism designer | Where |
|---|---|---|
| Typed `Wei` / `Timestamp` / `Duration` (26.5) | Phases, deadlines and amounts that can't be mixed up at compile time | prelude, `std::evm::units` |
| `UFixed<D>` / `Wad` / `Ray` / `SWad`, 512-bit intermediates (26.5); `parse` + `Display` (26.6) | Prices, rates and curves whose decimal scale is part of the type | `core::fixed` |
| `StorageHeap<T>` min-heap in storage, `Reverse<T>` for max (26.5) | Priority queues on-chain (best-bid/ask, top-k, eviction) | `std::evm::heap` |
| `core::sort` (`sort`, `binary_search`, `lower_bound`, `dedup_sorted`) (26.5); `.sort()` on any `Ord` memory slice (26.6) | Batch clearing and sorted settlement in memory | `core::sort`, `MemSlice` |
| `std::evm::signature` (ECDSA recover, EIP-2098, ERC-1271) + `std::evm::eip712` `Domain` (26.5) | Off-chain signed orders, bids and votes verified on-chain | `std::evm::signature`, `eip712` |
| `std::evm::random` (`uses (rng: mut Rng)`, `KeccakRng`) (26.5) | Randomness as an injectable effect: deterministic in tests, `prevrandao`-seeded on-chain | `std::evm::random` |
| `core::hash` Keccak-256 / SHA-256 on any target (26.6); `keccak_words`, `keccak_packed` (26.4) | Commit–reveal schemes; the same hashing code runs on-chain and natively | `core::hash`, `std::evm::crypto` |
| `std::evm::merkle` (OZ-compatible) (26.4) | Allowlists and snapshot-based voting power | `std::evm::merkle` |
| `#[abi]` structs; `SolArray`, `SolEnumerableSet`, `SolSlot`, `SolMapping`, `layout` (26.4–26.5) | Speak existing Solidity protocols' ABI and storage (Uniswap v4 `PoolKey`, proxies) | `std::abi`, `std::evm::*` |
| `TSlot<T>` transient storage, `std::evm::mutex` | Reentrancy guards, per-tx accumulators | `std::evm` |
| `multicall`, `clones` (ERC-1167), `predict_create2` / `init_code_hash` | Factories of per-market or per-proposal instances; batched user actions | `std::evm::multicall`, `clones` |
| Const `where` predicates, `const fn`, `static_assert` (26.5) | Compile-time-checked mechanism parameters (e.g. `where N > 0`, fee bounds) | language |
| Closures and iterator adapters, `mut?` items, tuple structs (26.5); `loop`, `HashMap` (26.6) | Expressive, mostly allocation-free logic; newtypes for IDs (`struct BidId(pub u256)`) | language, `core::map` |
| Effects with supertraits (26.6), `with` provision | "Which storage a handler touches and whether it can move funds", visible in signatures | language |
| Native backend + `#[cfg(target = …)]` (26.5–26.6) | One mechanism core used by the contract and by an off-chain simulator. ⚠ Native build is Linux/macOS only; not this Windows box | CLI, ideas post |

Organiser prompts for "Rethink a protocol" (verbatim keywords): Uniswap v4 hooks with typed units; CoW-style conditional orders; Safe modules and guards for AI agents; Solidity-proxy re-implementation with layout preserved; "Order books, auctions, lending, governance". See `tracks.md`.
