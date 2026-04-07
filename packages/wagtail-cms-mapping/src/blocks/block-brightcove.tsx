import type { BlockComponentProps } from "../types/index";

/** Block value shape for Brightcove video embeds. */
type BrightcoveValue = {
	video_id: string;
	account_id: string;
	player_slug: string;
	video_title: string;
	display_video_title: boolean;
	video_description: string;
};

/**
 * Renders a Brightcove video player embed via iframe.
 *
 * Optionally displays the video title and description above the player.
 */
export function BlockBrightcove({
	value,
}: BlockComponentProps<BrightcoveValue>) {
	return (
		<div className="hse-video">
			{value.display_video_title && <h4>{value.video_title}</h4>}
			<p>{value.video_description}</p>
			<div className="embed-responsive">
				<iframe
					title="brightcove-player"
					src={`https://players.brightcove.net/${value.account_id}/default_default/index.html?videoId=${value.video_id}`}
					allow="encrypted-media"
					allowFullScreen
					style={{
						position: "absolute",
						top: "0px",
						right: "0px",
						bottom: "0px",
						left: "0px",
						width: "100%",
						height: "100%",
					}}
				/>
			</div>
		</div>
	);
}
