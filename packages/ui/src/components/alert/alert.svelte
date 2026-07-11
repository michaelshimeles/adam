<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	/** Geist status surfaces: 100 bg / 400 border / 900 text per scale. */
	export const alertVariants = tv({
		base: "grid gap-0.5 rounded-md border px-3 py-2.5 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4 group/alert relative w-full",
		variants: {
			variant: {
				default: "bg-background border-border text-foreground",
				destructive: "bg-red-100 border-red-400 text-red-900 *:data-[slot=alert-description]:text-red-900/90 *:[svg]:text-current",
				warning: "bg-amber-100 border-amber-400 text-amber-900 *:data-[slot=alert-description]:text-amber-900/90 *:[svg]:text-current",
				success: "bg-green-100 border-green-400 text-green-900 *:data-[slot=alert-description]:text-green-900/90 *:[svg]:text-current",
				info: "bg-blue-100 border-blue-400 text-blue-900 *:data-[slot=alert-description]:text-blue-900/90 *:[svg]:text-current",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "../../utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert"
	role="alert"
	class={cn(alertVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
