import {
  DateRange,
  generateSeriesCountPoints,
  PartialDateRange,
} from 'src/common';
import { parentPort, workerData } from 'worker_threads';

if (parentPort) {
  const {
    dates,
    range,
  }: {
    dates: (Date | DateRange | undefined)[];
    range: PartialDateRange;
  } = workerData;

  const result = generateSeriesCountPoints(dates, range);

  parentPort.postMessage(result);
}
