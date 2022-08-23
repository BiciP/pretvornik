import type { RefAttributes } from '.';

export default interface PDExtendedDependency {
	'a:Stereotype': 'extends';
	'c:Object1': {
		[key: string]: RefAttributes;
	};
	'c:Object2': {
		[key: string]: RefAttributes;
	};
	'@_Id': string;
}
