import type { PDObjectDefinition, RefAttributes } from '..';

export interface PDShortcutDefinition extends PDObjectDefinition {
	'a:TargetStereotype': string;
	'a:TargetID': string;
	'a:TargetClassID': string;
	'a:TargetPackagePath': string;
}

export interface PDMessageShortcut extends PDShortcutDefinition {
	'c:LinkShortcutExtremities': {
		'o:Shortcut': RefAttributes;
	};
}

export interface PDActorShortcut extends PDShortcutDefinition {}
