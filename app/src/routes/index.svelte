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
				diagrams = diagrams.map(d => ({
					...d,
					imageUrl: compress(d.data)
				}))
			};
			reader.readAsText(filePath.target.files[0]);
		} else {
			return false;
		}
		return true;
	}
</script>

<h1>Pretvornik PowerDesigner v PlantUML notacijo</h1>
<h3>Podprti modeli:</h3>
<ul>
	<li>Konceptualni model (.cdm datoteke)</li>
	<li>Use case diagram (.oom datoteke)</li>
	<li>Fizični & logični diagram (.pdm datoteke)</li>
	<li>Razredni diagram (.oom datoteke)</li>
</ul>
<p>Izberite PowerDesigner datoteko, ki jo želite pretvoriti v PlantUML notacijo.</p>
<input type="file" on:change={readText} accept=".cdm,.oom,.pdm" />

{#each diagrams as { data, diagram, imageUrl }}
	<div style="border-bottom: 1px solid black;">
		<p><b>{diagram.name}</b> - {diagram.type} diagram</p>
		<pre class="puml-notation">{data}</pre>
		<div class="text-center">
			<img class="puml-diagram" src={imageUrl} alt="PlantUML Diagram" />
		</div>
	</div>
{/each}

<style>
	.text-center {
		text-align: center;
	}

	.puml-diagram {
		max-width: 100%;
	}

	.puml-notation {
		background-color: #eeeeee;
		border-radius: 3px;
		padding: 1rem;
		box-shadow: 3px 5px 8px 0 #e5e5e5;
	}
</style>
