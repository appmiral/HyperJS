import {
  HyperJSGraph,
} from "../src/HyperJSStriped.js";

// initialize this directed hypergraph
const graph = new HyperJSGraph({ type: "lineage", label: "My Family" });

// adding my family
const dadId = graph.addNode({ label: "Dad", metadata: { dob: '1987-06-05T10:09' } });
const momId = graph.addNode({ label: "Mom", metadata: { dob: '1988-07-05T05:04' } });
const sisterId = graph.addNode({ label: "Sister" });
const meId = graph.addNode({ label: "Me" });

// adding relations
const e1 = graph.addEdge({
  source: dadId,
  target: [sisterId, meId],
  relation: "children",
});

const e2 = graph.addEdge({
  source: momId,
  target: [sisterId, meId],
  relation: "children",
});