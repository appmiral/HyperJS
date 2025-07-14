import {
  HyperJSGraph,
  HyperJSNode
} from "../src/HyperJSStriped.js";

// initialize this directed hypergraph
const graph = new HyperJSGraph({ type: "lineage", label: "Genealogy" });

// with a node like this:
class LocationNode extends HyperJSNode {
  static _config = {
    isMetadataStrict: true,
    metaSchema: {
      region: { type: "string", default: '' }, // this locations region 
    },
  };
}

// Register node types that can represent locations on this planet
graph.registerNodeType('location', LocationNode);

// you can set the region at the config objects root. internaly it will be within the metadata. It is just a shortcut for developers
graph.addNode({ type: 'location', label: "Home", region: 'North America' });

// will result in the same node as
graph.addNode({ type: 'location', label: "Home", metadata: { region: 'North America' } });

// in case you mix it, metadata will win: region will be set to: 'North America'
graph.addNode({ type: 'location', label: "Home", region: 'Europe', metadata: { region: 'North America' } });