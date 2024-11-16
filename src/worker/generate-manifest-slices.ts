import {
  generateManifestSlices,
  ManifestSliceProps,
} from 'src/health/health.utils';
import { parentPort, workerData } from 'worker_threads';

if (parentPort) {
  const sliceProps = workerData as ManifestSliceProps;
  const slices = generateManifestSlices(sliceProps);
  parentPort.postMessage(slices);
}
