// Assembles a downloadable, ready-to-install Stellaris mod zip.

import JSZip from "jszip";
import type { ModProject } from "../types";
import {
  buildExport,
  folderSlug,
  generateDescriptor,
  generateLocalisation,
  toKey,
} from "./pdxExport";
import { imageDataUrlToDds } from "./dds";

/** Stellaris .yml files must begin with a UTF-8 BOM. */
const BOM = "﻿";

/** Build the mod zip and return it as a Blob. */
export async function buildModZip(project: ModProject): Promise<Blob> {
  const zip = new JSZip();
  const root = folderSlug(project.modName);
  const dir = zip.folder(root)!;
  const bundle = buildExport(project);

  dir.file("descriptor.mod", generateDescriptor(project));
  dir.file(
    `localisation/english/${root}_l_english.yml`,
    BOM + generateLocalisation(project),
  );
  for (const { path, content } of bundle.files) {
    dir.file(path, content);
  }

  // Convert each uploaded image to a DDS at its conventional path.
  for (const { path, dataUrl } of bundle.icons) {
    const dds = await imageDataUrlToDds(dataUrl, 128);
    if (dds) dir.file(path, dds);
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
