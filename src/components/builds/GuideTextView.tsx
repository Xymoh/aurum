import { splitEmphasis } from "../../lib/buildTarget/guideText";
import type { GuideText } from "../../lib/buildTarget/guide";
import type { BuildSkin } from "./skin";

/**
 * Game text as the scripts flattened it: line breaks kept, highlighted spans
 * in the accent colour. Rendered as text nodes only, so nothing in the data
 * can become markup.
 */
export function GuideTextView({ text, skin, className = "" }: { text: GuideText; skin: BuildSkin; className?: string }) {
  return (
    <p className={`whitespace-pre-line text-sm leading-relaxed ${skin.muted} ${className}`}>
      {splitEmphasis(text).map((run, i) =>
        run.strong ? (
          <strong key={i} className={`font-semibold ${skin.accent}`}>
            {run.text}
          </strong>
        ) : (
          <span key={i}>{run.text}</span>
        ),
      )}
    </p>
  );
}
