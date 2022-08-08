<script lang="ts">
	import Parser from '../lib/index'

	let diagrams: any[] = [];

	function readText(filePath: any) {
		let reader: FileReader = new FileReader()
		var output: string | ArrayBuffer | undefined | null = '';
		if (filePath.target?.files && filePath.target?.files[0] && reader) {
			reader.onload = function (e) {
				output = e.target?.result;
				let data = Parser(output);
				diagrams = [...data.model];
				data.model.forEach(model => diagrams.push(model))
			};
			reader.readAsText(filePath.target.files[0]);
		} else {
			return false;
		}
		return true;
	}
</script>

<h1>Pretvornik PowerDesigner v PlantUML notacijo</h1>
<h3>Trenutno podprti modeli</h3>
<ul>
	<li>Konceptualni model (.cdm datoteke)</li>
</ul>
<p>Izberite PowerDesigner datoteko, ki jo želite pretvoriti v PlantUML notacijo.</p>
<input type="file" on:change={readText} accept=".cdm" />

{#each diagrams as { data, diagram }}
	<div style="border-bottom: 1px solid black;">
		<p><b>{diagram.name}</b> - {diagram.type} diagram</p>
		<pre class="puml-notation">{data}</pre>
	</div>
{/each}

<style>
	.puml-notation {
		background-color: #eeeeee;
		border-radius: 3px;
		padding: 1rem;
		box-shadow: 3px 5px 8px 0 #e5e5e5;
	}
</style>
