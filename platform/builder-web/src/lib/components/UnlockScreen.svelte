<script lang="ts">
  import { Button } from "ui/components/button";
  import { Input } from "ui/components/input";
  import { Label } from "ui/components/label";

  let {
    hadSecret,
    onSubmit,
  }: {
    /** True when a stored secret was rejected (vs. none entered yet). */
    hadSecret: boolean;
    onSubmit: (secret: string) => void;
  } = $props();

  let value = $state("");

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (value.trim()) onSubmit(value);
  }
</script>

<div class="flex min-h-0 flex-1 items-center justify-center px-4">
  <form onsubmit={submit} class="flex w-full max-w-sm flex-col gap-4">
    <div class="flex flex-col gap-1.5">
      <p class="m-0 font-mono text-[11px] font-medium tracking-[0.12em] text-gray-600 uppercase">
        access required
      </p>
      <h1 class="m-0 text-base leading-6 font-semibold tracking-[-0.32px] text-gray-1000">
        This builder is locked
      </h1>
      <p class="m-0 text-sm leading-5 text-muted-foreground">
        The deployment has <code class="font-mono text-xs">BUILDER_DASHBOARD_SECRET</code> set.
        Enter it to manage agents.
      </p>
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="dashboard-secret">Dashboard secret</Label>
      <Input
        id="dashboard-secret"
        bind:value
        type="password"
        class="font-mono"
        autocomplete="off"
        placeholder="••••••••"
      />
      {#if hadSecret}
        <p class="m-0 text-xs leading-4 text-red-900">
          The saved secret was rejected — it may have been rotated.
        </p>
      {/if}
    </div>
    <Button type="submit" disabled={!value.trim()}>Unlock</Button>
  </form>
</div>
