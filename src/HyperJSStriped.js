
/*  HyperJS.js
 *  A directed hypergraph library for JavaScript (ES-Next).
 *
 *  Key Features:
 *  - High-performance API based on JavaScript objects and IDs
 *  - Optional object mapping for simplicity (trades performance)
 *  - Extensible via HyperJSGraph, HyperJSNode, and HyperJSEdge classes
 *  - Supports schema-based metadata validation
 */
export class HyperJSGraph {

  static _config = {
    version: "0.0",
    isMetadataStrict: false,
    metaSchema: {}
  };


  // Creates a new hypergraph instance with optional configuration
  constructor({ id, label = '', type = '', directed = true, metadata = {} } = {}) {
    this.id = id || this.generateId();
    this.label = label;
    this.type = type;

    this.directed = directed;
    //this.metadata = metadata; //this.getCleanMetadata(metadata, this._metaSchema, false); // allows aditional metadata not covered by the schema, but ensures the type if in schema

    this.nodes = new Map();       // Map of nodeID -> nodeObject
    this.hyperedges = new Map();  // Map of edgeID -> edgeObject

    this.nodeTypes = new Map(); // Registry for node types
    this.edgeRelations = new Map(); // Registry for edge types

    this.registerNodeType('', HyperJSNode); // register the default nodeClass as fallback
    this.registerEdgeRelation('', HyperJSEdge); // register the default edgeClass as fallback

    this.config = new GraphConfig(this); // ← create config wrapper
    this.metadata = this.config.sanitizeMetadata(metadata);
  }

  // Registers a custom node class for a specific `type`.
  // If `type` matches the node.type, the node is instantiated using the custom class.
  // Otherwise, falls back to default: HyperJSNode.
  registerNodeType(type, NodeClass) {

    // checks are done within NodeConfig.
    const config = new NodeConfig(NodeClass); // ← create config wrapper
    this.nodeTypes.set(type, { NodeClass, config });
  }

  // Registers a custom edge class for a specific `relation`.
  // If `relation` matches the edge.relation, the edge is instantiated using the custom class.
  // Otherwise, falls back to default: HyperJSEdge.
  registerEdgeRelation(relation, EdgeClass) {
    // checks are done within EdgeConfig.
    const config = new EdgeConfig(EdgeClass); // ← create config wrapper
    this.edgeRelations.set(relation, { EdgeClass, config });
  }


  // Serializes the graph to a plain JSON-compatible object.
  toJSON() {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      directed: this.directed,
      metadata: this.config.sanitizeMetadata(this.metadata),
      nodes: Object.fromEntries(this.nodes),
      hyperedges: Object.fromEntries(this.hyperedges)
    };
  }

  // Generates a unique identifier for graph elements.
  // This method can be overridden by subclasses.
  generateId() {
    return crypto.randomUUID();
  }

  getNodeConfig(type) {
    return this.nodeTypes.get(type)?.config || this.nodeTypes.get('')?.config;
  }

  getEdgeConfig(relation) {
    return this.edgeRelations.get(relation)?.config || this.edgeRelations.get('')?.config;
  }


  /* Start of graph specific methods */

  // ➕ Add a node (returns id -> performant api)
  addNode({ id, type = "", label = '', metadata = {} } = {}) {
    id = id || this.generateId();

    if (this.nodes.has(id)) {
      throw new Error(`Node with id '${id}' already exists.`);
    }

    const { config } = this.nodeTypes.get(type) ?? this.nodeTypes.get('');
    metadata = config.sanitizeMetadata(metadata, true);

    // Store node as raw object
    this.nodes.set(id, { id, type, label, metadata });
    return id;
  }

  // ➕ Add a hyperedge (returns id → performant API)
  addEdge({ id, source = [], target = [], relation = '', metadata = {} } = {}) {
    id = id || this.generateId();

    if (this.hyperedges.has(id)) {
      throw new Error(`Edge with id '${id}' already exists.`);
    }

    // Normalize source and target as arrays
    source = Array.isArray(source) ? source : [source];
    target = Array.isArray(target) ? target : [target];

    // Retrieve correct config (fallback to default)
    const { config } = this.edgeRelations.get(relation) ?? this.edgeRelations.get('');
    metadata = config.sanitizeMetadata(metadata, true);

    // Store edge as raw object
    this.hyperedges.set(id, { id, source, target, relation, metadata });
    return id;
  }
}

export class HyperJSNode {

  static _config = {
    version: "0.0",
    isMetadataStrict: false,
    metaSchema: {},
    incoming: [],
    outgoing: [],
  }

  // Constructs a new node within a given graph
  // Throws an error if `graph` is not a valid HyperJSGraph instance
  constructor({ graph, id, type, label = '', metadata = {} } = {}) {

    if (!(graph instanceof HyperJSGraph)) {
      throw new TypeError(
        `Invalid graph: expected instance of HyperJSGraph, got ${graph?.constructor?.name || typeof graph}`
      );
    }

    this.graph = graph;
    this.id = id || graph.generateId();
    this.type = type || '';
    this.label = label;

    const config = this.graph.getNodeConfig(type);
    this.metadata = config.sanitizeMetadata(metadata, true);
  }

  // Serializes the node into JSON, excluding non-essential properties (e.g. graph reference)
  toJSON() {

    const config = this.graph.getNodeConfig(this.type);

    return {
      id: this.id,
      type: this.type,
      label: this.label,
      metadata: config.sanitizeMetadata(this.metadata)
    };
  }
}

export class HyperJSEdge {

  static _config = {
    version: "0.0",
    isMetadataStrict: false,
    metaSchema: {},
    incoming: [],
    outgoing: [],
  }

  // Constructs a new edge within a given graph
  // Throws an error if `graph` is not a valid HyperJSGraph instance
  constructor(graph, { id, source = [], target = [], relation = '', metadata = {} }) {

    if (!(graph instanceof HyperJSGraph)) {
      throw new TypeError(
        `Invalid graph: expected instance of HyperJSGraph, got ${graph?.constructor?.name || typeof graph}`
      );
    }

    this.graph = graph;
    this.id = id || graph.generateId();
    this.source = Array.isArray(source) ? source : [source];
    this.target = Array.isArray(target) ? target : [target];
    this.relation = relation;
    this.metadata = this.graph.getEdgeConfig(this.relation).sanitizeMetadata(this.metadata, true);
  }

  // Serializes the node into JSON, excluding non-essential properties (e.g. graph reference)
  toJSON() {
    return {
      id: this.id,
      relation: this.relation,
      source: this.source,
      target: this.target,
      metadata: this.graph.getEdgeConfig(this.relation).sanitizeMetadata(this.metadata)
    };
  }
}

export class BaseConfig {

  sanitizeMetadata(rawMetadata = {}, typeCheckOnly = false) {
    const result = {};

    // Apply schema defaults and type checks
    for (const key in this.schema) {
      const { type, default: defaultValue } = this.schema[key];

      if (key in rawMetadata) {
        const value = rawMetadata[key];
        if ((type === 'array') ? !Array.isArray(value) : typeof value !== type) {
          throw new TypeError(
            `Invalid type for "${key}" in ${this.typeName}: expected ${type}, got ${Array.isArray(value) ? 'array' : typeof value}`
          );
        }
        result[key] = value;
      } else {
        result[key] = defaultValue;
      }
    }

    // Preserve extra keys if strict is false. typeCheckOnly is able to override strict if strict is true
    if (!this.strict || !typeCheckOnly) {
      for (const key in rawMetadata) {
        if (!(key in this.schema)) {
          result[key] = rawMetadata[key];
        }
      }
    }

    return result;
  }

  getSchema() {
    return this.schema;
  }

  isStrict() {
    return this.strict;
  }

  getVersion() {
    return this.version;
  }

  getTypeName() {
    return this.typeName;
  }
}

export class NodeConfig extends BaseConfig {
  constructor(NodeClass) {
    super(NodeClass); // Call the parent class constructor
    if (NodeClass !== HyperJSNode && !(NodeClass.prototype instanceof HyperJSNode) && !(NodeClass instanceof HyperJSNode)) {
      throw new Error("NodeClass must be HyperJSNode or a subclass of it.");
    }

    const config = NodeClass._config ?? {};

    this.version = config.version || '1.0';
    this.schema = config.metaSchema || {};
    this.strict = config.isMetadataStrict ?? false;

    this.typeName = NodeClass.name;
  }
}

export class GraphConfig extends BaseConfig {
  constructor(GraphClass) {

    super(GraphClass); // Call the parent class constructor

    if (GraphClass !== HyperJSGraph && !(GraphClass.prototype instanceof HyperJSGraph) && !(GraphClass instanceof HyperJSGraph)) {
      throw new Error("GraphClass must be HyperJSGraph or a subclass of it.");
    }


    const config = GraphClass._config ?? {};

    this.version = config.version || '1.0';
    this.schema = config.metaSchema || {};
    this.strict = config.isMetadataStrict ?? false;

    this.typeName = GraphClass.name;
  }
}

export class EdgeConfig extends BaseConfig {

  constructor(EdgeClass) {

    super(EdgeClass); // Call the parent class constructor

    if (EdgeClass !== HyperJSEdge && !(EdgeClass.prototype instanceof HyperJSEdge) && !(EdgeClass instanceof HyperJSEdge)) {
      throw new Error("EdgeClass must be HyperJSEdge or a subclass of it.");
    }


    const config = EdgeClass._config ?? {};

    this.version = config.version || '1.0';
    this.schema = config.metaSchema || {};
    this.strict = config.isMetadataStrict ?? false;

    this.typeName = EdgeClass.name;
  }
}



export class CustomNodeExample extends HyperJSNode {

  static _config = {
    version: "0.1",

    isMetadataStrict: true,

    metaSchema: {
      age: { type: 'number', default: 0 },
      occupation: { type: 'string', default: 'unemployed' },
      skills: { type: 'array', default: [] }
    },

    incoming: [
      {
        type: ['ProjectNode', 'DepartmentNode'],
        relation: ['AssignedTo'],
        required: true,
        multiplicity: '1'
      },
      {
        type: '*',
        relation: ['TaggedAs'],
        required: false
      }
    ],

    outgoing: [
      {
        type: ['SkillNode'],
        relation: ['HasSkill'],
        required: false,
        multiplicity: 'many',
      },
      {
        type: '*',
        relation: '*',
        required: false
      }
    ],

  }
}
