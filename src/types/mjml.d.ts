// mjml ships no types; the package only needs the default export signature.
declare module 'mjml' {
  interface MjmlResult {
    html: string;
    errors: unknown[];
    json?: unknown;
  }
  const mjml2html: (
    mjml: string,
    options?: Record<string, unknown>,
  ) => MjmlResult | Promise<MjmlResult>;
  export default mjml2html;
}
