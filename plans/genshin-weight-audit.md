# Genshin substat weight audit

Generated 2026-09-03 by scripts/audit-genshin-weights.mjs. Guides give an ordering; our table gives magnitudes. A flag means the two disagree in a way that changes a score, and someone should decide which is right.

73 of 116 characters flagged.

## Aino

- Ours: EM (1) > ER (0.7) > HP% (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/aino>
- kqm: no priority found <https://keqingmains.com/aino/>
- game8: "Elemental Mastery > CRIT Rate > CRIT DMG > Energy Recharge" -> EM > CR > CD > ER <https://game8.co/games/Genshin-Impact/archives/537903>
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ guide lists CD, we weight it 0.00
  - ⚠ guide ranks CR above ER, we weight 0.00 vs 0.70
  - ⚠ guide ranks CD above ER, we weight 0.00 vs 0.70

## Albedo

- Ours: CR = CD (1) > DEF% (0.9) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/albedo>
- kqm: "CRIT Rate/DMG% > DEF% > (ATK% if using Burst)" -> CR > DEF% (unparsed: DMG%, (ATK% if using Burst)) <https://keqingmains.com/albedo/>
  - ⚠ we weight CD 1.00, guide does not list it
- game8: "DEF% > CRIT Rate > CRIT DMG" -> DEF% > CR > CD <https://game8.co/games/Genshin-Impact/archives/312182>

## Alhaitham

- Ours: CR = CD (1) > EM (0.9) > ATK% (0.4) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/alhaitham>
- kqm: no priority found <https://keqingmains.com/alhaitham/>
- game8: "Elemental Mastery > Energy Recharge > CRIT Rate > CRIT DMG > ATK%" -> EM > ER > CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/383712>
  - ⚠ guide ranks ER above CR, we weight 0.30 vs 1.00
  - ⚠ guide ranks ER above CD, we weight 0.30 vs 1.00

## Aloy (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/aloy>
- kqm: no priority found <https://keqingmains.com/aloy/>
- game8: "Energy Recharge > CRIT DMG > CRIT Rate > ATK%" -> ER > CD > CR > ATK% <https://game8.co/games/Genshin-Impact/archives/337957>

## Amber (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > EM = ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/amber>
- kqm: no priority found <https://keqingmains.com/amber/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK%" -> ER > CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/297535>

## Arataki Itto

- Ours: CR = CD (1) > DEF% (0.8) > ER (0.4) > ATK% (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/arataki-itto>
- kqm: no priority found <https://keqingmains.com/itto/>
- game8: "DEF% > CRIT DMG > CRIT Rate > Energy Recharge" -> DEF% > CD > CR > ER <https://game8.co/games/Genshin-Impact/archives/345461>
  - ⚠ guide ranks DEF% above CD, we weight 0.80 vs 1.00
  - ⚠ guide ranks DEF% above CR, we weight 0.80 vs 1.00

## Arlecchino

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.4)
- prydwen: "CRIT Rate = CRIT DMG > ATK% = EM" -> CR = CD > ATK% = EM <https://www.prydwen.gg/genshin-impact/characters/arlecchino>
- kqm: no priority found <https://keqingmains.com/arlecchino/>
- game8: "CRIT Rate > CRIT DMG > Energy Recharge > ATK%" -> CR > CD > ER > ATK% <https://game8.co/games/Genshin-Impact/archives/382103>
  - ⚠ guide lists ER, we weight it 0.00
  - ⚠ guide ranks ER above ATK%, we weight 0.00 vs 0.80

## Baizhu (agrees)

- Ours: ER (1.1) > HP% (1) > Heal (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/baizhu>
- kqm: "ER% (until requirement) > HP% (up to 50,000 Max HP)" -> ER > HP% <https://keqingmains.com/baizhu/>
- game8: "Energy Recharge > HP% > HP" -> ER > HP% > HP% <https://game8.co/games/Genshin-Impact/archives/314348>

## Barbara

- Ours: HP% (1) > ER (0.8) > Heal (0.6)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/barbara>
- kqm: no priority found <https://keqingmains.com/barbara/>
- game8: "HP%" -> HP% <https://game8.co/games/Genshin-Impact/archives/297517>
  - ⚠ we weight ER 0.80, guide does not list it
  - ⚠ we weight Heal 0.60, guide does not list it

## Beidou

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.7) > EM (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/beidou>
- kqm: no priority found <https://keqingmains.com/beidou/>
- game8: "ATK% > Energy Recarge > CRIT Rate > CRIT DMG" -> ATK% > CR > CD (unparsed: Energy Recarge) <https://game8.co/games/Genshin-Impact/archives/297528>
  - ⚠ we weight ER 0.70, guide does not list it
  - ⚠ guide ranks ATK% above CR, we weight 0.80 vs 1.00
  - ⚠ guide ranks ATK% above CD, we weight 0.80 vs 1.00

## Bennett

- Ours: ER (1) > CR = CD (0.7) > HP% (0.6) > ATK% (0.4) > Heal (0.3) > EM (0.2)
- prydwen: "ER > HP%" -> ER > HP% <https://www.prydwen.gg/genshin-impact/characters/bennett>
  - ⚠ we weight CR 0.70, guide does not list it
  - ⚠ we weight CD 0.70, guide does not list it
- kqm: "ER > HP% > Flat HP" -> ER > HP% > flat HP <https://keqingmains.com/bennett/>
  - ⚠ guide lists flat HP, we weight it 0.10
  - ⚠ we weight CR 0.70, guide does not list it
  - ⚠ we weight CD 0.70, guide does not list it
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK% > HP%" -> ER > CR > CD > ATK% > HP% <https://game8.co/games/Genshin-Impact/archives/297522>
  - ⚠ guide ranks ATK% above HP%, we weight 0.40 vs 0.60

## Candace

- Ours: HP% (0.8) > ER (0.7) > CR = CD (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/candace>
- kqm: "ER% (until requirement) > CRIT Rate = CRIT DMG > ATK% > HP% ≥ EM" -> ER > CR = CD > ATK% > HP% = EM <https://keqingmains.com/candace/>
  - ⚠ guide lists ATK%, we weight it 0.00
  - ⚠ guide lists EM, we weight it 0.00
  - ⚠ guide ranks CR above HP%, we weight 0.50 vs 0.80
  - ⚠ guide ranks CD above HP%, we weight 0.50 vs 0.80
  - ⚠ guide ranks ATK% above HP%, we weight 0.00 vs 0.80
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/386384>

## Charlotte

- Ours: ER (1) > ATK% = Heal (0.6) > HP% (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/charlotte>
- kqm: no priority found <https://keqingmains.com/charlotte/>
- game8: "ATK% > Energy Recharge" -> ATK% > ER <https://game8.co/games/Genshin-Impact/archives/412428>
  - ⚠ we weight Heal 0.60, guide does not list it
  - ⚠ guide ranks ATK% above ER, we weight 0.60 vs 1.00

## Chasca (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.3) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/chasca>
- kqm: no priority found <https://keqingmains.com/chasca/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Elemental Mastery" -> CD > CR > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/462001>

## Chevreuse (agrees)

- Ours: HP% (1) > ER (0.6) > Heal (0.5)
- prydwen: "HP% > ER" -> HP% > ER <https://www.prydwen.gg/genshin-impact/characters/chevreuse>
- kqm: no priority found <https://keqingmains.com/chevreuse/>
- game8: "HP% > Energy Recharge" -> HP% > ER <https://game8.co/games/Genshin-Impact/archives/426201>

## Chiori

- Ours: CR = CD (1) > DEF% (0.8) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/chiori>
- kqm: no priority found <https://keqingmains.com/chiori/>
- game8: "CRIT Rate > CRIT DMG > DEF% > ATK%" -> CR > CD > DEF% > ATK% <https://game8.co/games/Genshin-Impact/archives/382793>
  - ⚠ guide lists ATK%, we weight it 0.00

## Chongyun (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > EM = ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/chongyun>
- kqm: no priority found <https://keqingmains.com/chongyun/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK% > Elemental Mastery" -> ER > CR > CD > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/297532>

## Citlali (agrees)

- Ours: EM (1) > ER (0.8) > HP% (0.4)
- prydwen: "ER > EM" -> ER > EM <https://www.prydwen.gg/genshin-impact/characters/citlali>
- kqm: no priority found <https://keqingmains.com/citlali/>
- game8: "Elemental Mastery > Energy Recharge" -> EM > ER <https://game8.co/games/Genshin-Impact/archives/461989>

## Clorinde

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.3) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/clorinde>
- kqm: no priority found <https://keqingmains.com/clorinde/>
- game8: "CRIT Rate > CRIT DMG > Energy Recharge > ATK" -> CR > CD > ER > ATK% <https://game8.co/games/Genshin-Impact/archives/417218>
  - ⚠ guide ranks ER above ATK%, we weight 0.20 vs 0.80

## Collei

- Ours: ER (0.9) > EM (0.6) > CR = CD (0.5) > ATK% (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/collei>
- kqm: "ER% > CRIT Rate/CRIT DMG > EM/ATK%" -> ER > CR = CD > EM = ATK% <https://keqingmains.com/collei/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK% > Elemental Mastery" -> ER > CR > CD > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/382079>
  - ⚠ guide ranks ATK% above EM, we weight 0.40 vs 0.60

## Columbina (agrees)

- Ours: HP% = ER (1) > CR = CD (0.8) > EM (0.2)
- prydwen: "ER > HP% > CRIT Rate = CRIT DMG" -> ER > HP% > CR = CD <https://www.prydwen.gg/genshin-impact/characters/columbina>
  - main stats: Energy Recharge = HP% / HP% / CRIT Rate / CRIT DMG > HP%
- kqm: no priority found <https://keqingmains.com/columbina/>
- game8: "HP% > Energy Recharge > CRIT > Elemental Mastery" -> HP% > ER > CR = CD > EM <https://game8.co/games/Genshin-Impact/archives/382106>

## Cyno

- Ours: CR = CD (1) > EM (0.8) > ATK% (0.6) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/cyno>
- kqm: no priority found <https://keqingmains.com/cyno/>
- game8: "CRIT DMG > CRIT Rate > Energy Recharge > Elemental Mastery" -> CD > CR > ER > EM <https://game8.co/games/Genshin-Impact/archives/315233>
  - ⚠ we weight ATK% 0.60, guide does not list it
  - ⚠ guide ranks ER above EM, we weight 0.30 vs 0.80

## Dahlia (agrees)

- Ours: HP% (1) > ER (0.8) > CR = CD (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/dahlia>
- kqm: no priority found <https://keqingmains.com/dahlia/>
- game8: "Energy Recharge > HP%" -> ER > HP% <https://game8.co/games/Genshin-Impact/archives/516026>

## Dehya (agrees)

- Ours: HP% (0.8) > CR = CD (0.7) > ER (0.5) > ATK% (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/dehya>
- kqm: no priority found <https://keqingmains.com/dehya/>
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/383716>

## Diluc

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.5) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/diluc>
- kqm: no priority found <https://keqingmains.com/diluc/>
- game8: "CRIT DMG > CRIT Rate > Elemental Mastery > Energy Recharge > ATK%" -> CD > CR > EM > ER > ATK% <https://game8.co/games/Genshin-Impact/archives/297518>
  - ⚠ guide ranks EM above ATK%, we weight 0.50 vs 0.70
  - ⚠ guide ranks ER above ATK%, we weight 0.20 vs 0.70

## Diona

- Ours: HP% (1) > ER (0.8)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/diona>
- kqm: no priority found <https://keqingmains.com/diona/>
- game8: "Energy Recharge > HP% > CRIT Rate" -> ER > HP% > CR <https://game8.co/games/Genshin-Impact/archives/305872>
  - ⚠ guide lists CR, we weight it 0.00

## Dori

- Ours: ER (0.9) > HP% (0.8) > Heal (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/dori>
- kqm: no priority found <https://keqingmains.com/dori/>
- game8: "Energy Recharge > HP% > ATK% > CRIT Rate" -> ER > HP% > ATK% > CR <https://game8.co/games/Genshin-Impact/archives/380569>
  - ⚠ guide lists ATK%, we weight it 0.00
  - ⚠ guide lists CR, we weight it 0.00

## Durin

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.3) > ER (0.2)
- prydwen: "ER > CRIT Rate = CRIT DMG > ATK% > EM" -> ER > CR = CD > ATK% > EM <https://www.prydwen.gg/genshin-impact/characters/durin>
  - main stats: ATK% / Pyro DMG or ATK% / CRIT Rate / CRIT DMG
- kqm: no priority found <https://keqingmains.com/durin/>
- game8: "ATK% > Elemental Mastery > CRIT Rate > CRIT DMG" -> ATK% > EM > CR > CD <https://game8.co/games/Genshin-Impact/archives/462478>
  - ⚠ guide ranks ATK% above CR, we weight 0.80 vs 1.00
  - ⚠ guide ranks ATK% above CD, we weight 0.80 vs 1.00
  - ⚠ guide ranks EM above CR, we weight 0.30 vs 1.00
  - ⚠ guide ranks EM above CD, we weight 0.30 vs 1.00

## Emilie (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/emilie>
- kqm: no priority found <https://keqingmains.com/emilie/>
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/422493>

## Escoffier (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > ER (0.4)
- prydwen: "ER > CRIT Rate = CRIT DMG > ATK%" -> ER > CR = CD > ATK% <https://www.prydwen.gg/genshin-impact/characters/escoffier>
- kqm: no priority found <https://keqingmains.com/escoffier/>
- game8: "CRIT Rate > CRIT DMG > ATK% > Energy Recharge" -> CR > CD > ATK% > ER <https://game8.co/games/Genshin-Impact/archives/385307>

## Eula (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/eula>
- kqm: no priority found <https://keqingmains.com/eula/>
- game8: "Energy Recharge > CRIT DMG > CRIT Rate > ATK%" -> ER > CD > CR > ATK% <https://game8.co/games/Genshin-Impact/archives/328764>

## Faruzan (agrees)

- Ours: ER (1) > CR = CD (0.6) > ATK% (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/faruzan>
- kqm: "ER > CRIT Rate > CRIT DMG = ATK%" -> ER > CR > CD = ATK% <https://keqingmains.com/faruzan/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG" -> ER > CR > CD <https://game8.co/games/Genshin-Impact/archives/391897>

## Fischl (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.4) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/fischl>
- kqm: no priority found <https://keqingmains.com/fischl/>
- game8: "CRIT Rate > CRIT DMG > ATK" -> CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/297524>

## Flins

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.5) > ER (0.3)
- prydwen: "CRIT Rate = CRIT DMG > ATK% > EM" -> CR = CD > ATK% > EM <https://www.prydwen.gg/genshin-impact/characters/flins>
- kqm: no priority found <https://keqingmains.com/flins/>
- game8: "Energy Recharge > ATK > CRIT DMG > CRIT Rate > Elemental Mastery" -> ER > ATK% > CD > CR > EM <https://game8.co/games/Genshin-Impact/archives/538451>
  - ⚠ guide ranks ATK% above CD, we weight 0.80 vs 1.00
  - ⚠ guide ranks ATK% above CR, we weight 0.80 vs 1.00

## Freminet

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/freminet>
- kqm: no priority found <https://keqingmains.com/freminet/>
- game8: "ATK > CRIT Rate > CRIT DMG > ATK% > Elemental Mastery" -> ATK% > CR > CD > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/417207>
  - ⚠ guide lists EM, we weight it 0.00

## Furina

- Ours: CR = CD (1) > HP% (0.8) > ER (0.7) > EM (0.2)
- prydwen: "ER > CRIT Rate = CRIT DMG > HP%" -> ER > CR = CD > HP% <https://www.prydwen.gg/genshin-impact/characters/furina>
- kqm: "ER% (until requirement) > CRIT > HP%" -> ER > CR = CD > HP% <https://keqingmains.com/furina/>
- game8: "HP% > Energy Recharge (until requirement) > ATK% > Elemental Mastery" -> HP% > ER > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/417212>
  - ⚠ guide lists ATK%, we weight it 0.00
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it
  - ⚠ guide ranks ATK% above EM, we weight 0.00 vs 0.20

## Gaming

- Ours: CR = CD (1) > ATK% (0.8) > EM = ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/gaming>
- kqm: no priority found <https://keqingmains.com/gaming/>
- game8: "CRIT DMG > Energy Recharge > Elemental Mastery > CRIT Rate > ATK%" -> CD > ER > EM > CR > ATK% <https://game8.co/games/Genshin-Impact/archives/437446>
  - ⚠ guide ranks ER above CR, we weight 0.30 vs 1.00
  - ⚠ guide ranks ER above ATK%, we weight 0.30 vs 0.80
  - ⚠ guide ranks EM above CR, we weight 0.30 vs 1.00
  - ⚠ guide ranks EM above ATK%, we weight 0.30 vs 0.80

## Ganyu

- Ours: CD (1) > CR (0.9) > ATK% (0.8) > EM (0.4) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/ganyu>
- kqm: "ER (until requirement) > CRIT DMG ≥ ATK% > CRIT Rate" -> ER > CD = ATK% > CR <https://keqingmains.com/ganyu/>
- game8: "ATK% > CRIT Rate > CRIT DMG > Elemental Mastery" -> ATK% > CR > CD > EM <https://game8.co/games/Genshin-Impact/archives/312173>
  - ⚠ guide ranks ATK% above CD, we weight 0.80 vs 1.00

## Gorou

- Ours: DEF% (1) > ER (0.9)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/gorou>
- kqm: no priority found <https://keqingmains.com/gorou/>
- game8: "DEF% > Energy Recharge > CRIT Rate" -> DEF% > ER > CR <https://game8.co/games/Genshin-Impact/archives/336726>
  - ⚠ guide lists CR, we weight it 0.00

## Hu Tao (agrees)

- Ours: CR = CD (1) > HP% (0.8) > EM (0.75)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/hu-tao>
- kqm: no priority found <https://keqingmains.com/hu-tao/>
- game8: "CRIT Rate > CRIT DMG > HP% > Elemental Mastery" -> CR > CD > HP% > EM <https://game8.co/games/Genshin-Impact/archives/314347>

## Iansan

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.5)
- prydwen: "ER > ATK% > ATK" -> ER > ATK% > ATK% <https://www.prydwen.gg/genshin-impact/characters/iansan>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it
- kqm: no priority found <https://keqingmains.com/iansan/>
- game8: "Energy Recharge > ATK%" -> ER > ATK% <https://game8.co/games/Genshin-Impact/archives/345881>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it

## Ifa (agrees)

- Ours: EM (1) > ER (0.8)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/ifa>
- kqm: no priority found <https://keqingmains.com/ifa/>
- game8: "Elemental Mastery > Energy Recharge" -> EM > ER <https://game8.co/games/Genshin-Impact/archives/472693>

## Illuga (agrees)

- Ours: EM (1) > ER (0.7) > DEF% (0.4)
- prydwen: "ER > EM" -> ER > EM <https://www.prydwen.gg/genshin-impact/characters/illuga>
- kqm: no priority found <https://keqingmains.com/illuga/>
- game8: "Elemental Mastery > Energy Recharge > DEF" -> EM > ER > DEF% <https://game8.co/games/Genshin-Impact/archives/555902>

## Ineffa

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.5) > ER (0.4)
- prydwen: "ATK% > CRIT Rate = CRIT DMG" -> ATK% > CR = CD <https://www.prydwen.gg/genshin-impact/characters/ineffa>
  - ⚠ guide ranks ATK% above CR, we weight 0.70 vs 1.00
  - ⚠ guide ranks ATK% above CD, we weight 0.70 vs 1.00
- kqm: no priority found <https://keqingmains.com/ineffa/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Elemental Mastery" -> CD > CR > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/531360>

## Jahoda

- Ours: ER (0.9) > HP% (0.8) > Heal (0.6)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/jahoda>
- kqm: no priority found <https://keqingmains.com/jahoda/>
- game8: "Energy Recharge > ATK > CRIT Rate > CRIT DMG > Elemental Mastery" -> ER > ATK% > CR > CD > EM <https://game8.co/games/Genshin-Impact/archives/538446>
  - ⚠ guide lists ATK%, we weight it 0.00
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ guide lists CD, we weight it 0.00
  - ⚠ guide lists EM, we weight it 0.00
  - ⚠ we weight HP% 0.80, guide does not list it
  - ⚠ we weight Heal 0.60, guide does not list it

## Jean

- Ours: ATK% (0.8) > ER (0.7) > CR = CD (0.6) > Heal (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/jean>
- kqm: no priority found <https://keqingmains.com/jean/>
- game8: "ATK% > Energy Recharge > CRIT DMG > CRIT Rate > Elemental Mastery" -> ATK% > ER > CD > CR > EM <https://game8.co/games/Genshin-Impact/archives/297536>
  - ⚠ guide lists EM, we weight it 0.00

## Kachina

- Ours: DEF% (0.8) > ER (0.7) > CR = CD (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kachina>
- kqm: no priority found <https://keqingmains.com/kachina/>
- game8: "CRIT DMG > CRIT Rate > DEF% > Energy Recharge" -> CD > CR > DEF% > ER <https://game8.co/games/Genshin-Impact/archives/462004>
  - ⚠ guide ranks CD above DEF%, we weight 0.50 vs 0.80
  - ⚠ guide ranks CD above ER, we weight 0.50 vs 0.70
  - ⚠ guide ranks CR above DEF%, we weight 0.50 vs 0.80
  - ⚠ guide ranks CR above ER, we weight 0.50 vs 0.70

## Kaedehara Kazuha

- Ours: EM (1) > ER (0.8)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kaedehara-kazuha>
- kqm: no priority found <https://keqingmains.com/kazuha/>
- game8: "Energy Recharge > Elemental Mastery > CRIT DMG > CRIT Rate > ATK%" -> ER > EM > CD > CR > ATK% <https://game8.co/games/Genshin-Impact/archives/332826>
  - ⚠ guide lists CD, we weight it 0.00
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ guide lists ATK%, we weight it 0.00

## Kaeya

- Ours: CR = CD (0.8) > ER (0.7) > ATK% (0.6) > EM (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kaeya>
- kqm: "(ER% until requirement) > ATK% > CRIT DMG > CRIT Rate" -> ATK% > CD > CR (unparsed: (ER% until requirement)) <https://keqingmains.com/kaeya/>
  - ⚠ we weight ER 0.70, guide does not list it
  - ⚠ guide ranks ATK% above CD, we weight 0.60 vs 0.80
  - ⚠ guide ranks ATK% above CR, we weight 0.60 vs 0.80
- game8: "CRIT DMG > ATK% > CRIT Rate" -> CD > ATK% > CR <https://game8.co/games/Genshin-Impact/archives/297516>
  - ⚠ we weight ER 0.70, guide does not list it
  - ⚠ guide ranks ATK% above CR, we weight 0.60 vs 0.80

## Kamisato Ayaka

- Ours: CD (1) > CR (0.85) > ATK% (0.7) > ER (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kamisato-ayaka>
- kqm: no priority found <https://keqingmains.com/ayaka/>
- game8: "CRIT DMG > Energy Recharge > ATK% > CRIT Rate" -> CD > ER > ATK% > CR <https://game8.co/games/Genshin-Impact/archives/315215>
  - ⚠ guide ranks ER above ATK%, we weight 0.50 vs 0.70
  - ⚠ guide ranks ER above CR, we weight 0.50 vs 0.85
  - ⚠ guide ranks ATK% above CR, we weight 0.70 vs 0.85

## Kamisato Ayato

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.35) > EM (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kamisato-ayato>
- kqm: "ER% (until requirement) > CRIT > ATK% > HP%" -> ER > CR = CD > ATK% > HP% <https://keqingmains.com/ayato/>
  - ⚠ guide lists HP%, we weight it 0.00
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK% > HP%" -> ER > CR > CD > ATK% > HP% <https://game8.co/games/Genshin-Impact/archives/345514>
  - ⚠ guide lists HP%, we weight it 0.00

## Kaveh (agrees)

- Ours: EM (1) > ER (0.7) > CR = CD (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kaveh>
- kqm: no priority found <https://keqingmains.com/kaveh/>
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/386489>

## Keqing (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.3) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/keqing>
- kqm: no priority found <https://keqingmains.com/keqing/>
- game8: "CRIT Rate > CRIT DMG > ATK% > Elemental Mastery" -> CR > CD > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/297534>

## Kinich (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.3) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kinich>
- kqm: no priority found <https://keqingmains.com/kinich/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Energy Recharge > Elemental Mastery" -> CD > CR > ATK% > ER > EM <https://game8.co/games/Genshin-Impact/archives/461991>

## Kirara

- Ours: HP% (1) > ER (0.6)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kirara>
- kqm: no priority found <https://keqingmains.com/kirara/>
- game8: "HP% > HP > Energy Recharge > Elemental Mastery" -> HP% > HP% > ER > EM <https://game8.co/games/Genshin-Impact/archives/409556>
  - ⚠ guide lists EM, we weight it 0.00

## Klee (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.5) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/klee>
- kqm: no priority found <https://keqingmains.com/klee/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Elemental Mastery" -> CD > CR > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/297521>

## Kujou Sara (agrees)

- Ours: ER (1) > ATK% (0.6) > CR = CD (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kujou-sara>
- kqm: no priority found <https://keqingmains.com/sara/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK%" -> ER > CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/336727>

## Kuki Shinobu (agrees)

- Ours: EM (1) > HP% (0.7) > ER (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/kuki-shinobu>
- kqm: no priority found <https://keqingmains.com/shinobu/>
- game8: "Elemental Mastery > HP% > Energy Recharge" -> EM > HP% > ER <https://game8.co/games/Genshin-Impact/archives/346199>

## Lan Yan (agrees)

- Ours: ER (0.9) > ATK% (0.5) > CR = CD = EM (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/lan-yan>
- kqm: no priority found <https://keqingmains.com/lan-yan/>
- game8: not found

## Lauma

- Ours: EM (1) > ER (0.8) > CR = CD (0.5)
- prydwen: "ER > EM" -> ER > EM <https://www.prydwen.gg/genshin-impact/characters/lauma>
- kqm: no priority found <https://keqingmains.com/lauma/>
- game8: "Elemental Mastery > CRIT Rate > CRIT DMG > Energy Recharge" -> EM > CR > CD > ER <https://game8.co/games/Genshin-Impact/archives/538066>
  - ⚠ guide ranks CR above ER, we weight 0.50 vs 0.80
  - ⚠ guide ranks CD above ER, we weight 0.50 vs 0.80

## Layla

- Ours: HP% (1) > ER (0.7)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/layla>
- kqm: "ER% until requirement > HP% > CRIT Rate (w/ Favonius) > Flat HP" -> HP% > flat HP (unparsed: ER% until requirement, CRIT Rate (w, Favonius)) <https://keqingmains.com/layla/>
  - ⚠ we weight ER 0.70, guide does not list it
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/386486>

## Linnea

- Ours: CR = CD (1) > DEF% (0.8) > ER (0.4)
- prydwen: "DEF% > CRIT Rate = CRIT DMG > EM" -> DEF% > CR = CD > EM <https://www.prydwen.gg/genshin-impact/characters/linnea>
  - ⚠ guide lists EM, we weight it 0.00
  - ⚠ guide ranks DEF% above CR, we weight 0.80 vs 1.00
  - ⚠ guide ranks DEF% above CD, we weight 0.80 vs 1.00
- kqm: no priority found <https://keqingmains.com/linnea/>
- game8: "CRIT Rate > CRIT DMG > DEF% > Elemental Mastery > Energy Recharge" -> CR > CD > DEF% > EM > ER <https://game8.co/games/Genshin-Impact/archives/551088>
  - ⚠ guide lists EM, we weight it 0.00
  - ⚠ guide ranks EM above ER, we weight 0.00 vs 0.40

## Lisa (agrees)

- Ours: EM (1) > ER (0.7) > CR = CD (0.5) > ATK% (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/lisa>
- kqm: no priority found <https://keqingmains.com/lisa/>
- game8: "Energy Recharge > Elemental Mastery > CRIT Rate > CRIT DMG" -> ER > EM > CR > CD <https://game8.co/games/Genshin-Impact/archives/297515>

## Lohen (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > ER (0.5)
- prydwen: "CRIT Rate = CRIT DMG > ATK%" -> CR = CD > ATK% <https://www.prydwen.gg/genshin-impact/characters/lohen>
  - main stats: ATK% / Cryo DMG > ATK% / CRIT Rate / CRIT DMG
- kqm: no priority found <https://keqingmains.com/lohen/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Energy Recharge" -> CD > CR > ATK% > ER <https://game8.co/games/Genshin-Impact/archives/580697>

## Lynette (agrees)

- Ours: CR = CD (0.8) > ER (0.7) > ATK% (0.6) > EM (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/lynette>
- kqm: no priority found <https://keqingmains.com/lynette/>
- game8: "Energy Recharge (until requirement) > CRIT > ATK%" -> ER > CR = CD > ATK% <https://game8.co/games/Genshin-Impact/archives/345879>

## Lyney

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/lyney>
- kqm: no priority found <https://keqingmains.com/lyney/>
- game8: "CRIT DMG > Energy Recharge > CRIT Rate > ATK%" -> CD > ER > CR > ATK% <https://game8.co/games/Genshin-Impact/archives/345540>
  - ⚠ guide ranks ER above CR, we weight 0.30 vs 1.00
  - ⚠ guide ranks ER above ATK%, we weight 0.30 vs 0.80

## Mavuika

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: "CRIT Rate = CRIT DMG > EM = ATK%" -> CR = CD > EM = ATK% <https://www.prydwen.gg/genshin-impact/characters/mavuika>
  - ⚠ guide lists EM, we weight it 0.00
- kqm: no priority found <https://keqingmains.com/mavuika/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Elemental Mastery" -> CD > CR > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/461999>
  - ⚠ guide lists EM, we weight it 0.00

## Mika (agrees)

- Ours: ER (1) > HP% (0.8) > Heal (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/mika>
- kqm: no priority found <https://keqingmains.com/mika/>
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/390096>

## Mona

- Ours: ER (1) > CR = CD (0.8) > ATK% (0.6) > EM (0.3)
- prydwen: "ER" -> ER <https://www.prydwen.gg/genshin-impact/characters/mona>
  - main stats: Energy Recharge / Anything / CRIT Rate / Anything
  - ⚠ we weight CR 0.80, guide does not list it
  - ⚠ we weight CD 0.80, guide does not list it
  - ⚠ we weight ATK% 0.60, guide does not list it
- kqm: no priority found <https://keqingmains.com/mona/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK%" -> ER > CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/297526>

## Mualani

- Ours: CR = CD (1) > HP% (0.9) > EM (0.5) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/mualani>
- kqm: no priority found <https://keqingmains.com/mualani/>
- game8: "CRIT DMG > HP% > Elemental Mastery > CRIT Rate > Energy Recharge" -> CD > HP% > EM > CR > ER <https://game8.co/games/Genshin-Impact/archives/461994>
  - ⚠ guide ranks EM above CR, we weight 0.50 vs 1.00

## Nahida (agrees)

- Ours: EM (1) > CR = CD (0.9) > ER (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/nahida>
- kqm: "ER until requirement > as close to 900-1000 total EM as possible* > Dendro DMG% > CRIT > EM" -> CR = CD > EM (unparsed: ER until requirement, as close to 900-1000 total EM as possible*, Dendro DMG%) <https://keqingmains.com/nahida/>
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/383713>

## Navia

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/navia>
- kqm: no priority found <https://keqingmains.com/navia/>
- game8: "CRIT DMG > CRIT Rate > Energy Recharge > ATK%" -> CD > CR > ER > ATK% <https://game8.co/games/Genshin-Impact/archives/417194>
  - ⚠ guide ranks ER above ATK%, we weight 0.40 vs 0.80

## Nefer

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.4) > ER (0.3)
- prydwen: "CRIT Rate = CRIT DMG > EM" -> CR = CD > EM <https://www.prydwen.gg/genshin-impact/characters/nefer>
  - main stats: Elemental Mastery / Elemental Mastery / CRIT Rate / CRIT DMG > Elemental Mastery
  - ⚠ we weight ATK% 0.70, guide does not list it
- kqm: no priority found <https://keqingmains.com/nefer/>
- game8: "Elemental Mastery > CRIT Rate > CRIT DMG" -> EM > CR > CD <https://game8.co/games/Genshin-Impact/archives/538448>
  - ⚠ we weight ATK% 0.70, guide does not list it
  - ⚠ guide ranks EM above CR, we weight 0.40 vs 1.00
  - ⚠ guide ranks EM above CD, we weight 0.40 vs 1.00

## Neuvillette

- Ours: CR = CD (1) > HP% (0.9) > ER (0.5) > EM (0.2)
- prydwen: "CRIT Rate = CRIT DMG = ER > HP%" -> CR = CD = ER > HP% <https://www.prydwen.gg/genshin-impact/characters/neuvillette>
  - ⚠ guide ranks ER above HP%, we weight 0.50 vs 0.90
- kqm: no priority found <https://keqingmains.com/neuvillette/>
- game8: "ATK% > Energy Recharge > ATK" -> ATK% > ER > ATK% <https://game8.co/games/Genshin-Impact/archives/393054>
  - ⚠ guide lists ATK%, we weight it 0.00
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it
  - ⚠ we weight HP% 0.90, guide does not list it

## Nicole

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: "ATK% > ER" -> ATK% > ER <https://www.prydwen.gg/genshin-impact/characters/nicole>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it
- kqm: no priority found <https://keqingmains.com/nicole/>
- game8: "ATK% > Energy Recharge > ATK" -> ATK% > ER > ATK% <https://game8.co/games/Genshin-Impact/archives/406932>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it

## Nilou

- Ours: HP% (1) > EM (0.8) > CR = CD (0.6) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/nilou>
- kqm: no priority found <https://keqingmains.com/nilou/>
- game8: "HP% > Energy Recharge > Flat HP > Elemental Mastery" -> HP% > ER > flat HP > EM <https://game8.co/games/Genshin-Impact/archives/383715>
  - ⚠ we weight CR 0.60, guide does not list it
  - ⚠ we weight CD 0.60, guide does not list it
  - ⚠ guide ranks ER above EM, we weight 0.30 vs 0.80
  - ⚠ guide ranks flat HP above EM, we weight 0.20 vs 0.80

## Ningguang (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/ningguang>
- kqm: no priority found <https://keqingmains.com/ningguang/>
- game8: "CRIT Rate > CRIT DMG > ATK%" -> CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/297529>

## Noelle

- Ours: DEF% (1) > CR = CD (0.9) > ER (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/noelle>
- kqm: "ER% (until requirement) > CRIT > DEF% > ATK% > Flat DEF > Flat ATK" -> ER > CR = CD > DEF% > ATK% > flat DEF > flat ATK <https://keqingmains.com/noelle/>
  - ⚠ guide lists ATK%, we weight it 0.00
  - ⚠ guide lists flat ATK, we weight it 0.00
  - ⚠ guide ranks ATK% above flat DEF, we weight 0.00 vs 0.20
- game8: "DEF% > CRIT DMG > CRIT Rate > ATK%" -> DEF% > CD > CR > ATK% <https://game8.co/games/Genshin-Impact/archives/297523>
  - ⚠ guide lists ATK%, we weight it 0.00

## Ororon

- Ours: ER (0.9) > EM (0.7) > CR = CD (0.6) > ATK% (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/ororon>
- kqm: no priority found <https://keqingmains.com/ororon/>
- game8: "ATK > CRIT Rate > CRIT DMG > Energy Recharge" -> ATK% > CR > CD > ER <https://game8.co/games/Genshin-Impact/archives/461993>
  - ⚠ we weight EM 0.70, guide does not list it
  - ⚠ guide ranks ATK% above ER, we weight 0.50 vs 0.90
  - ⚠ guide ranks CR above ER, we weight 0.60 vs 0.90
  - ⚠ guide ranks CD above ER, we weight 0.60 vs 0.90

## Prune

- Ours: ER (0.9) > ATK% = EM (0.5) > CR = CD (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/prune>
- kqm: no priority found <https://keqingmains.com/prune/>
- game8: "ATK% > ATK > Energy Recharge" -> ATK% > ATK% > ER <https://game8.co/games/Genshin-Impact/archives/590328>
  - ⚠ guide ranks ATK% above ER, we weight 0.50 vs 0.90

## Qiqi

- Ours: ATK% (1) > Heal (0.7) > ER (0.6)
- prydwen: "ATK% > CRIT Rate" -> ATK% > CR <https://www.prydwen.gg/genshin-impact/characters/qiqi>
  - main stats: ATK% / ATK% / ATK% / CRIT Rate
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ we weight ER 0.60, guide does not list it
  - ⚠ we weight Heal 0.70, guide does not list it
- kqm: no priority found <https://keqingmains.com/qiqi/>
- game8: "Energy Recharge > ATK% > CRIT Rate > CRIT DMG" -> ER > ATK% > CR > CD <https://game8.co/games/Genshin-Impact/archives/297533>
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ guide lists CD, we weight it 0.00
  - ⚠ we weight Heal 0.70, guide does not list it

## Raiden Shogun

- Ours: CR = CD (1) > ER (0.85) > ATK% (0.6)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/raiden-shogun>
- kqm: no priority found <https://keqingmains.com/raiden/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Energy Recharge > Elemental Mastery" -> CD > CR > ATK% > ER > EM <https://game8.co/games/Genshin-Impact/archives/337161>
  - ⚠ guide lists EM, we weight it 0.00
  - ⚠ guide ranks ATK% above ER, we weight 0.60 vs 0.85

## Razor

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/razor>
- kqm: no priority found <https://keqingmains.com/razor/>
- game8: "ATK% > CRIT Rate > CRIT DMG > Energy Recharge" -> ATK% > CR > CD > ER <https://game8.co/games/Genshin-Impact/archives/297519>
  - ⚠ guide ranks ATK% above CR, we weight 0.80 vs 1.00
  - ⚠ guide ranks ATK% above CD, we weight 0.80 vs 1.00

## Rosaria (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > ER (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/rosaria>
- kqm: no priority found <https://keqingmains.com/rosaria/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK%" -> ER > CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/314177>

## Sandrone

- Ours: CR = CD = ATK% (1) > ER (0.35) > EM (0.2)
- prydwen: "CRIT Rate = CRIT DMG > ATK% > EM > ER" -> CR = CD > ATK% > EM > ER <https://www.prydwen.gg/genshin-impact/characters/sandrone>
  - main stats: ATK% / ATK% / CRIT Rate / CRIT DMG
  - ⚠ guide ranks EM above ER, we weight 0.20 vs 0.35
- kqm: no priority found <https://keqingmains.com/sandrone/>
- game8: "Energy Recharge (until requirement) > CRIT DMG > CRIT Rate > ATK > Elemental Mastery" -> ER > CD > CR > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/382107>

## Sangonomiya Kokomi

- Ours: HP% (1) > Heal (0.8) > ER (0.7) > EM (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/sangonomiya-kokomi>
- kqm: no priority found <https://keqingmains.com/kokomi/>
- game8: "HP% > Energy Recharge > Elemental Mastery" -> HP% > ER > EM <https://game8.co/games/Genshin-Impact/archives/337140>
  - ⚠ we weight Heal 0.80, guide does not list it

## Sayu (agrees)

- Ours: EM (1) > ER (0.8) > ATK% (0.4) > Heal (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/sayu>
- kqm: no priority found <https://keqingmains.com/sayu/>
- game8: no priority found <https://game8.co/games/Genshin-Impact/archives/333496>

## Sethos

- Ours: EM (1) > CR = CD (0.8) > ATK% = ER (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/sethos>
- kqm: no priority found <https://keqingmains.com/sethos/>
- game8: "CRIT Rate > CRIT DMG > Energy Recharge > Elemental Mastery" -> CR > CD > ER > EM <https://game8.co/games/Genshin-Impact/archives/451024>
  - ⚠ guide ranks CR above EM, we weight 0.80 vs 1.00
  - ⚠ guide ranks CD above EM, we weight 0.80 vs 1.00
  - ⚠ guide ranks ER above EM, we weight 0.40 vs 1.00

## Shenhe (agrees)

- Ours: ATK% (1) > ER (0.8) > CR = CD (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/shenhe>
- kqm: no priority found <https://keqingmains.com/shenhe/>
- game8: "ATK% > Energy Recharge" -> ATK% > ER <https://game8.co/games/Genshin-Impact/archives/346620>

## Shikanoin Heizou (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.5) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/shikanoin-heizou>
- kqm: no priority found <https://keqingmains.com/heizou/>
- game8: "CRIT Rate > CRIT DMG > ATK% > Elemental Mastery" -> CR > CD > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/345516>

## Sigewinne (agrees)

- Ours: HP% (1) > ER (0.7) > Heal (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/sigewinne>
- kqm: no priority found <https://keqingmains.com/sigewinne/>
- game8: "HP% > Energy Recharge" -> HP% > ER <https://game8.co/games/Genshin-Impact/archives/352956>

## Skirk

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: "CRIT Rate = CRIT DMG > ATK%" -> CR = CD > ATK% <https://www.prydwen.gg/genshin-impact/characters/skirk>
- kqm: no priority found <https://keqingmains.com/skirk/>
- game8: "ATK% > CRIT Rate > CRIT DMG" -> ATK% > CR > CD <https://game8.co/games/Genshin-Impact/archives/333140>
  - ⚠ guide ranks ATK% above CR, we weight 0.80 vs 1.00
  - ⚠ guide ranks ATK% above CD, we weight 0.80 vs 1.00

## Sucrose

- Ours: EM (1) > ER (0.7)
- prydwen: "EM" -> EM <https://www.prydwen.gg/genshin-impact/characters/sucrose>
  - ⚠ we weight ER 0.70, guide does not list it
- kqm: no priority found <https://keqingmains.com/sucrose/>
- game8: "Elemental Mastery > Energy Recharge (until requirement) > CRIT Rate (if Fav)" -> EM > ER > CR <https://game8.co/games/Genshin-Impact/archives/297525>
  - ⚠ guide lists CR, we weight it 0.00

## Tartaglia

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.4) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/tartaglia>
- kqm: no priority found <https://keqingmains.com/tartaglia/>
- game8: "ATK% > CRIT Rate > CRIT DMG > Elemental Mastery" -> ATK% > CR > CD > EM <https://game8.co/games/Genshin-Impact/archives/305862>
  - ⚠ guide ranks ATK% above CR, we weight 0.80 vs 1.00
  - ⚠ guide ranks ATK% above CD, we weight 0.80 vs 1.00

## Thoma (agrees)

- Ours: ER (1) > HP% (0.8)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/thoma>
- kqm: no priority found <https://keqingmains.com/thoma/>
- game8: "Energy Recharge > HP%" -> ER > HP% <https://game8.co/games/Genshin-Impact/archives/337141>

## Tighnari

- Ours: CR = CD (1) > EM (0.9) > ATK% (0.5) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/tighnari>
- kqm: no priority found <https://keqingmains.com/tighnari/>
- game8: "CRIT Rate > CRIT DMG > ATK% > Elemental Mastery" -> CR > CD > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/382082>
  - ⚠ guide ranks ATK% above EM, we weight 0.50 vs 0.90

## Varesa

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.4) > ER (0.2)
- prydwen: "CRIT Rate = CRIT DMG > ATK%" -> CR = CD > ATK% <https://www.prydwen.gg/genshin-impact/characters/varesa>
- kqm: no priority found <https://keqingmains.com/varesa/>
- game8: "CRIT DMG > CRIT Rate > ATK% > Energy Recharge > Elemental Mastery" -> CD > CR > ATK% > ER > EM <https://game8.co/games/Genshin-Impact/archives/500244>
  - ⚠ guide ranks ER above EM, we weight 0.20 vs 0.40

## Varka (agrees)

- Ours: CR = CD (1) > ATK% (0.7) > EM = ER (0.3)
- prydwen: "CRIT Rate = CRIT DMG > ATK%" -> CR = CD > ATK% <https://www.prydwen.gg/genshin-impact/characters/varka>
- kqm: no priority found <https://keqingmains.com/varka/>
- game8: "CRIT Rate > CRIT DMG > ATK% > Energy Recharge > Elemental Mastery" -> CR > CD > ATK% > ER > EM <https://game8.co/games/Genshin-Impact/archives/314346>

## Venti

- Ours: EM (1) > CR = CD (0.8) > ER (0.7) > ATK% (0.6)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/venti>
- kqm: "ER (until sufficient) > EM > ATK% = CR > CD/Flat ATK" -> ER > EM > ATK% = CR > CD = flat ATK <https://keqingmains.com/venti/>
  - ⚠ guide lists flat ATK, we weight it 0.10
  - ⚠ guide ranks ATK% above CD, we weight 0.60 vs 0.80
- game8: "Elemental Mastery > Energy Recharge > ATK% > CRIT Rate > CRIT DMG" -> EM > ER > ATK% > CR > CD <https://game8.co/games/Genshin-Impact/archives/297520>
  - ⚠ guide ranks ER above CR, we weight 0.70 vs 0.80
  - ⚠ guide ranks ER above CD, we weight 0.70 vs 0.80
  - ⚠ guide ranks ATK% above CR, we weight 0.60 vs 0.80
  - ⚠ guide ranks ATK% above CD, we weight 0.60 vs 0.80

## Wanderer

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/wanderer>
- kqm: no priority found <https://keqingmains.com/wanderer/>
- game8: "CRIT Rate > CRIT DMG > Energy Recharge > ATK%" -> CR > CD > ER > ATK% <https://game8.co/games/Genshin-Impact/archives/309656>
  - ⚠ guide ranks ER above ATK%, we weight 0.20 vs 0.80

## Wriothesley (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > EM = ER (0.3)
- prydwen: "CRIT Rate = CRIT DMG > ATK% > EM" -> CR = CD > ATK% > EM <https://www.prydwen.gg/genshin-impact/characters/wriothesley>
- kqm: no priority found <https://keqingmains.com/wriothesley/>
- game8: "CRIT DMG > CRIT Rate > ATK > Energy Recharge" -> CD > CR > ATK% > ER <https://game8.co/games/Genshin-Impact/archives/417191>

## Xiangling

- Ours: CR = CD (1) > ER (0.9) > EM (0.75) > ATK% (0.7)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/xiangling>
- kqm: no priority found <https://keqingmains.com/xiangling/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > Elemental Mastery" -> ER > CR > CD > EM <https://game8.co/games/Genshin-Impact/archives/297530>
  - ⚠ we weight ATK% 0.70, guide does not list it

## Xianyun (agrees)

- Ours: ATK% (1) > ER (0.8) > Heal (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/xianyun>
- kqm: no priority found <https://keqingmains.com/xianyun/>
- game8: "Energy Recharge > ATK%" -> ER > ATK% <https://game8.co/games/Genshin-Impact/archives/437445>

## Xiao (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.5)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/xiao>
- kqm: no priority found <https://keqingmains.com/xiao/>
- game8: "Energy Recharge > CRIT Rate > CRIT DMG > ATK%" -> ER > CR > CD > ATK% <https://game8.co/games/Genshin-Impact/archives/297527>

## Xilonen

- Ours: DEF% (1) > ER (0.8) > Heal (0.4)
- prydwen: "ER = DEF%" -> ER = DEF% <https://www.prydwen.gg/genshin-impact/characters/xilonen>
- kqm: no priority found <https://keqingmains.com/xilonen/>
- game8: "Energy Recharge > DEF% Recommended ER: 180 - 220%" -> ER (unparsed: DEF% Recommended ER: 180 - 220%) <https://game8.co/games/Genshin-Impact/archives/461997>
  - ⚠ we weight DEF% 1.00, guide does not list it

## Xingqiu (agrees)

- Ours: CR = CD (1) > ER (0.9) > ATK% (0.8) > EM (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/xingqiu>
- kqm: "ER% (until requirement) > CRIT Rate = CRIT DMG > ATK%" -> ER > CR = CD > ATK% <https://keqingmains.com/xingqiu/>
- game8: "Energy Recharge > CRIT DMG > CRIT Rate > ATK% > Elemental Mastery" -> ER > CD > CR > ATK% > EM <https://game8.co/games/Genshin-Impact/archives/297531>

## Xinyan (agrees)

- Ours: CR = CD (1) > ATK% (0.8) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/xinyan>
- kqm: no priority found <https://keqingmains.com/xinyan/>
- game8: "CRIT Rate > CRIT DMG > ATK% > Energy Recharge" -> CR > CD > ATK% > ER <https://game8.co/games/Genshin-Impact/archives/305873>

## Yae Miko

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.5) > ER (0.4)
- prydwen: "CRIT Rate = CRIT DMG > ATK% > EM" -> CR = CD > ATK% > EM <https://www.prydwen.gg/genshin-impact/characters/yae-miko>
  - main stats: ATK% > Elemental Mastery / ATK% > Elemental Mastery / CRIT Rate / CRIT DMG
- kqm: no priority found <https://keqingmains.com/yae-miko/>
- game8: "CRIT DMG > CRIT Rate > Energy Recharge > Elemental Mastery > ATK%" -> CD > CR > ER > EM > ATK% <https://game8.co/games/Genshin-Impact/archives/327533>
  - ⚠ guide ranks ER above ATK%, we weight 0.40 vs 0.70
  - ⚠ guide ranks EM above ATK%, we weight 0.50 vs 0.70

## Yanfei

- Ours: CR = CD (1) > ATK% (0.7) > EM (0.5) > ER (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/yanfei>
- kqm: "Rotation (unless otherwise stated): Xingqiu EQ > Bennett EQ N1 > Yanfei EQ 3xN3C E C > Xingqiu EQ > Bennett EQ N1 > Yanfei E N1C 3xN3C E C" ->  (unparsed: Rotation (unless otherwise stated): Xingqiu EQ, Bennett EQ N1, Yanfei EQ 3xN3C E C, Xingqiu EQ, Bennett EQ N1, Yanfei E N1C 3xN3C E C) <https://keqingmains.com/yanfei/>
- game8: "ATK% > CRIT DMG > CRIT Rate" -> ATK% > CD > CR <https://game8.co/games/Genshin-Impact/archives/328765>
  - ⚠ guide ranks ATK% above CD, we weight 0.70 vs 1.00
  - ⚠ guide ranks ATK% above CR, we weight 0.70 vs 1.00

## Yaoyao

- Ours: HP% (0.8) > ER (0.7) > Heal (0.6) > EM (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/yaoyao>
- kqm: "ER% > CRIT Rate* > HP% > Flat HP / EM" -> ER > CR > HP% > flat HP = EM <https://keqingmains.com/yaoyao/>
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ we weight Heal 0.60, guide does not list it
  - ⚠ guide ranks CR above HP%, we weight 0.00 vs 0.80
  - ⚠ guide ranks CR above flat HP, we weight 0.00 vs 0.20
  - ⚠ guide ranks CR above EM, we weight 0.00 vs 0.30
- game8: "Energy Recharge > CRIT Rate / DMG > Elemental Mastery > HP%" -> ER > CR > EM > HP% (unparsed: DMG) <https://game8.co/games/Genshin-Impact/archives/314174>
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ we weight Heal 0.60, guide does not list it
  - ⚠ guide ranks CR above EM, we weight 0.00 vs 0.30
  - ⚠ guide ranks CR above HP%, we weight 0.00 vs 0.80
  - ⚠ guide ranks EM above HP%, we weight 0.30 vs 0.80

## Yelan

- Ours: CR = CD (1) > ER (0.9) > HP% (0.8) > EM (0.3)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/yelan>
- kqm: no priority found <https://keqingmains.com/yelan/>
- game8: "Energy Recharge > HP% > CRIT Rate or CRIT DMG" -> ER > HP% (unparsed: CRIT Rate or CRIT DMG) <https://game8.co/games/Genshin-Impact/archives/372781>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it

## Yoimiya

- Ours: CR = CD (1) > ATK% (0.8) > EM (0.5) > ER (0.2)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/yoimiya>
- kqm: "CRIT > ATK% ≥ EM > ER%" -> CR = CD > ATK% = EM > ER <https://keqingmains.com/yoimiya/>
- game8: "CRIT DMG > CRIT Rate. ATK% > Elemental Mastery > Energy Recharge" -> CD > EM > ER (unparsed: CRIT Rate. ATK%) <https://game8.co/games/Genshin-Impact/archives/333497>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight ATK% 0.80, guide does not list it

## Yumemizuki Mizuki

- Ours: EM (1) > ER (0.8) > HP% (0.4)
- prydwen: "CRIT Rate = CRIT DMG > EM" -> CR = CD > EM <https://www.prydwen.gg/genshin-impact/characters/yumemizuki-mizuki>
  - main stats: Elemental Mastery / Elemental Mastery / CRIT Rate / CRIT DMG
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ guide lists CD, we weight it 0.00
  - ⚠ we weight ER 0.80, guide does not list it
  - ⚠ guide ranks CR above EM, we weight 0.00 vs 1.00
  - ⚠ guide ranks CD above EM, we weight 0.00 vs 1.00
- kqm: no priority found <https://keqingmains.com/mizuki/>
- game8: "CRIT > Elemental Mastery > Energy Recharge" -> CR = CD > EM > ER <https://game8.co/games/Genshin-Impact/archives/492414>
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ guide lists CD, we weight it 0.00
  - ⚠ guide ranks CR above EM, we weight 0.00 vs 1.00
  - ⚠ guide ranks CR above ER, we weight 0.00 vs 0.80
  - ⚠ guide ranks CD above EM, we weight 0.00 vs 1.00
  - ⚠ guide ranks CD above ER, we weight 0.00 vs 0.80

## Yun Jin

- Ours: DEF% (1) > ER (0.9)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/yun-jin>
- kqm: "ER% = DEF% = CRIT Rate% > Flat DEF" -> ER = DEF% = CR > flat DEF <https://keqingmains.com/yun-jin/>
  - ⚠ guide lists CR, we weight it 0.00
  - ⚠ guide ranks CR above flat DEF, we weight 0.00 vs 0.30
- game8: "DEF% > Energy Recharge > CRIT Rate" -> DEF% > ER > CR <https://game8.co/games/Genshin-Impact/archives/314345>
  - ⚠ guide lists CR, we weight it 0.00

## Zhongli

- Ours: CR = CD (1) > HP% (0.9) > ATK% (0.5) > ER (0.4)
- prydwen: no build guide <https://www.prydwen.gg/genshin-impact/characters/zhongli>
- kqm: "HP%/Flat HP > CritRate% (If using Favonious Lance)" -> HP% = flat HP (unparsed: CritRate% (If using Favonious Lance)) <https://keqingmains.com/zhongli/>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it
- game8: "HP% > HP > Energy Recharge" -> HP% > HP% > ER <https://game8.co/games/Genshin-Impact/archives/305858>
  - ⚠ we weight CR 1.00, guide does not list it
  - ⚠ we weight CD 1.00, guide does not list it

## Zibai

- Ours: CR = CD (1) > DEF% (0.75) > ER (0.4)
- prydwen: "CRIT Rate = CRIT DMG > DEF% > EM" -> CR = CD > DEF% > EM <https://www.prydwen.gg/genshin-impact/characters/zibai>
  - main stats: DEF% / DEF% / CRIT Rate / CRIT DMG
  - ⚠ guide lists EM, we weight it 0.00
- kqm: no priority found <https://keqingmains.com/zibai/>
- game8: "CRIT Rate > CRIT DMG > DEF% > Elemental Mastery > Energy Recharge" -> CR > CD > DEF% > EM > ER <https://game8.co/games/Genshin-Impact/archives/570263>
  - ⚠ guide lists EM, we weight it 0.00
  - ⚠ guide ranks EM above ER, we weight 0.00 vs 0.40
