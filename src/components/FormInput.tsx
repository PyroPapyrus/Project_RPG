import { InputHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef } from 'react'

type BaseFormInputProps = {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

type InputProps = BaseFormInputProps & Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseFormInputProps> & {
  type: Exclude<string, 'textarea'>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type TextareaProps = BaseFormInputProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseFormInputProps> & {
  type: 'textarea';
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

type FormInputProps = InputProps | TextareaProps;

export function FormInput(props: FormInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (props.type === 'textarea') {
      adjustTextareaHeight();
    }
  }, [props.value, props.type]);

  const baseClasses = "w-full justify-items-start rounded-r-md px-3 py-2 text-sm";
  const textareaClasses = `${baseClasses} min-h-[100px] resize-none overflow-hidden ${props.className || ''}`;
  const inputClasses = `${baseClasses} ${props.className || ''}`;

  if (props.type === 'textarea') {
    const { onChange, ...textareaProps } = props as TextareaProps;
    return (
      <div>
        <label htmlFor={textareaProps.id} className="sr-only">
          
          {textareaProps.placeholder}
        </label>
        <textarea
          ref={textareaRef}
          className={textareaClasses}
          onChange={(e) => {
            onChange(e);
            adjustTextareaHeight();
          }}
          {...textareaProps}
        />
      </div>
    );
  }

  const { onChange, ...inputProps } = props as InputProps;
  return (
    <div>
      <label htmlFor={inputProps.id} className="sr-only">
        {inputProps.placeholder}
      </label>
      <input
        className={inputClasses}
        onChange={onChange}
        {...inputProps}
      />
    </div>
  );
} 