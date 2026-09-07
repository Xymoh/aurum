import { createContext, useContext, useMemo } from "react";
import { useI18n } from "../../i18n";
import type { ShareContext } from "./model";

/**
 * Who the showcase belongs to, so a card can be stamped with it.
 *
 * A context rather than props: the account is known at the page, the button
 * is drawn deep inside each character panel, and every layer between them
 * (grids, panels, headers) would otherwise have to carry two fields it has
 * no use for.
 *
 * Split from the provider the same way the i18n module is, so neither file
 * mixes a component with the values around it.
 */
export const AccountContext = createContext<{ uid: string; playerName: string } | null>(null);

/**
 * Null outside a showcase, where there is no account to stamp a card with.
 * Callers hide the button rather than rendering one that cannot work.
 */
export function useShareContext(): ShareContext | null {
  const account = useContext(AccountContext);
  const { t } = useI18n();
  return useMemo(() => (account ? { ...account, t } : null), [account, t]);
}
