import type { SVGProps } from 'react';
import {
  ArrowRight as LucideArrowRight,
  Plus as LucidePlus,
  Download as LucideDownload,
  Archive as LucideArchive,
  Menu as LucideMenu,
  X as LucideX,
  Pin as LucidePin,
  Grid2X2 as LucideGrid2X2,
  RefreshCw as LucideRefreshCw,
  Search as LucideSearch,
  Ellipsis as LucideEllipsis,
  FileText as LucideFileText,
  List as LucideList,
  type LucideIcon,
} from 'lucide-react';

/**
 * Showcase basic icons come from the Lucide base layer (direction decision 2026-10-14,
 * docs/design/icons/icon-review/2026-10-14-batch-02). They are wrapped to the family
 * grammar — 1em sizing, 1.75 stroke, currentColor. Decorative by default;
 * give the parent control an accessible name. BrandMark stays a custom glyph.
 */
type IconProps = SVGProps<SVGSVGElement>;

function wrap(C: LucideIcon) {
  return function WrappedIcon(p: IconProps) {
    return <C width="1em" height="1em" strokeWidth={1.75} aria-hidden="true" focusable="false" {...p} />;
  };
}

export const ArrowRight = wrap(LucideArrowRight);
export const Plus = wrap(LucidePlus);
export const Download = wrap(LucideDownload);
export const Archive = wrap(LucideArchive);
export const Menu = wrap(LucideMenu);
export const Close = wrap(LucideX);
export const Pin = wrap(LucidePin);
export const Grid = wrap(LucideGrid2X2);
export const Refresh = wrap(LucideRefreshCw);
export const Search = wrap(LucideSearch);
export const Ellipsis = wrap(LucideEllipsis);
export const FileText = wrap(LucideFileText);
export const List = wrap(LucideList);

/** Brand mark: an original stacked-aperture glyph, not a franchise logo. */
export const BrandMark = (p: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...p}
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
    <path d="M3.5 9.5h17M9.5 9.5v11M14.5 14.5h6" />
  </svg>
);
