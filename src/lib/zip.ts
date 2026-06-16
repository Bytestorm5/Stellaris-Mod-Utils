// Assembles a downloadable, ready-to-install Stellaris mod zip.

import JSZip from "jszip";
import type { ModProject } from "../types";
import {
  effectiveCivicKey,
  generateCivicsFile,
  generateDescriptor,
  generateLocalisation,
  originIconPath,
  toKey,
} from "./pdxExport";
import { imageDataUrlToDds } from "./dds";

/** Stellaris .yml files must begin with a UTF-8 BOM. */
const BOM = "﻿";

function folderSlug(modName: string): string {
  return (
    modName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "civic_mod"
  );
}

/** Build the mod zip and return it as a Blob. */
export async function buildModZip(project: ModProject): Promise<Blob> {
  const zip = new JSZip();
  const root = folderSlug(project.modName);
  const dir = zip.folder(root)!;

  dir.file("descriptor.mod", generateDescriptor(project));
  dir.file(
    `common/governments/civics/00_${root}_civics.txt`,
    generateCivicsFile(project),
  );
  dir.file(
    `localisation/english/${root}_l_english.yml`,
    BOM + generateLocalisation(project),
  );

  // Icons: convert each uploaded image to DDS at the conventional path.
  for (const civic of project.civics) {
    if (!civic.iconDataUrl) continue;
    const dds = await imageDataUrlToDds(civic.iconDataUrl, 128);
    if (dds) {
      const key = effectiveCivicKey(project, civic);
      const path =
        civic.kind === "origin"
          ? originIconPath(key)
          : `gfx/interface/icons/governments/civics/${key}.dds`;
      dir.file(path, dds);
    }
  }

  return zip.generateAsync({ type: "blob" });
}

/** Build and trigger a browser download of the mod zip. */
export async function downloadModZip(project: ModProject): Promise<void> {
  const blob = await buildModZip(project);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${folderSlug(project.modName)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export { toKey };
