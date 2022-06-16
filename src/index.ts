import {parseFile} from "./Parser";
import * as fs from "fs";

let pdFile = fs.readFileSync('./fizicini_model.pdm').toString()
parseFile(pdFile)