/**
 * Blank subview spec template (Reset to Template).
 */
export const BLANK_SPEC = {
  type: 'readonly',
  name: 'New Subview',
  description: '',
  maker: 'official',
  defaultSize: '2x1',
  inputs: {},
  layout: [[{ weight: 1, alignment: 'center middle', content: [{ text: { value: 'py:placeholder', alignment: 'center' } }] }]],
  python_code: 'def placeholder(context, inputs):\n    return "Hello"\n',
  functions: ['placeholder'],
} as const;
