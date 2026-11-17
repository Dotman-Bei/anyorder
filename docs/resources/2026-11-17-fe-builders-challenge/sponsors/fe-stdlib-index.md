# Fe 26.6.0 standard library — public API index (core + std)

Generated 2026-11-17 from `fe-lang/fe-docs` `26.6.0/docs.json.gz` (the data behind <https://docs.fe-lang.dev>, whose live page was confirmed in Chrome to read "Fe 26.6.0 Standard Library"). It covers 932 public items in 81 modules; one line each: kind, name, first signature line (≤150 chars) and first doc sentence (≤110 chars). Per-width integer intrinsics are collapsed. Use it to find real names, then read the source at `argotorg/fe` `ingots/{core,std}/src/**` @ v26.6.0 or the live docs for full signatures. The generator script lives outside the repo (session scratchpad), so regenerate from the JSON if needed.

<!-- generated from fe-lang/fe-docs 26.6.0/docs.json.gz (compiler_version 26.6.0, schema 4); public items only -->

### `core` (5 public)

- function `assert` — `pub fn assert(_ condition: bool)` — Trap when a target-neutral assertion fails.
- function `panic` — `pub fn panic() -> !`
- function `panic_code` — `pub const fn panic_code(_ code: u256) -> !` — Aborts with a Solidity-compatible panic code (see `core::panics`).
- function `panic_with_value` — `pub fn panic_with_value<T>(_: own T) -> !`
- function `todo` — `pub fn todo() -> !`

### `core::abi` (45 public)

- enum `AbiError` — `pub enum AbiError` — Errors returned by ABI decoding/encoding helpers.
- function `abi_field_end` — `pub fn abi_field_end<A: Abi, T, I>(_ input: I, base: u256, pos: u256) -> u256`
- function `abi_field_end_with_input_len` — `pub fn abi_field_end_with_input_len<A: Abi, T, I>(_ input: I, base: u256, pos: u256, input_len: u256) -> u256`
- function `abi_field_head_size` — `pub const fn abi_field_head_size<T: AbiSize>() -> u256`
- function `abi_field_size` — `pub fn abi_field_size<T: AbiSize>(_ value: T) -> u256`
- function `abi_payload_head_size` — `pub const fn abi_payload_head_size<T: AbiSize>() -> u256`
- function `abi_payload_size` — `pub fn abi_payload_size<T: AbiSize>(_ value: T) -> u256`
- function `abi_record_field_end` — `pub fn abi_record_field_end<A: Abi, T, I>(_ input: I, _ frame: u256, _ head_pos: u256, _ input_len: u256, _ end: u256) -> u256` — Folds one field of a record at `frame` into the record's payload end.
- function `abi_single_root_head_size` — `pub const fn abi_single_root_head_size<T: AbiSize>() -> u256`
- function `abi_single_root_size` — `pub fn abi_single_root_size<T: AbiSize>(_ value: T) -> u256`
- function `checked_frame_end` — `pub fn checked_frame_end<A: Abi>(_ pos: u256, _ head_size: u256, _ input_len: u256) -> u256`
- function `checked_tail` — `pub fn checked_tail<A: Abi>(_ base: u256, _ tail_rel: u256) -> u256`
- function `copy_payload` — `pub unsafe fn copy_payload<A: Abi, I: ByteInput>(_ input: I, _ pos: u256, actual_size: u256, input_len: u256, padded: bool) -> (*u8, u256)` — A fresh tail holding the `actual_size` payload bytes at `pos` of
- function `decode_field` — `pub fn decode_field<A: Abi, T, D, I>(_ d: mut D, _ input: I) -> T`
- function `decode_field_from` — `pub fn decode_field_from<A: Abi, T, I>(_ input: I, base: u256, head_pos: u256) -> T`
- function `decode_field_from_prechecked_head` — `pub fn decode_field_from_prechecked_head<A: Abi, T, I>(_ input: I, base: u256, head_pos: u256, input_len: u256) -> T` — Decode a field whose head word lies inside an already-checked parent frame.
- function `decode_frame_from` — `pub fn decode_frame_from<A: Abi, T, I>(_ input: I, _ pos: u256, _ input_len: u256) -> T`
- function `decode_msg_field_from` — `pub fn decode_msg_field_from<A: Abi, T, I>(_ input: I, base: u256, head_pos: u256, input_len: u256) -> T`
- function `decode_or_revert` — `pub fn decode_or_revert<A: Abi, T, D, I>(d: mut D, _ input: I) -> T`
- function `decode_payload_root` — `pub fn decode_payload_root<A: Abi, T, D, I>(_ d: mut D, _ input: I) -> T`
- function `decode_single_root` — `pub fn decode_single_root<A: Abi, T, D, I>(_ d: mut D, _ input: I) -> T`
- function `dynamic_payload_size` — `pub fn dynamic_payload_size<T: AbiSize>(_ value: T) -> u256`
- function `encode_alloc` — `pub fn encode_alloc<A: Abi, T>(_ value: own T) -> ptr::MemBuffer`
- function `encode_field` — `pub fn encode_field<A: Abi, T>(_ value: T, _ out: AbiFrame, head_pos: u256, tails: own AbiFrame) -> AbiFrame` — Encodes `value` as the field whose head is at `head_pos` in `out`, and
- function `encode_return_alloc` — `pub fn encode_return_alloc<A: Abi, T>(_ value: own T) -> ptr::MemBuffer` — Encode a top-level return/output value.
- function `encode_single_root_alloc` — `pub fn encode_single_root_alloc<A: Abi, T>(_ value: own T) -> ptr::MemBuffer`
- function `load_word` — `pub unsafe fn load_word(_ ptr: *u8) -> u256` — Reads the big-endian word at `ptr`, whose 32 bytes must lie in a live
- function `prefix` — `pub fn prefix<I: ByteInput>(input: I) -> Prefix`
- function `ptr_offset` — `pub fn ptr_offset(_ ptr: *u8, _ offset: u256) -> *u8` — `ptr` advanced by the word `offset`, which lies within `ptr`'s
- function `store_word` — `pub unsafe fn store_word(ptr: *u8, value: u256)` — Writes `value` as a big-endian word at `ptr`, which must have room for 32
- struct `AbiFrame` — `pub struct AbiFrame` — The bytes an ABI encoding writes: `len` bytes in linear memory.
- struct `Bytes` — `pub struct Bytes` — A Solidity ABI `bytes` payload stored in linear memory.
- struct `BytesView` — `pub struct BytesView<I>`
- struct `Cursor` — `pub struct Cursor<I>` — Generic cursor over a `ByteInput`.
- struct `DynString` — `pub struct DynString` — A Solidity ABI `string` payload stored in linear memory.
- struct `Prefix` — `pub struct Prefix` — First-word prefix used for fast dispatch.
- struct `StringView` — `pub struct StringView<I>`
- trait `Abi` — `pub trait Abi` — ABI definition (selector width/format).
- trait `AbiDecoder` — `pub trait AbiDecoder<A: Abi>` — ABI decoder with cursor state.
- trait `AbiSize` — `pub trait AbiSize` — ABI payload layout metadata and exact runtime payload size.
- trait `AbiSpan` — `pub trait AbiSpan<A: Abi>: AbiSize` — End of the required input bytes; byte and string tails exclude trailing padding.
- trait `ByteInput` — `pub trait ByteInput: ByteSource` — A `ByteSource` with its length as a word for bounds arithmetic. Only the
- trait `ByteSource` — `pub trait ByteSource` — A read-only byte input for ABI decoding, such as calldata or a memory
- trait `Decode` — `pub trait Decode<A: Abi>: AbiSize`
- trait `Encode` — `pub trait Encode<A: Abi>: AbiSize`

### `core::bytes` (4 public)

- function `keccak` — `pub const fn keccak<T: AsBytes>(_ x: T) -> u256` — Hashes the fixed-width packed representation.
- struct `ByteWriter` — `pub struct ByteWriter<const M: usize>` — Appends into one packed destination. Every write checks the remaining capacity.
- struct `PackedBytes` — `pub struct PackedBytes<const N: usize>` — An owned, fixed-width byte sequence stored in big-endian numeric words.
- trait `AsBytes` — `pub trait AsBytes` — Fixed-width, big-endian serialization shared by CTFE and runtime.

### `core::clone` (1 public)

- trait `Clone` — `pub trait Clone`

### `core::contracts` (3 public)

- function `decode_runtime_args` — `pub fn decode_runtime_args<H, A, T>(_ host: mut H) -> T`
- trait `ContractHost` — `pub trait ContractHost` — Host interface required by compiler-generated contract entrypoints.
- trait `Target` — `pub trait Target` — Target configuration used by compiler-generated contract entrypoints.

### `core::default` (1 public)

- trait `Default` — `pub trait Default`

### `core::effect_ref` (1 public)

- trait `EffectRef` — `pub trait EffectRef<Target>` — Effect reference trait.

### `core::error` (1 public)

- trait `ErrorVariant` — `pub trait ErrorVariant<A: Abi>: Encode<A> + AbiSize` — Trait implemented by `#[error]` structs for Solidity-compatible custom errors.

### `core::fixed` (5 public)

- struct `Fixed` — `pub struct Fixed<const D: u256>` — Signed decimal fixed-point number with `D` decimals.
- struct `UFixed` — `pub struct UFixed<const D: u256>` — Unsigned decimal fixed-point number with `D` decimals.
- type_alias `Ray` — `pub type Ray = UFixed<27>` — 27-decimal unsigned fixed point (`1e27 == 1.0`).
- type_alias `SWad` — `pub type SWad = Fixed<18>` — 18-decimal signed fixed point.
- type_alias `Wad` — `pub type Wad = UFixed<18>` — 18-decimal unsigned fixed point (`1e18 == 1.0`).

### `core::functional` (5 public)

- trait `Applicative` — `pub trait Applicative: Functor` — A type constructor that supports `pure` and function application.
- trait `Fn` — `pub trait Fn<shape A>` — Core functional abstractions built around higher-kinded types.
- trait `FnMut` — `pub trait FnMut<shape A>` — A callable value whose call may mutate it: `FnMut(own T, U) -> R` is
- trait `Functor` — `pub trait Functor` — A type constructor that can be mapped over.
- trait `Monad` — `pub trait Monad: Applicative` — A monad in the sense of functional programming.

### `core::hash` (15 public)

- function `fold_hash` — `pub fn fold_hash<T: Hash>(_ value: T) -> u64` — The hash `FoldHasher` gives `value`, as a map finds it.
- function `hash_bytes` — `pub fn hash_bytes<H: Hasher>(_ bytes: MemSpan, _ state: mut H)` — Feeds `bytes` to `state` as text of every type does: each 32-byte word,
- function `keccak256` — `pub fn keccak256<T: HashInput>(_ input: T) -> [u8; 32]`
- function `keccak256_word` — `pub fn keccak256_word<T: HashInput>(_ input: T) -> u256` — The digest of `input` as a big-endian word; see `Keccak256::finish_word`.
- function `keccak_packed` — `pub fn keccak_packed<const N: usize>(_ bytes: PackedBytes<N>) -> u256` — The digest of `bytes`.
- function `keccak_raw` — `pub unsafe fn keccak_raw(_ ptr: *u8, _ len: u256) -> u256` — The digest of the `len` bytes at `ptr`.
- function `keccak_words` — `pub fn keccak_words<const N: usize>(_ words: [u256; N]) -> u256` — The digest of `words`, each as 32 big-endian bytes, in order.
- function `sha256` — `pub fn sha256<T: HashInput>(_ input: T) -> [u8; 32]`
- function `sha256_word` — `pub fn sha256_word<T: HashInput>(_ input: T) -> u256` — The digest of `input` as a big-endian word; see `Sha256::finish_word`.
- struct `FoldHasher` — `pub struct FoldHasher` — The hasher of `HashMap`: foldhash's folded multiply, which multiplies
- struct `Keccak256` — `pub struct Keccak256` — Ethereum's Keccak-256: 136-byte rate, 512-bit capacity, suffix 0x01.
- struct `Sha256` — `pub struct Sha256` — SHA-256 (FIPS 180-4).
- trait `Hash` — `pub trait Hash` — A value a `Hasher` reads, such as a `HashMap` key. Equal values must
- trait `HashInput` — `pub trait HashInput` — Read-only bytes. Implementations must accept every index below `input_len()`.
- trait `Hasher` — `pub trait Hasher` — A hash function over a sequence of words.

### `core::hint` (1 public)

- function `black_box` — `pub fn black_box<T>(_ value: own T) -> T` — Returns `value` unchanged while hiding it from the optimizer.

### `core::intrinsic` (6 public)

Collapsed (low-level/per-width intrinsics): `__keccak256`, `__keccak_words`, `clear`, `contract_field_slot`, `size_of`, `storage_slots`

### `core::iter` (13 public)

- struct `Enumerate` — `pub struct Enumerate<D>` — Each step of the inner traversal with its index.
- struct `Filter` — `pub struct Filter<D, P>` — The steps of the inner traversal that `p` holds for.
- struct `Identity` — `pub struct Identity<B>` — The traversal `for x in xs` runs over a `B`: each element in order.
- struct `Map` — `pub struct Map<D, F>` — The values `f` makes of the inner traversal's steps, owned.
- struct `Reversed` — `pub struct Reversed<B>` — Each element of a `B` from the last to the first.
- struct `Skip` — `pub struct Skip<D>` — The inner traversal after its first `n` steps.
- struct `StepBy` — `pub struct StepBy<D>` — Every `k`th step of the inner traversal, from its first.
- struct `Take` — `pub struct Take<D>` — The first `n` steps of the inner traversal.
- trait `Bidirectional` — `pub trait Bidirectional: Collection` — A collection that can also be traversed from its end.
- trait `Collection` — `pub trait Collection` — A collection a loop traverses by cursor, projecting each element in turn.
- trait `Driver` — `pub trait Driver` — A traversal of a base collection, `Base`, that a loop holds and passes to
- trait `FromProducer` — `pub trait FromProducer` — A container a producer's owned values are collected into, of the same
- trait `Producer` — `pub trait Producer` — A traversal that produces an owned value at each position, so non-`Copy`

### `core::map` (3 public)

- struct `Entries` — `pub struct Entries<K, V>` — The traversal `HashMap::entries` runs over a map.
- struct `HashMap` — `pub struct HashMap<K, V>` — A hash table that owns its keys and values, and destroys them when it is
- struct `Keys` — `pub struct Keys<K, V>` — The traversal `HashMap::keys` runs over a map.

### `core::marker` (6 public)

- struct `Storage` — `pub struct Storage` — Persistent storage, as the `Space` of a pinned type.
- struct `Transient` — `pub struct Transient` — Transient storage, as the `Space` of a pinned type.
- trait `Clearable` — `pub trait Clearable` — A type whose all-zero representation is a value, so a stored value is
- trait `Copy` — `pub trait Copy`
- trait `Pinned` — `pub trait Pinned` — A type pinned to a state space: a value of it, and every place in it,
- trait `Snapshot` — `pub trait Snapshot: Copy` — A `Copy` type a view parameter takes by copy, a *snapshot*: a scalar or a

### `core::mem` (5 public)

- function `drop` — `pub fn drop<T>(_ value: own T)` — Destroys `value` here, ending its lifetime before its owner's scope does.
- function `forget` — `pub fn forget<T>(_ value: own T)` — Consumes `value` without destroying it, so whatever it owns stays
- function `needs_drop` — `pub fn needs_drop<T>() -> bool` — Whether destroying a `T` does anything on the target being compiled.
- function `replace` — `pub fn replace<T>(_ dest: mut T, _ value: own T) -> T` — Moves `value` into `dest` and returns the value `dest` held.
- function `take` — `pub fn take<T: Default>(_ dest: mut T) -> T` — Moves the value out of `dest`, leaving `T::default()` in its place.

### `core::message` (1 public)

- trait `MsgVariant` — `pub trait MsgVariant<A: Abi>: Encode<A> + Decode<A>` — Trait implemented by message variants in a `msg` block.

### `core::num` (24 public)

Functions/consts (names only; many are per-integer-width): `Abs`, `Bounded`, `IntDowncast`, `IntWord`, `UnsignedAbs`, `WordValue`, `addmod`, `checked_mul_div`, `checked_mul_div_ceil`, `from_be`, `from_le`, `full_mul`, `gcd`, `isqrt`, `leading_zeros`, `mul_div`, `mul_div_ceil`, `mulmod`, `sign_extend`, `swap_bytes`, `to_be`, `to_le`, `trailing_zeros`, `word_to_usize`

### `core::num_intrinsics` (119 public)

Collapsed (low-level/per-width intrinsics): `checked_add_i128`, `checked_add_i16`, `checked_add_i256`, `checked_add_i32`, `checked_add_i64`, `checked_add_i8`, `checked_add_isize`, `checked_add_u128`, `checked_add_u16`, `checked_add_u256`, `checked_add_u32`, `checked_add_u64`, `checked_add_u8`, `checked_add_usize`, `checked_div_i128`, `checked_div_i16`, `checked_div_i256`, `checked_div_i32`, `checked_div_i64`, `checked_div_i8`, `checked_div_isize`, `checked_div_u128`, `checked_div_u16`, `checked_div_u256`, `checked_div_u32`, `checked_div_u64`, `checked_div_u8`, `checked_div_usize`, `checked_mul_i128`, `checked_mul_i16`, `checked_mul_i256`, `checked_mul_i32`, `checked_mul_i64`, `checked_mul_i8`, `checked_mul_isize`, `checked_mul_u128`, `checked_mul_u16`, `checked_mul_u256`, `checked_mul_u32`, `checked_mul_u64`, `checked_mul_u8`, `checked_mul_usize`, `checked_neg_i128`, `checked_neg_i16`, `checked_neg_i256`, `checked_neg_i32`, `checked_neg_i64`, `checked_neg_i8`, `checked_neg_isize`, `checked_rem_i128`, `checked_rem_i16`, `checked_rem_i256`, `checked_rem_i32`, `checked_rem_i64`, `checked_rem_i8`, `checked_rem_isize`, `checked_rem_u128`, `checked_rem_u16`, `checked_rem_u256`, `checked_rem_u32` …

### `core::ops` (42 public)

- function `clear_storage` — `pub fn clear_storage<C: StateIndex>(_ collection: mut C, _ key: C::Key)` — Zeroes the element at `key` of a collection: its slots, or only its bits
- struct `Location` — `pub struct Location` — Where an element of a `StateIndex` collection lies: its slot in the
- trait `Add` — `pub trait Add<T = Self>`
- trait `AddAssign` — `pub trait AddAssign<T = Self>`
- trait `BitAnd` — `pub trait BitAnd<T = Self>`
- trait `BitAndAssign` — `pub trait BitAndAssign<T = Self>`
- trait `BitNot` — `pub trait BitNot`
- trait `BitOr` — `pub trait BitOr<T = Self>`
- trait `BitOrAssign` — `pub trait BitOrAssign<T = Self>`
- trait `BitXor` — `pub trait BitXor<T = Self>`
- trait `BitXorAssign` — `pub trait BitXorAssign<T = Self>`
- trait `Div` — `pub trait Div<T = Self>`
- trait `DivAssign` — `pub trait DivAssign<T = Self>`
- trait `Drop` — `pub trait Drop` — Destroys a value when its owner gives it up: at the end of the owner's
- trait `Eq` — `pub trait Eq<T = Self>`
- trait `Index` — `pub trait Index<I>` — `t[i]`: at `mut` where the context needs a `mut` place (an assignment
- trait `LaneCodec` — `pub trait LaneCodec<T>` — How a place-indexed collection encodes an element it packs into a lane:
- trait `Len` — `pub trait Len` — The number of elements of a collection indexed by position: its
- trait `Mul` — `pub trait Mul<T = Self>`
- trait `MulAssign` — `pub trait MulAssign<T = Self>`
- trait `Neg` — `pub trait Neg`
- trait `Not` — `pub trait Not`
- trait `Ord` — `pub trait Ord<T = Self>`
- trait `Pow` — `pub trait Pow<T = Self>`
- trait `PowAssign` — `pub trait PowAssign<T = Self>`
- trait `Rem` — `pub trait Rem<T = Self>`
- trait `RemAssign` — `pub trait RemAssign<T = Self>`
- trait `SaturatingAdd` — `pub trait SaturatingAdd<T = Self>`
- trait `SaturatingMul` — `pub trait SaturatingMul<T = Self>`
- trait `SaturatingSub` — `pub trait SaturatingSub<T = Self>`
- trait `Shl` — `pub trait Shl<T = Self>`
- trait `ShlAssign` — `pub trait ShlAssign<T = Self>`
- trait `Shr` — `pub trait Shr<T = Self>`
- trait `ShrAssign` — `pub trait ShrAssign<T = Self>`
- trait `StateIndex` — `pub unsafe trait StateIndex: Pinned` — A collection whose elements are places in a state space, as an array's
- trait `Sub` — `pub trait Sub<T = Self>`
- trait `SubAssign` — `pub trait SubAssign<T = Self>`
- trait `WrappingAdd` — `pub trait WrappingAdd<T = Self>`
- trait `WrappingMul` — `pub trait WrappingMul<T = Self>`
- trait `WrappingNeg` — `pub trait WrappingNeg`
- trait `WrappingPow` — `pub trait WrappingPow<T = Self>`
- trait `WrappingSub` — `pub trait WrappingSub<T = Self>`

### `core::option` (1 public)

- enum `Option` — `pub enum Option<T>`

### `core::panics` (10 public)

- const `PANIC_ASSERT` — `pub const PANIC_ASSERT: u256 = 0x01`
- const `PANIC_DIVISION_BY_ZERO` — `pub const PANIC_DIVISION_BY_ZERO: u256 = 0x12`
- const `PANIC_ENUM_CONVERSION` — `pub const PANIC_ENUM_CONVERSION: u256 = 0x21`
- const `PANIC_GENERIC` — `pub const PANIC_GENERIC: u256 = 0x00`
- const `PANIC_INDEX_OUT_OF_BOUNDS` — `pub const PANIC_INDEX_OUT_OF_BOUNDS: u256 = 0x32`
- const `PANIC_OUT_OF_MEMORY` — `pub const PANIC_OUT_OF_MEMORY: u256 = 0x41`
- const `PANIC_OVERFLOW` — `pub const PANIC_OVERFLOW: u256 = 0x11`
- const `PANIC_POP_EMPTY` — `pub const PANIC_POP_EMPTY: u256 = 0x31`
- const `PANIC_STORAGE_ENCODING` — `pub const PANIC_STORAGE_ENCODING: u256 = 0x22`
- const `PANIC_ZERO_INIT_FUNCTION_POINTER` — `pub const PANIC_ZERO_INIT_FUNCTION_POINTER: u256 = 0x51`

### `core::ptr` (31 public)

- const `MAX_ALLOCATION` — `pub(ingot) const MAX_ALLOCATION: usize = u64::max().downcast_saturate()` — The largest allocation: the Solidity bound of `2**64 - 1`, or the largest
- function `alloc` — `pub fn alloc<T>() -> *T` — Allocates room for `T`, without establishing initialized `T` contents.
- function `alloc_array` — `pub unsafe fn alloc_array<T>(_ len: usize) -> MemArray<T>` — Allocates an array without initializing its contents. The caller must
- function `alloc_bytes` — `pub fn alloc_bytes(_ len: usize) -> *u8` — Allocates `len` bytes, without initializing them. Reverts with
- function `alloc_bytes_unchecked` — `pub(ingot) unsafe fn alloc_bytes_unchecked(_ len: usize) -> *u8` — Allocates `len` bytes, without initializing them or bounding `len`. The
- function `allocation_len` — `pub fn allocation_len(_ len: u256) -> usize` — The `usize` length of an allocation sized as a word. A length the
- function `byte_ptr` — `pub fn byte_ptr<T>(_ ptr: *T) -> *u8`
- function `cast` — `pub fn cast<T, U>(_ ptr: *T) -> *U` — Changes interpretation without changing allocation size or initializing bytes.
- function `copy` — `pub unsafe fn copy(_ dest: *u8, _ source: MemSpan)` — Copy a byte span into a valid destination region.
- function `copy_mem` — `pub(ingot) unsafe fn copy_mem(_ dest: *u8, _ source: *u8, _ len: usize)` — Copies `len` bytes between linear-memory regions.
- function `copy_raw` — `pub unsafe fn copy_raw(_ dest: *u8, _ source: *u8, _ len: usize)` — Copy a raw byte range into a valid destination region.
- function `dealloc` — `pub unsafe fn dealloc<T>(_ ptr: *T)` — Releases an allocation made by `alloc_bytes` or `try_alloc_bytes`.
- function `drop_in_place` — `pub unsafe fn drop_in_place<T>(_ ptr: *T)` — Destroys the value at `ptr`, leaving its memory uninitialized.
- function `drop_in_place_n` — `pub unsafe fn drop_in_place_n<T>(_ ptr: *T, _ len: usize)` — Destroys the `len` values from `ptr` on, in order; see `drop_in_place`.
- function `index_out_of_bounds` — `pub(ingot) fn index_out_of_bounds() -> !`
- function `offset` — `pub fn offset<T>(_ ptr: *T, _ count: usize) -> *T` — Computes an element offset with the same access preconditions as `offset_bytes`.
- function `offset_bytes` — `pub fn offset_bytes<T>(_ ptr: *T, _ offset: usize) -> *T` — Computes an address without enlarging or validating its allocation.
- function `read_padded_word` — `pub(ingot) unsafe fn read_padded_word(_ ptr: *u8, _ len: usize) -> u256` — The 32-byte big-endian word at `ptr`, with every byte from `len` on
- function `try_alloc_bytes` — `pub fn try_alloc_bytes(_ len: usize) -> Option<*u8>` — Allocates `len` bytes without initializing them, or `None` when `len`
- function `try_alloc_elems` — `pub(ingot) fn try_alloc_elems<T>(_ len: usize) -> Option<*T>` — Allocates room for `len` values of `T`, without initializing them, or
- function `zero_bytes` — `pub unsafe fn zero_bytes(_ ptr: *u8, _ len: usize)` — Zeroes a raw range. The caller must ensure all `len` bytes fit without
- struct `Box` — `pub struct Box<T>` — A value in an allocation of its own, which the box owns.
- struct `FixedMemBuffer` — `pub struct FixedMemBuffer<const N: usize>` — A fixed-size owned allocation in linear memory.
- struct `MemArray` — `pub struct MemArray<T>` — A dynamically sized array in linear memory.
- struct `MemBuffer` — `pub struct MemBuffer` — An owned allocation in linear memory.
- struct `MemSlice` — `pub struct MemSlice<T>` — A view over typed values in linear memory.
- struct `MemVec` — `pub struct MemVec<T>` — A growable array in linear memory.
- type_alias `CalldataPtr` — `pub type CalldataPtr<T> = *T` — A pointer to a calldata offset.
- type_alias `MemSpan` — `pub type MemSpan = MemSlice<u8>` — A byte view over linear memory.
- type_alias `StorPtr` — `pub type StorPtr<T> = *T` — A pointer to a storage slot. Dereferencing it is the slot's place.
- type_alias `TStorPtr` — `pub type TStorPtr<T> = *T` — A pointer to a transient-storage slot.

### `core::range` (4 public)

- struct `Known` — `pub struct Known<const N: usize>` — A compile-time known bound value.
- struct `Range` — `pub struct Range<S: Bound, E: Bound>` — A range from start to end (exclusive).
- struct `Unknown` — `pub struct Unknown` — A runtime bound value.
- trait `Bound` — `pub trait Bound` — Trait for range bounds - either compile-time known or runtime.

### `core::result` (1 public)

- enum `Result` — `pub enum Result<E, T>`

### `core::sort` (10 public)

- function `binary_search` — `pub fn binary_search<S: Index<usize> + Len>(_ seq: S, _ needle: S::Output) -> Option<usize> uses S::E` — The index of an element equal to `needle` in the sorted `seq`, like
- function `dedup_sorted` — `pub fn dedup_sorted<S: mut Index<usize> + Len>(_ seq: mut S) -> usize uses S::E` — Removes consecutive duplicates from the sorted `seq` by moving the
- function `heap_sort` — `pub fn heap_sort<S: mut Index<usize> + Len>(_ seq: mut S) uses S::E` — Sorts `seq` in ascending order with heapsort: `O(n log n)` for every
- function `insertion_sort` — `pub fn insertion_sort<S: mut Index<usize> + Len>(_ seq: mut S) uses S::E` — Sorts `seq` in ascending order by insertion: `O(n^2)` comparisons but
- function `is_sorted` — `pub fn is_sorted<S: Index<usize> + Len>(_ seq: S) -> bool uses S::E` — Whether every element is less than or equal to the next.
- function `is_sorted_unique` — `pub fn is_sorted_unique<S: Index<usize> + Len>(_ seq: S) -> bool uses S::E` — Whether every element is strictly less than the next, i.e. the sequence
- function `lower_bound` — `pub fn lower_bound<S: Index<usize> + Len>(_ seq: S, _ needle: S::Output) -> usize uses S::E` — The index of the first element of the sorted `seq` that is not less
- function `reverse` — `pub fn reverse<S: mut Index<usize> + Len>(_ seq: mut S) uses S::E` — Reverses the order of the elements.
- function `sort` — `pub fn sort<S: mut Index<usize> + Len>(_ seq: mut S) uses S::E` — Sorts `seq` in ascending order.
- function `swap` — `pub fn swap<S: mut Index<usize>>(_ seq: mut S, _ i: usize, _ j: usize) uses S::E` — Swaps the elements at `i` and `j`.

### `core::string` (1 public)

- function `concat` — `pub const fn concat<const A: usize, const B: usize, const OUT: usize>(` — Concatenates two fixed-size strings using their effective (unpadded) lengths.

### `core::text` (18 public)

- function `base58` — `pub fn base58(_ data: MemSpan) -> DynString` — Returns the Bitcoin base58 encoding of `data` (OpenZeppelin
- function `base64` — `pub fn base64(_ data: MemSpan) -> DynString` — Returns the standard base64 encoding of `data`, with `=` padding
- function `concat` — `pub fn concat<const N: usize>(_ parts: [DynString; N]) -> DynString` — Returns the concatenation of `parts` (Solidity `string.concat`).
- function `concat_slice` — `pub fn concat_slice(_ parts: ptr::MemSlice<DynString>) -> DynString` — Concatenate a runtime-length slice of strings with one output allocation.
- function `decimal` — `pub fn decimal(_ value: u256) -> DynString` — Returns the decimal representation of `value` (Solidity `Strings.toString`).
- function `decode_base58` — `pub fn decode_base58<T: Text>(_ input: T) -> Option<Bytes>` — Decodes Bitcoin base58, the inverse of `base58` (OpenZeppelin
- function `decode_base64` — `pub fn decode_base64<T: Text>(_ input: T) -> Option<Bytes>` — Decodes standard base64 with `=` padding, the inverse of `base64`.
- function `decode_hex` — `pub fn decode_hex<T: Text>(_ input: T) -> Option<Bytes>` — Decodes hex digits of either case, with or without a `0x` prefix, two
- function `hex` — `pub fn hex(_ value: u256, _ bytes: usize) -> DynString` — Returns the lowest `bytes` bytes of `value` as `2 * bytes` lowercase hex
- function `hex_upper` — `pub fn hex_upper(_ value: u256, _ bytes: usize) -> DynString` — Like `hex`, with uppercase digits.
- function `parse_hex_uint` — `pub fn parse_hex_uint<T: Text>(_ text: T) -> Option<u256>` — Parses hex digits of either case, with or without a `0x` prefix, as a
- function `parse_int` — `pub fn parse_int<T: Text>(_ text: T) -> Option<i256>` — Parses decimal digits with an optional `+` or `-` sign as an `i256`
- function `parse_uint` — `pub fn parse_uint<T: Text>(_ text: T) -> Option<u256>` — Parses decimal digits as a `u256` (Solidity `Strings.tryParseUint`).
- struct `Lines` — `pub struct Lines` — The traversal `MemSpan::lines` runs over a span. Its state is a line's
- struct `Split` — `pub struct Split<P>` — The traversal `MemSpan::split` runs over a span. Its state is a part's
- struct `TextBuilder` — `pub struct TextBuilder` — Incremental byte-preserving text construction. Capacity grows geometrically
- trait `Pattern` — `pub trait Pattern` — What a span's searches and `split` look for: a byte (`b','`) or any
- trait `Text` — `pub trait Text` — Text the parsers read in place, and a span's searches look for: a

### `std::abi` (5 public)

- function `bytes_from_word` — `pub fn bytes_from_word(_ w: u256) -> Bytes` — Allocate a 32-byte Solidity ABI `bytes` value from a single word.
- function `bytes_from_words` — `pub fn bytes_from_words<const N: usize>(_ words: [u256; N]) -> Bytes` — Allocate a Solidity ABI `bytes` value from `N` full 32-byte words.
- function `bytes_from_words_prefix` — `pub fn bytes_from_words_prefix<const LEN: usize, const N: usize>(_ words: [u256; N]) -> Bytes` — Allocate a `Bytes` of byte length `LEN` from `N` u256 words.
- type_alias `Text` — `pub type Text = DynString` — UTF-8 text stored as Solidity ABI `string`.
- type_alias `Vec` — `pub type Vec<T> = DynArray<T>` — Solidity ABI dynamic array.

### `std::abi::array_view` (3 public)

- function `decode_array_view` — `pub fn decode_array_view<T, I>(_ input: own I) -> ArrayView<I, T>` — View the ABI `T[]` whose head word is at byte 0 of `input`.
- function `decode_array_view_at` — `pub fn decode_array_view_at<T, I>(_ input: own I, base: u256, head_pos: u256) -> ArrayView<I, T>` — View an ABI `T[]` inside `input`.
- struct `ArrayView` — `pub struct ArrayView<I, T>` — A lazy, validated view of a Solidity ABI `T[]` value inside a `ByteInput`.

### `std::abi::dyn_array` (3 public)

- function `canonical_dyn_array` — `pub fn canonical_dyn_array<T>(_ values: DynArray<T>) -> DynArray<T>` — A canonically encoded copy of `values`.
- function `dyn_array_from` — `pub fn dyn_array_from<T, const N: usize>(_ values: [T; N]) -> DynArray<T>` — A `DynArray` holding `values` in order.
- struct `DynArray` — `pub struct DynArray<T>` — A Solidity-style dynamic array (`T[]`) stored in linear memory.

### `std::abi::sol` (12 public)

- function `decode_bytes_view` — `pub fn decode_bytes_view<I>(_ input: own I) -> BytesView<I>` — Decode a Solidity ABI `bytes` payload view from `input` at byte 0.
- function `decode_bytes_view_at` — `pub fn decode_bytes_view_at<I>(_ input: own I, base: u256, head_pos: u256) -> BytesView<I>` — Decode a Solidity ABI `bytes` payload view from `input`.
- function `decode_input` — `pub fn decode_input<T, I>(_ input: I) -> T` — Decode a Solidity ABI payload from an arbitrary byte input starting at byte 0.
- function `decode_input_at` — `pub fn decode_input_at<T, I>(_ input: I, _ base: u256) -> T` — Decode a Solidity ABI payload from an arbitrary byte input using an explicit base offset.
- function `decode_output` — `pub fn decode_output<T, I>(_ input: I) -> T` — Decode a Solidity ABI return/output payload from an arbitrary byte input at byte 0.
- function `decode_output_at` — `pub fn decode_output_at<T, I>(_ input: I, _ base: u256) -> T` — Decode a Solidity ABI return/output payload from an arbitrary byte input.
- function `decode_string_view` — `pub fn decode_string_view<I>(_ input: own I) -> StringView<I>` — Decode a Solidity ABI `string` payload view from `input` at byte 0.
- function `decode_string_view_at` — `pub fn decode_string_view_at<I>(_ input: own I, base: u256, head_pos: u256) -> StringView<I>` — Decode a Solidity ABI `string` payload view from `input`.
- function `encoded_size` — `pub const fn encoded_size<T>() -> u256`
- function `sol` — `pub const fn sol<T: AsBytes>(_ sig: T) -> u32` — Compute the 4-byte Solidity selector from the fixed-width packed encoding.
- struct `Sol` — `pub struct Sol`
- struct `SolDecoder` — `pub struct SolDecoder` — A Solidity ABI decoder: a position in the input and the base that

### `std::abi::sol::ints` (53 public)

Collapsed (low-level/per-width intrinsics): `Int104`, `Int112`, `Int120`, `Int136`, `Int144`, `Int152`, `Int160`, `Int168`, `Int176`, `Int184`, `Int192`, `Int200`, `Int208`, `Int216`, `Int224`, `Int232`, `Int24`, `Int240`, `Int248`, `Int40`, `Int48`, `Int56`, `Int72`, `Int80`, `Int88`, `Int96`, `Uint104`, `Uint112`, `Uint120`, `Uint136`, `Uint144`, `Uint152`, `Uint160`, `Uint168`, `Uint176`, `Uint184`, `Uint192`, `Uint200`, `Uint208`, `Uint216`, `Uint224`, `Uint232`, `Uint24`, `Uint240`, `Uint248`, `Uint40`, `Uint48`, `Uint56`, `Uint72`, `Uint80`, `Uint88`, `Uint96`, `SolWordRepr`

### `std::abi::sol::types` (37 public)

- struct `FixedBytes` — `pub struct FixedBytes<const N: usize>` — Solidity `bytesN` for `1 <= N <= 32`.
- trait `SolCompat` — `pub trait SolCompat` — Maps a Fe type to its Solidity ABI type name.
- trait `StaticAbiElement` — `pub trait StaticAbiElement: StaticAbiElementSeal`
- trait `StaticAbiElementSeal` — `pub(ingot) trait StaticAbiElementSeal` — Marker for Solidity ABI values encoded as one static 32-byte word.
- type_alias `Bytes1` — `pub type Bytes1 = FixedBytes<1>` — Solidity ABI `bytes1`.
- type_alias `Bytes10` — `pub type Bytes10 = FixedBytes<10>` — Solidity ABI `bytes10`.
- type_alias `Bytes11` — `pub type Bytes11 = FixedBytes<11>` — Solidity ABI `bytes11`.
- type_alias `Bytes12` — `pub type Bytes12 = FixedBytes<12>` — Solidity ABI `bytes12`.
- type_alias `Bytes13` — `pub type Bytes13 = FixedBytes<13>` — Solidity ABI `bytes13`.
- type_alias `Bytes14` — `pub type Bytes14 = FixedBytes<14>` — Solidity ABI `bytes14`.
- type_alias `Bytes15` — `pub type Bytes15 = FixedBytes<15>` — Solidity ABI `bytes15`.
- type_alias `Bytes16` — `pub type Bytes16 = FixedBytes<16>` — Solidity ABI `bytes16`.
- type_alias `Bytes17` — `pub type Bytes17 = FixedBytes<17>` — Solidity ABI `bytes17`.
- type_alias `Bytes18` — `pub type Bytes18 = FixedBytes<18>` — Solidity ABI `bytes18`.
- type_alias `Bytes19` — `pub type Bytes19 = FixedBytes<19>` — Solidity ABI `bytes19`.
- type_alias `Bytes2` — `pub type Bytes2 = FixedBytes<2>` — Solidity ABI `bytes2`.
- type_alias `Bytes20` — `pub type Bytes20 = FixedBytes<20>` — Solidity ABI `bytes20`.
- type_alias `Bytes21` — `pub type Bytes21 = FixedBytes<21>` — Solidity ABI `bytes21`.
- type_alias `Bytes22` — `pub type Bytes22 = FixedBytes<22>` — Solidity ABI `bytes22`.
- type_alias `Bytes23` — `pub type Bytes23 = FixedBytes<23>` — Solidity ABI `bytes23`.
- type_alias `Bytes24` — `pub type Bytes24 = FixedBytes<24>` — Solidity ABI `bytes24`.
- type_alias `Bytes25` — `pub type Bytes25 = FixedBytes<25>` — Solidity ABI `bytes25`.
- type_alias `Bytes26` — `pub type Bytes26 = FixedBytes<26>` — Solidity ABI `bytes26`.
- type_alias `Bytes27` — `pub type Bytes27 = FixedBytes<27>` — Solidity ABI `bytes27`.
- type_alias `Bytes28` — `pub type Bytes28 = FixedBytes<28>` — Solidity ABI `bytes28`.
- type_alias `Bytes29` — `pub type Bytes29 = FixedBytes<29>` — Solidity ABI `bytes29`.
- type_alias `Bytes3` — `pub type Bytes3 = FixedBytes<3>` — Solidity ABI `bytes3`.
- type_alias `Bytes30` — `pub type Bytes30 = FixedBytes<30>` — Solidity ABI `bytes30`.
- type_alias `Bytes31` — `pub type Bytes31 = FixedBytes<31>` — Solidity ABI `bytes31`.
- type_alias `Bytes32` — `pub type Bytes32 = FixedBytes<32>` — Solidity ABI `bytes32`.
- type_alias `Bytes4` — `pub type Bytes4 = FixedBytes<4>` — Solidity ABI `bytes4`.
- type_alias `Bytes5` — `pub type Bytes5 = FixedBytes<5>` — Solidity ABI `bytes5`.
- type_alias `Bytes6` — `pub type Bytes6 = FixedBytes<6>` — Solidity ABI `bytes6`.
- type_alias `Bytes7` — `pub type Bytes7 = FixedBytes<7>` — Solidity ABI `bytes7`.
- type_alias `Bytes8` — `pub type Bytes8 = FixedBytes<8>` — Solidity ABI `bytes8`.
- type_alias `Bytes9` — `pub type Bytes9 = FixedBytes<9>` — Solidity ABI `bytes9`.
- type_alias `SolPunctuation` — `pub type SolPunctuation = String<1>` — One byte of punctuation in a Solidity type name. The `SolCompat`

### `std::env` (4 public)

- function `c_string_len` — `pub(ingot) fn c_string_len(_ bytes: *u8) -> usize`
- struct `Arg` — `pub struct Arg` — A process argument: bytes that may be empty and need not be UTF-8.
- trait `Args` — `pub trait Args: HostCapabilitySeal` — The process's command-line arguments. The first names the program.
- trait `Env` — `pub trait Env: HostCapabilitySeal` — The process's environment variables.

### `std::evm::address` (2 public)

- function `checksum_address` — `pub fn checksum_address(_ address: Address) -> DynString` — Format an address as `0x` and 40 ERC-55 checksum-cased hex digits.
- function `parse_address` — `pub fn parse_address<T: Text>(_ text: T) -> Option<Address>` — Parses `0x` and 40 hex digits, or the 40 digits alone, as an address

### `std::evm::calldata` (1 public)

- struct `CallData` — `pub struct CallData` — A view over the current EVM calldata.

### `std::evm::calls` (2 public)

- function `has_min_gas` — `pub fn has_min_gas(_ available: u256, _ minimum: u256, _ reserved: u256) -> bool` — Whether available >= ceil(minimum * 64 / 63) + reserved + 40,000.
- struct `InsufficientGas` — `pub struct InsufficientGas`

### `std::evm::clones` (5 public)

- function `clone` — `pub fn clone(_ implementation: Address, value: Wei) -> Address` — Deploy a proxy using CREATE, forwarding `value` to its creation.
- function `clone_deterministic` — `pub fn clone_deterministic(_ implementation: Address, salt: u256, value: Wei) -> Address` — Deploy a proxy using CREATE2. Reusing an occupied implementation/salt/deployer
- function `clone_initcode` — `pub fn clone_initcode(_ implementation: Address) -> FixedMemBuffer<55>` — The standard 55-byte creation code for an ERC-1167 proxy.
- function `predict_deterministic_address` — `pub fn predict_deterministic_address(` — Predict a CREATE2 proxy address without deploying it. `deployer` is the
- struct `ERC1167FailedCreateClone` — `#[error]`

### `std::evm::crypto` (57 public)

- const `BLAKE2F_ADDRESS` — `pub const BLAKE2F_ADDRESS: u256 = 0x09`
- const `BLAKE2F_INPUT_LEN` — `pub const BLAKE2F_INPUT_LEN: usize = 213`
- const `BLS12_FP2_LEN` — `pub const BLS12_FP2_LEN: usize = 128`
- const `BLS12_FP_LEN` — `pub const BLS12_FP_LEN: usize = 64`
- const `BLS12_G1_ADD_ADDRESS` — `pub const BLS12_G1_ADD_ADDRESS: u256 = 0x0b`
- const `BLS12_G1_ADD_INPUT_LEN` — `pub const BLS12_G1_ADD_INPUT_LEN: usize = 256`
- const `BLS12_G1_LEN` — `pub const BLS12_G1_LEN: usize = 128`
- const `BLS12_G1_MSM_ADDRESS` — `pub const BLS12_G1_MSM_ADDRESS: u256 = 0x0c`
- const `BLS12_G1_MSM_PAIR_LEN` — `pub const BLS12_G1_MSM_PAIR_LEN: usize = 160`
- const `BLS12_G2_ADD_ADDRESS` — `pub const BLS12_G2_ADD_ADDRESS: u256 = 0x0d`
- const `BLS12_G2_ADD_INPUT_LEN` — `pub const BLS12_G2_ADD_INPUT_LEN: usize = 512`
- const `BLS12_G2_LEN` — `pub const BLS12_G2_LEN: usize = 256`
- const `BLS12_G2_MSM_ADDRESS` — `pub const BLS12_G2_MSM_ADDRESS: u256 = 0x0e`
- const `BLS12_G2_MSM_PAIR_LEN` — `pub const BLS12_G2_MSM_PAIR_LEN: usize = 288`
- const `BLS12_MAP_FP2_TO_G2_ADDRESS` — `pub const BLS12_MAP_FP2_TO_G2_ADDRESS: u256 = 0x11`
- const `BLS12_MAP_FP_TO_G1_ADDRESS` — `pub const BLS12_MAP_FP_TO_G1_ADDRESS: u256 = 0x10`
- const `BLS12_PAIRING_ADDRESS` — `pub const BLS12_PAIRING_ADDRESS: u256 = 0x0f`
- const `BLS12_PAIRING_PAIR_LEN` — `pub const BLS12_PAIRING_PAIR_LEN: usize = 384`
- const `BN254_ADD_ADDRESS` — `pub const BN254_ADD_ADDRESS: u256 = 0x06`
- const `BN254_MUL_ADDRESS` — `pub const BN254_MUL_ADDRESS: u256 = 0x07`
- const `BN254_PAIRING_ADDRESS` — `pub const BN254_PAIRING_ADDRESS: u256 = 0x08`
- const `ECRECOVER_ADDRESS` — `pub const ECRECOVER_ADDRESS: u256 = 0x01`
- const `IDENTITY_ADDRESS` — `pub const IDENTITY_ADDRESS: u256 = 0x04`
- const `KZG_POINT_EVALUATION_ADDRESS` — `pub const KZG_POINT_EVALUATION_ADDRESS: u256 = 0x0a`
- const `KZG_POINT_EVALUATION_INPUT_LEN` — `pub const KZG_POINT_EVALUATION_INPUT_LEN: usize = 192`
- const `MODEXP_ADDRESS` — `pub const MODEXP_ADDRESS: u256 = 0x05`
- const `P256VERIFY_ADDRESS` — `pub const P256VERIFY_ADDRESS: u256 = 0x100`
- const `P256VERIFY_INPUT_LEN` — `pub const P256VERIFY_INPUT_LEN: usize = 160`
- const `RIPEMD160_ADDRESS` — `pub const RIPEMD160_ADDRESS: u256 = 0x03`
- const `SHA256_ADDRESS` — `pub const SHA256_ADDRESS: u256 = 0x02`
- enum `PrecompileError` — `pub enum PrecompileError`
- function `addmod` — `pub const fn addmod(_ a: u256, _ b: u256, _ m: u256) -> u256` — Modular addition: `(a + b) % m` with 512-bit intermediate precision.
- function `blake2f` — `pub fn blake2f(_ data: MemSpan) -> Result<PrecompileError, (u256, u256)>` — BLAKE2 compression function F (precompile 0x09).
- function `bls12_g1_add` — `pub fn bls12_g1_add(_ data: MemSpan) -> Result<PrecompileError, (u256, u256, u256, u256)>` — BLS12-381 G1 addition (precompile 0x0b).
- function `bls12_g1_msm` — `pub fn bls12_g1_msm(_ data: MemSpan) -> Result<PrecompileError, (u256, u256, u256, u256)>` — BLS12-381 G1 multiscalar multiplication (precompile 0x0c).
- function `bls12_g2_add` — `pub fn bls12_g2_add(` — BLS12-381 G2 addition (precompile 0x0d).
- function `bls12_g2_msm` — `pub fn bls12_g2_msm(` — BLS12-381 G2 multiscalar multiplication (precompile 0x0e).
- function `bls12_map_fp2_to_g2` — `pub fn bls12_map_fp2_to_g2(` — BLS12-381 map field element pair to G2 (precompile 0x11).
- function `bls12_map_fp_to_g1` — `pub fn bls12_map_fp_to_g1(_ data: MemSpan) -> Result<PrecompileError, (u256, u256, u256, u256)>` — BLS12-381 map field element to G1 (precompile 0x10).
- function `bls12_pairing` — `pub fn bls12_pairing(_ data: MemSpan) -> Result<PrecompileError, bool>` — BLS12-381 pairing check (precompile 0x0f).
- function `create2_address` — `pub fn create2_address(deployer: Address, salt: u256, init_code_hash: u256) -> Address` — Address of a contract created with `CREATE2` by `deployer`:
- function `ec_add` — `pub fn ec_add(` — EC point addition on BN254 (precompile 0x06).
- function `ec_mul` — `pub fn ec_mul(px: u256, py: u256, s: u256) -> Result<PrecompileError, (u256, u256)>` — EC scalar multiplication on BN254 (precompile 0x07).
- function `ec_pairing` — `pub fn ec_pairing(_ data: MemSpan) -> Result<PrecompileError, bool>` — EC pairing check on a pre-built memory span (precompile 0x08).
- function `ecrecover` — `pub fn ecrecover(` — Recover signer address from a message hash and ECDSA signature (precompile 0x01).
- function `ecrecover_raw` — `pub fn ecrecover_raw(` — Recover signer address through the ECRecover precompile without canonical
- function `eip712_digest` — `pub fn eip712_digest(domain_separator: u256, struct_hash: u256) -> u256` — EIP-712 typed-data digest:
- function `identity` — `pub fn identity(_ data: MemSpan) -> Result<PrecompileError, MemBuffer>` — Copy a memory region through the identity precompile (precompile 0x04).
- function `keccak256` — `pub fn keccak256(_ data: MemSpan) -> u256` — Keccak256 hash of a memory region.
- function `keccak_words` — `pub const fn keccak_words<const N: usize>(_ words: [u256; N]) -> u256` — Keccak256 of the concatenated 32-byte words, e.g. `keccak_words([a, b])`
- function `kzg_point_evaluation` — `pub fn kzg_point_evaluation(_ data: MemSpan) -> Result<PrecompileError, (u256, u256)>` — KZG point evaluation (precompile 0x0a).
- function `modexp` — `pub fn modexp(base: u256, exp: u256, modulus: u256) -> Result<PrecompileError, u256>` — Modular exponentiation (precompile 0x05).
- function `modexp_raw` — `pub fn modexp_raw(_ data: MemSpan, ret_len: usize) -> Result<PrecompileError, MemBuffer>` — Raw modular exponentiation with caller-provided input and return size.
- function `mulmod` — `pub const fn mulmod(_ a: u256, _ b: u256, _ m: u256) -> u256` — Modular multiplication: `(a * b) % m` with 512-bit intermediate precision.
- function `p256_verify` — `pub fn p256_verify(_ data: MemSpan) -> Result<PrecompileError, bool>` — secp256r1 P-256 signature verification (precompile 0x100).
- function `ripemd160` — `pub fn ripemd160(_ data: MemSpan) -> Result<PrecompileError, u256>` — RIPEMD160 hash of a memory region (precompile 0x03).
- function `sha256` — `pub fn sha256(_ data: MemSpan) -> Result<PrecompileError, u256>` — SHA256 hash of a memory region (precompile 0x02).

### `std::evm::effects` (31 public)

- function `assert` — `pub fn assert(_ b: own bool)`
- function `bubble_last_revert` — `pub fn bubble_last_revert() -> !` — Revert, bubbling the current returndata payload unchanged.
- function `bubble_revert_or` — `pub fn bubble_revert_or<E>(_ error: own E) -> !` — Revert with the current returndata if there is any, otherwise with the
- function `copy_returndata` — `pub fn copy_returndata() -> MemBuffer` — Copy the complete current returndata into a fresh owner.
- function `decode_returndata` — `pub fn decode_returndata<R>(_ ret: MemSpan) -> R` — Decode Solidity ABI data from an in-memory returndata buffer.
- function `encode_abi_payload` — `pub fn encode_abi_payload<T>(_ value: own T) -> MemBuffer`
- function `encode_error` — `pub fn encode_error<T>(_ error: own T) -> MemBuffer` — Encode a custom error (4-byte selector + ABI-encoded fields) into freshly
- function `encode_msg_calldata` — `pub fn encode_msg_calldata<M>(_ message: own M) -> MemBuffer` — ABI-encode a message (4-byte selector + payload) into freshly allocated
- function `init_code_hash` — `pub fn init_code_hash<C: Contract>(_ args: own C::InitArgs) -> u256` — Keccak256 of the init code `create2<C>(value, args, salt)` deploys: `C`'s
- function `predict_create2` — `pub fn predict_create2<C: Contract>(deployer: Address, args: own C::InitArgs, salt: u256) -> Address` — Address at which `create2<C>(value, args, salt)` executed by `deployer`
- function `read_storage_word` — `pub fn read_storage_word(_ slot: u256) -> u256 uses (storage: RawStorage)` — Copies one word from the current contract's persistent storage.
- function `read_transient_word` — `pub fn read_transient_word(_ slot: u256) -> u256 uses (storage: RawStorage)` — Copies one word from the current contract's transaction-local storage.
- function `revert` — `pub fn revert<T>(_ value: own T) -> !` — Revert the current transaction with ABI-encoded data.
- function `revert_bytes` — `pub fn revert_bytes(_ data: MemSpan) -> !` — Revert with `data` as the raw revert payload.
- function `revert_empty` — `pub fn revert_empty() -> !` — Revert without revert data, like Solidity's `revert()`.
- function `revert_error` — `pub fn revert_error<T>(_ error: own T) -> !` — Revert with a Solidity-compatible custom error.
- function `staticcall_decode` — `pub fn staticcall_decode<R>(addr: Address, gas: u256, args: MemSpan) -> R` — Perform a raw `STATICCALL` and ABI-decode the returndata on success.
- function `storage_at` — `pub unsafe fn storage_at<T>(_ slot: u256) -> mut? T uses (storage: mut? RawStorage)` — The `T` at storage slot `slot`, as a storage place to read, or to write
- struct `Address` — `pub struct Address` — EVM address (20 bytes).
- struct `CallOutcome` — `pub struct CallOutcome` — Owned returndata from a typed, non-bubbling EVM call.
- struct `Evm` — `pub struct Evm` — Default EVM effect provider (zero-sized).
- struct `RawCallOutcome` — `pub struct RawCallOutcome` — Metadata returned by a low-level EVM call.
- struct `TSlot` — `pub struct TSlot<T>` — A transient storage cell holding a `T`, kept in a storage struct.
- trait `Call` — `pub trait Call: EvmCapabilitySeal` — High-level contract calls with ABI encoding/decoding.
- trait `Contract` — `pub trait Contract` — Metadata for deployable high-level contracts.
- trait `Create` — `pub trait Create: EvmCapabilitySeal`
- trait `Ctx` — `pub trait Ctx: EvmCapabilitySeal` — EVM execution context (env access).
- trait `Log` — `pub trait Log: EvmCapabilitySeal`
- trait `RawOps` — `pub trait RawOps: RawStorage` — Access to low-level EVM op functions (excluding raw stack ops).
- trait `RawStorage` — `pub trait RawStorage: EvmCapabilitySeal` — Low-level raw storage operations.
- trait `Super` — `pub trait Super: Ctx + RawOps + Log + Create + Call` — Combined EVM capability: provides all EVM effects.

### `std::evm::eip712` (4 public)

- const `DOMAIN_TYPEHASH` — `pub const DOMAIN_TYPEHASH: u256 = core::keccak(` — `keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")`.
- function `digest` — `pub fn digest(domain_separator: u256, struct_hash: u256) -> u256` — EIP-712 typed-data digest,
- function `domain_separator` — `pub fn domain_separator(` — `keccak256(abi.encode(DOMAIN_TYPEHASH, name_hash, version_hash, chain_id, verifying_contract))`.
- struct `Domain` — `pub struct Domain` — An EIP-712 domain with the separator cached for the chain and contract

### `std::evm::erc1155` (2 public)

- function `try_safe_batch_transfer_from` — `pub fn try_safe_batch_transfer_from(` — Call `safeBatchTransferFrom(owner, receiver, ids, amounts, data)` on
- function `try_safe_transfer_from` — `pub fn try_safe_transfer_from(` — Call `safeTransferFrom(owner, receiver, id, amount, data)` on `token`

### `std::evm::erc165` (3 public)

- function `supports_erc165` — `pub fn supports_erc165(_ account: Address) -> bool uses (call: Call)` — Whether `account` implements ERC-165 itself.
- function `supports_interface` — `pub fn supports_interface(_ account: Address, interface_id: u32) -> bool uses (call: Call)` — Whether `account` implements ERC-165 and `interface_id`.
- function `supports_interface_unchecked` — `pub fn supports_interface_unchecked(_ account: Address, interface_id: u32) -> bool uses (call: Call)` — `supportsInterface(interface_id)` without checking ERC-165 support first:

### `std::evm::erc20` (6 public)

- function `safe_approve` — `pub fn safe_approve(token: Address, spender: Address, amount: u256)` — Call `approve(spender, amount)` on `token`, reverting unless the approval
- function `safe_transfer` — `pub fn safe_transfer(token: Address, receiver: Address, amount: u256)` — Call `transfer(receiver, amount)` on `token`, reverting unless the
- function `safe_transfer_from` — `pub fn safe_transfer_from(token: Address, owner: Address, receiver: Address, amount: u256)` — Call `transferFrom(owner, receiver, amount)` on `token`, reverting unless
- function `try_approve` — `pub fn try_approve(token: Address, spender: Address, amount: u256) -> TokenCall` — Call `approve(spender, amount)` on `token` without reverting; see
- function `try_transfer` — `pub fn try_transfer(token: Address, receiver: Address, amount: u256) -> TokenCall` — Call `transfer(receiver, amount)` on `token` without reverting; see
- function `try_transfer_from` — `pub fn try_transfer_from(` — Call `transferFrom(owner, receiver, amount)` on `token` without reverting.

### `std::evm::erc4337` (18 public)

- const `ENTRY_POINT_V07` — `pub const ENTRY_POINT_V07: Address = Address { inner: 0x0000000071727de22e5e9d8baf0edac6f37da032 }` — The canonical EntryPoint v0.7 deployment.
- const `ENTRY_POINT_V08` — `pub const ENTRY_POINT_V08: Address = Address { inner: 0x4337084d9e255ff0702461cf8895ce9e3b5ff108 }` — The canonical EntryPoint v0.8 deployment.
- const `PACKED_USEROP_TYPEHASH` — `pub const PACKED_USEROP_TYPEHASH: u256 = core::keccak(` — `keccak256` of the EIP-712 type of a user operation in EntryPoint v0.8.
- const `SIG_VALIDATION_FAILED` — `pub const SIG_VALIDATION_FAILED: u256 = 1` — Validation data of a user operation whose signature is invalid. Accounts
- const `SIG_VALIDATION_SUCCESS` — `pub const SIG_VALIDATION_SUCCESS: u256 = 0` — Validation data of a user operation whose signature is valid, with no
- enum `PostOpMode` — `pub enum PostOpMode` — Why the EntryPoint calls `postOp`, the Solidity `IPaymaster.PostOpMode`.
- function `pack_validation_data` — `pub fn pack_validation_data(sig_success: bool, valid_after: u64, valid_until: u64) -> u256` — `SIG_VALIDATION_SUCCESS` or `SIG_VALIDATION_FAILED` packed with a time
- function `pay_prefund` — `pub fn pay_prefund(_ missing_account_funds: Wei) uses (ctx: Ctx, call: mut Call)` — Send `missing_account_funds` to the caller (the EntryPoint), with all
- function `require_entry_point` — `pub fn require_entry_point(_ entry_point: Address) uses (ctx: Ctx)` — Revert with `AccountUnauthorized` unless the caller is `entry_point`.
- function `require_paymaster_entry_point` — `pub fn require_paymaster_entry_point(_ entry_point: Address) uses (ctx: Ctx)` — Revert with `PaymasterUnauthorized` unless the caller is `entry_point`.
- function `validate_user_op` — `pub fn validate_user_op<S: UserOpSigner>(` — `validateUserOp` of an account whose signatures `signer` checks, like
- msg `AccountMsg` — `pub msg AccountMsg` — Messages the EntryPoint sends to accounts.
- msg `PaymasterMsg` — `pub msg PaymasterMsg` — Messages the EntryPoint sends to paymasters. `ValidatePaymasterUserOp`
- struct `AccountUnauthorized` — `/// The validator of an account was called by an address other than the` — The validator of an account was called by an address other than the
- struct `PackedUserOperation` — `/// A user operation as the v0.7 and v0.8 EntryPoint pass it to accounts and` — A user operation as the v0.7 and v0.8 EntryPoint pass it to accounts and
- struct `PaymasterUnauthorized` — `/// The validator of a paymaster was called by an address other than the` — The validator of a paymaster was called by an address other than the
- struct `ValidationData` — `pub struct ValidationData` — Unpacked validation data: an `aggregator` (zero for a valid signature,
- trait `UserOpSigner` — `pub trait UserOpSigner` — The account's own signature check for `validate_user_op`, OpenZeppelin's

### `std::evm::erc721` (3 public)

- const `ON_ERC721_RECEIVED` — `pub const ON_ERC721_RECEIVED: u32 = 0x150b7a02` — `IERC721Receiver.onERC721Received.selector`.
- function `check_on_received` — `pub fn check_on_received(` — Call `onERC721Received(operator, from, token_id, data)` on `receiver`
- function `try_transfer_from` — `pub fn try_transfer_from(` — Call `transferFrom(owner, receiver, token_id)` on `token` without

### `std::evm::event` (2 public)

- trait `Event` — `pub trait Event` — Trait implemented by `#[event]` structs.
- trait `TopicValue` — `pub trait TopicValue` — Converts an indexed event field value to a `u256` log topic.

### `std::evm::heap` (4 public)

- enum `Enqueued` — `pub enum Enqueued<T>` — The outcome of [`StorageHeap::enqueue`].
- struct `HeapIsEmpty` — `/// `pop` or `replace` on an empty heap. Selector `0xa6ca772e`, as in` — `pop` or `replace` on an empty heap. Selector `0xa6ca772e`, as in
- struct `Reverse` — `pub struct Reverse<T>` — Reverses the order of `T`, so a `StorageHeap<Reverse<T>>` is a max-heap.
- struct `StorageHeap` — `pub struct StorageHeap<T>` — A min-heap of `T` in storage: `root` and `pop` return the smallest

### `std::evm::intrinsic` (3 public)

Collapsed (low-level/per-width intrinsics): `code_region_len`, `code_region_offset`, `contract_field_slot`

### `std::evm::layout` (3 public)

- function `array_data_slot` — `pub fn array_data_slot(_ root: u256) -> u256` — The first slot of the elements of a Solidity dynamic array at slot
- function `element_location` — `pub fn element_location<T>(_ first: u256, _ index: u256, bits: u256) -> Location` — The location of element `index` of elements laid out from slot `first`
- function `mapping_slot` — `pub fn mapping_slot<K: StorageKey>(_ root: u256, _ key: K) -> u256` — The slot of `mapping[key]` for a Solidity `mapping` at slot `root`:

### `std::evm::mapping` (1 public)

- struct `SolMapping` — `pub struct SolMapping`

### `std::evm::merkle` (6 public)

- function `hash_pair_sorted` — `pub fn hash_pair_sorted(_ a: u256, _ b: u256) -> u256` — `keccak256(abi.encode(min(a, b), max(a, b)))`: OpenZeppelin's
- function `process_indexed_proof` — `pub fn process_indexed_proof<P: ProofNodes>(proof: P, leaf: u256, index: u256) -> u256` — The root implied by `leaf` at position `index` of a positional tree.
- function `process_proof` — `pub fn process_proof<P: ProofNodes>(proof: P, leaf: u256) -> u256` — The root implied by `leaf` and a sorted-pair `proof`:
- function `verify` — `pub fn verify<P: ProofNodes>(proof: P, root: u256, leaf: u256) -> bool` — Whether `leaf` is proven part of the sorted-pair tree with `root`:
- function `verify_indexed` — `pub fn verify_indexed<P: ProofNodes>(proof: P, root: u256, leaf: u256, index: u256) -> bool` — Whether `leaf` sits at position `index` of the positional tree with
- trait `ProofNodes` — `pub trait ProofNodes` — A sequence of 32-byte Merkle proof nodes, ordered from the leaf's

### `std::evm::multicall` (3 public)

- function `multicall` — `pub fn multicall(_ data: DynArray<Bytes>) -> DynArray<Bytes>` — `DELEGATECALL` every entry of `data` to `ctx.address()` in order, with
- msg `MulticallMsg` — `pub msg MulticallMsg`
- struct `FailedCall` — `/// A batched call failed without revert data. Selector `0xd6bda275`, as` — A batched call failed without revert data. Selector `0xd6bda275`, as

### `std::evm::mutex` (1 public)

- struct `Mutex` — `pub struct Mutex<T>` — A storage-backed value guarded by a transient reentrancy lock.

### `std::evm::ops` (55 public)

- function `address` — `pub(ingot) fn address() -> u256`
- function `balance` — `pub(ingot) fn balance(_ addr: u256) -> u256`
- function `basefee` — `pub(ingot) fn basefee() -> u256`
- function `blobbasefee` — `pub(ingot) fn blobbasefee() -> u256`
- function `blobhash` — `pub(ingot) fn blobhash(_ index: u256) -> u256`
- function `blockhash` — `pub(ingot) fn blockhash(_: u256) -> u256`
- function `byte` — `pub fn byte(pos: u256, value: u256) -> u256`
- function `call` — `pub(ingot) unsafe fn call(`
- function `calldatacopy` — `pub(ingot) unsafe fn calldatacopy(dest: *u8, offset: u256, len: u256)`
- function `calldataload` — `pub(ingot) fn calldataload(_: u256) -> u256`
- function `calldatasize` — `pub(ingot) fn calldatasize() -> u256`
- function `caller` — `pub(ingot) fn caller() -> u256`
- function `callvalue` — `pub(ingot) fn callvalue() -> u256`
- function `chainid` — `pub(ingot) fn chainid() -> u256`
- function `codecopy` — `pub(ingot) unsafe fn codecopy(dest: *u8, offset: u256, len: u256)`
- function `codesize` — `pub(ingot) fn codesize() -> u256`
- function `coinbase` — `pub(ingot) fn coinbase() -> u256`
- function `create` — `pub(ingot) unsafe fn create(value: u256, offset: *u8, len: u256) -> u256`
- function `create2` — `pub(ingot) unsafe fn create2(value: u256, offset: *u8, len: u256, salt: u256) -> u256`
- function `delegatecall` — `pub(ingot) unsafe fn delegatecall(`
- function `extcodecopy` — `pub(ingot) unsafe fn extcodecopy(addr: u256, dest: *u8, offset: u256, len: u256)`
- function `extcodehash` — `pub(ingot) fn extcodehash(_ addr: u256) -> u256`
- function `extcodesize` — `pub(ingot) fn extcodesize(_ addr: u256) -> u256`
- function `gas` — `pub(ingot) fn gas() -> u256`
- function `gaslimit` — `pub(ingot) fn gaslimit() -> u256`
- function `gasprice` — `pub(ingot) fn gasprice() -> u256`
- function `keccak256` — `pub(ingot) unsafe fn keccak256(offset: *u8, len: u256) -> u256`
- function `log0` — `pub(ingot) unsafe fn log0(offset: *u8, len: u256)`
- function `log1` — `pub(ingot) unsafe fn log1(offset: *u8, len: u256, topic0: u256)`
- function `log2` — `pub(ingot) unsafe fn log2(offset: *u8, len: u256, topic0: u256, topic1: u256)`
- function `log3` — `pub(ingot) unsafe fn log3(offset: *u8, len: u256, topic0: u256, topic1: u256, topic2: u256)`
- function `log4` — `pub(ingot) unsafe fn log4(offset: *u8, len: u256, topic0: u256, topic1: u256, topic2: u256, topic3: u256)`
- function `mload` — `pub(ingot) unsafe fn mload(_: *u8) -> u256`
- function `msize` — `pub(ingot) fn msize() -> u256`
- function `mstore` — `pub(ingot) unsafe fn mstore(addr: *u8, value: u256)`
- function `mstore8` — `pub(ingot) unsafe fn mstore8(addr: *u8, value: u8)`
- function `number` — `pub(ingot) fn number() -> u256`
- function `origin` — `pub(ingot) fn origin() -> u256`
- function `prevrandao` — `pub(ingot) fn prevrandao() -> u256`
- function `return_data` — `pub(ingot) unsafe fn return_data(offset: *u8, len: u256) -> !`
- function `returndatacopy` — `pub(ingot) unsafe fn returndatacopy(dest: *u8, offset: u256, len: u256)`
- function `returndatasize` — `pub(ingot) fn returndatasize() -> u256`
- function `revert` — `pub(ingot) unsafe fn revert(offset: *u8, len: u256) -> !`
- function `revert_empty` — `pub(ingot) fn revert_empty() -> !`
- function `selfbalance` — `pub(ingot) fn selfbalance() -> u256`
- function `selfdestruct` — `pub(ingot) fn selfdestruct(_: u256) -> !`
- function `signextend` — `pub fn signextend(byte: u256, value: u256) -> u256`
- function `sload` — `pub(ingot) unsafe fn sload(_: u256) -> u256` — Copies an arbitrary word, including declared state. The caller must
- function `sload_hashed` — `pub(ingot) unsafe fn sload_hashed(_: u256) -> u256`
- function `sstore` — `pub(ingot) unsafe fn sstore(slot: u256, value: u256)`
- function `sstore_hashed` — `pub(ingot) unsafe fn sstore_hashed(slot: u256, value: u256)`
- function `staticcall` — `pub(ingot) unsafe fn staticcall(`
- function `staticcall_precompile` — `pub(ingot) unsafe fn staticcall_precompile(` — `STATICCALL` to a precompile. Unlike `staticcall`, the borrow checker
- function `stop` — `pub(ingot) fn stop() -> !`
- function `timestamp` — `pub(ingot) fn timestamp() -> u256`

### `std::evm::packed` (5 public)

- function `encode_packed` — `pub fn encode_packed<T: EncodePacked>(_ value: own T) -> Packed` — Pack a value (typically a tuple) into an exactly-sized fresh buffer.
- function `keccak_packed` — `pub fn keccak_packed<T: EncodePacked>(_ value: own T) -> u256` — keccak256 of the packed encoding — the dominant consumer.
- function `write_word_prefix` — `pub(ingot) unsafe fn write_word_prefix(_ dest: *u8, _ value: u256, _ width: u256, room: u256) -> u256` — Writes the low `width` bytes of `value` big-endian at `dest` with a single
- struct `Packed` — `pub struct Packed` — Imperative builder for packed byte payloads.
- trait `EncodePacked` — `pub trait EncodePacked` — A value with a tightly packed byte encoding (Solidity

### `std::evm::panic` (1 public)

- struct `Panic` — `#[error]`

### `std::evm::random` (6 public)

- function `choose` — `pub fn choose<T, const N: usize>(_ items: [T; N]) -> T` — A uniformly chosen element of `items`, which must not be empty.
- function `shuffle` — `pub fn shuffle<T, const N: usize>(_ items: mut [T; N])` — Shuffles `items` in place with an unbiased Fisher-Yates shuffle.
- function `shuffle_slice` — `pub fn shuffle_slice<T>(_ items: mut MemSlice<T>) uses (rng: mut Rng) where T: Copy` — Shuffles the memory viewed by `items` in place with an unbiased
- struct `KeccakRng` — `pub struct KeccakRng` — Solady's PRNG: each word is the keccak256 of the previous one.
- struct `ReplayRng` — `pub struct ReplayRng<const N: usize>` — Returns the given words in order and then starts over. Meant for tests
- trait `Rng` — `pub trait Rng` — A source of pseudorandom 256-bit words.

### `std::evm::returndata` (6 public)

- function `decode_error_string` — `pub fn decode_error_string<I: ByteInput>(_ data: I) -> Option<DynString>` — The message of a Solidity `Error(string)` revert, accepted and rejected
- function `decode_panic` — `pub fn decode_panic<I: ByteInput>(_ data: I) -> Option<u256>` — The code of a Solidity `Panic(uint256)` revert, accepted like Solidity's
- function `has_selector` — `pub fn has_selector<E>(_ data: MemSpan) -> bool where E: ErrorVariant<Sol>` — Whether `data` starts with the selector of the custom error `E`.
- function `is_error` — `pub fn is_error<E>(_ data: MemSpan) -> bool where E: ErrorVariant<Sol>` — Whether `data` has the shape of the custom error `E`: it starts with
- function `revert_selector` — `pub fn revert_selector<I: ByteInput>(_ data: I) -> Option<u32>` — The 4-byte selector at the start of revert data, or `None` if `data` is
- struct `ReturnData` — `pub struct ReturnData` — A read-only view over the current EVM returndata buffer.

### `std::evm::rlp` (7 public)

- function `decode` — `pub fn decode(_ input: MemSpan) -> Option<Item>` — Decodes `input` as exactly one item. `None` if it is not canonically
- function `encode_address` — `pub fn encode_address(_ address: Address) -> Bytes` — Encodes an address as a 20-byte string.
- function `encode_bool` — `pub fn encode_bool(_ value: bool) -> Bytes` — Encodes `true` as the integer 1 (`0x01`) and `false` as 0 (`0x80`).
- function `encode_bytes` — `pub fn encode_bytes(_ data: MemSpan) -> Bytes` — Encodes a byte string.
- function `encode_list` — `pub fn encode_list<const N: usize>(_ items: [Bytes; N]) -> Bytes` — Encodes a list of already encoded items.
- function `encode_uint` — `pub fn encode_uint(_ value: u256) -> Bytes` — Encodes an integer as its big-endian bytes without leading zeros, so
- struct `Item` — `pub struct Item` — A decoded RLP item: a byte string or a list, as the range of its payload

### `std::evm::signature` (6 public)

- function `is_valid_erc1271_signature_now` — `pub fn is_valid_erc1271_signature_now(_ signer: Address, digest: u256, signature: MemSpan) -> bool` — ERC-1271 check with OpenZeppelin `isValidERC1271SignatureNow` semantics:
- function `is_valid_signature_now` — `pub fn is_valid_signature_now(_ signer: Address, digest: u256, signature: MemSpan) -> bool` — Whether `signature` is valid for `signer` over `digest`: true if it
- function `parse` — `pub fn parse(_ signature: MemSpan) -> Option<EcdsaSig>` — Decode a 65-byte `r ++ s ++ v` signature or a 64-byte EIP-2098
- function `recover` — `pub fn recover(digest: u256, _ signature: MemSpan) -> Option<Address>` — `parse` then `EcdsaSig::recover`: the canonical (low `s`) signer of
- function `recover_raw` — `pub fn recover_raw(digest: u256, _ signature: MemSpan) -> Option<Address>` — `parse` then `EcdsaSig::recover_raw`: the signer of `digest` under the
- struct `EcdsaSig` — `pub struct EcdsaSig` — A decoded ECDSA signature. `v` is the recovery byte as encoded (27 or 28

### `std::evm::sol_array` (2 public)

- struct `SolArray` — `pub struct SolArray<T>`
- struct `SolLanes` — `pub struct SolLanes` — How a `SolArray` packs its elements: Solidity's encoding (`SolPacked`), in

### `std::evm::sol_set` (1 public)

- struct `SolEnumerableSet` — `pub struct SolEnumerableSet<T>`

### `std::evm::sol_slot` (5 public)

- function `field_mask` — `pub(ingot) fn field_mask(_ bits: u256) -> u256`
- struct `SolSlot` — `pub struct SolSlot`
- struct `SolWord` — `pub struct SolWord` — A 32-byte word of Solidity-packed fields, such as the value of a storage
- trait `SolPacked` — `pub trait SolPacked` — A value with a fixed-width Solidity storage representation.
- trait `SolValueType` — `pub(ingot) trait SolValueType` — Marker for the std Solidity value types whose `SolPacked` encoding is

### `std::evm::ssz` (8 public)

- function `hash_pair` — `pub fn hash_pair(left: u256, right: u256) -> u256` — Hash two adjacent SSZ chunks as `sha256(left || right)`.
- function `hash_tree_root` — `pub fn hash_tree_root<T>(_ input: MemSpan, start: u256, len: u256) -> u256` — User-facing entry point for `HashTreeRoot`.
- function `mix_in_length` — `pub fn mix_in_length(root: u256, len: u64) -> u256` — Mix the actual element count of an SSZ list into its Merkle root.
- function `serialize_u64` — `pub fn serialize_u64(_ value: u64) -> Bytes` — Serialize a `uint64` as a Solidity-compatible `bytes memory` value.
- function `u64_chunk` — `pub fn u64_chunk(_ value: u64) -> u256` — Pack a `uint64` SSZ basic value into a 32-byte chunk.
- struct `ByteVector` — `pub struct ByteVector<const N: usize>` — Type-level tag for an SSZ `ByteVector[N]` (fixed-length byte
- trait `HashTreeRoot` — `pub trait HashTreeRoot` — Compute the SSZ hash-tree-root of a value given its bytes in memory.
- trait `Merkleize` — `pub trait Merkleize` — Merkleize a tuple of pre-computed chunk roots into a single SSZ

### `std::evm::storage_bytes` (8 public)

- function `ceil_words` — `pub fn ceil_words(_ len: u256) -> u256` — Round `len` up to the number of whole EVM words required to store it.
- function `emit_bytes_event` — `pub fn emit_bytes_event(topic0: u256, data_ptr: u256, data_len: u256)` — Emit a Solidity-compatible event with a single dynamic `bytes` payload.
- function `emit_bytes_event_view` — `pub fn emit_bytes_event_view<I: ByteInput>(topic0: u256, view: I)` — Emit a Solidity-compatible event with a single dynamic `bytes` payload.
- function `encode_bytes_return_from_calldata` — `pub fn encode_bytes_return_from_calldata(data_ptr: u256, len: u256) -> !` — Return ABI-encoded `bytes` copied directly from calldata.
- function `encode_bytes_return_view` — `pub fn encode_bytes_return_view<I: ByteInput>(view: I) -> !` — Return ABI-encoded `bytes` copied from an arbitrary byte input.
- function `mask_for_bytes` — `pub fn mask_for_bytes(rem: u256) -> u256` — Mask that preserves the first `rem` bytes of a 32-byte word.
- function `zero_pad_memory_bytes` — `pub unsafe fn zero_pad_memory_bytes(ptr: *u8, len: u256)` — Zero the right-padding bytes after copying a dynamic byte slice into memory.
- struct `StorageBytes` — `pub struct StorageBytes<K>` — Storage-backed dynamic bytes keyed by `K`: the byte length of each value

### `std::evm::storage_map` (2 public)

- struct `StorageMap` — `pub struct StorageMap<K, V>` — A storage-backed mapping from keys `K` to values `V`, laid out like a
- trait `StorageKey` — `pub trait StorageKey` — Keys that can be written into the mapping preimage for keccak hashing.

### `std::evm::storage_packed_array` (3 public)

- struct `PackedBits` — `pub struct PackedBits<const N: u256>` — Type-level witness used to constrain `BITS` of `StoragePackedArray`.
- struct `StoragePackedArray` — `pub struct StoragePackedArray<const BITS: u256>` — A storage-backed map from `u256` indices to fixed-bit-width integer
- trait `ValidPackedBits` — `pub trait ValidPackedBits` — Marker trait for `BITS` values that produce a well-formed packed layout

### `std::evm::target` (1 public)

- struct `EvmTarget` — `pub struct EvmTarget`

### `std::evm::token` (2 public)

- enum `ReceiverCheck` — `pub enum ReceiverCheck` — Outcome of a safe-transfer receiver hook such as
- enum `TokenCall` — `pub enum TokenCall` — Outcome of a token transfer or approval call.

### `std::evm::units` (19 public)

- const `DAY` — `pub const DAY: Duration = Duration { secs: 86_400 }` — One day.
- const `ETHER` — `pub const ETHER: Wei = Wei { amount: 1_000_000_000_000_000_000 }` — One ether.
- const `GWEI` — `pub const GWEI: Wei = Wei { amount: 1_000_000_000 }` — One gwei.
- const `HOUR` — `pub const HOUR: Duration = Duration { secs: 3_600 }` — One hour.
- const `MINUTE` — `pub const MINUTE: Duration = Duration { secs: 60 }` — One minute.
- const `SECOND` — `pub const SECOND: Duration = Duration { secs: 1 }` — One second.
- const `WEEK` — `pub const WEEK: Duration = Duration { secs: 604_800 }` — One week.
- const `WEI` — `pub const WEI: Wei = Wei { amount: 1 }` — One wei.
- function `days` — `pub const fn days(_ n: u256) -> Duration` — `n` days.
- function `ether` — `pub const fn ether(_ n: u256) -> Wei` — `n` ether.
- function `gwei` — `pub const fn gwei(_ n: u256) -> Wei` — `n` gwei.
- function `hours` — `pub const fn hours(_ n: u256) -> Duration` — `n` hours.
- function `minutes` — `pub const fn minutes(_ n: u256) -> Duration` — `n` minutes.
- function `seconds` — `pub const fn seconds(_ n: u256) -> Duration` — `n` seconds.
- function `weeks` — `pub const fn weeks(_ n: u256) -> Duration` — `n` weeks.
- function `wei` — `pub const fn wei(_ n: u256) -> Wei` — `n` wei.
- struct `Duration` — `pub struct Duration` — A span of time, counted in seconds.
- struct `Timestamp` — `pub struct Timestamp` — A point in time, in seconds since the unix epoch.
- struct `Wei` — `pub struct Wei` — An amount of native ETH, counted in wei.

### `std::io` (14 public)

- const `EINVAL` — `pub(ingot) const EINVAL: i32 = 22`
- enum `ErrorKind` — `pub enum ErrorKind` — The kinds of `Error`.
- function `eprint_buffer` — `pub fn eprint_buffer(_ text: MemBuffer) uses (err: mut Stderr)` — Writes `text` to standard error, as `eprint!` and `eprintln!` do. Panics
- function `print_buffer` — `pub fn print_buffer(_ text: MemBuffer) uses (out: mut Stdout)` — Writes `text` to standard output, as `print!` and `println!` do. Panics
- function `read` — `pub(ingot) fn read(_ fd: i32, _ buf: *u8, _ count: usize) -> isize`
- function `read_to_end` — `pub fn read_to_end(_ buf: mut MemBuffer) uses (input: mut Stdin)` — Appends the rest of standard input to `buf`. Panics if the stream fails.
- function `write` — `pub(ingot) fn write(_ fd: i32, _ buf: *u8, _ count: usize) -> isize`
- struct `Error` — `pub struct Error` — Why a host operation failed: the host's `errno`.
- struct `StdinReader` — `pub struct StdinReader` — Reads standard input through a buffer, a byte or a line at a time.
- trait `Display` — `pub trait Display` — A value with a text form, which `format!`, `write!`, `print!` and their
- trait `Stderr` — `pub trait Stderr: HostCapabilitySeal` — The process's standard error.
- trait `Stdin` — `pub trait Stdin: HostCapabilitySeal` — The process's standard input.
- trait `Stdio` — `pub trait Stdio: Stdout + Stderr + Stdin` — Standard input, output and error together: an effect keyed by `Stdio`
- trait `Stdout` — `pub trait Stdout: HostCapabilitySeal` — The process's standard output.

### `std::native` (3 public)

- function `cpu_clock_ticks` — `pub fn cpu_clock_ticks() -> i64` — Process CPU time in host clock ticks. Negative readings are unavailable.
- struct `Host` — `pub struct Host` — Interfaces to the native host runtime.
- trait `HostCapabilitySeal` — `pub(ingot) trait HostCapabilitySeal` — Seals the host capabilities, so that only `Host` provides them.

### `std::process` (1 public)

- trait `Exit` — `pub trait Exit: HostCapabilitySeal` — Ending the process.

### `std::sp1` (8 public)

- function `commit_u32` — `pub fn commit_u32(_ value: u32) uses (values: mut PublicValues)`
- function `commit_u64` — `pub fn commit_u64(_ value: u64) uses (values: mut PublicValues)`
- function `read_u32` — `pub fn read_u32() -> u32 uses (input: mut ProverInput)`
- function `read_u64` — `pub fn read_u64() -> u64 uses (input: mut ProverInput)`
- function `sp1` — `pub fn sp1() -> Guest`
- struct `Guest` — `pub struct Guest`
- trait `ProverInput` — `pub trait ProverInput`
- trait `PublicValues` — `pub trait PublicValues`

### `std::wasm` (10 public)

- function `abort` — `pub fn abort(_ code: u32) -> ! uses (abort: mut Abort)`
- function `log_i32` — `pub fn log_i32(_ value: i32) uses (log: mut Log)`
- function `log_u64` — `pub fn log_u64(_ value: u64) uses (log: mut Log)`
- function `mock` — `pub fn mock(_ now: u64, _ step: u64) -> Mock`
- function `now_ms` — `pub fn now_ms() -> u64 uses (clock: mut Clock)`
- struct `Host` — `pub struct Host` — The WebAssembly root effect, which calls the imports of the host. Exports
- struct `Mock` — `pub struct Mock` — A provider written in Fe: no imports are needed.
- trait `Abort` — `pub trait Abort` — Ends the program. The code identifies the reason to the host.
- trait `Clock` — `pub trait Clock` — Wall-clock time in milliseconds since the Unix epoch.
- trait `Log` — `pub trait Log` — Reports a number to the host, for example to a console.

### `std::wasm::boundary` (2 public)

- struct `HostText` — `pub struct HostText` — Text that the host lent for the duration of one call.
- struct `Reply` — `pub struct Reply` — The result of an operation: a tag and a payload, as described above.

### `std::wasm::files` (10 public)

- enum `FileError` — `pub enum FileError` — Why an operation failed. The numbers are part of the contract and never
- function `close` — `pub fn close(_ handle: own Handle) uses (files: mut Files)`
- function `mock` — `pub fn mock() -> MemFiles` — A provider with no files. Add them with `MemFiles::add`.
- function `open` — `pub fn open(_ name: DynString) -> Result<FileError, Handle> uses (files: mut Files)`
- function `read_byte` — `pub fn read_byte(_ handle: Handle, _ index: u32) -> Result<FileError, u8> uses (files: mut Files)`
- function `reply` — `pub fn reply(_ outcome: own Result<FileError, u32>) -> Reply` — The reply that carries the outcome of an operation with a number as its
- function `size` — `pub fn size(_ handle: Handle) -> Result<FileError, u32> uses (files: mut Files)`
- struct `Handle` — `pub struct Handle` — An open file. A program cannot make a handle, copy one or use one after
- struct `MemFiles` — `pub struct MemFiles` — A provider written in Fe: files held in memory, no imports needed.
- trait `Files` — `pub trait Files` — The four operations.
