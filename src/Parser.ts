import { xml2js } from "../app/node_modules/xml-js";
import { parser, parseReferences, parseTables } from "./DiagramParser/Physical";
import { PdInfo, TableColumn, TableSymbol } from "./types";
import ParserError, { PARSE_ERROR_MESSAGE } from "./ParseError";
import { PDTableObject } from "./PDTypes/PDTable";
import { PDReferenceObject } from "./PDTypes/PDReference";
import { PDPhysicalDiagram } from "./PDTypes/PDPhysicalDiagram";
// import { writeFileSync } from "fs";
import { parseConceptualDiagram, parseEntities, parseInheritanceLinks, parseRelationships } from "./DiagramParser/Conceptual";
import { PDConceptualDiagram } from "./PDTypes/PDConceptualDiagram";
import { getCollectionAsArray } from "./helpers";

// Pretvori XML v JS in inicializira branje diagrama
export const parseFile = (file: string) => {
  let xml = xml2js(file, { compact: true });

  // Preverimo ustreznost datoteke
  let pdInfo = xml["_instruction"]?.["PowerDesigner"];
  let pdModel = xml["Model"]?.["o:RootObject"]?.["c:Children"]?.["o:Model"];
  if (!pdInfo || !pdModel) throw new ParserError(PARSE_ERROR_MESSAGE.NOT_A_PD_FILE);

  return {
    info: parsePdInfo(pdInfo),
    model: parsePdModel(pdModel) 
  }
};

// Pretvori diagrame v PlantUML notacijo
// najprej pretvorimo vse objekte v PlantUML notacijo in si zapišemo
// nato začnemo s pretvorbo diagramov
const parsePdModel = (pdModel: object) => {
  // writeFileSync("json.json", JSON.stringify(pdModel));
  // PlantUML definicije PowerDesigner objektov
  let definitions = {};

  // Vrsta objektov, ki jih lahko pretvorimo v PlantUML notacijo
  let collectionQueue = ["c:Tables", "c:References", "c:Entities", "c:Relationships", "c:InheritanceLinks"];

  // V prihodje se bomo po pretvorjenih objektih sklicevali
  // po objektu (o:XXX) in ne po collectionu (c:XXX)
  let colObjMap = {
    "c:Tables": "o:Table",
    "c:References": "o:Reference",
    "c:Entities": "o:Entity",
    "c:Relationships": "o:Relationship",
    "c:InheritanceLinks": "o:InheritanceLink",
  };

  // this should resolve into an object of objects
  // { "c:Tables": { o1: PUMLEntity, ... }, "c:References": { o2: PUMLEntity } }
  collectionQueue.forEach((col) => {
    // Check that the column exists
    if (pdModel[col] == null) return;

    // @ts-ignore
    definitions[colObjMap[col]] = PDCollectionResolver(col, pdModel[col], pdModel);
  });

  // Seznam pretvorjenih diagramov datoteke
  let converted = [];

  // START - Pretvorba fizičnih diagramov
  let physicalDiagrams: PDPhysicalDiagram[] = [];
  if (pdModel["c:PhysicalDiagrams"]) {
    physicalDiagrams = [].concat(pdModel["c:PhysicalDiagrams"]["o:PhysicalDiagram"]);
  }
  let physicalParserResolver = (diagram) => parser(diagram, definitions);
  physicalDiagrams.forEach((diagram) => converted.push(physicalParserResolver(diagram)));
  // END - Pretvorba fizicnih diagramov

  // START - Pretvorba konceptualnih diagramov
  let conceptualDiagrams: PDConceptualDiagram[] = getCollectionAsArray(pdModel["c:ConceptualDiagrams"]?.["o:ConceptualDiagram"]);
  let conceptualParserResolver = (diagram) => parseConceptualDiagram(diagram, definitions);
  conceptualDiagrams.forEach((diagram) => converted.push(conceptualParserResolver(diagram)));
  // END - Pretvorba konceptualnih diagramov

  return converted
};

// Pretvori podatke o PowerDesigner v formatu KEY="VALUE" v JS objekt
const parsePdInfo = (pdInfo: string) => {
  let infoObj: PdInfo = {};
  let info = pdInfo.split(/" /g).map((el) => el.split("="));
  info.forEach(([key, val]) => {
    infoObj[key] = val.slice(1);
  });
  return infoObj;
};

/*
 * HELPERS
 * */

const PDCollectionParser = {
  "c:Tables": function (col) {
    let tables: PDTableObject[] = [].concat(col["o:Table"]);
    return parseTables(tables);
  },

  "c:References": function (col) {
    let references: PDReferenceObject[] = [].concat(col["o:Reference"]);
    return parseReferences(references);
  },

  "c:Entities": function (col, pdModel) {
    let entities = [].concat(col["o:Entity"]);
    return parseEntities(entities, pdModel);
  },

  "c:Relationships": function (col) {
    let relationships = [].concat(col["o:Relationship"]);
    return parseRelationships(relationships);
  },

  "c:InheritanceLinks": function (col, pdModel) {
    let inheritanceLinks = [].concat(col["o:InheritanceLink"]);
    return parseInheritanceLinks(inheritanceLinks, pdModel);
  },

  _default: function (collection) {
    const colKey = Object.keys(collection)[0];
    throw new ParserError(`Collection '${colKey}' not implemented.`);
  },
};

// https://github.com/rwaldron/idiomatic.js - 7.A.1.2 Misc - A better switch statement,
const PDCollectionResolver = function () {
  let args, key, delegate;

  // Transform arguments list into an array
  args = [].slice.call(arguments);

  // shift the case key from the arguments
  key = args.shift();

  // Assign the default case handler
  delegate = PDCollectionParser._default;

  // Derive the method to delegate operation to
  if (PDCollectionParser.hasOwnProperty(key)) {
    delegate = PDCollectionParser[key];
  }

  // The scope arg could be set to something specific,
  // in this case, |null| will suffice
  return delegate.apply(null, args);
};
