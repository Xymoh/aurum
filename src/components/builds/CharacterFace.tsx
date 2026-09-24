import type { BuildListing } from "../../lib/buildTarget/model";
import { RemoteImg } from "../ui/RemoteImg";

interface CharacterFaceProps {
  listing: BuildListing | undefined;
  /** Width and height, e.g. "h-12 w-12". */
  size: string;
  /** A ring in this colour, for the page's own character. */
  ring?: string;
  /** More classes for the round face itself. */
  className?: string;
}

/**
 * A character's round face, with the badge that tells one of their builds
 * from the others (the Traveler's element, the Trailblazer's Path) in its
 * corner. The badge is sized as a share of the face, so it shrinks with it:
 * on the smallest faces, a team slot's alternates, it is the only thing that
 * says which build the link opens.
 */
export function CharacterFace({ listing, size, ring, className = "" }: CharacterFaceProps) {
  return (
    <span className={`relative block shrink-0 ${size}`}>
      <span
        className={`block h-full w-full overflow-hidden rounded-full bg-black/20 ${className}`}
        style={ring ? { boxShadow: `0 0 0 2px ${ring}` } : undefined}
      >
        {listing?.iconUrl ? (
          <RemoteImg src={listing.iconUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs opacity-60">?</span>
        )}
      </span>
      {listing?.badge && (
        <span className="absolute -bottom-[4%] -right-[4%] block h-[42%] min-h-2.5 w-[42%] min-w-2.5 rounded-full bg-black/75 p-[6%] ring-1 ring-black/30">
          <RemoteImg src={listing.badge.iconUrl} alt="" loading="lazy" className="h-full w-full object-contain" />
        </span>
      )}
    </span>
  );
}
