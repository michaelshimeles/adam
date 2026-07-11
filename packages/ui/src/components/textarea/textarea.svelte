<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "../../utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"border-input bg-background hover:border-alpha-500 aria-invalid:border-destructive resize-none rounded-md border px-3 py-2 text-sm transition-colors duration-150 placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700",
		className
	)}
	bind:value
	{...restProps}
></textarea>
