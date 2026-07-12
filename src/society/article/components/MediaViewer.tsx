
import { MediaViewerRoot } from "./media-viewer/MediaViewerRoot";
import { getMediaTakenTimeLabel } from "./media-viewer/metadata";
import type { MediaViewerProps } from "./media-viewer/types";

export type { MediaViewerProps };
export { getMediaTakenTimeLabel };

export function MediaViewer(props: MediaViewerProps) {
	return <MediaViewerRoot {...props} />;
}
