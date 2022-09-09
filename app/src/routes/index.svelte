<script lang="ts">
	import { parse } from '$lib/DiagramParser/Class';

	import { PDParser } from '$lib/PDParser';

	import DiagramItem from '../components/DiagramItem.svelte';
	import Parser, { getDiagramList, parseDiagram } from '../lib/index';

	let diagrams: any[] = [];
	let pdModel: any;
	let parser: PDParser;
	let diagramList: any[] = [];

	function parseFile(file) {
		let reader: FileReader = new FileReader();
		reader.onload = function (e) {
			let output = e.target?.result;
			parser = new PDParser(output.toString());
			// diagramList = parser.DiagramList;
			// pdModel = parser.PDModel;
			let { model, list } = getDiagramList(output);
			diagramList = list;
			pdModel = model;
		};
		reader.readAsText(file);
	}

	function readText(filePath: any) {
		diagrams = [];
		// @ts-ignore
		document.getElementById('form')?.reset?.();
		if (filePath.target?.files && filePath.target?.files[0]) {
			parseFile(filePath.target.files[0]);
		}
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

	function savePUML() {
		let fileData = diagrams[0].data;
		let name = parser.getDiagramName();
		download(fileData, `${name}.txt`, 'text/plain');
	}

	// Function to download data to a file
	function download(data, filename, type) {
		var file = new Blob([data], { type: type });
		// @ts-ignore
		if (window.navigator.msSaveOrOpenBlob) {
			// @ts-ignore // IE10+
			window.navigator.msSaveOrOpenBlob(file, filename);
		} else {
			// Others
			var a = document.createElement('a'),
				url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			setTimeout(function () {
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			}, 0);
		}
	}

	function dropHandler(ev) {
		ev.preventDefault();
		dropzoneActive(false);

		if (ev.dataTransfer.items) {
			// Use DataTransferItemList interface to access the file(s)
			let item = [...ev.dataTransfer.items][0];
			// If dropped items aren't files, reject them
			if (item.kind === 'file') {
				const file = item.getAsFile();
				let type = getFileExtension(file.name);
				if (!['oom', 'cdm', 'pdm'].includes(type)) return;
				parseFile(file);
			}
		}
	}

	function getFileExtension(filename) {
		return filename.split('.').pop();
	}

	function dragOverHandler(ev) {
		ev.preventDefault();
	}

	function dropzoneActive(active) {
		let dropzone = document.getElementById('file-upload');
		if (active) dropzone.style.backgroundColor = '#e2f6ff';
		else dropzone.style.backgroundColor = 'unset';
	}
</script>

<div class="container">
	<nav>
		<h1>PowerDesigner v PlantUML pretvornik</h1>
	</nav>

	<!-- <p>Izberite PowerDesigner datoteko, ki jo želite pretvoriti v PlantUML notacijo.</p> -->
	<div class="flex">
		<div>
			<h3>Podprti modeli:</h3>
			<ul>
				<li>Konceptualni model (.cdm datoteke)</li>
				<li>Fizični & logični diagram (.pdm datoteke)</li>
				<li>Use case diagram (.oom datoteke)</li>
				<li>Razredni diagram (.oom datoteke)</li>
				<li>Diagram zaporedja (.oom datoteke)</li>
			</ul>
		</div>
		<div style="flex: 1;">
			<label
				id="file-upload"
				for="file"
				on:drop={dropHandler}
				on:dragover={dragOverHandler}
				on:dragenter={() => dropzoneActive(true)}
				on:dragleave={() => dropzoneActive(false)}
			>
				<span class="btn">Naloži datoteko</span>
				<span>ali jo odloži tukaj</span>
				<input id="file" type="file" on:change={readText} accept=".cdm,.oom,.pdm" />
			</label>
		</div>
		<div class="info">
			<div>
				<h4>Izberite diagram za pretvorbo</h4>
				{#if diagramList.length}
					<form id="form" on:submit={handleSubmit}>
						{#each diagramList as diagram}
							<DiagramItem {diagram} />
						{/each}
						<div class="form-actions">
							<input type="submit" value="Pretvori" />
							{#if diagrams.length}
								<button on:click={savePUML}>Shrani</button>
							{/if}
						</div>
					</form>
					{#each diagrams as { imageUrl }}
						<h4>
							<a target="_blank" href={`http://www.plantuml.com/plantuml/png/${imageUrl}`}>PNG</a>
							<a target="_blank" href={`http://www.plantuml.com/plantuml/svg/${imageUrl}`}>SVG</a>
							<a target="_blank" href={`http://www.plantuml.com/plantuml/txt/${imageUrl}`}>ASCII Art</a>
						</h4>
					{/each}
				{:else}
					<p style="padding: .5rem 0; opacity: .8;">Ni diagramov za pretvorbo</p>
				{/if}
			</div>
		</div>
	</div>

	<hr />

	<div>
		{#each diagrams as { data, diagram, imageUrl }}
			<div>
				<div class="text-center">
					<img
						class="puml-diagram"
						src={`http://www.plantuml.com/plantuml/img/${imageUrl}`}
						alt="PlantUML Diagram"
					/>
				</div>
				<pre class="puml-notation">{data}</pre>
			</div>
		{/each}
	</div>
</div>

<style>
	.flex {
		display: flex;
		gap: 2rem;
		margin: 2rem 0;
	}

	.info {
		min-width: 370px;
	}

	form {
		margin: 0.5rem 0 1rem;
	}

	input[type='submit'],
	.form-actions button {
		background-color: #278fe3;
		border-radius: 3px;
		border: none;
		padding: 0.5rem 1.5rem;
		color: white;
		font-weight: 600;
		font-size: 1rem;
		margin-top: 5px;
	}

	input[type='submit']:hover,
	.form-actions button:hover {
		background-color: #1e7cc7 !important;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
	}

	.text-center {
		text-align: center;
	}

	.puml-diagram {
		max-width: calc(100% - 10px);
		background: white;
		border-radius: 3px;
		box-shadow: 3px 5px 10px 2px #dddddd;
		padding: 5px;
	}

	.puml-notation {
		background-color: #eeeeee;
		border-radius: 3px;
		padding: 1rem;
		box-shadow: 3px 5px 8px 0 #e5e5e5;
		margin-top: 0.5rem;
	}

	.container {
		padding: 0 2rem;
		background-color: whitesmoke;
		min-height: 100vh;
	}

	nav {
		margin: 0 -2rem;
		background-color: white;
		padding: 1rem 2rem;
		box-shadow: 0px 2px 15px 10px #f3f3f3;
	}

	#file-upload {
		position: relative;
		border: 3px dashed #278fe3;
		border-radius: 5px;
		display: flex;
		flex-direction: column;
		height: 100%;
		align-items: center;
		justify-content: center;
		max-height: 112px;
	}

	#file-upload span.btn {
		background-color: #278fe3;
		border-radius: 3px;
		border: none;
		padding: 0.5rem 1.5rem;
		color: white;
		font-weight: 600;
		font-size: 1rem;
		margin-bottom: 5px;
	}

	#file-upload .btn:hover {
		background-color: #1e7cc7 !important;
		cursor: pointer;
	}

	#file-upload span {
		color: #9e9e9e;
		font-size: 0.875rem;
	}

	#file-upload input {
		position: absolute;
		left: -200vw;
	}

	hr {
		border: none;
		border-bottom: 1px solid #cbcbcb;
		margin-bottom: 2rem;
	}
</style>
