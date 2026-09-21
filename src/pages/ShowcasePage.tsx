import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { diffShowcase, readSnapshot, saveSnapshot } from "../lib/history";
import { downloadGood } from "../lib/export/good";
import { useShowcase } from "../hooks/useShowcase";
import { ShareCardProvider } from "../lib/shareCard/ShareCardProvider";
import { PlayerHeader } from "../components/showcase/PlayerHeader";
import { CharacterGrid, type FocusSignal } from "../components/showcase/CharacterGrid";
import { WeakestArtifacts } from "../components/showcase/WeakestArtifacts";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { WarningIcon } from "../components/ui/icons";
import { useI18n } from "../i18n";
import { isValidUid } from "../lib/uid";
import { errorCode } from "../lib/showcaseError";
import { getGrade } from "../lib/scoring";

export function ShowcasePage() {
  const { uid } = useParams<{ uid: string }>();
  const { data, isLoading, isError, isFetching, error, refetch, forceRefresh, dataUpdatedAt, freshUntil } =
    useShowcase(uid ?? "");
  const [focusSignal, setFocusSignal] = useState<FocusSignal | null>(null);
  const { t } = useI18n();

  const characters = data?.characters ?? [];

  // What this browser saw last time, read once per UID before it is
  // overwritten, so every card can say how its build moved since.
  const previous = useMemo(() => (uid ? readSnapshot(uid) : null), [uid]);
  const deltas = useMemo(() => (data ? diffShowcase(previous, data) : undefined), [previous, data]);
  useEffect(() => {
    if (uid && data) saveSnapshot(uid, data);
  }, [uid, data]);

  if (!uid) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-dark-muted text-lg">{t("errors", "noUid")}</p>
      </div>
    );
  }

  // A UID Enka could never answer is refused before any request is made,
  // and says so instead of showing a generic failure with a retry that
  // cannot help.
  const invalid = !isValidUid(uid);

  if (isLoading && !invalid) {
    return <LoadingSkeleton />;
  }

  // Once a showcase has loaded it stays on screen; a failed refresh is a
  // banner on top of it, not a replacement for it.
  if (!data) {
    const message = invalid ? t("errors", "invalidUid") : t("errors", errorCode(error));

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="rounded-full bg-red-500/10 p-4">
          <WarningIcon className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-dark-text text-xl font-semibold">{t("errors", "title")}</h2>
        <p className="text-dark-muted text-center max-w-md">{message}</p>
        {invalid ? (
          <Link
            to="/genshin"
            className="rounded-lg bg-accent px-6 py-2 text-dark-bg font-medium no-underline hover:opacity-90 transition-opacity"
          >
            {t("errors", "tryAnotherUid")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-accent px-6 py-2 text-dark-bg font-medium hover:opacity-90 transition-opacity"
          >
            {t("errors", "tryAgain")}
          </button>
        )}
      </div>
    );
  }

  // Only fully geared characters count toward the account mean, as on the
  // other two games: a half-built one would drag it down for gear the
  // player has not finished rather than gear that rolled badly.
  const scored = characters.filter((c) => c.buildScore.complete);
  const accountScore = scored.length > 0 ? scored.reduce((sum, c) => sum + c.buildScore.total, 0) / scored.length : 0;
  const account = {
    score: accountScore,
    grade: getGrade(Math.round(accountScore)),
    scored: scored.length,
    total: characters.length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PlayerHeader
        uid={uid}
        playerInfo={data.playerInfo}
        characterCount={characters.length}
        onRefresh={forceRefresh}
        lastUpdated={dataUpdatedAt}
        isFetching={isFetching}
        freshUntil={freshUntil}
        account={account}
        onExport={() => downloadGood(data, uid)}
      />

      {isError && (
        <p
          role="status"
          className="rounded-lg border border-verdict-replace/30 bg-verdict-replace/10 px-4 py-2 text-sm text-dark-text"
        >
          {t("errors", "refreshFailed")} {t("errors", errorCode(error))}
        </p>
      )}

      <WeakestArtifacts
        characters={characters}
        onSelectCharacter={(characterId) => setFocusSignal({ characterId, token: Date.now() })}
      />

      {/* Character Grid - dak.gg-style card layout with Fribbels scoring */}
      <ShareCardProvider uid={uid} playerName={data.playerInfo.nickname}>
        <CharacterGrid characters={characters} focusSignal={focusSignal} deltas={deltas} />
      </ShareCardProvider>
    </div>
  );
}
