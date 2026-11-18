#!/usr/bin/env python3
"""AnyOrder clearing reference: exact integer and rational arithmetic, stdlib only.

It restates the clearing rule from the spec in Python, checks it against a
brute-force oracle that tries every integer price, and generates the Fe test
vectors in ingots/clearing/src/vectors.fe.

    python ref/clearing_ref.py --write      regenerate ingots/clearing/src/vectors.fe
    python ref/clearing_ref.py --check      exit 1 if the committed vectors differ
    python ref/clearing_ref.py --selftest   random books: rule vs oracle and the lemmas

--write and --check pass the generated text through `fe fmt` (it must be on
PATH), so the committed file is exactly what the formatter accepts.
"""
import argparse
import pathlib
import random
import subprocess
import sys
import tempfile
from fractions import Fraction

UNIT = 10**18
ROOT = pathlib.Path(__file__).resolve().parent.parent
VECTORS = ROOT / "ingots" / "clearing" / "src" / "vectors.fe"


class Order:
    def __init__(self, is_buy, limit, quantity, owner, owner_seq=0):
        self.is_buy = is_buy
        self.limit = limit
        self.quantity = quantity
        self.owner = owner
        self.owner_seq = owner_seq


def buy(limit, quantity, owner, owner_seq=0):
    return Order(True, limit, quantity, owner, owner_seq)


def sell(limit, quantity, owner, owner_seq=0):
    return Order(False, limit, quantity, owner, owner_seq)


def demand_at(book, p):
    return sum(o.quantity for o in book if o.is_buy and o.limit >= p)


def supply_at(book, p):
    return sum(o.quantity for o in book if not o.is_buy and o.limit <= p)


def select_price(book):
    """Returns (traded, price, volume, demand, supply) by the spec's rule."""
    rows = []
    for p in sorted({o.limit for o in book}):
        d, s = demand_at(book, p), supply_at(book, p)
        rows.append((p, d, s, min(d, s), abs(d - s)))
    best_volume = max((r[3] for r in rows), default=0)
    if best_volume == 0:
        return (False, 0, 0, 0, 0)
    tied = [r for r in rows if r[3] == best_volume]
    best_gap = min(r[4] for r in tied)
    tied = [r for r in tied if r[4] == best_gap]
    at_least = [r for r in tied if r[1] >= r[2]]
    p, d, s, v, _ = max(at_least) if at_least else min(tied)
    return (True, p, v, d, s)


def allocate(book, clearing):
    traded, p, _, demand, supply = clearing
    if not traded:
        return [0] * len(book)
    buyers_long = demand >= supply
    excess = abs(demand - supply)
    marginal = sum(o.quantity for o in book if o.is_buy == buyers_long and o.limit == p)
    share = marginal - excess
    assert share >= 0, "a strictly better order would need rationing"
    fills, ranks = [], []
    for i, o in enumerate(book):
        long_side = o.is_buy == buyers_long
        better = o.limit > p if o.is_buy else o.limit < p
        if better or (o.limit == p and not long_side):
            fills.append(o.quantity)
        elif o.limit == p:
            exact = Fraction(o.quantity * share, marginal)
            fills.append(exact.numerator // exact.denominator)
            ranks.append((-(o.quantity * share % marginal), -o.quantity, o.owner, o.owner_seq, i))
        else:
            fills.append(0)
    leftover = share - sum(fills[r[4]] for r in ranks)
    for r in sorted(ranks)[:leftover]:
        fills[r[4]] += 1
    return fills


def cost_ceil(quantity, price):
    return -(-quantity * price // UNIT)


def proceeds_floor(quantity, price):
    return quantity * price // UNIT


def oracle_check(book, clearing, fills):
    traded, p, v, d, s = clearing
    high = max((o.limit for o in book), default=0) + 2
    best = max(min(demand_at(book, q), supply_at(book, q)) for q in range(0, high + 1)) if high <= 4096 else None
    if best is not None:
        assert v == best, "not volume-maximal over every integer price"
    if traded:
        assert (d, s) == (demand_at(book, p), supply_at(book, p))
    assert sum(f for f, o in zip(fills, book) if o.is_buy) == v
    assert sum(f for f, o in zip(fills, book) if not o.is_buy) == v
    for f, o in zip(fills, book):
        assert 0 <= f <= o.quantity
        if f:
            assert (o.limit >= p) if o.is_buy else (o.limit <= p)


T = 10**18      # one whole token, in base units
MILLI = 10**15  # 0.001 ETH, in wei

CASES = [
    ("simple_cross", "one buy and one sell that cross: ties resolve to the highest price where demand >= supply",
     [buy(10, 5, 1), sell(8, 5, 2)]),
    ("no_cross", "the best bid is below the best ask: no trade",
     [buy(7, 5, 1), sell(9, 5, 2)]),
    ("one_side_only", "buys only: no trade",
     [buy(7, 5, 1), buy(8, 3, 2)]),
    ("buyers_long_largest_remainder", "excess demand at the price: marginal buys share pro rata, the leftover unit goes to the largest remainder",
     [sell(8, 10, 4), buy(9, 7, 1), buy(9, 5, 2), buy(9, 3, 3)]),
    ("sellers_long_largest_remainder", "excess supply: the mirror image, ties resolve to the lowest price",
     [buy(9, 10, 4), sell(8, 7, 1), sell(8, 5, 2), sell(8, 3, 3)]),
    ("equal_remainders_owner_tiebreak", "equal remainders and quantities: the lower owner gets the leftover units",
     [sell(5, 2, 8), buy(5, 1, 9), buy(5, 1, 4), buy(5, 1, 7)]),
    ("owner_seq_tiebreak", "one owner's two identical orders: the earlier own order gets the leftover unit",
     [sell(5, 1, 8), buy(5, 1, 3, 1), buy(5, 1, 3, 0)]),
    ("strictly_better_needs_highest", "with lowest-price tie-breaking the buy at 12 would need rationing; the rule picks 12",
     [buy(12, 10, 1), sell(8, 3, 2), sell(10, 3, 3)]),
    ("mixed_sign_tie", "a tie of excess demand then excess supply: the highest excess-demand price keeps rationing feasible",
     [buy(10, 3, 1), sell(5, 1, 2), buy(1, 7, 3), sell(2, 6, 4), sell(11, 2, 5), sell(6, 2, 6),
      buy(8, 5, 7), sell(8, 6, 8), buy(7, 6, 9), buy(8, 1, 10), buy(12, 4, 11, 0), sell(0, 4, 11, 1)]),
    ("one_sided_baseline", "the attacker-free book of the one-sided case",
     [buy(10, 5, 1), buy(8, 5, 2), sell(6, 5, 3), sell(9, 5, 4)]),
    ("one_sided_buy_moves_price", "a one-sided buy at 12 moves the price from 8 to 10; it pays 10 too",
     [buy(10, 5, 1), buy(8, 5, 2), sell(6, 5, 3), sell(9, 5, 4), buy(12, 5, 5)]),
    ("wash_pair_in_range_moves_price", "an in-range wash pair moves the price from 7 to 6; both legs fill",
     [buy(7, 5, 1), sell(2, 5, 2), buy(6, 1, 3, 0), sell(5, 1, 3, 1)]),
    ("sandwich_demo_attacker_free", "the demo batch without the attacker (tokens and wei)",
     [sell(10 * MILLI, 10 * T, 1), sell(11 * MILLI, 10 * T, 2), sell(12 * MILLI, 10 * T, 3), sell(13 * MILLI, 10 * T, 4),
      buy(9 * MILLI, 5 * T, 5), buy(12 * MILLI, 15 * T, 6)]),
    ("sandwich_demo_attacked", "the same batch with the attacker's legs outside every other limit (condition C)",
     [sell(10 * MILLI, 10 * T, 1), sell(11 * MILLI, 10 * T, 2), sell(12 * MILLI, 10 * T, 3), sell(13 * MILLI, 10 * T, 4),
      buy(9 * MILLI, 5 * T, 5), buy(12 * MILLI, 15 * T, 6),
      buy(26 * MILLI, 10 * T + 1, 7, 0), sell(1 * MILLI, 10 * T + 1, 7, 1)]),
]

MONEY = [
    ("money_odd_lot", 10 * T + 1, 11 * MILLI),
    ("money_exact", 15 * T, 11 * MILLI),
    ("money_one_unit", 1, 3),
]


def fe_bool(b):
    return "true" if b else "false"


def render():
    out = []
    out.append("// GENERATED by ref/clearing_ref.py. Do not edit by hand:")
    out.append("// run `python ref/clearing_ref.py --write` and commit the result.")
    out.append("")
    out.append("use core::ptr::MemVec")
    out.append("use std::evm::wei")
    out.append("use ingot::{Order, allocate, cost_ceil, proceeds_floor, select_price}")
    for name, about, book in CASES:
        clearing = select_price(book)
        fills = allocate(book, clearing)
        oracle_check(book, clearing, fills)
        traded, p, v, _, _ = clearing
        out.append("")
        out.append(f"/// {about}")
        out.append("#[test]")
        out.append(f"fn vector_{name}() {{")
        out.append("    var book = MemVec<Order>::new()")
        for o in book:
            out.append(
                "    book.push(Order { "
                f"is_buy: {fe_bool(o.is_buy)}, limit: {o.limit}, quantity: {o.quantity}, "
                f"owner: {o.owner}, owner_seq: {o.owner_seq} }})"
            )
        out.append("    let c = select_price(book)")
        out.append(f"    assert!(c.traded == {fe_bool(traded)})")
        out.append(f"    assert!(c.price == {p})")
        out.append(f"    assert!(c.volume == {v})")
        out.append("    let fills = allocate(book, c)")
        for i, f in enumerate(fills):
            out.append(f"    assert!(fills[{i}] == {f})")
        out.append("}")
    for name, quantity, price in MONEY:
        out.append("")
        out.append(f"/// {quantity} base units at {price} wei per token: buyers round up, sellers down.")
        out.append("#[test]")
        out.append(f"fn vector_{name}() {{")
        out.append(f"    assert!(cost_ceil(quantity: {quantity}, price: {price}) == wei({cost_ceil(quantity, price)}))")
        out.append(f"    assert!(proceeds_floor(quantity: {quantity}, price: {price}) == wei({proceeds_floor(quantity, price)}))")
        out.append("}")
    return "\n".join(out) + "\n"


def formatted(raw):
    """The generated text as `fe fmt` writes it. Arguments go as a list, so a
    path with spaces is safe."""
    with tempfile.TemporaryDirectory(prefix="anyorder vectors ") as tmp:
        path = pathlib.Path(tmp) / "vectors.fe"
        path.write_text(raw, encoding="utf-8", newline="\n")
        subprocess.run(["fe", "fmt", str(path)], check=True, stdout=subprocess.DEVNULL)
        return path.read_text(encoding="utf-8")


def selftest(rounds):
    rng = random.Random(20261118)
    traded_books = 0
    for _ in range(rounds):
        n = rng.randint(1, 14)
        book = [Order(rng.random() < 0.5, rng.randint(2, 16), rng.randint(1, 9), rng.randint(1, 4), k) for k in range(n)]
        c = select_price(book)
        fills = allocate(book, c)
        oracle_check(book, c, fills)
        if not c[0]:
            continue
        traded_books += 1
        a = rng.randint(1, 30)
        attacked = book + [Order(True, max(o.limit for o in book) + 1, a, 99, 0),
                           Order(False, min(o.limit for o in book) - 1, a, 99, 1)]
        ca = select_price(attacked)
        fa = allocate(attacked, ca)
        assert ca[1] == c[1] and fa[:n] == fills and fa[n:] == [a, a], "condition C invariance failed"
    print(f"selftest: {rounds} random books, {traded_books} traded: rule = oracle, lemmas hold, condition C holds")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--write", action="store_true")
    group.add_argument("--check", action="store_true")
    group.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        selftest(20000)
        return 0
    text = formatted(render())
    if args.write:
        VECTORS.write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {VECTORS.relative_to(ROOT)} ({len(CASES)} clearing vectors, {len(MONEY)} money vectors)")
        return 0
    current = VECTORS.read_text(encoding="utf-8") if VECTORS.exists() else ""
    if current != text:
        print(f"{VECTORS.relative_to(ROOT)} is stale: run python ref/clearing_ref.py --write", file=sys.stderr)
        return 1
    print("vectors: up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())
