import { useParams } from "react-router-dom";
import { useState } from "react";
import { useShowcase } from "../hooks/useShowcase";
import { PlayerHeader } from "../components/showcase/PlayerHeader";
import { CharacterGrid, type FocusSignal } from "../components/showcase/CharacterGrid";
import { WeakestArtifacts } from "../components/showcase/WeakestArtifacts";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { WarningIcon } from "../components/ui/icons";
import { useI18n } from "../i18n";

export function ShowcasePage() {
  const { uid } = useParams<{ uid: string }>();
  const { data, isLoading, isError, error, refetch, forceRefresh, dataUpdatedAt } = useShowcase(uid ?? "");
  const [focusSignal, setFocusSignal] = useState<FocusSignal | null>(null);
  const { t } = useI18n();

  const characters = data?.characters ?? [];

  if (!uid) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-dark-muted text-lg">{t("errors", "noUid")}</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !data) {
    const errorMessage =
      error instanceof Error ? error.message : t("errors", "generic");

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="rounded-full bg-red-500/10 p-4">
          <WarningIcon className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-dark-text text-xl font-semibold">{t("errors", "title")}</h2>
        <p className="text-dark-muted text-center max-w-md">{errorMessage}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-accent px-6 py-2 text-dark-bg font-medium hover:opacity-90 transition-opacity"
        >
          {t("errors", "tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PlayerHeader
        uid={uid}
        playerInfo={data.playerInfo}
        characterCount={characters.length}
        onRefresh={() => forceRefresh()}
        lastUpdated={dataUpdatedAt}
      />

      <WeakestArtifacts
        characters={characters}
        onSelectCharacter={(characterId) => setFocusSignal({ characterId, token: Date.now() })}
      />

      {/* Character Grid - dak.gg-style card layout with Fribbels scoring */}
      <CharacterGrid characters={characters} focusSignal={focusSignal} />
    </div>
  );
}
