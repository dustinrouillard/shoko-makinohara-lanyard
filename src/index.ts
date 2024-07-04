import { routes } from './routes';

import { CraftedResponse, Env, Method, ParsedRequest } from './types/Routes';
import { NotFound } from './methods/notfound';

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    return new Promise(async (resolve) => {
      const url = new URL(_request.url);

      const request = _request.clone();
      const headers = Object.fromEntries([...request.headers]);
      const method = request.method as Method;
      const buffer = await request.clone().arrayBuffer();

      let body;
      if (!['GET', 'OPTIONS', 'HEAD'].includes(method)) {
        if (request.headers.get('content-type')?.startsWith('application/json')) body = await request.json();
        else body = await request.text();
      }

      const route = routes.find(
        (route) => route.route.match(url.pathname.endsWith('/') && url.pathname.length > 1 ? url.pathname.slice(0, -1) : url.pathname) && route.method == _request.method,
      );
      const params = route?.route.match(url.pathname.endsWith('/') && url.pathname.length > 1 ? url.pathname.slice(0, -1) : url.pathname);
      const query = Object.fromEntries([...url.searchParams]);

      const req: ParsedRequest = {
        body,
        buffer,
        headers,
        method,
        params,
        query,
        url,
        env,
        cloudflare: request.cf
      };

      const res: CraftedResponse = {
        statusCode: 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
        },
        redirect: (target: string, code = 302) => {
          const response = Response.redirect(target, code);
          resolve(response);
        },
        send: (body?: any) => {
          if (typeof body == 'object' && !res.headers['content-type']) res.headers['content-type'] = 'application/json';
          const response = new Response(typeof body == 'object' ? JSON.stringify(body) : body, { headers: res.headers, status: res.statusCode });
          console.log('sending', response);
          resolve(response);
        },
        proxy: async (host: string) => {
          const response = await fetch(`${host}${url.pathname}`, request);
          resolve(response);
        },
        header: (key: string, value: string | number | any) => {
          res.headers[key.toLowerCase()] = value.toString();
          return res;
        },
        status: (code: number) => {
          res.statusCode = code;
          return res;
        },
      };

      try {
        if (route?.middlewares)
          for await (const middleware of route.middlewares) {
            let mw = await middleware(req, res);
            if (!mw) return mw;
          }
      } catch (error) {
        console.error('mw error', error);
        resolve(new Response(JSON.stringify({ code: 'internal_error' }), { status: 403, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } }));
      }

      try {
        route ? route.handler(req, res) : NotFound(req, res);
      } catch (error) {
        console.error('error', error);
        resolve(new Response(JSON.stringify({ code: 'internal_error' }), { status: 500, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } }));
      }
    });
  },
};