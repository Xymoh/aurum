import { useMemo, type ReactNode } from "react";
import { AccountContext } from "./context";

/** Names the account every card rendered underneath is stamped with. */
export function ShareCardProvider({
  uid,
  playerName,
  children,
}: {
  uid: string;
  playerName: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ uid, playerName }), [uid, playerName]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
