const https = require('https');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const apiKey = event.queryStringParameters && event.queryStringParameters.key;
  const endpoint = event.queryStringParameters && event.queryStringParameters.endpoint;

  if (!apiKey || !endpoint) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing key or endpoint parameter' })
    };
  }

  const allowedEndpoints = [
    '/v1/jobs',
    '/v1/estimates',
    '/v1/customers',
    '/v1/employees',
    '/v1/invoices',
    '/v1/payments',
  ];

  const isAllowed = allowedEndpoints.some(e => endpoint.startsWith(e));
  if (!isAllowed) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Endpoint not allowed' })
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const queryParts = [];
    Object.keys(params).forEach(k => {
      if (k !== 'key' && k !== 'endpoint') {
        queryParts.push(k + '=' + encodeURIComponent(params[k]));
      }
    });
    const queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    const fullUrl = 'https://api.housecallpro.com' + endpoint + queryString;

    const data = await new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Authorization': 'Token token=' + apiKey,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(fullUrl, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch(e) {
            resolve({ status: res.statusCode, body: body });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });

    return {
      statusCode: data.status,
      headers,
      body: JSON.stringify(data.body)
    };

  } catch(err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
