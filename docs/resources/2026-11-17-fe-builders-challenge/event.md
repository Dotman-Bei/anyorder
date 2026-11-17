# Event — Fe Builders Challenge 2026

Primary source: <https://fe-lang.org/contest/>. Fetched 2026-11-17 with curl (raw HTML → text) and cross-checked with WebFetch. The page is static and rendered completely. Its "A FEW MORE DETAILS" FAQ **is** the rulebook; there is no separate rules document.
Secondary: the announcement post (`fe-lang/blog` `content/posts/fe-builders-challenge.md`, dated 2026-10-27, <https://blog.fe-lang.org>) and the starter README (<https://github.com/fe-lang/builders-challenge-starter> @ `f9d9aa9`).
Quoted text is verbatim from the contest page unless marked otherwise. "→" marks a short summary of a longer FAQ answer.

## Deadlines (absolute; WAT = UTC+1, no DST)

| Milestone | UTC (verbatim source) | WAT (Lagos) |
|---|---|---|
| Build window opens | 2026-11-03 00:00 UTC | 2026-11-03 01:00 WAT |
| **Registration closes (required to submit)** | **2026-11-17 23:59 UTC** — "Register by 23:59 UTC" | **2026-11-18 00:59 WAT** |
| **Final submission closes** | **2026-11-24 23:59 UTC** — "Submit by 23:59 UTC" | **2026-11-25 00:59 WAT** |
| Eligibility checks + judging (blog only) | 2026-11-25 → 2026-12-01 | — |
| Results (target) | 2026-12-01 — "Results · target date" | — |

- FAQ: "All times are UTC." … "The registration deadline is firm; exceptions apply only if a problem on our side prevents registration."
- FAQ: "You can start building before registering, but registration is required to submit."
- Registration and submission dates agree across the contest page, the blog and the starter README. No conflict found.

## Eligibility (FAQ, verbatim)

- "The contest is open worldwide, to beginners and experienced developers alike. Members of the Argot Collective and contest judges are not eligible to participate."
- Teams: "There is no team-size limit, and your team can change after registration. Each project needs one contact person reachable by email."
- Multiple entries: "You can submit multiple distinct projects and participate in multiple teams. Register each project separately. Do not submit multiple variants of the same work as separate entries."
- Existing projects: "Yes, but only substantial work completed during November 3–24 is judged. Identify the starting point and explain what changed. New feature work after the final deadline is not eligible."
- AI: "AI assistance is welcome and is not scored negatively. Disclose how you used it, test the result, and be prepared to explain your code. Every project needs one responsible human contact."
- Scope: "Contributions to the Rust codebases of the Fe compiler and Sonatina are outside this contest's scope." Standard-library submissions "do not need to be merged upstream before the deadline."
- Toolchain: "Any Fe release from 26.5.0 on is allowed." (The campaign pins **26.6.0**, released 2026-11-10.)

## Submission requirements (contest page "READY TO SUBMIT?", verbatim)

> Your core technical contribution must be in Fe. Frontends, scripts, and supporting tools can use other languages.

- "A public GitHub repository with an OSI-approved license."
- "The full commit SHA, project manifest, and exact Fe version."
- "Reproducible build instructions and appropriate automated tests."
- "A README covering the approach, architecture, and limitations."
- "A short pitch, a Fe-specific highlight, and a demo or reproducible example."
- "A declaration of pre-existing work, reused code, and AI assistance."

The starter README's checklist adds wording worth matching: a README "covering the problem, your approach, the architecture, and limitations. Start from `SUBMISSION.md`"; "A one-sentence pitch and one Fe-specific technical highlight"; "A short demo: a video, screenshots, or a reproducible CLI example."

### Submission mechanics (FAQ)

- Registration asks for "your project idea, team, and contact email". Confirmation is "by email with your project ID and private submission link". The blog adds that the form asks for "a project name, a one-sentence idea, team members, and one responsible human contact", plus a repo link if you have one.
- Updates: "Use your personal submission link to submit again before November 24 at 23:59 UTC. The latest valid submission counts. Include the exact commit SHA you want judged."
- Validity: "For submissions, an email confirms whether the automated checks passed or explains what needs correcting. The form's receipt alone is not confirmation of acceptance." → If there is no confirmation, check spam or ask on Zulip.
- Post-deadline: judges review the submitted commit and may ask for clarification; "please reply within 48 hours". Clarifications "must not introduce new code changes".
- Reproducibility: "A minor setup issue does not automatically disqualify your project … the core contribution must be verifiable for the project to be eligible."
- Prototypes: "A working prototype is enough if you can demonstrate the core contribution and clearly document what works, what is unfinished, and any limitations. Completeness is part of technical quality, but your project does not need to be production-ready."
- Video: "No. Provide reproducible instructions so judges can build and try your project. An optional video or demo can help … support your score in the Documentation & demo category."
- Links: registration form <https://docs.google.com/forms/d/e/1FAIpQLSehDUUbqfQt67Ecy21zIsOFN7pp4orx9Ko9DKCWcDkjhEUVBg/viewform>; submission form <https://docs.google.com/forms/d/e/1FAIpQLSd2pqUkJzFpZMu5FVQP-NtetrIoB6nI-pHG1MLTOQhCpsLKqg/viewform>. Blog: the personal link "prefill[s] your project ID, private submission code, and contact email … Keep your submission code private." **Never commit the submission code.**

## Judging criteria — published weights (contest page, verbatim)

| Weight | Criterion | Description (verbatim) |
|---:|---|---|
| **30%** | Technical quality | "Correctness, architecture, tests, and completeness." |
| **25%** | Fe-specific value | "Meaningful use of Fe's features and abstractions." |
| **20%** | Originality | "A fresh idea, implementation, or combination." |
| **15%** | Usefulness or insight | "Value for users, researchers, or future builders." |
| **10%** | Documentation & demo | "A clear explanation and reproducible results." |

- Contest page: "Your evidence should fit your project: tests, benchmarks, test vectors, or a working demo. Social reach does not affect your score."
- **Wording variant (blog, same weights).** The blog names the rows "Technical quality and correctness" ("Sound implementation, appropriate tests, completeness, and **clear security assumptions**"), "Fe-specific value" ("Meaningful use of Fe's language features, abstractions, or tooling"), "Originality", "Usefulness or insight" ("Value for users, developers, researchers, or future Fe projects") and "Documentation and demo" ("Clear explanations and a result others can reproduce"). The blog also says: "a claim about gas efficiency needs benchmarks … Explain what your project demonstrates and give the jury a way to verify it." Both sources agree on the weights. Treat the blog's "clear security assumptions" as part of the 30% axis.
- Process: "Judges review submissions independently, then consider a shortlist to select the winners." The blog adds: "Judges will declare conflicts of interest and recuse themselves where necessary." "There is no public-vote component." "The jury's decisions are final." Individual feedback is not guaranteed.

## Prize structure

| Place | Prize |
|---|---:|
| 1st | $2,500 |
| 2nd | $1,500 |
| 3rd | $1,000 |

- "One competition. Every project competes in the same pool." Funded by the Argot Collective ($5,000 total). FAQ: "All three prizes will be awarded."
- Payment: "Prizes are paid in USDC on Ethereum Mainnet." One payout address per winning project, confirmed by email after results. The organisers aim to pay "within one week once that address is confirmed". Teams split prizes internally. "Winners are responsible for any taxes that apply to their prize."

## Testnet vs mainnet; EVM vs native (FAQ, verbatim)

- "Do I need to deploy to mainnet? No. Mainnet deployment provides no scoring advantage. A testnet deployment is sufficient where deployment helps demonstrate the project. Native projects do not need a blockchain deployment at all."
- "Does my project need to use the EVM or a blockchain? No. Fe supports both the EVM and native code, and purely native projects are welcome."

## Jury (8 judges)

| Judge | Affiliation (contest page) | Taste signal for idea-forge |
|---|---|---|
| Austin Griffith | BuidlGuidl · builder & educator (Scaffold-ETH, SpeedRunEthereum) | Working, demoable apps for builders |
| Ahmed Castro | Filosofía Código · developer & educator | Education, developer tooling, L2s |
| Marius van der Wijden | Ethereum Foundation · core developer (Geth) | "testing, fuzzing, and making Ethereum's execution layer more robust" |
| Philogy | security researcher; creator of **Plank** (EVM language) | EVM internals, DeFi security (Solady, Uniswap's The Compact). Will read the code adversarially. |
| Rahul Kothari | Ethereum Foundation · dev tooling lead (ex-Aztec) | Developer tooling, privacy L2 contracts |
| jistro | EVVM · smart contract developer | Solidity and TypeScript tooling; virtual-chain / "fisher" execution models |
| Grant Wuerker | Argot Collective · Fe core developer | Ingots/dependencies, ABI performance, compiler fuzzing |
| Micah Scopes | Argot Collective · Fe core developer | Language server, docs tooling, type checking, Sonatina codegen |

## Help channels

- Fe Zulip office-hours: <https://fe-lang.zulipchat.com/#narrow/channel/594128-office-hours>. **Requires login.** It is not web-public, so it wasn't extracted (see INDEX gaps).
- Compiler bugs: <https://github.com/argotorg/fe/issues> ("ideally with a minimal example"). Email hello@fe-lang.org "if it blocks your entry".
