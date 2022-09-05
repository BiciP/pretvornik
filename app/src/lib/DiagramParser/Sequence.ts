import { getCollectionAsArray, getObjectRef, getPosition, parseArrowStyle } from '$lib/helpers';
import type { PDMessage } from '$lib/PDTypes/Sequence/PDMessage';
import type {
	ActivationSymbol,
	ActorSequenceSymbol,
	MessageSymbol,
	SequenceDiagram,
	UMLObjectSequenceSymbol
} from '$lib/PDTypes/Sequence/SequenceDiagram';

// point 1 = bottom left
// point 2 = top right

export function parseSequenceDiagram(diagram: SequenceDiagram, PDObjects: object) {
	let puml = `@startuml ${diagram['a:Name']}\n\n`;
	let symbols = {};
	let activations = {};

	const getSymbolActivations = (symbol, parent) => {
		let act: ActivationSymbol[] = getCollectionAsArray(
			symbol?.['c:SlaveSubSymbols']?.['o:ActivationSymbol']
		);
		act.forEach((act) => {
			activations[act['@_Id']] = { last: null, active: false, parent };
		});
	};

	let actors = diagram?.['c:Symbols']?.['o:ActorSequenceSymbol'];
	let arr: ActorSequenceSymbol[] = getCollectionAsArray(actors);
	arr.forEach((item) => {
		let ref = item['c:Object']['o:Actor']?.['@_Ref'] || item['c:Object']['o:Shortcut']?.['@_Ref'];
		symbols[item['@_Id']] = ref;
		getSymbolActivations(item, ref);

		let def = PDObjects['o:Actor'][ref];
		if (!def) return;
		puml += def;
	});

	let objects = diagram?.['c:Symbols']?.['o:UMLObjectSequenceSymbol'];
	let objSymbols: UMLObjectSequenceSymbol[] = getCollectionAsArray(objects);
	objSymbols.forEach((obj) => {
		let ref = obj['c:Object']['o:UMLObject']?.['@_Ref'] || obj['c:Object']['o:Shortcut']?.['@_Ref'];
		symbols[obj['@_Id']] = ref;
		getSymbolActivations(obj, ref);

		let def = PDObjects['o:UMLObject']?.[ref];
		if (!def) return;
		puml += def;
	});

	let msgs = diagram?.['c:Symbols']?.['o:MessageSymbol'];
	let MessageSymbols: MessageSymbol[] = getCollectionAsArray(msgs);
	// sort messages
	MessageSymbols = MessageSymbols.map((msg) => {
		let pos = getPosition(msg['a:Rect']);
		return {
			...msg,
			...pos
		};
	}).sort((a, b) => b.y - a.y);

	// mark the first and last message for activation
	MessageSymbols.forEach((msg) => {
		let key = 'o:ActivationSymbol';
		let act1 = msg?.['c:SourceSymbol']?.[key]?.['@_Ref'];
		let act2 = msg?.['c:DestinationSymbol']?.[key]?.['@_Ref'];

		if (act1) activations[act1].last = msg['@_Id'];
		if (act2) activations[act2].last = msg['@_Id'];
	});

	MessageSymbols.forEach((msg) => {
		let ref = msg['c:Object']['o:Message']?.['@_Ref'] || msg['c:Object']['o:Shortcut']?.['@_Ref']
		let {def, obj1, obj2} = PDObjects['o:Message'][ref];
		if (!def) return;

		let obj1Ref = getObjectRef(msg['c:SourceSymbol']);
		let obj2Ref = getObjectRef(msg['c:DestinationSymbol']);

        let act1 = activations[obj1Ref]
        let act2 = activations[obj2Ref]

		let type = getTypeFromDef(def);

		if (type === 'C' && obj1Ref !== obj2Ref && obj1 === obj2) {
			def = def.replace('++', '--++');
		}

        if (type === 'R' && obj1Ref === obj2Ref) {
            def = def.replace(' --', '')
        }

		puml += def;

		if (act1?.last === msg['@_Id']) puml += `deactivate ${act1.parent}\n`;
		if (act2?.last === msg['@_Id']) puml += `deactivate ${act2.parent}\n`;
	});

	puml += `\n@enduml`;

	return {
		diagram: {
			id: diagram['@_Id'],
			name: diagram['a:Name'],
			type: 'Sequence'
		},
		data: puml
	};
}

export function parseMessages(messages: PDMessage[]) {
	let obj = {};

	messages.forEach((msg) => {
		let obj1 = getObjectRef(msg['c:Object1']);
		let obj2 = getObjectRef(msg['c:Object2']);
		let arrow = msg['a:ControlFlow'] === 'R' ? '-->' : msg['a:ControlFlow'] === 'C' ? '->' : '->>';
		let init = '';
		if (msg['a:ControlFlow'] === 'C') {
			init = ' ++';
		} else if (msg['a:ControlFlow'] === 'R') {
			init = ' --';
		}

		obj[msg['@_Id']] = {
			def: `${obj2} ${arrow} ${obj1}${init} : ${msg['a:Name']}\n`,
			obj1, obj2
		};

		// obj[msg['@_Id']] = msg;
	});

	return obj;
}

export function parseModelObjects(ModelObjects: any[]) {
	let obj = {};
	ModelObjects.forEach(
		(item) => (obj[item['@_Id']] = `participant "${item['a:Name']}" as ${item['@_Id']}\n`)
	);
	return obj;
}

// helpers

function getTypeFromDef(def: string) {
	if (def.includes('-->')) return 'R';
	if (def.includes('->')) return 'C';
	return null;
}
