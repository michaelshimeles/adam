<script lang="ts" module>
	import { cn, type WithElementRef } from "../../utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	/**
	 * Geist buttons: 6px radius, button-14 type, 32/40/48px heights.
	 * default → Geist primary · outline → Geist secondary · ghost → tertiary ·
	 * destructive → Geist error (solid red-800). Focus ring comes from the
	 * global two-layer :focus-visible shadow in theme.css.
	 */
	export const buttonVariants = tv({
		base: "aria-invalid:border-destructive rounded-md border border-transparent bg-clip-padding text-sm font-medium group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-colors duration-150 outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700 disabled:border-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
				outline: "border-border bg-background text-foreground hover:bg-gray-100 hover:border-alpha-500 active:bg-gray-200 aria-expanded:bg-gray-100",
				secondary: "bg-gray-100 text-foreground hover:bg-gray-200 active:bg-gray-300 aria-expanded:bg-gray-200",
				ghost: "text-foreground hover:bg-alpha-200 active:bg-alpha-300 aria-expanded:bg-alpha-200",
				destructive: "bg-destructive text-white hover:bg-red-700 active:bg-red-600",
				link: "text-blue-900 underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 gap-2 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				xs: "h-6 gap-1 px-1.5 text-xs [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1.5 px-1.5 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-12 gap-2 px-3.5 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
				icon: "size-10",
				"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
				"icon-lg": "size-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
