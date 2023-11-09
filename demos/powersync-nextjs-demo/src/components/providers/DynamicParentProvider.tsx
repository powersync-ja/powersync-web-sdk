import dynamic from 'next/dynamic';

/**
 * Only use PowerSync in client side rendering
 */
export const DynamicParentProvider = dynamic(() => import('./ParentProvider'), {
  ssr: false
});
