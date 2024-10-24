import * as fs from "fs";
import * as path from "path";
import { Link, MyNode, TreeNode } from "./types";

const extractImports = (filePath: string) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const importRegex = /import\s.*?from\s['"](.*?)['"]/g;
  const imports: string[] = [];

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];

    if (!importPath.endsWith(".ts") && !importPath.endsWith(".js")) {
      if (
        fs.existsSync(path.resolve(path.dirname(filePath), importPath + ".ts"))
      ) {
        importPath += ".ts";
      } else if (
        fs.existsSync(path.resolve(path.dirname(filePath), importPath + ".js"))
      ) {
        importPath += ".js";
      }
    }

    imports.push(path.join(path.dirname(filePath), importPath));
  }

  console.log(imports);
  return imports;
};

const getFileSize = (filePath: string): number => {
  const stats = fs.statSync(filePath);
  return stats.size;
};

export const extractNodesAndLinks = (
  tree: TreeNode
): {
  nodes: MyNode[];
  links: Link[];
} => {
  const nodes: MyNode[] = [];
  const links: Link[] = [];

  function traverse(node: TreeNode) {
    const newNode: MyNode = { id: node.name };
    nodes.push(newNode);

    if (node.children) {
      node.children.forEach((child) => {
        links.push({ source: node.name, target: child.name });
        traverse(child);
      });
    }
  }

  traverse(tree);

  return { nodes, links };
};

export const getDependencies = (dir: string): { [key: string]: string[] } => {
  const files = fs.readdirSync(dir);
  const dependencies: { [key: string]: string[] } = {};

  files.forEach((file: any) => {
    const filePath = path.join(dir, file);
    if (
      fs.statSync(filePath).isFile() &&
      (file.endsWith(".ts") || file.endsWith(".js"))
    ) {
      dependencies[filePath] = extractImports(filePath);
    }
  });

  return dependencies;
};

export const buildTree = (
  deps: { [key: string]: string[] },
  root: string
): TreeNode => {
  const node: TreeNode = {
    name: root,
    children: [],
    size: getFileSize(root),
  };

  if (deps[root]) {
    deps[root].forEach((child) => {
      node.children.push(buildTree(deps, child));
    });
  }

  return node;
};
