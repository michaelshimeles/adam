<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	/**
	 * Geist pills: label-12 type, full radius, 100 bg / 400 border / 900 text
	 * per scale. Pass e.g. `class="border-green-400 bg-green-100 text-green-900"`
	 * on the outline variant for status colors.
	 */
	export const badgeVariants = tv({
		base: "h-5 gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-2.5! aria-invalid:border-destructive group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap transition-colors [&>svg]:pointer-events-none",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/90",
				secondary: "bg-gray-100 text-gray-1000 [a]:hover:bg-gray-200",
				destructive: "bg-red-100 border-red-400 text-red-900 [a]:hover:bg-red-200",
				outline: "border-border bg-transparent text-muted-foreground [a]:hover:bg-alpha-100",
				ghost: "text-muted-foreground hover:bg-alpha-100",
				link: "text-blue-900 underline-offset-4 hover:underline",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "../../utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
