/** Replace `{key}` placeholders in a template string with values from the given object. */
export function interpolate(template: string, values: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match));
}
