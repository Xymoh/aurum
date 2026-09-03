# Genshin weight decisions

Changes made after `node scripts/audit-genshin-weights.mjs` on 2026-09-03. The audit report itself is regenerated on every run; this file is the record of what was changed and why. Flat ATK/HP/DEF weights are derived (40% of the percent stat) so they are not listed.

- **Bennett**: CRIT_RATE 0.7 -> 0.25, CRIT_DMG 0.7 -> 0.25, HP_PERCENT 0.6 -> 0.8, ATK_PERCENT 0.4 -> 0.3. Prydwen "ER > HP%", KQM "ER > HP% > flat HP": crit only matters with Favonius, so it drops from 0.7 to a Favonius-sized 0.25 and HP% rises.
- **Furina**: ENERGY_RECHARGE 0.7 -> 0.8. Prydwen "ER > CR = CD > HP%", KQM "ER (until requirement) > CRIT > HP%": ER up from 0.7; the requirement itself is the ER caution.
- **Yumemizuki Mizuki**: CRIT_RATE 0 -> 1.0, CRIT_DMG 0 -> 1.0, ELEMENTAL_MASTERY 1 -> 0.8, ENERGY_RECHARGE 0.8 -> 0.4, HP_PERCENT 0.4 -> 0.0. Prydwen "CR = CD > EM", Game8 "CRIT > EM > ER": the table had no crit at all.
- **Iansan**: ENERGY_RECHARGE 0.5 -> 1.0, ATK_PERCENT 0.8 -> 1.0, CRIT_RATE 1 -> 0.2, CRIT_DMG 1 -> 0.2. Prydwen "ER > ATK% > flat ATK", Game8 "ER > ATK%": a buffer scaling off ATK, not a crit carry.
- **Nicole**: ATK_PERCENT 0.8 -> 1.0, ENERGY_RECHARGE 0.3 -> 0.8, CRIT_RATE 1 -> 0.2, CRIT_DMG 1 -> 0.2. Prydwen "ATK% > ER", Game8 "ATK% > ER > flat ATK": support profile, crit was wrongly 1.0.
- **Neuvillette**: ENERGY_RECHARGE 0.5 -> 0.8. Prydwen "CR = CD = ER > HP%": ER up from 0.5.
- **Linnea**: DEF_PERCENT 0.8 -> 1.0, CRIT_RATE 1 -> 0.9, CRIT_DMG 1 -> 0.9, ELEMENTAL_MASTERY 0 -> 0.3. Prydwen "DEF% > CR = CD > EM": DEF% leads.
- **Ineffa**: ATK_PERCENT 0.7 -> 1.0, CRIT_RATE 1 -> 0.9, CRIT_DMG 1 -> 0.9. Prydwen "ATK% > CR = CD".
- **Zibai**: ELEMENTAL_MASTERY 0 -> 0.3. Prydwen and Game8 both list EM after DEF%.
- **Mavuika**: ELEMENTAL_MASTERY 0 -> 0.8. Prydwen "CR = CD > EM = ATK%": EM was 0.
- **Nefer**: ELEMENTAL_MASTERY 0.4 -> 0.8, ATK_PERCENT 0.7 -> 0.3. Prydwen "CR = CD > EM", Game8 "EM > CR > CD": EM up, ATK% down.
- **Durin**: ENERGY_RECHARGE 0.2 -> 0.6. Prydwen "ER > CR = CD > ATK% > EM": ER was 0.2.
- **Sandrone**: ELEMENTAL_MASTERY 0.2 -> 0.4, ENERGY_RECHARGE 0.35 -> 0.3. Prydwen "CR = CD > ATK% > EM > ER".
- **Arlecchino**: ELEMENTAL_MASTERY 0.4 -> 0.8. Prydwen "CR = CD > ATK% = EM": EM was 0.4.
- **Qiqi**: CRIT_RATE 0 -> 0.3, HEALING_BONUS 0.7 -> 0.5. Prydwen "ATK% > CR": CR for Favonius, healing bonus is a smaller factor than the table had.
- **Xilonen**: ENERGY_RECHARGE 0.8 -> 1.0. Prydwen "ER = DEF%", Game8 "ER > DEF%".
- **Candace**: CRIT_RATE 0.5 -> 0.7, CRIT_DMG 0.5 -> 0.7, ATK_PERCENT 0 -> 0.4. KQM "ER (until requirement) > CR = CD > ATK% > HP% >= EM": crit matters more than the table had; HP% kept for her skill scaling.
- **Kaeya**: ATK_PERCENT 0.6 -> 0.8. KQM "ER (until requirement) > ATK% > CD > CR", Game8 "CD > ATK% > CR".
- **Noelle**: ATK_PERCENT 0 -> 0.5. KQM and Game8 both list ATK% after DEF% and crit.
- **Venti**: ATK_PERCENT 0.6 -> 0.7, CRIT_RATE 0.8 -> 0.7, CRIT_DMG 0.8 -> 0.5. KQM "ER (until sufficient) > EM > ATK% = CR > CD": CD below ATK% and CR.
- **Yaoyao**: CRIT_RATE 0 -> 0.3, ENERGY_RECHARGE 0.7 -> 0.9, HEALING_BONUS 0.6 -> 0.5. KQM "ER > CR (Favonius) > HP% > flat HP / EM", Game8 agrees on ER first.
- **Yun Jin**: CRIT_RATE 0 -> 0.4. KQM "ER = DEF% = CR > flat DEF", Game8 lists CR: Favonius trigger.
- **Zhongli**: HP_PERCENT 0.9 -> 1.0, CRIT_RATE 1 -> 0.6, CRIT_DMG 1 -> 0.6, ATK_PERCENT 0.5 -> 0.3. KQM "HP% / flat HP > CR (Favonius)", Game8 "HP% > flat HP > ER": the table scored him as a crit carry.

## Reviewed and left alone

- Game8 orders ATK% above CRIT for many carries (Skirk, Tartaglia, Razor, Yanfei, Flins, Durin) and lists ER above ATK% for others; Prydwen and KQM disagree, and a CRIT-first weighting is the mainstream build, so those flags were not acted on.
- Game8 lists CRIT Rate for Favonius holders (Diona, Gorou, Dori, Sucrose, Kirara); that is weapon-specific, so no change.
- Kachina keeps DEF% above crit (her kit scales with DEF); Game8 puts crit first.
- Jahoda, Aino, Prune and Ororon have only a Game8 listing with no corroboration; left unchanged pending a Prydwen or KQM guide.
- Albedo, Alhaitham, Ayaka, Ganyu, Xiangling, Yelan, Yoimiya, Yae Miko, Raiden: the flags are ordering noise between stats the table already weights highly.
