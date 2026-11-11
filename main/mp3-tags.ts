import type { TagPatch } from 'music-metadata';

/** Preserve v2.4 frames directly; normalize supported legacy metadata before upgrading it. */
export async function writeMp3Tags(filePath: string, patch: TagPatch): Promise<void> {
  const { parseFile } = await import('music-metadata');
  const { updateFile } = await import('music-metadata');
  const metadata = await parseFile(filePath);
  if (metadata.format.tagTypes?.includes('ID3v2.4')) {
    await updateFile(filePath, patch);
    return;
  }

  const native: Record<string, any> = {};
  for (const [group, tags] of Object.entries(metadata.native)) {
    if (!group.startsWith('ID3v2')) continue;
    for (const tag of tags) {
      if (tag.id === 'CHAP' || tag.id === 'CTOC') {
        throw new Error('Legacy MP3 chapter tags cannot yet be safely converted. Catalog changes are saved.');
      }
      if (tag.id.startsWith('TXXX:') || tag.id === 'SYLT') {
        const previous = native[tag.id];
        native[tag.id] = previous === undefined ? tag.value : [...(Array.isArray(previous) ? previous : [previous]), tag.value];
      }
    }
  }
  const common = { ...metadata.common };
  if (patch.artist !== undefined) delete common.artists;
  if (patch.albumartist !== undefined) delete common.albumartists;
  await updateFile(filePath, {
    ...common,
    ...patch,
    ...(patch.track && { track: { ...common.track, ...patch.track } }),
    native: { ...native, ...patch.native },
  }, { replaceId3: true });
}
