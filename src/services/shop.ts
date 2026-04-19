import { api } from './api';

export function getItemShop() {
  return api.get('/tienda/items');
}

export function buyItem(itemId: number, cantidad: number) {
  return api.post('/tienda/comprar', {
    item_id: itemId,
    cantidad
  });
}
