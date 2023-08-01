import {useCallback, useMemo} from 'react';
import type {z} from 'zod';
import {Checkmark} from '../../../icons/Checkmark';
import {useZodIfPossible} from '../../get-zod-if-possible';
import type {ComboboxValue} from '../../NewComposition/ComboBox';
import {Combobox} from '../../NewComposition/ComboBox';
import {Fieldset} from './Fieldset';
import {useLocalState} from './local-state';
import {SchemaLabel} from './SchemaLabel';
import type {JSONPath} from './zod-types';
import type {UpdaterFunction} from './ZodSwitch';

export const ZodDiscriminatedUnionEditor: React.FC<{
	schema: z.ZodTypeAny;
	setValue: UpdaterFunction<Record<string, unknown>>;
	value: Record<string, unknown>;
	defaultValue: Record<string, unknown>;
	mayPad: boolean;
	jsonPath: JSONPath;
	onRemove: null | (() => void);
	onSave: UpdaterFunction<unknown>;
	showSaveButton: boolean;
	saving: boolean;
	saveDisabledByParent: boolean;
}> = ({
	schema,
	setValue,
	showSaveButton,
	saving,
	value,
	defaultValue,
	saveDisabledByParent,
	onSave,
	mayPad,
	jsonPath,
	onRemove,
}) => {
	const z = useZodIfPossible();
	if (!z) {
		throw new Error('expected zod');
	}

	const typedSchema = schema._def as z.ZodDiscriminatedUnionDef<string>;
	const options = useMemo(
		() => [...typedSchema.optionsMap.keys()],
		[typedSchema.optionsMap]
	) as string[];
	console.log(options);

	const {
		localValue,
		onChange: setLocalValue,
		reset,
	} = useLocalState({
		schema,
		setValue,
		value,
		defaultValue,
	});

	const comboBoxValues = useMemo(() => {
		return options.map((option): ComboboxValue => {
			return {
				value: option,
				label: option,
				id: option,
				keyHint: null,
				leftItem:
					option === value[typedSchema.discriminator] ? <Checkmark /> : null,
				onClick: () => {},
				quickSwitcherLabel: null,
				subMenu: null,
				type: 'item',
			};
		});
	}, [options, typedSchema.discriminator, value]);

	const save = useCallback(() => {
		onSave(() => value, false, false);
	}, [onSave, value]);

	return (
		<Fieldset shouldPad={mayPad} success={localValue.zodValidation.success}>
			<SchemaLabel
				isDefaultValue={localValue.value === defaultValue}
				jsonPath={jsonPath}
				onRemove={onRemove}
				onReset={reset}
				onSave={save}
				saveDisabledByParent={saveDisabledByParent}
				saving={saving}
				showSaveButton={showSaveButton}
				suffix={null}
				valid={localValue.zodValidation.success}
			/>
			<SchemaLabel
				isDefaultValue={localValue.value === defaultValue}
				jsonPath={[...jsonPath, typedSchema.discriminator]}
				onRemove={onRemove}
				onReset={reset}
				onSave={save}
				saveDisabledByParent={saveDisabledByParent}
				saving={saving}
				showSaveButton={showSaveButton}
				suffix={null}
				valid={localValue.zodValidation.success}
			/>
			<Combobox
				title="Select type"
				values={comboBoxValues}
				selectedId={localValue.value[typedSchema.discriminator] as string}
			/>
		</Fieldset>
	);
};
