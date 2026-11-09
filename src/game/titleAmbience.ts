export type TitlePropKind = "avocado" | "goose" | "pillow";
export type TitleProp = { id: number; kind: TitlePropKind; born: number; life: number; y: number; x: number; reverse: boolean };
export const TITLE_PROP_LIMIT = 2;
export const TITLE_PROP_LIFE = { avocado: 6_000, goose: 7_000, pillow: 2_800 };
export function nextTitleSpawnDelay(random = Math.random) {
  return 3_000 + random() * 2_000;
}
/** Remove expired decorations from state, not just from the rendered view. */
export function liveTitleProps(props: TitleProp[], now: number) {
  return props.filter((prop) => now - prop.born < prop.life).slice(0, TITLE_PROP_LIMIT);
}
export function addTitleProp(props: TitleProp[], prop: TitleProp, now: number) {
  const live = liveTitleProps(props, now);
  return live.length < TITLE_PROP_LIMIT ? [...live, prop] : live;
}