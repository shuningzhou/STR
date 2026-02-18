/**
 * Blank subview spec template (Reset to Template).
 */
export const BLANK_SPEC = {
  type: 'readonly',
  name: 'New Subview',
  description: '',
  maker: 'official',
  defaultSize: { w: 400, h: 80 },
  inputs: {},
  layout: [[{ flex: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: [{ text: { value: 'py:placeholder', alignment: 'center' } }] }]],
  python_code: 'def placeholder(context, inputs):\n    return "Hello"\n',
  functions: ['placeholder'],
} as const;
