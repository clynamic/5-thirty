import { ManifestSlice } from './health.dto';

export interface ManifestSliceProps {
  allIds: { id: number }[];
  lowerId: number;
  upperId: number;
  maxSize?: number;
  baseCount?: number;
}

export const generateManifestSlices = ({
  allIds,
  lowerId,
  upperId,
  maxSize = 10000,
  baseCount = 30,
}: ManifestSliceProps): ManifestSlice[] => {
  const rangeSize = upperId - lowerId + 1;
  const sliceCount =
    Math.ceil(Math.ceil(rangeSize / maxSize) / baseCount) * baseCount;
  const sliceSize = Math.ceil(rangeSize / sliceCount);

  const slices: ManifestSlice[] = [];
  let currentId = lowerId;
  let idIndex = 0;

  for (let i = 0; i < sliceCount; i++) {
    const sliceStart = currentId;
    const sliceEnd = Math.min(currentId + sliceSize - 1, upperId);

    let available = 0;
    let unavailable = 0;

    while (idIndex < allIds.length && allIds[idIndex]!.id <= sliceEnd) {
      while (currentId < allIds[idIndex]!.id) {
        unavailable++;
        currentId++;
      }

      available++;
      currentId++;
      idIndex++;
    }

    unavailable += Math.max(0, sliceEnd - currentId + 1);
    const none = sliceSize - (available + unavailable);

    slices.push(
      new ManifestSlice({
        startId: sliceStart,
        endId: sliceEnd,
        available,
        unavailable,
        none,
      }),
    );

    currentId = sliceEnd + 1;
  }

  return slices;
};
