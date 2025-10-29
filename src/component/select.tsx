import React, { useState, useRef, useEffect, type ReactNode, type ReactElement } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

// Types
interface SelectProps {
	children: ReactNode;
	value: string;
	onValueChange: (value: string) => void;
	defaultValue?: string;
	required?: boolean;
	disabled?: boolean;
	name?: string;
	onOpenChange?: (open: boolean) => void;
	defaultOpen?: boolean;
	creatable?: boolean;
	onCreateOption?: (value: string) => void;
	maxLength?: number;
}

interface MultiSelectProps {
	children: ReactNode;
	value: string[];
	onValueChange: (value: string[]) => void;
	defaultValue?: string[];
	required?: boolean;
	disabled?: boolean;
	name?: string;
	onOpenChange?: (open: boolean) => void;
	defaultOpen?: boolean;
	placeholder?: string;
	creatable?: boolean;
	onCreateOption?: (value: string) => void;
	maxLength?: number;
}

interface SelectTriggerProps {
	children?: ReactNode;
	value?: string;
	isOpen?: boolean;
	onToggle?: () => void;
	className?: string;
	contentChildren?: ReactNode;
	disabled?: boolean;
	creatable?: boolean;
	onInputChange?: (value: string) => void;
	inputValue?: string;
}

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
	placeholder?: string;
}

interface SelectContentProps {
	children: ReactNode;
	isOpen?: boolean;
	onValueChange?: (value: string) => void;
	value?: string;
	filterValue?: string;
}

interface SelectItemProps {
	children: ReactNode;
	value: string;
	onValueChange?: (value: string) => void;
	selectedValue?: string;
	selectedValues?: string[];
	onToggleValue?: (value: string) => void;
}

// Select Component
const Select: React.FC<SelectProps> = ({
																				 children,
																				 value,
																				 onValueChange,
																				 defaultValue = '',
																				 required = false,
																				 disabled = false,
																				 name,
																				 onOpenChange,
																				 defaultOpen = false,
																				 creatable = false,
																				 onCreateOption,
																				 maxLength
																			 }) => {
	const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
	const [inputValue, setInputValue] = useState<string>('');
	const selectRef = useRef<HTMLDivElement>(null);

	const isOpen = internalOpen;

	const handleOpenChange = (open: boolean): void => {
		if (disabled) return;
		setInternalOpen(open);
		onOpenChange?.(open);
		if (!open) {
			setInputValue('');
		}
	};

	const handleValueChange = (newValue: string): void => {
		// Validate length if maxLength is set
		if (maxLength && newValue.length > maxLength) {
			return;
		}
		onValueChange(newValue);
		handleOpenChange(false);
		setInputValue('');
	};

	const handleInputChange = (newInputValue: string): void => {
		// Prevent input beyond maxLength
		if (maxLength && newInputValue.length > maxLength) {
			return;
		}
		setInputValue(newInputValue);
		if (!isOpen) {
			handleOpenChange(true);
		}
	};

	const handleCreateValue = (): void => {
		const trimmedValue = inputValue.trim();
		if (trimmedValue) {
			// Validate length before creating
			if (maxLength && trimmedValue.length > maxLength) {
				return;
			}
			onCreateOption?.(trimmedValue);
			handleValueChange(trimmedValue);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent): void => {
		if (!creatable || !inputValue.trim()) return;

		if (e.key === 'Enter') {
			e.preventDefault();
			// Check if there are matching options
			const selectContent = React.Children.toArray(children).find(
				(c): c is ReactElement => React.isValidElement(c) && c.type === SelectContent
			);

			if (selectContent) {
				const hasMatch = React.Children.toArray(selectContent.props.children).some(child => {
					if (!React.isValidElement<SelectItemProps>(child)) return false;
					const label = typeof child.props.children === 'string' ? child.props.children : child.props.value;
					return label.toLowerCase().includes(inputValue.toLowerCase());
				});

				if (!hasMatch) {
					handleCreateValue();
				}
			}
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
				handleOpenChange(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div ref={selectRef} className="relative inline-block w-full">
			{/* Hidden input for form submission */}
			{name && (
				<input
					type="hidden"
					name={name}
					value={value}
					required={required}
				/>
			)}
			{React.Children.map(children, child => {
				if (React.isValidElement(child)) {
					// Find SelectContent to pass its children to SelectTrigger
					const selectContent = React.Children.toArray(children).find(
						(c): c is ReactElement<SelectContentProps> => React.isValidElement(c) && c.type === SelectContent
					);

					return React.cloneElement(child, {
						value: value,
						isOpen,
						onToggle: () => handleOpenChange(!isOpen),
						onValueChange: handleValueChange,
						contentChildren: selectContent?.props.children,
						disabled,
						creatable,
						onInputChange: handleInputChange,
						inputValue,
						onKeyDown: handleKeyDown,
						filterValue: creatable ? inputValue : undefined,
						onCreateValue: handleCreateValue,
						maxLength,
					});
				}
				return child;
			})}
		</div>
	);
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({
																											 children,
																											 value,
																											 isOpen,
																											 onToggle,
																											 className = '',
																											 contentChildren,
																											 disabled,
																											 creatable,
																											 onInputChange,
																											 inputValue,
																											 onKeyDown,
																											 maxLength
																										 }) => {
	const inputRef = useRef<HTMLInputElement>(null);

	// Find the selected item's label from contentChildren
	let displayText: ReactNode = children;

	if (value && contentChildren) {
		const selectedItem = React.Children.toArray(contentChildren).find(child => {
			return React.isValidElement<SelectItemProps>(child) && child.props.value === value;
		});

		if (selectedItem && React.isValidElement<SelectItemProps>(selectedItem)) {
			displayText = selectedItem.props.children;
		}
	}

	const handleClick = () => {
		onToggle?.();
		if (creatable && isOpen) {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	};

	if (creatable) {
		return (
			<div
				onClick={handleClick}
				className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-400 focus-within:ring-offset-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'} ${className}`}
			>
				<input
					ref={inputRef}
					type="text"
					value={isOpen ? inputValue : (value || '')}
					onChange={(e) => onInputChange?.(e.target.value)}
					onKeyDown={onKeyDown}
					disabled={disabled}
					maxLength={maxLength}
					placeholder={!value ? (typeof children === 'string' ? children : 'Type to search or create...') : ''}
					className="flex-1 outline-none bg-transparent"
				/>
				<ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={onToggle}
			disabled={disabled}
			className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
		>
			<span className={`block truncate ${!value ? 'text-gray-400' : ''}`}>{displayText}</span>
			<ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
		</button>
	);
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className = '', ...props }) => {
	return <span className={`block truncate ${className}`} {...props}>{placeholder}</span>;
};

interface SelectContentInternalProps extends SelectContentProps {
	creatable?: boolean;
	onCreateValue?: () => void;
}

const SelectContent: React.FC<SelectContentProps> = ({ children, isOpen, onValueChange, value, filterValue, creatable, onCreateValue }) => {
	if (!isOpen) return null;

	// Filter children based on filterValue
	const filteredChildren = filterValue
		? React.Children.toArray(children).filter(child => {
			if (!React.isValidElement<SelectItemProps>(child)) return true;
			const label = typeof child.props.children === 'string' ? child.props.children : child.props.value;
			return label.toLowerCase().includes(filterValue.toLowerCase());
		})
		: React.Children.toArray(children);

	const hasResults = filteredChildren.length > 0;

	return (
		<div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
			<div className="max-h-60 overflow-auto p-1">
				{filteredChildren.map((child, index) => {
					if (React.isValidElement<SelectItemProps>(child)) {
						return React.cloneElement(child, {
							key: child.props.value || index,
							onValueChange,
							selectedValue: value,
						});
					}
					return child;
				})}
				{!hasResults && !creatable && filterValue && (
					<div className="px-2 py-1.5 text-sm text-gray-500">No options found</div>
				)}
				{!hasResults && creatable && filterValue && (
					<div
						onClick={onCreateValue}
						className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100"
					>
						<span className="text-gray-600">Create: <span className="font-medium">'{filterValue}'</span></span>
					</div>
				)}
				{!hasResults && !filterValue && React.Children.count(children) === 0 && (
					<div className="px-2 py-1.5 text-sm text-gray-500">No options available</div>
				)}
			</div>
		</div>
	);
};

const SelectItem: React.FC<SelectItemProps> = ({
																								 children,
																								 value,
																								 onValueChange,
																								 selectedValue,
																								 selectedValues,
																								 onToggleValue
																							 }) => {
	// Handle both single and multi select
	const isSelected = selectedValues
		? selectedValues.includes(value)
		: value === selectedValue;

	const handleClick = () => {
		if (onToggleValue) {
			onToggleValue(value);
		} else if (onValueChange) {
			onValueChange(value);
		}
	};

	return (
		<div
			onClick={handleClick}
			className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${
				isSelected ? 'bg-gray-100' : ''
			}`}
		>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
			{children}
		</div>
	);
};

// MultiSelect Component
const MultiSelect: React.FC<MultiSelectProps> = ({
																									 children,
																									 value,
																									 onValueChange,
																									 defaultValue = [],
																									 required = false,
																									 disabled = false,
																									 name,
																									 onOpenChange,
																									 defaultOpen = false,
																									 placeholder = 'Select items...',
																									 creatable = false,
																									 onCreateOption,
																									 maxLength
																								 }) => {
	const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
	const [inputValue, setInputValue] = useState<string>('');
	const selectRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const isOpen = internalOpen;

	const handleOpenChange = (open: boolean): void => {
		if (disabled) return;
		setInternalOpen(open);
		onOpenChange?.(open);
		if (!open) {
			setInputValue('');
		}
	};

	const handleToggleValue = (selectedValue: string): void => {
		const newValue = value.includes(selectedValue)
			? value.filter(v => v !== selectedValue)
			: [...value, selectedValue];
		onValueChange(newValue);
		setInputValue(''); // Clear input after selecting
	};

	const handleRemoveValue = (selectedValue: string, e: React.MouseEvent): void => {
		e.stopPropagation();
		onValueChange(value.filter(v => v !== selectedValue));
	};

	const handleCreateValue = (): void => {
		const trimmedValue = inputValue.trim();
		if (trimmedValue && !value.includes(trimmedValue)) {
			// Validate length before creating
			if (maxLength && trimmedValue.length > maxLength) {
				return;
			}
			onCreateOption?.(trimmedValue);
			onValueChange([...value, trimmedValue]);
			setInputValue('');
			// Keep dropdown open and refocus input
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	};

	const handleInputChange = (newValue: string): void => {
		// Prevent input beyond maxLength
		if (maxLength && newValue.length > maxLength) {
			return;
		}
		setInputValue(newValue);
	};

	const handleKeyDown = (e: React.KeyboardEvent): void => {
		if (!creatable || !inputValue.trim()) return;

		if (e.key === 'Enter') {
			e.preventDefault();
			// Check if there are matching options
			const selectContent = React.Children.toArray(children).find(
				(c): c is ReactElement => React.isValidElement(c) && c.type === SelectContent
			);

			if (selectContent) {
				const hasMatch = React.Children.toArray(selectContent.props.children).some(child => {
					if (!React.isValidElement<SelectItemProps>(child)) return false;
					const label = typeof child.props.children === 'string' ? child.props.children : child.props.value;
					return label.toLowerCase().includes(inputValue.toLowerCase());
				});

				if (!hasMatch) {
					handleCreateValue();
				}
			}
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
				handleOpenChange(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	// Find SelectContent to get items
	const selectContent = React.Children.toArray(children).find(
		(c): c is ReactElement<SelectContentProps> => React.isValidElement(c) && c.type === SelectContent
	);

	const getItemLabel = (itemValue: string): ReactNode => {
		if (!selectContent) return itemValue;
		const item = React.Children.toArray(selectContent.props.children).find(child => {
			return React.isValidElement<SelectItemProps>(child) && child.props.value === itemValue;
		});
		return item && React.isValidElement<SelectItemProps>(item) ? item.props.children : itemValue;
	};

	const handleContainerClick = () => {
		if (!isOpen) {
			handleOpenChange(true);
		}
		if (creatable) {
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	};

	const handleClearAll = (e: React.MouseEvent): void => {
		e.stopPropagation();
		onValueChange([]);
	};

	// Filter children based on input value
	const filteredChildren = inputValue && selectContent
		? React.Children.toArray(selectContent.props.children).filter(child => {
			if (!React.isValidElement<SelectItemProps>(child)) return true;
			const label = typeof child.props.children === 'string' ? child.props.children : child.props.value;
			return label.toLowerCase().includes(inputValue.toLowerCase());
		})
		: selectContent ? React.Children.toArray(selectContent.props.children) : [];

	const hasFilteredResults = filteredChildren.length > 0;

	return (
		<div ref={selectRef} className="relative inline-block w-full">
			{/* Hidden input for form submission */}
			{name && value.map((v, idx) => (
				<input
					key={idx}
					type="hidden"
					name={`${name}[]`}
					value={v}
				/>
			))}

			<div
				onClick={handleContainerClick}
				className={`flex min-h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-400 focus-within:ring-offset-2 ${disabled ? 'cursor-not-allowed opacity-50' : creatable ? 'cursor-text' : 'cursor-pointer'}`}
			>
				<div className="flex flex-wrap gap-1 flex-1">
					{value.length === 0 && !creatable && (
						<span className="text-gray-400">{placeholder}</span>
					)}
					{value.map((v) => (
						<span
							key={v}
							className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-sm"
						>
              {getItemLabel(v)}
							<X
								className="h-3 w-3 cursor-pointer hover:text-red-500"
								onClick={(e) => handleRemoveValue(v, e)}
							/>
            </span>
					))}
					{creatable && (
						<input
							ref={inputRef}
							type="text"
							value={inputValue}
							onChange={(e) => handleInputChange(e.target.value)}
							onKeyDown={handleKeyDown}
							onFocus={() => {
								if (!isOpen) {
									handleOpenChange(true);
								}
							}}
							disabled={disabled}
							maxLength={maxLength}
							placeholder={value.length === 0 ? placeholder : ''}
							className="flex-1 min-w-[120px] outline-none bg-transparent"
							onClick={(e) => e.stopPropagation()}
						/>
					)}
				</div>
				<div className="flex items-center gap-1 ml-2 flex-shrink-0">
					{value.length > 0 && (
						<X
							className="h-4 w-4 cursor-pointer hover:text-red-500 opacity-50 hover:opacity-100"
							onClick={handleClearAll}
						/>
					)}
					<ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
				</div>
			</div>

			{isOpen && selectContent && (
				<div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
					<div className="max-h-60 overflow-auto p-1">
						{filteredChildren.map((child, index) => {
							if (React.isValidElement<SelectItemProps>(child)) {
								return React.cloneElement(child, {
									key: child.props.value || index,
									selectedValues: value,
									onToggleValue: handleToggleValue,
								});
							}
							return child;
						})}
						{!hasFilteredResults && !creatable && inputValue && (
							<div className="px-2 py-1.5 text-sm text-gray-500">No options found</div>
						)}
						{!hasFilteredResults && creatable && inputValue.trim() && !value.includes(inputValue.trim()) && (
							<div
								onClick={handleCreateValue}
								className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100"
							>
								<span className="text-gray-600">Create: <span className="font-medium">'{inputValue.trim()}'</span></span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

// Demo Component
export function SelectDemo() {
	const [framework, setFramework] = useState<string>('');
	const [fruit, setFruit] = useState<string>('apple');
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [frameworks, setFrameworks] = useState<string[]>(['react', 'vue']);
	const [colors, setColors] = useState<string[]>([]);
	const [customValue, setCustomValue] = useState<string>('');
	const [customOptions] = useState<string[]>(['Option 1', 'Option 2', 'Option 3']);
	const [tags, setTags] = useState<string[]>(['react', 'typescript']);
	const [availableTags] = useState<string[]>(['react', 'typescript', 'javascript', 'python', 'go']);

	const handleSubmit = (): void => {
		alert(`Framework: ${framework || 'Not selected'}\nFruit: ${fruit}\nFrameworks: ${frameworks.join(', ')}\nTags: ${tags.join(', ')}`);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
			<div className="w-full max-w-md space-y-8">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold text-gray-900">Select Component</h1>
					<p className="text-gray-600">A shadcn-style select component with TypeScript</p>
				</div>

				<div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Select a framework <span className="text-red-500">*</span>
						</label>
						<Select
							value={framework}
							onValueChange={setFramework}
							required={true}
							name="framework"
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a framework" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="next">Next.js</SelectItem>
								<SelectItem value="react">React</SelectItem>
								<SelectItem value="vue">Vue</SelectItem>
								<SelectItem value="svelte">Svelte</SelectItem>
								<SelectItem value="angular">Angular</SelectItem>
							</SelectContent>
						</Select>
						{framework && (
							<p className="text-sm text-gray-600">
								Selected: <span className="font-medium">{framework}</span>
							</p>
						)}
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							MultiSelect - Frameworks
						</label>
						<MultiSelect
							value={frameworks}
							onValueChange={setFrameworks}
							placeholder="Select frameworks..."
						>
							<SelectContent>
								<SelectItem value="next">Next.js</SelectItem>
								<SelectItem value="react">React</SelectItem>
								<SelectItem value="vue">Vue</SelectItem>
								<SelectItem value="svelte">Svelte</SelectItem>
								<SelectItem value="angular">Angular</SelectItem>
							</SelectContent>
						</MultiSelect>
						{frameworks.length > 0 && (
							<p className="text-sm text-gray-600">
								Selected: <span className="font-medium">{frameworks.join(', ')}</span>
							</p>
						)}
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							MultiSelect - Colors (Empty by default)
						</label>
						<MultiSelect
							value={colors}
							onValueChange={setColors}
							placeholder="Choose colors..."
						>
							<SelectContent>
								<SelectItem value="red">Red</SelectItem>
								<SelectItem value="blue">Blue</SelectItem>
								<SelectItem value="green">Green</SelectItem>
								<SelectItem value="yellow">Yellow</SelectItem>
								<SelectItem value="purple">Purple</SelectItem>
							</SelectContent>
						</MultiSelect>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Creatable Select - Custom Values (Max 20 chars)
						</label>
						<Select
							value={customValue}
							onValueChange={setCustomValue}
							creatable={true}
							maxLength={20}
							onCreateOption={(val) => console.log('Created:', val)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Type to search or create..." />
							</SelectTrigger>
							<SelectContent>
								{customOptions.map(opt => (
									<SelectItem key={opt} value={opt}>{opt}</SelectItem>
								))}
							</SelectContent>
						</Select>
						{customValue && (
							<p className="text-sm text-gray-600">
								Selected: <span className="font-medium">{customValue}</span> ({customValue.length} chars)
							</p>
						)}
						<p className="text-xs text-gray-500">
							Type to filter, or enter a custom value (max 20 characters)
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Creatable MultiSelect - Tags (Max 15 chars each)
						</label>
						<MultiSelect
							value={tags}
							onValueChange={setTags}
							placeholder="Type to add tags..."
							creatable={true}
							maxLength={15}
							onCreateOption={(val) => console.log('Created:', val)}
						>
							<SelectContent>
								{availableTags.map(tag => (
									<SelectItem key={tag} value={tag}>{tag}</SelectItem>
								))}
							</SelectContent>
						</MultiSelect>
						<p className="text-xs text-gray-500">
							Press Enter to create a new tag (max 15 characters each)
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Select a fruit (Disabled)
						</label>
						<Select value={fruit} onValueChange={setFruit} disabled={true}>
							<SelectTrigger>
								<SelectValue placeholder="Select a fruit" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="apple">Apple</SelectItem>
								<SelectItem value="banana">Banana</SelectItem>
								<SelectItem value="orange">Orange</SelectItem>
								<SelectItem value="grape">Grape</SelectItem>
								<SelectItem value="mango">Mango</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Select size (with onOpenChange)
						</label>
						<Select
							value="medium"
							onValueChange={() => {}}
							name="size"
							onOpenChange={(open) => setIsOpen(open)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select size" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="small">Small</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="large">Large</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-gray-500">
							Dropdown is: {isOpen ? 'Open' : 'Closed'}
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							With defaultOpen
						</label>
						<Select value="blue" onValueChange={() => {}} defaultOpen={true}>
							<SelectTrigger>
								<SelectValue placeholder="Select color" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="red">Red</SelectItem>
								<SelectItem value="blue">Blue</SelectItem>
								<SelectItem value="green">Green</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<button
						type="button"
						onClick={handleSubmit}
						className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
					>
						Show Values
					</button>
				</div>
			</div>
		</div>
	);
}
