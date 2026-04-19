import { api } from './api';

export function getPaymentsCatalog() {
  return api.get('/payments/catalogo');
}

export function getActiveBenefits() {
  return api.get('/payments/beneficios/activos');
}

export function getPurchaseHistory(limit = 20) {
  return api.get(`/payments/compras?limit=${limit}`);
}
