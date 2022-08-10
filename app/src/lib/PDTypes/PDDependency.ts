import type { PDObjectDefinition, RefAttributes } from "."

export interface PDDependency extends PDObjectDefinition {
    "a:Stereotype"?: string,
    "c:Object1": {
        [key: string]: RefAttributes;
    },
    "c:Object2": {
        [key: string]: RefAttributes;
    }
  }