export async function getValue(metric: string) {
  const query = `${metric}`;

  const req: any = await fetch(`${PROMETHEUS_ENDPOINT}/api/v1/query?query=${query}`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${PROMETHEUS_USERNAME}:${PROMETHEUS_PASSWORD}`).toString('base64')}`,
    },
  }).then((r) => r.json());

  const series = req.data.result[0];
  return ~~series.value[1];
}

export async function getValueIncrease(metric: string, time: string) {
  const query = `increase(${metric}[${time}])`;

  const req: any = await fetch(`${PROMETHEUS_ENDPOINT}/api/v1/query?query=${query}`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${PROMETHEUS_USERNAME}:${PROMETHEUS_PASSWORD}`).toString('base64')}`,
    },
  }).then((r) => r.json());

  const series = req.data.result[0];
  return ~~series.value[1];
}
