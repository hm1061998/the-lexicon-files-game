import { expect, it } from 'vitest';
import { createNavigationController } from './navigationController';
it('arrives then stops without interacting and replaces/cancels routes', () => {
  const route = createNavigationController();
  route.replace([{ u: 1, v: 1 }]);
  expect(route.direction({ u: 0, v: 0 }, 16)).toEqual({ u: 1, v: 1 });
  expect(route.direction({ u: 1, v: 1 }, 16)).toBeNull();
  expect(route.isActive()).toBe(false);
  route.replace([{ u: 2, v: 0 }]);
  route.replace([{ u: 0, v: 2 }]);
  expect(route.direction({ u: 0, v: 0 }, 16)).toEqual({ u: 0, v: 2 });
  route.cancel();
  expect(route.direction({ u: 0, v: 0 }, 16)).toBeNull();
});
it('stops a route after 500ms without progress', () => {
  const route = createNavigationController();
  route.replace([{ u: 2, v: 2 }]);
  for (let i = 0; i < 10; i++) route.observeMovement({ u: 0, v: 0 }, { u: 0, v: 0 }, 50);
  expect(route.isActive()).toBe(false);
});
