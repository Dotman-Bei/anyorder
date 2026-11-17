# Tracks — Fe Builders Challenge 2026

**There are no separate tracks or bounties.** The contest page says: "These are starting points, not separate tracks. Make the idea your own." and "One competition. Every project competes in the same pool." There are no sponsors. All four starting points compete for the same three prizes ($2,500 / $1,500 / $1,000) under the same rubric (`event.md`).

Sources:
- the contest page (<https://fe-lang.org/contest/>, fetched 2026-11-17);
- the announcement post, `fe-lang/blog` `fe-builders-challenge.md` (2026-10-27);
- the ideas post, `fe-builders-challenge-project-ideas.md` (2026-10-29), written by the organisers to steer entrants. Its examples show what the core team finds interesting.

## The universal minimum bar (applies to every starting point)

- The core technical contribution is in Fe (release ≥ 26.5.0; campaign pin 26.6.0).
- A public GitHub repo with an OSI license, the full commit SHA, `fe.toml` and the exact Fe version.
- Reproducible build, and automated tests that fit the project.
- A README (problem, approach, architecture, limitations), a one-sentence pitch, one Fe-specific highlight with a code excerpt, a demo (video, screenshots or a reproducible CLI example), and a declaration of pre-existing work, third-party code and AI use.
- **Registered by 2026-11-17 23:59 UTC.**
- There is no required SDK, deployment or chain. Mainnet gives "no scoring advantage".

## 01 · Rethink a protocol  ← campaign primary

- **Statement (contest page, verbatim):** "Reimagine an auction, exchange, or governance mechanism. Show how Fe makes the design clearer, more expressive, or more efficient." Tags: "Protocols · DeFi · Governance".
- **Blog framing (verbatim):** "Can Fe make its implementation easier to understand, its assumptions more explicit, or its code more reusable? Can you improve its runtime or gas usage? Explain what changed and demonstrate the benefit with tests, benchmarks, code comparisons, or a clear technical argument. A thoughtful redesign can be just as interesting as a new mechanism."
- **Ideas-post prompts:** These are the organisers' own suggestions, so building one exactly as given is not original.
  - **Uniswap v4 hooks** with units and decimal scales in the types. Fe `#[abi]` structs map Solidity structs such as `PoolKey`.
  - **CoW Protocol** conditional orders.
  - **Safe** modules and guards: "What should an AI agent be allowed to do with your money, and how could a reviewer see those limits at a glance?"
  - **Proxy re-implementations:** replace a Solidity implementation behind a proxy, preserving storage layout via `SolArray`, `SolEnumerableSet` and `std::evm::layout` (proof: "show how … nothing changed but the code").
  - "Or start from a blank page. Order books, auctions, lending, governance: every handler in a Fe contract declares which storage it touches and whether it can move funds. Which protocol would become easier to trust if that were visible in its code?"
- **Implied evidence:** comparison against a reference design (Solidity side-by-side, gas benchmarks via `fe build --emit sizes` or test gas), mechanism invariants as tests, and explicit security assumptions.
- **Required tech:** the Fe EVM backend (default). Optional: interop with Solidity ABIs (`msg` + `sol("…")` selectors, `#[abi]` structs) and a local Anvil deploy (`anvil --hardfork osaka`).

## 02 · Make the math work  ← campaign secondary angle

- **Statement (verbatim):** "Explore advanced arithmetic, proof verification, or cryptographic building blocks. Bring test vectors, explicit assumptions, and reusable abstractions." Tags: "Math · Cryptography · Verification".
- **Ideas-post prompts:**
  - SP1 zkVM guests. These need a compiler built with SP1, which is "not in the release binaries yet" → infeasible with the release exe.
  - Pairings, SNARK and Merkle-Patricia proofs: "the precompiles are wrapped in `std`, but most of the machinery around them is still waiting to be written".
  - `const fn` and `static_assert` to derive tables and constants at compile time.
  - Types that prevent mixing field elements, points, amounts and timestamps.
- **Minimum evidence:** test vectors, stated assumptions, and known limitations (blog: "a cryptographic library needs test vectors").
- **Relevant std:**
  - `core::fixed` (`UFixed<D>`, `Fixed<D>`, `Wad`, `Ray`, `SWad`; 512-bit intermediates; `parse`/`Display` in 26.6)
  - `core::num::mul_div` family
  - `core::num::gcd`, `isqrt`, `leading_zeros`
  - `std::evm::crypto` precompile wrappers
  - `std::evm::merkle`, `std::evm::rlp`, `std::evm::signature`, `std::evm::eip712`
  - `core::hash` (Keccak-256 and SHA-256 in software)

  See `sponsors/fe-stdlib-index.md`.

## 03 · Build for the next builder  ← campaign byproduct angle

- **Statement (verbatim):** "Create a library, a standard-library addition, or developer tooling with a meaningful Fe component. Build for the EVM or compile native tools that others can pick up and use." Tags: "Libraries · Tooling · Developer experience".
- **Ideas-post gaps (verbatim fragments):**
  - "no JSON parser, no argument parser, and no client that talks to an Ethereum node". ⚠ `fe-lang/json` now exists but "needs a compiler built from Fe's `master`".
  - "`fe test` has no fuzzing"
  - experimental ethdebug export
  - "How close can idiomatic Fe get to hand-written bytecode?"
- **Rule:** library/tooling qualifies "with a meaningful Fe contribution central to the project". Compiler and Sonatina Rust work is out of scope.
- **Platform caveat for this machine:** native executables are built only on x86-64 Linux and AArch64 macOS. On Windows the native backend is limited to `--emit ir` (26.5.0 changelog). A native-tool entry would need WSL with a distro (none installed) or CI. See `sponsors/fe-lang.md` §Toolchain.

## 04 · Take us by surprise

- **Statement (verbatim):** "Games, art, agents, social applications, or an experiment we haven't imagined. Follow an interesting idea and show what Fe makes possible." Tags: "Games · Art · Unexpected ideas".
- **Ideas-post prompts:** a board game whose rules run in both contract and client; a commit-reveal hidden-information game; "a small world whose systems declare which parts of it they may change"; generative art with compile-time palettes and fixed-point physics.

## Cross-cutting organiser signal: "one codebase, on-chain and off-chain"

The ideas post leads with this. Write pricing or rules once as a plain `pub fn`; the same file builds the contract (`fe build`) and a native simulator (`fe build --backend native`). Its worked example is a `Wad`-typed constant-product pool. A protocol entry that reuses its own mechanism code in a native simulator or backtester fits the organisers' stated taste. The catch is the native-target platform limit above.
