import type { PDObjectDefinition } from "..";
import type { ObjectRef } from "./PDClassDiagram";

export interface PDAssociation extends PDObjectDefinition {
    "a:RoleAMultiplicity": "0..1",
    "a:RoleBMultiplicity": "0..*",
    "a:RoleBOrdering": "O",
    "a:RoleANavigability": 1,
    "a:RoleBChangeability": "R",
    "a:RoleAIndicator"?: "A" | "C",
    "c:Object1": ObjectRef,
    "c:Object2": ObjectRef,
  }