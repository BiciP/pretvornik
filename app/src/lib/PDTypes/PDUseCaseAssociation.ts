import type { PDObjectDefinition, RefAttributes } from "."

export interface PDUseCaseAssociation extends PDObjectDefinition {
    "c:Object1": {
      [key: string]: RefAttributes
    },
    "c:Object2": {
      [key: string]: RefAttributes
    },
  }