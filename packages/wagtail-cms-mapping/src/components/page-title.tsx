import { generateRichText } from "../utils/generate-rich-text";

export type PageTitleProps = {
	title: string;
	lead?: string;
	richLead?: string;
};

export function PageTitle({ title, lead, richLead }: PageTitleProps) {
	return (
		<>
			<h1 className="hse-u-margin-bottom-6">{title}</h1>
			{lead && (
				<div className="hse-lede-text">
					<p>{generateRichText(lead)}</p>
				</div>
			)}
			{richLead && <div className="hse-lede-text">{generateRichText(richLead)}</div>}
		</>
	);
}
