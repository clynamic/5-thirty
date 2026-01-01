import { TileSlice } from './tile-health.dto';

export interface TileSliceProps {
  missingTimes: { time: Date }[];
  startDate: Date;
  endDate: Date;
  intervalHours?: number;
  maxSlices?: number;
}

export const generateTileSlices = ({
  missingTimes,
  startDate,
  endDate,
  intervalHours = 1,
  maxSlices = 30,
}: TileSliceProps): TileSlice[] => {
  const totalHours = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60),
  );
  const totalTiles = Math.ceil(totalHours / intervalHours);
  const sliceCount = Math.min(maxSlices, totalTiles);
  const tilesPerSlice = Math.ceil(totalTiles / sliceCount);

  const slices: TileSlice[] = [];
  let currentTime = new Date(startDate);
  let timeIndex = 0;

  for (let i = 0; i < sliceCount; i++) {
    const sliceStart = new Date(currentTime);
    const sliceEnd = new Date(
      Math.min(
        currentTime.getTime() + tilesPerSlice * intervalHours * 60 * 60 * 1000,
        endDate.getTime(),
      ),
    );

    let available = 0;
    let unavailable = 0;

    while (
      timeIndex < missingTimes.length &&
      missingTimes[timeIndex]!.time < sliceEnd
    ) {
      if (missingTimes[timeIndex]!.time >= sliceStart) {
        unavailable++;
      }
      timeIndex++;
    }

    const expectedInSlice = Math.ceil(
      (sliceEnd.getTime() - sliceStart.getTime()) /
        (intervalHours * 60 * 60 * 1000),
    );
    available = Math.max(0, expectedInSlice - unavailable);
    const none = tilesPerSlice - (available + unavailable);

    slices.push(
      new TileSlice({
        startDate: sliceStart,
        endDate: sliceEnd,
        available,
        unavailable,
        none,
      }),
    );

    currentTime = sliceEnd;
  }

  return slices;
};
