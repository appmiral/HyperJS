// HyperJS.js

export class HyperJSGraph {
  constructor({ id, label = '', type = '', directed = true, metadata = {} } = {}) {
    //this.id = id || crypto.randomUUID();
    this.id = id || this.generateId();
    this.label = label;
    this.type = type;
    this.directed = directed;
    this.metadata = metadata;

    this.nodes = new Map();       // Map of nodeID -> nodeObject
    this.hyperedges = new Map();  // Map of edgeID -> edgeObject

    this.nodeTypes = new Map(); // Registry for node types
    this.edgeRelations = new Map(); // Registry for edge types
  }

  // ➕ Add a node (returns id -> performant api)
  addNode({ id, label = '', metadata = {} } = {}) {
    const nodeId = id || crypto.randomUUID();
    if (this.nodes.has(nodeId)) throw new Error(`Node with id '${nodeId}' already exists.`);
    this.nodes.set(nodeId, { id: nodeId, label, metadata });
    return nodeId;
  }

  // ➕ Create a node that is bound to the graph (returns object -> for complex tasks)
  // Factory method to create and register a node
  createNode(type, ...args) {
    const NodeClass = this.nodeTypes.get(type) || HyperJSNode;
    return new NodeClass(...args);
  }

  // Factory method to create and register an edge
  createEdge(relation, ...args) {
    const EdgeClass = this.edgeRelations.get(relation) || HyperJSEdge;
    return new EdgeClass(...args);
  }



  // 🔄 Update node metadata
  updateNodeMetadata(nodeId, newMetadata = {}) {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Node '${nodeId}' not found.`);
    node.metadata = { ...node.metadata, ...newMetadata };
  }

  // ➕ Add a hyperedge
  addEdge({ id, source = [], target = [], relation = '', metadata = {} } = {}) {
    const edgeId = id || crypto.randomUUID();
    if (this.hyperedges.has(edgeId)) throw new Error(`Edge with id '${edgeId}' already exists.`);

    const sourceArr = Array.isArray(source) ? source : [source];
    const targetArr = Array.isArray(target) ? target : [target];
    const allNodes = [...sourceArr, ...targetArr];

    for (const nodeId of allNodes) {
      if (!this.nodes.has(nodeId)) throw new Error(`Node '${nodeId}' not found in graph.`);
    }

    this.hyperedges.set(edgeId, {
      id: edgeId,
      nodes: allNodes,
      source: sourceArr,
      target: targetArr,
      relation,
      metadata
    });

    return edgeId;
  }

  // 🧠 Get node by ID
  getNode(id) {
    return this.nodes.get(id);
  }

  // 🧠 Get edge by ID
  getEdge(id) {
    return this.hyperedges.get(id);
  }

  // 🗑️ Remove node
  removeNode(id) {
    if (!this.nodes.has(id)) return false;
    this.nodes.delete(id);
    // Remove edges that reference this node
    for (const [eid, edge] of this.hyperedges) {
      if (edge.nodes.includes(id)) this.hyperedges.delete(eid);
    }
    return true;
  }

  // 🗑️ Remove edge
  removeEdge(id) {
    return this.hyperedges.delete(id);
  }

  // ✅ Check if a node exists
  hasNode(id) {
    return this.nodes.has(id);
  }

  // ✅ Check if an edge exists
  hasEdge(id) {
    return this.hyperedges.has(id);
  }

  // 🔍 Get all edges where nodeId is in the target
  getIncomingEdges(nodeId) {
    if (!this.hasNode(nodeId)) throw new Error(`Node '${nodeId}' not found.`);
    return Array.from(this.hyperedges.values()).filter(edge =>
      edge.target.includes(nodeId)
    );
  }

  // 🔍 Get all edges where nodeId is in the source
  getOutgoingEdges(nodeId) {
    if (!this.hasNode(nodeId)) throw new Error(`Node '${nodeId}' not found.`);
    return Array.from(this.hyperedges.values()).filter(edge =>
      edge.source.includes(nodeId)
    );
  }

  // 🔍 Get all edges where nodeId is in source or target
  getIncidentEdges(nodeId) {
    if (!this.hasNode(nodeId)) throw new Error(`Node '${nodeId}' not found.`);
    return Array.from(this.hyperedges.values()).filter(edge =>
      edge.nodes.includes(nodeId)
    );
  }

  // 🤝 Get all directly connected nodes (via any edge)
  getNeighbors(nodeId) {
    if (!this.hasNode(nodeId)) throw new Error(`Node '${nodeId}' not found.`);
    const neighbors = new Set();

    for (const edge of this.hyperedges.values()) {
      if (edge.source.includes(nodeId)) {
        edge.target.forEach(n => neighbors.add(n));
      }
      if (edge.target.includes(nodeId)) {
        edge.source.forEach(n => neighbors.add(n));
      }
    }

    neighbors.delete(nodeId); // Exclude self
    return Array.from(neighbors);
  }

  // 🔁 Get source node IDs of a hyperedge
  getSources(edgeId) {
    const edge = this.hyperedges.get(edgeId);
    if (!edge) throw new Error(`Edge '${edgeId}' not found.`);
    return edge.source;
  }

  // 🔁 Get target node IDs of a hyperedge
  getTargets(edgeId) {
    const edge = this.hyperedges.get(edgeId);
    if (!edge) throw new Error(`Edge '${edgeId}' not found.`);
    return edge.target;
  }

  getCleanMetadata(metadata, schema = {}, strict = false) {
    const result = {};

    // Step 1: Apply schema-defined keys
    for (const key in schema) {
      const { type, default: defaultValue } = schema[key];

      if (key in metadata) {
        const value = metadata[key];
        if ((type === 'array') ? !Array.isArray(value) : typeof value !== type) {
          throw new TypeError(`Invalid type for "${key}": expected ${type}, got ${Array.isArray(value) ? 'array' : typeof value}`);
        }
        result[key] = value;
      } else {
        result[key] = defaultValue;
      }
    }

    // Step 2: Preserve extra keys not in schema if strict == false
    if (!strict) {
      for (const key in metadata) {
        if (!(key in schema)) {
          result[key] = metadata[key];
        }
      }
    }

    return result;
  }

  // 📊 Export graph as JSON
  toJSON() {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      directed: this.directed,
      metadata: this.metadata,
      nodes: Object.fromEntries(this.nodes),
      hyperedges: Object.fromEntries(this.hyperedges)
    };
  }

  // can be overidden in subclasses
  generateId() {
    return crypto.randomUUID();
  }
}

/**
 * https://www.simonsmith.io/destructuring-objects-as-function-parameters-in-es6
 * https://www.simonsmith.io/easier-function-arguments-with-destructuring
 */
export class HyperJSNode {

  isMetadataStrict = true; // Default: strict mode off

  // metadata Definition
  metaSchema = {
    age: { type: 'number', default: 0 },
    occupation: { type: 'string', default: 'unemployed' },
    hobbies: { type: 'array', default: [] }
  };

  // {graph = NULL, id = ''} = {}
  constructor({ graph, id, type, label = '', metadata = {} } = {}) {

    // graph needs to be valid
    if (!(graph instanceof HyperJSGraph)) {
      throw new TypeError(
        `Invalid graph: expected instance of HyperJSGraph, got ${graph?.constructor?.name || typeof graph}`
      );
    }

    this.graph = graph;
    this.id = id || graph.generateId();
    this.type = type || '';
    this.label = label;
    this.metadata = this.graph.getCleanMetadata(metadata, this.metaSchema, this.isMetadataStrict );
  }

  // Initialize metadata with defaults from schema
  initializeMetadata(metadata) {
    const result = {};

    // Add schema-defined keys with defaults or user values
    for (const [key, def] of Object.entries(this.metaSchema)) {
      result[key] = key in metadata
        ? metadata[key]
        : typeof def === 'object' && def !== null && 'default' in def
          ? def.default
          : undefined;
    }

    // If not strict, merge in additional user-defined keys
    if (!this.isMetadataStrict) {
      for (const [key, value] of Object.entries(metadata)) {
        if (!(key in result)) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  toJSON() {
    // dont return the graph object
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      metadata: this.metadata
    };
  }
}

export class HyperJSEdge {
  constructor(graph, { id, source = [], target = [], relation = '', metadata = {} }) {
    this.graph = graph;
    this.id = id || crypto.randomUUID();
    this.source = Array.isArray(source) ? source : [source];
    this.target = Array.isArray(target) ? target : [target];
    this.nodes = [...this.source, ...this.target];
    this.relation = relation;
    this.metadata = metadata;
  }
}

