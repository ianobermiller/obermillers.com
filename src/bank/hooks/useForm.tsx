import { useState, type FormEvent, type ReactNode } from "react";
import * as v from "valibot";

export function useForm<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>({
  onSubmit,
  schema,
}: {
  onSubmit: (args: {
    data: v.InferOutput<TSchema>;
    event: FormEvent<HTMLFormElement>;
    form: HTMLFormElement;
  }) => Promise<void>;
  schema: TSchema;
}): { errors: ReactNode | undefined; handleSubmit: (e: FormEvent<HTMLFormElement>) => void } {
  const [errors, setErrors] = useState<ReactNode>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parseResult = v.safeParse(schema, Object.fromEntries(formData));

    if (parseResult.success) {
      setErrors(undefined);
      void onSubmit({ data: parseResult.output, event, form });
    } else {
      const { nested, other, root } = v.flatten(parseResult.issues);
      const messages = [];
      if (root) messages.push(...root);
      if (other) messages.push(...other);
      if (nested) {
        messages.push(
          ...Object.entries(nested).map(
            ([field, issues]) => `${field}: ${issues?.join(", ") ?? ""}`,
          ),
        );
      }
      setErrors(
        messages.length > 0 ? (
          <ul className="mt-4 text-red-600 dark:text-red-300">
            {messages.map((issue, i) => (
              <li className="ml-4 list-disc" key={i}>
                {issue}
              </li>
            ))}
          </ul>
        ) : undefined,
      );
    }
  }

  return { errors, handleSubmit };
}
