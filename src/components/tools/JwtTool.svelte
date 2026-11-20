<script lang="ts">
  import { decodeJwt, describeClaims, type ClaimInfo } from "@/lib/tools/jwt";
  import CopyButton from "./CopyButton.svelte";

  let token = $state("");

  type View =
    | {
        ok: true;
        headerJson: string;
        payloadJson: string;
        claims: ClaimInfo[];
        expiry: "none" | "valid" | "expired";
      }
    | { ok: false; error: string }
    | null;

  const view: View = $derived.by(() => {
    if (token.trim() === "") return null;
    try {
      const decoded = decodeJwt(token);
      const { claims, expiry } = describeClaims(decoded.payload);
      return {
        ok: true as const,
        headerJson: JSON.stringify(decoded.header, null, 2),
        payloadJson: JSON.stringify(decoded.payload, null, 2),
        claims,
        expiry,
      };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
</script>

<div class="flex flex-col gap-5">
  <p class="font-mono text-xs text-faint">
    <span class="text-fg" aria-hidden="true">#</span> decoding ≠ verification — the
    signature is NOT checked
  </p>

  <div class="flex flex-col gap-2">
    <label for="jwt-input" class="font-mono text-xs text-faint">token</label>
    <textarea
      id="jwt-input"
      bind:value={token}
      placeholder="paste a JWT… (header.payload.signature)"
      spellcheck="false"
      class="min-h-28 w-full resize-y border border-line bg-raised p-3 font-mono text-sm break-all text-fg placeholder:text-faint"
    ></textarea>
  </div>

  {#if view === null}
    <p class="font-mono text-xs text-faint">paste a token to decode it</p>
  {:else if !view.ok}
    <p aria-live="polite" class="font-mono text-xs text-fg">{view.error}</p>
  {:else}
    {#if view.expiry === "expired"}
      <p class="border border-fg bg-mark px-3 py-2 font-mono text-xs text-fg">
        token is EXPIRED
      </p>
    {:else if view.expiry === "valid"}
      <p class="font-mono text-xs text-muted">exp is in the future</p>
    {/if}

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h2 class="font-mono text-xs text-faint">header</h2>
          <CopyButton text={view.headerJson} />
        </div>
        <pre
          class="overflow-x-auto border border-line bg-raised p-3 font-mono text-sm text-fg">{view.headerJson}</pre>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h2 class="font-mono text-xs text-faint">payload</h2>
          <CopyButton text={view.payloadJson} />
        </div>
        <pre
          class="overflow-x-auto border border-line bg-raised p-3 font-mono text-sm text-fg">{view.payloadJson}</pre>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <h2 class="font-mono text-xs text-faint">claims</h2>
      <div class="overflow-x-auto border border-line">
        <table class="w-full font-mono text-sm">
          <thead>
            <tr class="border-b border-line text-left text-xs text-faint">
              <th class="px-3 py-2 font-normal">claim</th>
              <th class="px-3 py-2 font-normal">value</th>
              <th class="px-3 py-2 font-normal">meaning</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            {#each view.claims as claim (claim.key)}
              <tr>
                <td class="px-3 py-2 align-top">
                  <span class="text-fg">
                    {claim.key}
                  </span>
                </td>
                <td class="px-3 py-2 align-top break-all text-muted">
                  {JSON.stringify(claim.value)}
                </td>
                <td class="px-3 py-2 align-top text-faint">
                  {claim.meaning ?? ""}{claim.date ? ` — ${claim.date}` : ""}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
