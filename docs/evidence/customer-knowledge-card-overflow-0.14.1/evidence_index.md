# Evidence index

| Claim | Evidence | Result |
| --- | --- | --- |
| Root cause | `styles.css` lacked a Candidate JSON wrapping contract | Confirmed |
| Card containment | 32 Card width measurements | Every overflow value was 0 |
| JSON containment | 31 JSON width measurements | Every overflow value was 0 |
| Page containment | Body and document width measurements | Both overflow values were 0 |
| Computed style | Browser computed CSS | `pre-wrap`, `anywhere`, `break-word` |
| Visual acceptance | `customer-knowledge-cards-no-overflow.png` | Long values remain inside Card borders |
| Console | Browser error and warning log | 0 issues |
| Runtime | 8092 and 8093 health endpoints | `UP`, OneOps 0.14.1 |
| Delivery | `continuous-delivery.log` | Trigger delivery succeeded at 12:24:31 JST |
