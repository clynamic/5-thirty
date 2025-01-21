import { AppDataSource } from 'src/data-source';
import { Column, ColumnOptions, DataSource } from 'typeorm';

/**
 * Utility type to extract the options type for the standard Column signature.
 */
type ExtractColumnOptions<T> = T extends (
  options?: infer O,
) => PropertyDecorator
  ? O
  : never;

export const DefaultColumn: (options?: ColumnOptions) => PropertyDecorator = (
  options,
) => Column(options as ColumnOptions);

/**
 * MetaColumn: A decorator that wraps a base column decorator and dynamically configures it.
 *
 * @param base - The base column decorator (e.g., `Column`, `CreateDateColumn`, etc.).
 * @param resolver - A callback that provides options for the base column based on the DataSource.
 */
export function MetaColumn<
  BaseColumn extends (options?: ColumnOptions) => PropertyDecorator,
>(
  base: BaseColumn,
  resolver: (dataSource: DataSource) => ExtractColumnOptions<BaseColumn>,
): (options?: Partial<ExtractColumnOptions<BaseColumn>>) => PropertyDecorator {
  return (userOptions?: Partial<ExtractColumnOptions<BaseColumn>>) => {
    return (target, propertyKey) => {
      const dataSource = AppDataSource;

      // Combine options dynamically and statically
      const resolvedOptions = {
        ...resolver(dataSource),
        ...userOptions,
      } as ExtractColumnOptions<BaseColumn>;

      base(resolvedOptions)(target, propertyKey as string);
    };
  };
}
