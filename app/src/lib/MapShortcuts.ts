import { getCollectionAsArray } from './helpers';
import type { PDActor } from './PDTypes/PDActor';
import type { PDMessage } from './PDTypes/Sequence/PDMessage';
import type {
	PDActorShortcut,
	PDMessageShortcut,
	PDShortcutDefinition
} from './PDTypes/Sequence/PDMessageShortcut';

export function mapActorShortcuts(shortcuts: PDActorShortcut[], pdModel) {
	if (shortcuts.length) {
		let ActorObjectID = {};
		let model = pdModel.parent;
		while (model) {
			let arr = [
				...getCollectionAsArray(model['c:Actors']?.['o:Actor']),
				...getCollectionAsArray(model['c:Actors']?.['o:Shortcut'])
			];
			let actors: PDActor[] = arr;
			actors.forEach((actor) => (ActorObjectID[actor['a:ObjectID']] = actor));
			model = model.parent;
		}

		shortcuts = shortcuts.map((shortcut) => {
			let id = shortcut['@_Id'];
			shortcut = ActorObjectID[shortcut['a:TargetID']] || shortcut;
			if (!shortcut) {
				console.warn('Shortcut not found:', id);
			}
			shortcut['@_Id'] = id;
			return shortcut;
		});
	}
	return shortcuts;
}

export function mapShortcuts(
	shortcuts: PDShortcutDefinition[],
	pdModel: any,
	colType: string,
	objType: string
) {
	if (!shortcuts.length) return [];

	let ObjectID = {};
	let model = pdModel;
	while (model) {
		let defs = getCollectionAsArray(model[colType]?.[objType]);
		defs.forEach((def) => (ObjectID[def['a:ObjectID']] = def));
		model = model.parent;
	}

	shortcuts = shortcuts.map((cut) => {
		let def = ObjectID[cut['a:TargetID']];
		if (!def) {
			console.warn(`Shortcut not found: ${cut['@_Id']}`);
			return cut;
		}

		return {
			...def,
			...cut
		};
	});

	return shortcuts
}

export function mapMessageShortcuts(shortcuts: PDMessageShortcut[], pdModel) {
	if (shortcuts.length) {
		let MessageObjectID = {};
		let curModel = pdModel.parent;
		while (curModel) {
			let msgs: PDMessage[] = getCollectionAsArray(curModel['c:Messages']?.['o:Message']);
			msgs.forEach((msg) => (MessageObjectID[msg['a:ObjectID']] = msg));
			curModel = curModel.parent;
		}

		shortcuts = shortcuts.map((shortcut) => {
			let id = shortcut['@_Id'];
			shortcut = MessageObjectID[shortcut['a:TargetID']] || shortcut;
			if (!shortcut) {
				console.warn('Shortcut not found:', id);
			}
			shortcut['@_Id'] = id;
			return shortcut;
		});
	}

	return shortcuts;
}
