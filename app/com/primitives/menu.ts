import { Interactive } from './interactive.ts';

export const MenuRoot = () => {
	return `flex flex-col overflow-hidden rounded-lg bg-background shadow-menu`;
};

export interface MenuItemProps {
	variant?: 'default' | 'danger';
}

export const MenuItem = (props: MenuItemProps = {}) => {
	const { variant = 'default' } = props;

	let cn = Interactive({
		variant,
		class: `flex items-center gap-4 px-4 py-3 text-left text-sm disabled:opacity-50`,
	});

	if (variant === 'danger') {
		cn += ` text-red-500`;
	}

	return cn;
};