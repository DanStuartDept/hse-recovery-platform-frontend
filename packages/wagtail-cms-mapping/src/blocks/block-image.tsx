import type { FieldTypeImage } from "@repo/wagtail-cms-types/fields";
import type { BlockComponentProps } from "../types/index";

export function BlockImage({ value }: BlockComponentProps<FieldTypeImage>) {
	return (
		<figure className="hse-image w-full">
			<picture>
				{value.max_screen_md && (
					<source type="image/webp" srcSet={value.max_screen_md.src} />
				)}
				<img
					src={value.src}
					alt={value.alt}
					className="hse-image__img"
					width={value.width}
					height={value.height}
				/>
			</picture>
		</figure>
	);
}
