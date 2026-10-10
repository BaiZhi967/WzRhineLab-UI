import * as React from 'react';
import { Form as BaseForm } from '@base-ui/react/form';
import { cx } from '../utils/cx.js';

type BaseFormProps = React.ComponentProps<typeof BaseForm>;

export type FormProps = Omit<BaseFormProps, 'className' | 'style' | 'render'> & {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * `<form>` on Base UI Form. On submit it validates every Field / CheckboxGroup / RadioGroup
 * inside, shows their errors, moves focus to the first invalid control and only then calls
 * `onSubmit`. `errors` maps field `name`s to server-side messages after a failed submission.
 * A plain `<form>` still works, but then errors only appear per field on change / blur.
 *
 *   <Form onSubmit={save} errors={serverErrors}>
 *     <Field name="title" label="标题" error="请填写标题。" errorMatch="valueMissing"><Input required /></Field>
 *     <Button type="submit">保存</Button>
 *   </Form>
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form({ className, style, ...rest }, ref) {
  return <BaseForm {...rest} ref={ref} className={cx('rl-form', className)} style={style} data-slot="form" />;
});
