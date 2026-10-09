declare module 'virtual:viewport-catalog' {
  const snapshot: import('./snapshot.ts').CatalogSnapshot | null;
  export default snapshot;
}
