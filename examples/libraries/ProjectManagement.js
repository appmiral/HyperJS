import { HyperJSNode, HyperJSEdge } from "../../src/HyperJSStriped.js";

// PROJECT node
class ProjectNode extends HyperJSNode {
  static _config = {
    isMetadataStrict: true,
    metaSchema: {
      budget:   { type: "number", default: 0 },
      deadline: { type: "string", default: "" }, // ISO date
    }
  };
}

// TASK node
class TaskNode extends HyperJSNode {
  static _config = {
    isMetadataStrict: true,
    metaSchema: {
      assignee: { type: "string", default: "" },
      status:   { type: "string", default: "todo" },
    }
  };
}

// “dependsOn” edge
class DependsOnEdge extends HyperJSEdge {
  static _config = {
    isMetadataStrict: true,
    metaSchema: {
      critical: { type: "boolean", default: false }
    }
  };
}

// Ownership edge: project → task
class OwnsEdge extends HyperJSEdge {
  static _config = {
    metaSchema: {} // no metadata needed
  };
}

export const ProjectManagement = {
  nodeTypes: {
    project: ProjectNode,
    task:    TaskNode
  },
  edgeRelations: {
    owns:      OwnsEdge,
    dependsOn: DependsOnEdge
  }
};