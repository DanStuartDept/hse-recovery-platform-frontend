import { Container } from "@hseireland/hse-frontend-react";
import { getDictionary } from "@repo/i18n";
import { i18nConfig } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { dictionaryLoaders } from "@/lib/i18n/loaders";

export default async function Home(props: PageProps<"/[lang]">) {
	const { lang } = await props.params;
	const dict = await getDictionary<Dictionary>(
		lang,
		dictionaryLoaders,
		i18nConfig.defaultLocale,
	);

	return (
		<Container>
			<h1>{dict.home.title}</h1>
		</Container>
	);
}
