export interface PDObject extends IdAttributes {
	'a:ObjectID': string;
	'a:Name': string;
	'a:Code': string;
}

export interface RefAttributes {
	'@_Ref': string;
}

export interface IdAttributes {
	'@_Id': string;
}
