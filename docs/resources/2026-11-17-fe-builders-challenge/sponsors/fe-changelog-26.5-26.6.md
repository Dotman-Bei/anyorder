# Fe 26.5.0 → 26.6.0: what changed (curated for this campaign)

Sources:
- `argotorg/fe` `CHANGELOG.md` @ v26.6.0, sections `## 26.6.0 (2026-11-10)`, `## 26.5.1 (2026-10-28)`, `## 26.5.0 (2026-10-26)`. The full text is ~125 KB; read it there, not here.
- The release posts `fe-lang/blog` `release-26-6.md` (§"Upgrading from 26.5") and `release-26-5.md`.

Fetched 2026-11-17 via `gh` and a git clone. Issue links are `https://github.com/argotorg/fe/issues/<n>`.

| Release | Date (GitHub publishedAt) |
|---|---|
| v26.5.0 | 2026-10-26T19:57:43Z |
| v26.5.1 | 2026-10-28T00:11:01Z — one fix: the parser hung on a stray `#` (#1889), which "could freeze the language server" |
| **v26.6.0** (campaign pin, "Latest") | 2026-11-10T17:55:57Z |

## 26.5.0 — the big one (the starter targets it)

The blog calls it "our biggest release so far". Load-bearing features:
- **Mutable value semantics**: "References are no longer values: `ref` and `mut` are not types, so a struct cannot hold a borrow." Parameters are views `x: T`, `x: mut T` or owned `x: own T`. `mut?` items.
- **Closures** (`|x| x + 1`), `fold`, `any`, `count`, `find`, and `filter`/`map` loop adapters. `unsafe { }` blocks. Tuple structs. Const `where` predicates (`struct Bounded<const N: usize> where N > 0`).
- **Typed ETH amounts and time** (`Wei`, `Timestamp`, `Duration`) in the std prelude. "`Ctx::value`, `Ctx::balance` and `Ctx::selfbalance` return `Wei`, and `Ctx::timestamp` returns `Timestamp`. Every `value` parameter takes `Wei` … Write `value: Wei::zero()` in place of `value: 0`." Use `as_wei()`/`as_seconds()` for plain numbers.
- **Solidity-compatible storage** (struct packing, `StorageMap` = Solidity mapping layout) and the **`#[abi]` struct** attribute (Solidity structs such as `PoolKey` in `msg` fields).
- **std additions:**
  - `core::fixed` (`UFixed<D>`, `Fixed<D>`, `Wad`, `Ray`, `SWad`)
  - `core::sort` (after Solady `LibSort`)
  - `std::evm::random` (`uses (rng: mut Rng)`, `KeccakRng`)
  - `std::evm::heap::StorageHeap<T>` (min-heap after Solady `MinHeapLib`)
  - `std::evm::eip712`, `std::evm::signature` (ECDSA recover, EIP-2098, ERC-1271)
  - `std::evm::multicall`, `std::evm::erc4337`, `std::evm::rlp`, `std::evm::layout`
  - `SolArray`, `SolEnumerableSet`, `init_code_hash`, `predict_create2`
  - `core::num::gcd`, string→number parsing, base64/base58
  - `MemVec<T>` for any element type
- **Native backend in release binaries**: "Native executables … can be built with the prebuilt downloads on x86-64 Linux and AArch64 macOS; on the other release targets the native backend is available for `--emit ir`." (#1660) **→ not on Windows.**
- Optional **SP1 RV64IM guest** compilation (needs a custom compiler build).

### 26.5.0 breaking changes (from 26.4)

- `Address.inner` is private. Use `Address::new(word)` (panics `0x11` if the word has bits above the low 160), `Address::from_word_truncate`, `address.word()`. `std::evm::address_to_word` is removed.
- Collection lengths and indices are **`usize`**, not `u256`.
- Storage collections are no longer `Copy` handles and lose their `SALT` parameters. Pass them as `mut` or view parameters.
- `DynArray` moved to `std::abi`. `IndexMut` and the `*_mut` method pairs became `mut?` methods. `Fn<T, U>` became `Fn(own T) -> U`.
- `AsBytes::as_bytes()` returns `PackedBytes<N>`.

## 26.6.0 — native I/O, destructors, storage packing

### Features worth knowing

- **Storage packing:** consecutive narrow contract fields share slots; `Address`, `FixedBytes<N>` and newtypes pack inside structs, tuples and map entries (#1826).
- **Destructors:** `core::ops::Drop`, `core::mem::drop`/`forget`; memory owners free their allocations.
- **`core::map::HashMap<K, V>`** in the prelude (memory, not storage): `get_or_insert(k, 0) += 1`, `map[key]`.
- `loop { }` (#1937). `Option<T>` `==`. `&=`/`^=` on `bool`. Byte literals `b'0'` are `u8`.
- `core::hash`: streaming Keccak-256 (#1909) and **SHA-256** in software (#1927). `std::evm::crypto::sha256` still uses the precompile.
- `UFixed::parse` / `Fixed::parse` (e.g. `Wad::parse("0.3")`) and `Display` (`format!(Wad::from_ratio(5, 2))` is `2.5`) (#1942).
- `core::text::decode_hex`; text parsers accept any `Text`; `MemSpan` gains `split`, `lines`, `trim`, `index_of`, …
- `MemSlice`/`MemArray`/`MemVec` `.sort()` for any `Ord` (#1940).
- `#[cfg(target = "evm" | "native", target_os = …)]` conditional compilation.
- `target = "evm" | "native"` (and `"wasm"`, per CLI.md) in `fe.toml`.
- Native I/O as effects from `std::native::Host`: `Stdout`/`Stderr`/`Stdin`, `print!`/`println!`/`format!`/`write!`, `std::env::Args`, `std::fs::Fs`, `std::process::Spawn`, `std::time::Clock`. **Linux/macOS only.**
- `#[unsafe(export)]`, `--emit object|staticlib`, `--link`/`--link-lib`. Experimental **wasm** backend (behind a Cargo feature).
- `fe build --emit sizes` (per-function code bytes). Warning past EIP-170/EIP-3860 size limits (#1956).
- Out-of-range array index reverts `Panic(0x32)` (#1941). A bad enum tag from storage or calldata reverts `Panic(0x21)` instead of `INVALID`.

### 26.6.0 bugfixes a protocol build benefits from

- Unused checked operations at `-O1`/`-O2` no longer drop operand masks and spuriously revert `Panic(0x11)` (#1853).
- A `mut` pattern binding of a packed storage field no longer silently loses writes (#1933).
- **`StoragePackedArray` no longer writes outside the array** (layout changed to `keccak256(w ++ s)`). Earlier, "a large index wrapped around the slot space and could overwrite another contract field or a map's entries."
- A recv arm with a constant-named field pattern now binds the field, not the constant. Non-exhaustive recv arm patterns are an error (8-0153).
- Integer literals that don't fit their type are rejected (they used to be silently truncated).
- Division by zero in unchecked code panics `0x12` (it used to return 0). Unchecked arithmetic now applies to `Wei`/`Duration`/`Timestamp` via the wrapping traits.

### 26.6.0 breaking changes ("Upgrading from 26.5", blog; verbatim bullets condensed)

1. "Storage layouts changed: contract fields, packed value types in structs and map entries, and `StoragePackedArray` move to new slots and offsets. Data stored by a contract compiled with 26.5 must be migrated."
2. "`DynString`, `Bytes` and `DynArray` are no longer `Copy`. Use `clone()` or pass them as view parameters. `payload_span` is renamed to `span`, and `DynString::as_bytes` is replaced by `into_bytes`."
3. "`std::native::ByteBuffer` and `FixedStack` are removed in favor of `MemBuffer` and `MemVec`. `MemBuffer::alloc` is renamed `MemBuffer::new`."
4. "`std::io`'s character I/O … is replaced by the `Stdout`, `Stderr` and `Stdin` effects. A native `main` no longer takes `argc` and `argv`; use `uses (args: Args)` instead."
5. "`as` casts must be lossless on every target; use `downcast()` and friends for narrowing `usize` conversions." (Changelog: `u64 as usize`, `u256 as usize`, `usize as u32` and `usize as u64` are rejected; `usize` is 256-bit on EVM.)
6. "Calls to `extern` functions need an `unsafe` block."
7. "In `#[arithmetic(unchecked)]` code, operators on type parameters need the matching wrapping trait bound, such as `T: WrappingAdd`, and the wrapping traits take their operands `own`."
8. "`v[i] = x` now destroys the element it overwrites, so fill uninitialized memory from `MemArray::new_uninit` through raw places."
9. "Only the root module's `pub fn main()` without parameters is a program entry." (Changelog: "a file without contracts or `pub fn main()` builds nothing".)

### Impact on the starter (`fe-lang/builders-challenge-starter` @ `f9d9aa9`)

- It uses `StorageMap<Address, Wei>`, `StorageMap<Address, Timestamp>`, `Duration`, `ctx.value()`, `ctx.timestamp()`, `call.send_value(...).success()`, `#[event]`, `log.emit`, `assert!` with messages, `evm.create2`/`evm.call`, `ether`/`days`, and `#[test(should_revert, balance = …)]`. **None of the nine 26.6 breaking items apply.** The layout change (1) only affects pre-existing deployed state. Expect it to compile on 26.6.0. **Unverified: no local `fe`.**
- Its CI pins `FE_VERSION: v26.5.0` and installs via feup's `master` script. Bump it to `v26.6.0` to match the declared version.
