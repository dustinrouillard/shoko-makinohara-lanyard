import { Env } from '../types/Routes';
import { trackServiceError } from './stats';

async function queryPrometheus(query: string, env?: Env): Promise<number> {
  try {
    const res = await fetch(`${PROMETHEUS_ENDPOINT}/api/v1/query?query=${query}`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${PROMETHEUS_USERNAME}:${PROMETHEUS_PASSWORD}`).toString('base64')}`,
      },
    });
    if (!res.ok) throw new Error(`prometheus_http_${res.status}`);

    const req: any = await res.json();
    const series = req?.data?.result?.[0];
    if (!series) throw new Error('prometheus_empty_result');

    return ~~series.value[1];
  } catch (error) {
    if (env) await trackServiceError('prometheus', env);
    throw error;
  }
}

export async function getValue(metric: string, env?: Env) {
  return queryPrometheus(metric, env);
}

export async function getValueIncrease(metric: string, time: string, env?: Env) {
  return queryPrometheus(`increase(${metric}[${time}])`, env);
}
