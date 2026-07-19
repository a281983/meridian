import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const CONFIG_DIR = path.join(process.cwd(), "config");

function loadYaml(filename) {
  const raw = fs.readFileSync(path.join(CONFIG_DIR, filename), "utf8");
  return yaml.load(raw);
}

export function getThesis() {
  return loadYaml("thesis.yaml");
}

export function getScoringWeights() {
  return loadYaml("scoring-weights.yaml");
}

export function getSourcingChannels() {
  return loadYaml("sourcing-channels.yaml");
}

export function getMemoSections() {
  return loadYaml("memo-sections.yaml");
}
