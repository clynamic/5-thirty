import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);

export default dayjs;
