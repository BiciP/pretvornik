<script lang="ts">
	import { onMount } from 'svelte';

	import Parser from '../../../src/index';

	let reader: FileReader | undefined;

	onMount(() => {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
			reader = new FileReader();
			return true;
		} else {
			alert('The File APIs are not fully supported by your browser. Fallback required.');
			return false;
		}
	});

	function readText(filePath: any) {
		var output: string | ArrayBuffer | undefined | null = '';
		if (filePath.target?.files && filePath.target?.files[0] && reader) {
			reader.onload = function (e) {
				output = e.target?.result;
				console.log(Parser(output))
			};
			reader.readAsText(filePath.target.files[0]);
		} else {
            alert("Lol fuck off")
			return false;
		}
		return true;
	}
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<input type="file" on:change={readText} />
