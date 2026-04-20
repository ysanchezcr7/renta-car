import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsStartBeforeEnd', async: false })
export class IsStartBeforeEndConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const object = args.object as any;
    const start = new Date(object.start_date);
    const end = new Date(object.end_date);
    return start < end;
  }

  defaultMessage(args: ValidationArguments) {
    return 'La fecha de inicio debe ser anterior a la fecha de fin.';
  }
}

export function IsStartBeforeEnd(validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      name: 'IsStartBeforeEnd',
      target: constructor,
      propertyName: undefined!, // <- importante: no estamos validando un campo, sino la clase
      options: validationOptions,
      validator: IsStartBeforeEndConstraint,
    });
  };
}
