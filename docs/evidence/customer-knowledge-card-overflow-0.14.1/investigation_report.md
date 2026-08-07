# Customer knowledge card overflow investigation

## Finding

The structured Candidate value was rendered inside a `pre` element nested in an Ant Design Descriptions table. Browser default `white-space: pre` preserved every JSON line and prevented wrapping. The table used content based width calculation, while the Candidate was a child of a responsive multi-column Grid. Long Japanese text, identifiers and paths therefore created an intrinsic width larger than the Card.

## Correction

1. Candidate Card, Card body, Descriptions container and value cell receive explicit zero minimum width and a 100 percent maximum width.
2. The Descriptions table uses fixed layout at 100 percent width.
3. `.customer-knowledge-json` uses `pre-wrap`, `overflow-wrap: anywhere` and `word-break: break-word`.
4. The Card clips accidental painting outside its border as a final containment boundary.

## Live evidence

The signed in OneOps 0.14.1 page was opened with the same sample organization and real Candidate data. All 32 Candidate Cards reported equal `clientWidth` and `scrollWidth`. All 31 JSON blocks reported zero overflow. `document.body` and `document.documentElement` also reported zero horizontal overflow.

Computed JSON styles were `white-space: pre-wrap`, `overflow-wrap: anywhere` and `word-break: break-word`. Browser Console returned zero errors and zero warnings.
