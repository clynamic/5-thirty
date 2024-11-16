import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { DateRange, PartialDateRange, SeriesCountPoint } from 'src/common';
import { ManifestSlice } from 'src/health/health.dto';
import { ManifestSliceProps } from 'src/health/health.utils';
import { Worker } from 'worker_threads';

@Injectable()
export class WorkerService {
  private runWorker<T>(workerFile: string, workerData: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const workerPath = join(__dirname, workerFile);

      const worker = new Worker(workerPath, {
        workerData,
        execArgv: ['-r', 'ts-node/register'],
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  async generateSeriesCountPoints(
    dates: (Date | DateRange | undefined)[],
    range: PartialDateRange,
  ): Promise<SeriesCountPoint[]> {
    return this.runWorker<SeriesCountPoint[]>(
      'generate-series-count-points.js',
      {
        dates,
        range,
      },
    );
  }

  async generateManifestSlices(
    props: ManifestSliceProps,
  ): Promise<ManifestSlice[]> {
    return this.runWorker<ManifestSlice[]>(
      'generate-manifest-slices.js',
      props,
    );
  }
}
