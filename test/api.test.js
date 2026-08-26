import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET / - Root Endpoint', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'online');
});

test('GET /api/v1/health - Health check endpoint', async () => {
  const res = await fetch(`${baseUrl}/api/v1/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.uptime !== undefined);
});

test('GET /api/v1/products - Fetch products list', async () => {
  const res = await fetch(`${baseUrl}/api/v1/products`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length > 0);
});

test('POST /api/v1/products - Create a new product', async () => {
  const newProduct = {
    name: 'Almond Bar 100g',
    sellingPrice: 80,
    mrp: 90,
    costPrice: 60,
    stock: 20
  };

  const res = await fetch(`${baseUrl}/api/v1/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProduct)
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.name, 'Almond Bar 100g');
});

test('GET /api/v1/categories - Fetch categories', async () => {
  const res = await fetch(`${baseUrl}/api/v1/categories`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length > 0);
});

test('POST /api/v1/orders - Create an order', async () => {
  const orderPayload = {
    customerName: 'Test Customer',
    items: [
      { productId: 'prod-1', name: 'Peanut Chikki 200g', quantity: 2, price: 55.00 }
    ],
    paymentMethod: 'UPI'
  };

  const res = await fetch(`${baseUrl}/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.paymentMethod, 'UPI');
});

test('GET /api/v1/upload/auth - Get ImageKit authentication parameters', async () => {
  const res = await fetch(`${baseUrl}/api/v1/upload/auth`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.data.token !== undefined);
  assert.ok(data.data.signature !== undefined);
  assert.ok(data.data.expire !== undefined);
});

test('GET /unknown-route - Returns 404', async () => {
  const res = await fetch(`${baseUrl}/unknown-endpoint`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});
