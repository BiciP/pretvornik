import { getCollectionAsArray } from "../helpers";
import ParserError from "../ParseError";
import type { RefAttributes } from "../PDTypes";
import type { EntitySymbol, InheritanceLinkSymbol, PDConceptualDiagram, RelationshipSymbol } from "../PDTypes/PDConceptualDiagram";
import type { PDDataItem } from "../PDTypes/PDDataItem";
import type { EntityAttribute, Identifier, PDEntityObject } from "../PDTypes/PDEntity";
import type { PDInheritance } from "../PDTypes/PDInheritance";
import type { PDInheritanceLink } from "../PDTypes/PDInheritanceLink";
import type { PDRelationship } from "../PDTypes/PDRelationship";

export function parseConceptualDiagram(diagram: PDConceptualDiagram, PDObjects: any) {
  // Initialize the PlantUML notation diagram and give it a name
  let PUMLDiagram = "@startuml " + diagram["a:Name"] + "\n\n";

  // Parse entities
  let EntitySymbols: EntitySymbol[] = getCollectionAsArray(diagram["c:Symbols"]["o:EntitySymbol"]);
  EntitySymbols.forEach((EntitySymbol) => (PUMLDiagram += PDObjects["o:Entity"][EntitySymbol["c:Object"]["o:Entity"]["@_Ref"]] + "\n"));

  // Parse relationships
  let RelationshipSymbols: RelationshipSymbol[] = getCollectionAsArray(diagram["c:Symbols"]["o:RelationshipSymbol"]);
  RelationshipSymbols.forEach((RelationshipSymbol) => {
    PUMLDiagram += PDObjects["o:Relationship"][RelationshipSymbol["c:Object"]["o:Relationship"]["@_Ref"]];
  });

  // Parse inheritance links
  let InheritanceLinkSymbols: InheritanceLinkSymbol[] = getCollectionAsArray(diagram["c:Symbols"]["o:InheritanceLinkSymbol"]);
  InheritanceLinkSymbols.forEach((InheritanceLinkSymbol) => {
    PUMLDiagram += PDObjects["o:InheritanceLink"][InheritanceLinkSymbol["c:Object"]["o:InheritanceLink"]["@_Ref"]];
  });

  // Finish the PlnatUML notation
  PUMLDiagram += "\n@enduml";

  return {
    diagram: {
      id: diagram["@_Id"],
      name: diagram["a:Name"],
      type: "Conceptual",
    },
    data: PUMLDiagram,
  };
}

export function parseEntities(entities: PDEntityObject[], pdModel: object) {
  // { o1: PUMLEntity, o2: PUMLEntity }
  let obj = {};
  let dataItems: PDDataItem[] = getCollectionAsArray(pdModel?.["c:DataItems"]?.["o:DataItem"]);

  entities.forEach((entity) => {
    // Extract entity Id
    let entityId = entity["@_Id"];

    // PlantUML entity initialization
    obj[entityId] = `entity "${entity["a:Name"]}" as ${entityId} {\n`;

    // Get primary identifiers
    let primaryIdentifiers: RefAttributes[] = getCollectionAsArray(entity["c:PrimaryIdentifier"]?.["o:Identifier"]);
    let primaryIdentifiersKeys = primaryIdentifiers.map((pk) => pk["@_Ref"]);

    // Declare identifiers
    let piAttributes = new Set()
    let identifiers: Identifier[] = getCollectionAsArray(entity["c:Identifiers"]?.["o:Identifier"]);
    identifiers.forEach((identifier) => {
      let attributesRefs: RefAttributes[] = getCollectionAsArray(identifier["c:Identifier.Attributes"]?.["o:EntityAttribute"])
      attributesRefs.forEach(attributeRef => piAttributes.add(attributeRef["@_Ref"]))
      let isPrimary = primaryIdentifiersKeys.includes(identifier["@_Id"]);
      obj[entityId] += `\t* ${identifier["a:Name"]} ${isPrimary ? "<<pi>>" : ""}\n`;
    });

    // Draw the line between identifiers and attributes if there are any identifiers
    obj[entityId] += "\t--\n";

    // Declare attributes
    let attributes: EntityAttribute[] = getCollectionAsArray(entity["c:Attributes"]?.["o:EntityAttribute"]);
    attributes.forEach((attribute) => {
      let isIdentifier = piAttributes.has(attribute["@_Id"])
      let isMandatory = attribute["a:BaseAttribute.Mandatory"] === 1;
      let dataItemRef = attribute["c:DataItem"]["o:DataItem"]["@_Ref"];
      let dataItem = dataItems.find((item) => item["@_Id"] === dataItemRef);
      if (dataItem == null) throw new ParserError(`Attribute data item does not exist: Ref[${dataItemRef}]`);
      let dataType = extractDataType(dataItem)
      let puml = `\t${isMandatory ? "* " : ""}${dataItem["a:Name"]}`;
      if (dataType != null || isIdentifier) {
        puml += ` : `
        if (dataType) puml += `${dataType} `
        if (isIdentifier) puml += "<<pi>>"
      }
      puml += "\n"
      obj[entityId] += puml
    });

    // PlantUML entity finalization
    obj[entityId] += "}\n";
  });

  return obj;
}

export function parseRelationships(relationships: PDRelationship[]) {
  let obj = {};

  relationships.forEach((relationship) => {
    let puml = "";
    puml += relationship["c:Object1"]["o:Entity"]["@_Ref"] + " ";
    puml += getCardinality(relationship, 1);
    puml += "--";
    puml += getCardinality(relationship, 2);
    puml += " " + relationship["c:Object2"]["o:Entity"]["@_Ref"]
    puml += " : " + relationship["a:Name"]
    puml += "\n";
    obj[relationship["@_Id"]] = puml;
  });

  return obj;
}

export function parseInheritanceLinks(inheritanceLinks: PDInheritanceLink[], pdModel: object) {
  let obj = {};

  // Get the model inheritances, needed to link with InheritanceLink
  let Inheritances: PDInheritance[] = getCollectionAsArray(pdModel?.["c:Inheritances"]?.["o:Inheritance"]);

  inheritanceLinks.forEach((inheritanceLink) => {
    let inheritanceId = inheritanceLink["c:Object1"]["o:Inheritance"]["@_Ref"];
    let inheritance = Inheritances.find((Inheritance) => Inheritance["@_Id"] === inheritanceId);
    if (!inheritance) throw new ParserError(`Inheritance '${inheritanceId}' does not exist.`);
    let puml = inheritance["c:ParentEntity"]["o:Entity"]["@_Ref"];
    puml += " ||--o| ";
    puml += inheritanceLink["c:Object2"]["o:Entity"]["@_Ref"];
    puml += " : " + inheritance["a:Name"]
    puml += "\n"
    obj[inheritanceLink["@_Id"]] = puml;
  });

  return obj;
}

// HELPERS

function extractDataType(dataItem: PDDataItem) {
  let dataType: string = dataItem["a:DataType"]
  let length: number | undefined = dataItem["a:Length"]
  let precision: number | undefined = dataItem["a:Precision"]

  if (!dataType) {
    return null
  }

  let isDefined = Object.keys(dataTypes)
    .every(key => {
      if (dataType.startsWith(key)) {
        dataType = dataTypes[key]
        return false
      } 
      
      return true
    })

  if (isDefined) {
    console.error(`Data type not implemented: '${dataType}'`)
  }

  if (length) {
    dataType += ` (${length}`
    if (precision) dataType += `,${precision}`
    dataType += `)`
  }

  return dataType
}

function getCardinality(relationship: PDRelationship, entity: 1 | 2): string {
  let keys = {
    1: "a:Entity1ToEntity2RoleCardinality",
    2: "a:Entity2ToEntity1RoleCardinality",
  };
  let raw = relationship[keys[entity]];
  let cardinality = cardinalityMap[raw];
  if (!cardinality) throw new ParserError("Invalid cardinality: " + raw);
  return cardinality[entity];
}

let dataTypes = {
  "VBIN": "Variable binary",
  "VMBT": "Variable multibyte",
  "LBIN": "Long binary",
  "BIN": "Binary",
  "BMP": "Bitmap",
  "PIC": "Image",
  "MBT": "Multibyte",
  "OLE": "OLE",
  "TXT": "Text",
  "VA": "Variable characters",
  "MN": "Money",
  "BT": "Byte",
  "BL": "Boolean",
  "LA": "Long characters",
  "SF": "Short float",
  "SI": "Short integer",
  "DT": "Date & Time",
  "DC": "Decimal",
  "TS": "Timestamp",
  "NO": "Serial",
  "N": "Number",
  "D": "Date",
  "T": "Time",
  "I": "Integer",
  "A": "Characters",
  "F": "Float",
}

let cardinalityMap = {
  "0,1": {
    1: "|o",
    2: "o|",
  },
  "0,n": {
    1: "}o",
    2: "o{",
  },
  "1,1": {
    1: "||",
    2: "||",
  },
  "1,n": {
    1: "}|",
    2: "|{",
  },
};
