import {parseFile} from "./Parser";

export default function init(fileAsString) {
    return parseFile(fileAsString)
}