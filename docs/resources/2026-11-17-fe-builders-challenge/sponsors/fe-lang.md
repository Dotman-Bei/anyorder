# "Sponsor": the Fe language (stack facts for idea-forge and the architect)

There are no sponsors. The Fe language **is** the stack, and its 25% "Fe-specific value" axis is what this file serves. Companion files:
- `fe-lang-examples.md` — working code excerpts in 26.6 syntax (contracts, tests, multi-actor pattern)
- `fe-stdlib-index.md` — generated index of every public `core`/`std` item in 26.6.0
- `fe-changelog-26.5-26.6.md` — the breaking and feature deltas that matter, with links

**Pinned version: Fe 26.6.0** (tag `v26.6.0`, commit `5b3f96a`, released 2026-11-10T17:55:57Z). The contest allows ≥ 26.5.0.

Sources (all fetched 2026-11-17):
- `argotorg/fe` @ v26.6.0 (CHANGELOG.md, CLI.md, `ingots/std` source, `crates/fe/tests/fixtures`, `feup/feup.sh`, `.github/workflows/main.yml`)
- `fe-lang/www` @ `9ff8138`, the fe-lang.org guide source, whose README says it "targets Fe 26.6"
- `fe-lang/fe-docs` 26.6.0 API JSON (docs.fe-lang.dev)
- `fe-lang/builders-challenge-starter` @ `f9d9aa9`
- `gh` release and issue data

**Nothing here was compiled locally: `fe` is not installed on this machine.** Every syntax claim comes from 26.6-targeted docs, the v26.6.0 compiler test fixtures, or the green CI of the starter (26.5.0).

---

## 1. What "Fe-specific value" rewards (from the language's own pitch)

- **Effects / capabilities.** Every function and handler declares in `uses (…)` what it reads (`x: T`) or mutates (`x: mut T`). Contract storage fields are effects; `Ctx`, `Call`, `Log` and `Create` are sealed capability traits. The guide's pitch: "you know exactly what that function can do". Ideas post: "every handler in a Fe contract declares which storage it touches and whether it can move funds."
- **Typed messages.** `msg` groups are the ABI. Selectors are `sol("sig(...)")`-checked against the field types, and `recv` blocks must handle every variant.
- **Typed units.** `Wei`, `Timestamp`, `Duration` (26.5+), and fixed-point types whose decimal scale is part of the type (`UFixed<D>`, `Wad`, `Ray`, `SWad`). "Amounts, points in time and durations no longer mix."
- **Mutable value semantics** (26.5+): no references stored in structs; parameters are views (`x: T`), `mut T` or `own T`. Closures, traits, generics, const generics with `where` predicates, `const fn` CTFE, `static_assert`, tuple structs, pattern matching.
- **Effect mocking.** Unit-test logic by providing an effect value with `with (…) { … }`; no mocking framework.
- **One codebase, on-chain and off-chain.** The same `pub fn` compiles into a contract and into a native program. ⚠ See the platform limits in §2.

## 2. Toolchain on THIS machine (Windows 11, Git Bash + PowerShell 5.1) — stack finding

| Fact | Evidence |
|---|---|
| `fe` is **not installed**; no `~/.fe`, no `feup` | probe 2026-11-17 (tollgate row 19) |
| v26.6.0 release assets: `fe_linux_amd64`, `fe_linux_arm64`, `fe_mac_amd64`, `fe_mac_arm64`, **`fe_windows_amd64.exe` (63,244,800 bytes)** | `gh release view v26.6.0 -R argotorg/fe` |
| **`feup.sh` does NOT support Windows/Git Bash.** `detect_platform()` matches `uname -s` against `Linux*` and `Darwin*` only; anything else hits `err "unsupported operating system: $os"`. Git Bash reports `MINGW64_NT-…`, so the documented installer **fails** here. | `feup/feup.sh` lines 97–105 @ v26.6.0 |
| Docs list "Windows | x86_64" as a pre-built platform but give **no Windows install steps** | `getting-started/installation.md`; live page confirmed by WebFetch |
| Fe's own CI runs the full test suite on `windows-latest`, so the Windows build is exercised upstream | `.github/workflows/main.yml` matrix |
| **Native executables are not built on Windows.** "Native executables … can be built with the prebuilt downloads on x86-64 Linux and AArch64 macOS; on the other release targets the native backend is available for `--emit ir`." | CHANGELOG 26.5.0 (#1660) |
| WSL is present but **has no distro installed** (`wsl -l -q` returns nothing) | probe 2026-11-17 |
| Git `core.autocrlf=true` (system level). The starter's `src/lib.fe` checked out with **CRLF** | `git config --system`; `file src/lib.fe` |
| Fe's lexer accepts CRLF (`Newline` = `(\n|\r\n|\r)+`), so the 2021 issue #537 is stale for parsing. **Unverified:** whether `fe fmt --check` reports CRLF files as unformatted | `crates/parser/src/syntax_kind.rs:13` |

**Recommended Windows install path (the user does this; the pipeline installs nothing):**
1. Download `fe_windows_amd64.exe` from <https://github.com/argotorg/fe/releases/tag/v26.6.0>, rename it to `fe.exe`, and put it in a folder on the user PATH (for example `%USERPROFILE%\.fe\bin`).
2. Verify in **both** shells: `fe --version` → should start with `fe 26.6.0` (installation doc: "The version should start with `fe 26.6.0`").
3. In the project repo, add `.gitattributes` with `*.fe text eol=lf` so local files match Linux CI and the formatter.
4. Running feup inside Git Bash is **not** a working path (see the table above). WSL+feup works only after installing a distro. Building from source needs Rust + Node/npm + a C toolchain; the guide found no MSVC build tools, so that's the worst path.
5. Starter CI pins `FE_VERSION: v26.5.0`. For the campaign pin, change it to `v26.6.0` (feup accepts `--version v26.6.0` on the Ubuntu runner).

EVM workflow on Windows (`fe build`, `fe test` with the default Sonatina/EVM backend, `fe fmt`, `fe check`) is expected to work with the exe. **Unverified locally.**

## 3. Project layout and `fe.toml` (ingot manifest)

```toml
[ingot]
name = "my_project"        # identifier; underscores, no hyphens
version = "0.1.0"          # required
# target = "evm"           # "evm" (default) | "native" | "wasm"   (26.6)
# arithmetic = "unchecked" # optional: "checked" (default) | "unchecked"; also [profiles.<name>] arithmetic / dependency-arithmetic

[dependencies]
utils = "../shared/utils"                                    # local path (or { path = "…" })
lib   = { source = "https://github.com/org/repo.git", rev = "<full 40-hex commit>", path = "subdir" }  # git; tags/branches rejected; no lockfile
# trusted = { path = "../x", allow_unsafe = true }           # needed if you call into a dep's unsafe code
```

- `src/lib.fe` is required (the ingot root). Files are modules (`src/token.fe` → `ingot::token`); a subdirectory needs `mod.fe`. Import your own items with `use ingot::{Vault, VaultMsg}`. Workspaces use `[workspace]` with `members = [...]`. "There is no central package registry."
- The starter manifest is just `[ingot] name = "starter"`, `version = "0.1.0"`. Rename it.
- Sources: `ingots/project-structure.md`, `ingots/dependencies.md`, CLI.md §Project target, `crates/common/src/config/mod.rs` (keys `target`, `arithmetic`, `[profiles.*]`, `dependency-arithmetic`).

## 4. CLI essentials

| Command | Notes |
|---|---|
| `fe new <name>` / `fe new --workspace <name>` | scaffolds `fe.toml` + `src/lib.fe` (Counter + test) |
| `fe build` | writes `out/<C>.bin` (init), `out/<C>.runtime.bin`, `out/<C>.abi.json`. `--emit abi,metadata,sizes,…`, `--contract <C>`, `--out-dir`, `-O 0|1|2|s` (default 1). `--emit sizes` writes `<contract>.sizes.txt` (per-function code bytes). Warns past the EIP-170/3860 size limits (26.6). `fe build --from-metadata out/C.metadata.json` reproduces a build. |
| `fe test [path|glob]` | `--filter`, `--jobs N` (default 8), `--show-logs`, `--trace-evm`, `--call-trace`, `--ingot <member>`, `--optimize`, `--report[-dir]`, `--backend sonatina|native|wasm` |
| `fe check`, `fe fmt [--check]`, `fe tree` | the starter CI runs `fe fmt --check` → `fe test` → `fe build` |

- The EVM revision is **Osaka**. "The test runner lifts Osaka's per-transaction gas cap, so a passing high-gas test does not prove that the transaction can be submitted unchanged". Local deploy: `anvil --hardfork osaka` + `cast send --create 0x$(cat out/C.bin)` (first-contract guide). Foundry isn't needed for scoring.

## 5. Language essentials (26.6 syntax, with sources)

- **Bindings:** `let x = …` (immutable), `var x = …` (mutable). Integer types run `u8…u256` and `i8…i256`, plus `usize` (256-bit on EVM, 64-bit native, 32-bit wasm) and `bool`. `Address` (construct with `Address::new(word)`, read with `.word()`; `inner` is private since 26.5). Arithmetic is **checked by default**: overflow → `Panic(0x11)`, div/0 → `Panic(0x12)`.
- **Calls use labeled arguments:** `max(a: 3, b: 7)`. The label can be omitted when the variable name matches it (`do_transfer(from: ctx.caller(), to, amount)`). Parameters declared `_ x: T` are positional.
- **Effects:**
  - Declare: `fn f() uses (store: mut S, ctx: Ctx)`.
  - Provide: `with (S = value) { … }` or `with (value) { … }`.
  - Mutable effects need a `var` binding: `var c = …; with (mut c) { … }`.
  - A `mut` effect satisfies a read-only requirement; not the reverse.
  - Effects propagate through call chains and can be shadowed by inner `with` blocks.
  - (26.6) "A trait effect now provides its supertraits": `uses (evm: mut Super)` gives `Ctx` and `Call`.
- **Contract shape:**
  ```fe
  pub contract Name uses (ctx: Ctx, call: mut Call, log: mut Log) {
      owner: Address,                          // immutable: set in init, embedded in code
      mut balances: StorageMap<Address, Wei>,  // mut: storage, zero-initialized
      init(a: Address) uses (mut owner) { owner = a }   // #[payable] init to accept ETH at deploy
      recv MsgGroup {
          #[payable]
          Variant { field } -> RetTy uses (ctx, mut balances, mut log) { … }
      }
      recv { MsgGroup::Other {} -> u256 uses x { … }  #[payable] _ uses (…) { … } }   // bare recv with wildcard fallback
  }
  ```
  - No `impl` on contracts and no `self.field`. Put logic on storage structs (`impl S { fn m(mut self) … }`) or in free functions with `uses`.
  - Immutable fields must be assigned on every successful constructor exit (`error[8-0086]`).
  - Handlers reject ETH unless marked `#[payable]`.
  - Without a fallback, unmatched calls revert.
- **Messages:** `msg M { #[selector = sol("transfer(address,uint256)")] Transfer { to: Address, amount: u256 } -> bool, }`. Raw integer selectors (`#[selector = 0x01]`) also compile (v26.6.0 fixtures). `M::Transfer::SELECTOR` is readable. A `recv M` block must handle every variant. 26.6: "A recv arm whose pattern may not match every value of its variant is now an error (8-0153)."
- **Events:** `#[event] struct E { #[indexed] who: Address, amount: Wei }` → `log.emit(E { … })` (needs `log: mut Log`).
- **Errors:**
  - `assert!(c)` → `Panic(0x01)`.
  - `assert!(c, "msg")` → `Error(string)` `0x08c379a0`. The message must be a string literal.
  - `#[error] struct X { … }` + `revert_error(X { … })` → selector of `X(types)`.
  - `revert(value)` ABI-encodes **without** a selector (not Solidity's `Error(string)`).
  - `core::panic_code(code)`.
- **Storage:**
  - `StorageMap<K,V>`: `get(key:)`, `set(key:, value:)`, `map[key]` place syntax (`+=`), `remove(key)`, nested maps `map[a][b]`, tuple keys `(a, b)`. Tuple-key layout ≠ nested Solidity mappings.
  - Maps can't be iterated or copied; keep a separate key list if you need iteration.
  - `TSlot<T>` is transient storage (`.value`).
  - `#[slot(e)]` places a field at a fixed slot.
  - `SolSlot`, `SolMapping`, `SolArray`, `SolEnumerableSet` give Solidity-layout interop.
  - `StorageBytes<K>`, `StorageHeap<T>` (min-heap; `Reverse<T>` for a max-heap), `StoragePackedArray`.
- **Typed units (prelude):** `Wei`, `Timestamp`, `Duration`; `ether(n)`, `gwei(n)`, `days(n)`, `hours(n)`, `minutes(n)`; consts `ETHER`, `DAY`, …; `Wei::zero()`, `Duration::zero()`, `.as_wei()`. `Timestamp + Duration → Timestamp`; `Timestamp - Timestamp → Duration`. `Ctx::value()`/`balance()`/`selfbalance()` return `Wei`; `Ctx::timestamp()` returns `Timestamp`.
- **Cross-contract calls (`Call` capability, `uses (call: mut Call)`):**
  - `call.call(addr:, gas:, value: Wei, message: M::V { … }) -> M::Return` (reverts bubble).
  - `call.static(addr:, gas:, message:)`
  - `call.try_call(…) -> CallOutcome` (`.success()`, `.decode<R>()`, `.returndata()`)
  - `call.send_value(addr:, gas:, value:) -> RawCallOutcome`
  - `delegate`, `try_delegate`, `call_with_default`, `try_call_into` (bounded returndata), `raw_call`, `call_with_min_gas`.
  - Address shorthand: `addr.call(message)`, `addr.static(message)`.
  - Helpers: `std::evm::erc20::{safe_transfer, safe_transfer_from, safe_approve, try_transfer…}`, `erc721`, `erc1155`, `erc165`, `multicall`, `clones`, `predict_create2`.
  - Reentrancy: 26.4+ "Live state borrows now conflict with `CALL`…". Update state before calling out (the starter's vault does this); `std::evm::mutex` and `TSlot` guards exist.
- **Generics/traits/closures:**
  - `trait T { fn m(self) -> u256 }`, `impl T for S`, bounds `fn f<X: T>(…)`, const generics `struct A<const N: usize> where N > 0`.
  - Closures `|x| x + 1`, iterator adapters `filter`/`map`/`fold`/`enumerate`, `for`, `while`, `loop` (26.6).
  - Tuple structs `struct Month(pub u8)`.
  - `Option`/`Result` with `?`, `match`, `if let`, `let … else`.
  - `HashMap` in memory (26.6 prelude); `MemVec`, `MemArray`, `MemBuffer`.
- **Fixed point (`core::fixed`):** `UFixed<D>`, `Fixed<D>`, `Wad` (18), `Ray` (27), `SWad`; `from_int`, `from_raw`, `from_ratio`, `raw()`, `one()`. `+ - * / **` keep scale with 512-bit intermediates. 26.6 adds `Wad::parse("0.3")` and `format!` display. Plus `core::num::mul_div`, `mul_div_ceil`, `checked_mul_div`, `full_mul`, `gcd`, `isqrt`.

## 6. Testing (the `fe test` runner) — what works and what doesn't

- Unit tests: `#[test] fn t() { assert!(…) }`. Revert tests: `#[test(should_revert)]`, optionally `panic = 0x11` or `selector = 0x…` (not both).
- **Integration tests:** `#[test] fn t() uses (evm: mut Evm) { … }`.
  - `evm.create2<C>(value: Wei::zero(), args: (a, b,), salt: n)`; a single arg needs a trailing comma: `(x,)`.
  - `evm.call(addr:, gas:, value:, message:)` returns the typed return value; `evm.try_call(…)` returns `.success()`.
  - Each test gets a fresh EVM; state persists across calls within one test.
- **`#[test(balance = N)]` funds the test contract** with N wei (opt-in, `crates/fe/src/test/mod.rs`). The starter uses `balance = 10_000_000_000_000_000_000` to send `ether(1)`.
- The test runner contract is the caller (`evm.address()`); `evm.timestamp()` and `evm.balance(a)` work (Ctx on Evm).
- **No cheatcodes:** no time warp, `prank`, `deal` or block roll anywhere in std or the runner (grep of v26.6.0 found none). Consequences:
  - **Multiple actors →** deploy small "actor/proxy" contracts that forward calls, so `ctx.caller()` differs. Canonical example: v26.6.0 fixtures `escrow.fe` and `ownable.fe` (excerpt in `fe-lang-examples.md`).
  - **Time-dependent logic →** inject time instead of relying on block time: pass a `Timestamp`/clock as an effect or parameter for unit tests, or use a mock-time contract variant (Uniswap-port pattern: `mock_time_uniswap_v3_pool.fe`). Or design phases to advance by explicit calls or deadlines set relative to `evm.timestamp()`.
  - **No fuzzing** (issue #1387 open; ideas post: "`fe test` has no fuzzing"). Property tests must be hand-rolled loops, or use community libraries (FeCheck, fissure — see prior-art.md; unaudited).
- **Effect mocking** for pure logic: `let r = with (config) { calc(amount: 400) }`; mutable via `var x …; with (mut x) { … }`. `Ctx`, `Call` and `Log` are sealed and can't be mocked; put logic behind your own effect type.
- Debugging: `--show-logs`, `--trace-evm`, `--call-trace`.

## 7. 26.5 → 26.6 differences that touch the starter / a protocol build

Full list in `fe-changelog-26.5-26.6.md`. For the starter (`src/lib.fe` vault and `src/tests.fe`):
- **Storage layout changed** (packing of narrow contract fields and of value types in structs and map entries; `StoragePackedArray` layout). This only matters for data stored by a 26.5-compiled contract. A fresh deploy is fine.
- The starter uses none of the removed or renamed APIs (`DynString`/`Bytes` copies, `payload_span`, `MemBuffer::alloc`, `as` narrowing casts, `extern`, native `main(argc, argv)`, `std::io` char I/O). **Expected to compile unchanged on 26.6.0. Unverified locally.** Starter CI is green on 26.5.0 at `f9d9aa9`.
- 26.6 things a new build will meet:
  - `as` casts must be lossless (use `downcast()`).
  - Out-of-range index → `Panic(0x32)`; bad enum tag → `Panic(0x21)`.
  - Integer literals that don't fit are now errors.
  - `loop {}`, `HashMap`, `Option ==`, `core::hash` SHA-256, `Wad::parse`, `#[cfg(target = "evm")]`.
- Change starter `ci.yml` `FE_VERSION` from `v26.5.0` to `v26.6.0` to match the declared version.

## 8. Known limitations and gotchas (what does NOT work yet)

1. **No test cheatcodes** (warp, prank, deal, roll) and **no fuzzing** (§6).
2. **Native executables can't be built on Windows** with the release exe (`--emit ir` only). The SP1 zkVM is not in release binaries. Wasm needs the `wasm` Cargo feature, and `fe build` for wasm takes only standalone files. `fe test --backend wasm` needs Node ≥ 20 and can't run tests that use `should_revert`, `balance` or EVM built-ins.
3. **StorageMap** can't be iterated; `get` returns the default for **any** key. Issue #1538 (open; reported against 26.1/26.2) shows an out-of-domain sentinel key causing an unauthorized write. Validate key domains explicitly.
4. **External `bool` decoding** accepts any returndata whose first word is canonical `true` (issue #1539, open). A commenter notes Solidity behaves the same way.
5. **JSON ABI rejects `()`** as a nested type (issue #1670, open). Avoid unit-typed fields in `#[abi]` structs, events and errors.
6. **Const-generic array arithmetic in types** (`[T; N + 1]`) can fail unification (issue #1372, open, 2026-03). 26.5.0 says many cases are fixed ("Array repeat lengths and array types computed from generic parameters … are now accepted"). Test early if you use it.
7. **Saturating methods aren't evaluable in `const fn`** (issue #1349, open).
8. **No `#[derive(Clone)]`** (issue #1245, open). Write `impl Clone` by hand; `impl Copy for X {}` is a marker. `DynString`, `Bytes` and `DynArray` are not `Copy` since 26.6.
9. **Gas:** idiomatic calldata forwarding costs 40–60 gas/call more than solc inline assembly (issue #2002, open, with an std PR #2004). Make gas claims only with benchmarks.
10. **`assert!` messages must be string literals.** `revert("x")` is **not** `Error(string)`. `safe_transfer` failures use `revert(...)`, so wallets won't decode the reason.
11. **High-gas tests pass under a lifted gas cap** (Osaka cap lifted in tests).
12. **No lockfile.** Git deps must pin a full 40-hex `rev`.
13. **Ecosystem repos lag the compiler.** `fe-lang/json` needs a `master` compiler. `fe-lang/rosetta` (2026-06) and `uniswap-v3-core-fe` (2026-09) predate 26.5 syntax (e.g. `old_delegate.inner`) and **will not compile on 26.6 as-is**. They are design references only, and rosetta and keccak have no license file.
14. Fe is "not yet recommended for production use" (installation page). Compiler bugs are possible: report minimal repros to argotorg/fe issues and email hello@fe-lang.org if blocked.

## 9. Stale-doc traps (docs disagree with the 26.6 code)

- `effects/built-in.md` lists `ctx.value()` and `ctx.timestamp()` as returning `u256`. In 26.6 std (`std/src/evm/effects.fe` lines 204–233) they return **`Wei`** and **`Timestamp`**. Trust the code and the starter.
- The ideas post says there is "no JSON parser"; `fe-lang/json` exists (master-only).
- Old Fe (v0.x, 2021–2024) material (issues, simple_dao, the 2023 hackathon winners, `rosetta-smart-contracts`) uses obsolete syntax (`let mut`, `self.field` in contracts, `ctx: Context`). Never copy syntax from it.
