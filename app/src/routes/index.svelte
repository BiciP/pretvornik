<script lang="ts">
	import { parse } from '$lib/DiagramParser/Class';

	import { PDParser } from '$lib/PDParser';

	import DiagramItem from '../components/DiagramItem.svelte';
	import Parser, { getDiagramList, parseDiagram } from '../lib/index';

	let diagrams: any[] = [];
	let pdModel: any;
	let parser: PDParser;
	let diagramList: any[] = [];

	function readText(filePath: any) {
		diagrams = [];
		let reader: FileReader = new FileReader();
		var output: string | ArrayBuffer | undefined | null = '';
		if (filePath.target?.files && filePath.target?.files[0] && reader) {
			reader.onload = function (e) {
				output = e.target?.result;
				parser = new PDParser(output.toString());
				// diagramList = parser.DiagramList;
				// pdModel = parser.PDModel;
				let { model, list } = getDiagramList(output);
				diagramList = list;
				pdModel = model;
			};
			reader.readAsText(filePath.target.files[0]);
		} else {
			return false;
		}
		return true;
	}

	function findDiagram(list, id) {
		let found;
		list.forEach((item) => {
			if (item['a:ObjectID'] === id) found = item;
			if (item.children) {
				let deepFound = findDiagram(item.children, id);
				if (deepFound) found = deepFound;
			}
		});
		return found;
	}

	function handleSubmit(e) {
		e.preventDefault();

		let form = new FormData(e.target);
		let diagramId = form.get('diagram');

		if (!diagramId) return;
		let model = parser.parseDiagram(diagramId.toString());

		diagrams = [
			{
				data: model,
				imageUrl: compress(model)
			}
		];
	}
</script>

<h1>Pretvornik PowerDesigner v PlantUML notacijo</h1>
<h3>Podprti modeli:</h3>
<ul>
	<li>Konceptualni model (.cdm datoteke)</li>
	<li>Use case diagram (.oom datoteke)</li>
	<li>Fizični & logični diagram (.pdm datoteke)</li>
	<li>Razredni diagram (.oom datoteke)</li>
	<li>Diagram zaporedja (.oom datoteke)</li>
</ul>
<p>Izberite PowerDesigner datoteko, ki jo želite pretvoriti v PlantUML notacijo.</p>
<input type="file" on:change={readText} accept=".cdm,.oom,.pdm" />

{#if diagramList.length}
	<form on:submit={handleSubmit}>
		{#each diagramList as diagram}
			<DiagramItem {diagram} />
		{/each}
		<input type="submit" />
	</form>
{/if}

{#each diagrams as { data, diagram, imageUrl }}
	<div style="border-bottom: 1px solid black;">
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
