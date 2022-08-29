<script>
	export let diagram;
</script>

{#if diagram.type === 'o:Package'}
	<span>{diagram['a:Name']}</span>
{:else}
	<label>
		<input type="radio" value={diagram['a:ObjectID']} name="diagram" />
		{diagram['a:Name']}
	</label>
{/if}

<div style="padding-left: 1rem;">
	{#each diagram.children || [] as child}
		<svelte:self diagram={child} />
	{/each}
</div>
