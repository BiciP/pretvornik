import {parseFile} from "./Parser";
// import * as fs from "fs";

// let pdFile = fs.readFileSync('../Picerija.cdm').toString()
export default function init(fileAsString) {
    return parseFile(fileAsString)
}