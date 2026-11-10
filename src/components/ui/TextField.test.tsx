import { zodResolver } from '@hookform/resolvers/zod';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import es from '@/locales/es.json';
import { dateMask } from '@/lib/input-masks';
import { useFieldError } from '@/lib/use-field-error';
import { dateField } from '@/lib/validation';
import { TextField } from './TextField';

const schema = z.object({ startDate: dateField });

function DateForm() {
  const fieldError = useFieldError();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { startDate: '' },
  });
  return (
    <form noValidate onSubmit={handleSubmit(() => {})}>
      <TextField
        label="Fecha de ingreso"
        helperText="Formato DD/MM/AAAA"
        mask={dateMask}
        maxLength={10}
        error={fieldError(errors.startDate)}
        {...register('startDate')}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe('TextField with a mask and validation', () => {
  it('does not accept letters in a date field', () => {
    render(<DateForm />);
    const input = screen.getByLabelText('Fecha de ingreso') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'asd' } });
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: '13102026' } });
    expect(input.value).toBe('13/10/2026');
  });

  it('cleans pasted text even if a maxLength is passed', () => {
    render(<DateForm />);
    const input = screen.getByLabelText('Fecha de ingreso') as HTMLInputElement;
    expect(input).not.toHaveAttribute('maxlength');
    fireEvent.change(input, { target: { value: 'asd13x10y2026' } });
    expect(input.value).toBe('13/10/2026');
  });

  it('shows no error while typing for the first time, then validates on blur', async () => {
    render(<DateForm />);
    const input = screen.getByLabelText('Fecha de ingreso');
    fireEvent.change(input, { target: { value: '3102' } });
    expect(input).not.toHaveAttribute('aria-invalid');

    await act(async () => {
      fireEvent.blur(input);
    });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(es.validation.dateFormat)).toBeInTheDocument();
    // The value typed so far is kept.
    expect((input as HTMLInputElement).value).toBe('31/02');
  });

  it('flags a date that does not exist and clears the error as soon as it is fixed', async () => {
    render(<DateForm />);
    const input = screen.getByLabelText('Fecha de ingreso');
    await act(async () => {
      fireEvent.change(input, { target: { value: '31022026' } });
      fireEvent.blur(input);
    });
    expect(screen.getByText(es.validation.dateInvalid)).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { value: '28022026' } });
    });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(es.validation.dateInvalid)).not.toBeInTheDocument();
    expect(screen.getByText('Formato DD/MM/AAAA')).toBeInTheDocument();
  });
});
