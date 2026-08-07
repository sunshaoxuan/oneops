# Customer customization and remote ledger delivery

## Objective

OneOps must store and display customer customization records, VPN records and customer environment records produced by CAG. `カスタマイズ情報` and `リモート接続情報` remain first class knowledge sources.

The organization selected for browser acceptance is sample data. Its code, name and directory path are prohibited from becoming a common parameter, default value, routing rule or classification condition.

## Implemented behavior

1. Migration 035 creates `customer_customizations` with an independent physical ID and source scan and candidate references.
2. Customer information API returns physical customization records.
3. The `カスタマイズ情報` tab renders those records as a real table.
4. Candidate apply writes customization values to `customer_customizations` and VPN values to `customer_vpn_connections`.
5. Environment apply writes customer scoped `environments` and resolves the `お客様環境` group by physical identity.
6. Scan records store the CAG ingestion physical ID and require analysis template version 2.

## Live apply result

OneOps scan `ce334711-68c9-40c9-8be4-320a0b81804f` is linked to CAG extraction `fc2519ed-509f-49de-8c49-625e330412d3`.

Applied records:

1. Customization candidate `77d841d7-30f3-493c-bb0a-82f0b34ba549` created record `92fce6ab-f2d8-4474-aaab-93e27f5bc3a9`, named `社会保険帳票カスタマイズ`, status `PLANNED`.
2. VPN candidate `b1d42bf2-3330-44bf-888d-89962ff8c39a` created record `219f7840-d8d8-4e4f-9d65-d257b4639a13`, named `SoftEther VPN Client`, status `ACTIVE`.
3. Environment candidate `fa7db85f-decc-4a5f-88d4-cdf96446f8e6` created environment IDs 15 and 16, named `U-PDS DB` and `U-HR・マイナ DB`. Both are customer scoped, active and linked to group ID 109, `お客様環境`.

## Browser result

The signed in production page at `https://192.168.20.54/customers` displayed OneOps 0.13.0 and all three applied record classes. Console inspection returned zero error and warning entries. Viewport screenshots are stored beside this report.

## Generic implementation check

Production directories `app/gateway`, `app/apps`, `app/packages` and `app/backend` were searched for the sample organization code and name with generated output excluded. No match was found.
